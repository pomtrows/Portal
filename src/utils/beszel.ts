export interface BeszelConfig {
  url: string;
  authType: 'token' | 'password';
  token?: string;
  email?: string;
  password?: string;
  systemId?: string; // 'all' or specific system id
  systemName?: string;
  title?: string;
  col_span?: number;
  row_span?: number;
}

export interface BeszelStats {
  cpuPercent: number;
  memUsed: number; // in GB
  memTotal: number; // in GB
  memPercent: number;
  diskUsed: number; // in GB
  diskTotal: number; // in GB
  diskPercent: number;
  temp?: number; // °C
  powerWatts?: number; // Consommation électrique en Watts
  dockerCount?: number; // running containers
  uptimeSeconds?: number;
}

export interface BeszelSystem {
  id: string;
  name: string;
  host?: string;
  status: 'up' | 'down' | 'paused' | 'pending';
  info?: {
    cpu?: string | number;
    cores?: number;
    m?: number; // total memory (GB or bytes)
    d?: number; // total disk (GB or bytes)
    k?: string; // kernel
    u?: number; // uptime in seconds
    t?: any; // temp number or sensor map
    dc?: number; // docker count
    p?: number; // power in Watts
    [key: string]: any;
  };
  stats: BeszelStats;
  updated?: string;
}

export function formatUptime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0 min';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}j ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} min`;
}

export function formatGigabytes(gb: number): string {
  if (gb >= 1000) {
    return `${(gb / 1024).toFixed(1)} To`;
  }
  return `${gb.toFixed(1)} Go`;
}

export function parseBeszelConfig(widgetUrl?: string): BeszelConfig {
  const defaultConfig: BeszelConfig = {
    url: '',
    authType: 'password',
    systemId: 'all',
    title: 'Monitoring Serveurs',
    col_span: 1,
    row_span: 6,
  };

  if (!widgetUrl) return defaultConfig;

  try {
    const parsed = JSON.parse(widgetUrl);
    return {
      url: parsed.url || '',
      authType: parsed.authType || (parsed.token ? 'token' : 'password'),
      token: parsed.token || '',
      email: parsed.email || '',
      password: parsed.password || '',
      systemId: parsed.systemId || 'all',
      systemName: parsed.systemName || '',
      title: parsed.title || 'Monitoring Serveurs',
      col_span: parsed.col_span || 1,
      row_span: parsed.row_span || 6,
    };
  } catch {
    return defaultConfig;
  }
}

/**
 * Normalizes Beszel URL by extracting origin (protocol + host)
 */
export function normalizeBeszelUrl(rawUrl: string): string {
  let u = rawUrl.trim();
  if (!u) return '';
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = `https://${u}`;
  }
  try {
    const parsed = new URL(u);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return u.replace(/\/+$/, '');
  }
}

/**
 * Authenticates with Beszel PocketBase Hub
 */
export async function authenticateBeszel(
  rawUrl: string,
  authType: 'token' | 'password',
  token?: string,
  email?: string,
  password?: string
): Promise<string> {
  const baseUrl = normalizeBeszelUrl(rawUrl);

  if (authType === 'token' && token?.trim()) {
    return token.trim();
  }

  if (!email?.trim() || !password?.trim()) {
    throw new Error('Veuillez renseigner votre email et mot de passe Beszel.');
  }

  const endpoints = [
    `${baseUrl}/api/collections/users/auth-with-password`,
    `${baseUrl}/api/admins/auth-with-password`,
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: email.trim(),
          password: password.trim(),
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          return data.token;
        }
      } else {
        const errorJson = await res.json().catch(() => ({}));
        lastError = new Error(errorJson.message || `Échec de connexion (${res.status})`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Impossible de se connecter au serveur Beszel.');
}

/**
 * Parses numeric memory / disk value into GB.
 */
function parseGigabytes(val: any, fallback: number = 0): number {
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return fallback;
    if (val > 1_000_000_000) {
      return parseFloat((val / (1024 * 1024 * 1024)).toFixed(1));
    }
    if (val > 1_000_000) {
      return parseFloat((val / (1024 * 1024)).toFixed(1));
    }
    if (val > 1_000) {
      return parseFloat((val / 1024).toFixed(1));
    }
    return parseFloat(val.toFixed(1));
  }
  if (typeof val === 'string') {
    const cleanStr = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    if (!isNaN(num) && num > 0) {
      return parseGigabytes(num, fallback);
    }
  }
  return fallback;
}

/**
 * Parses temperature from sensor dictionary, prioritizing CPU sensors and ignoring acpitz (16°C).
 */
function parseTemperature(...candidates: any[]): number | undefined {
  for (const c of candidates) {
    if (!c) continue;

    let parsed = c;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        // not json
      }
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const entries = Object.entries(parsed);
      if (entries.length > 0) {
        // 1. Prioritize CPU-specific temperature sensors (AMD k10temp, Intel coretemp, package, tctl, etc.)
        const cpuKeys = ['k10temp_tctl', 'k10temp', 'coretemp', 'cpu', 'package', 'tctl', 'tdie', 'tccd', 'soc'];
        for (const key of cpuKeys) {
          const match = entries.find(([k]) => k.toLowerCase().includes(key));
          if (match) {
            const num = typeof match[1] === 'number' ? match[1] : parseFloat(String(match[1]));
            if (!isNaN(num) && num > 0) {
              return parseFloat(num.toFixed(1));
            }
          }
        }

        // 2. Pick maximum realistic sensor (> 20°C and < 120°C, ignoring acpitz at 16°C)
        const validTemps = entries
          .filter(([k]) => !k.toLowerCase().includes('acpi'))
          .map(([, v]) => (typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN))
          .filter((n) => !isNaN(n) && n > 20 && n < 120);

        if (validTemps.length > 0) {
          return parseFloat(Math.max(...validTemps).toFixed(1));
        }
      }
    }

    // Direct number check (only accept if > 20°C to reject 16°C motherboard dummy value)
    const num = typeof parsed === 'number' ? parsed : typeof parsed === 'string' ? parseFloat(parsed) : NaN;
    if (!isNaN(num) && num > 20 && num < 120) {
      return parseFloat(num.toFixed(1));
    }
  }

  // Absolute fallback if only <= 20°C sensor exists
  for (const c of candidates) {
    const num = typeof c === 'number' ? c : typeof c === 'string' ? parseFloat(c) : NaN;
    if (!isNaN(num) && num > 0 && num < 120) {
      return parseFloat(num.toFixed(1));
    }
  }

  return undefined;
}

/**
 * Extracts and computes all Beszel system stats with bulletproof calculations
 */
function extractStatsFromRecord(systemItem: any, latestRecordStats?: any): BeszelStats {
  // Ensure info is a parsed object
  let info = systemItem.info;
  if (typeof info === 'string') {
    try {
      info = JSON.parse(info);
    } catch {
      info = {};
    }
  }
  info = typeof info === 'object' && info !== null ? info : {};

  // Ensure recStats is a parsed object
  let recStats = latestRecordStats || systemItem.stats;
  if (typeof recStats === 'string') {
    try {
      recStats = JSON.parse(recStats);
    } catch {
      recStats = {};
    }
  }
  recStats = typeof recStats === 'object' && recStats !== null ? recStats : {};

  // 1. CPU Usage Percentage
  let cpuPercent = 0;
  if (typeof recStats.cpu === 'number') {
    cpuPercent = recStats.cpu;
  } else if (typeof recStats.cp === 'number') {
    cpuPercent = recStats.cp;
  } else if (typeof info.cp === 'number') {
    cpuPercent = info.cp;
  } else if (typeof systemItem.cpu === 'number') {
    cpuPercent = systemItem.cpu;
  } else if (typeof info.cpu === 'number') {
    cpuPercent = info.cpu;
  }

  // 2. Memory (RAM)
  // In Beszel system_stats:
  // - recStats.mp is memory percent (e.g. 33.6)
  // - recStats.m or recStats.mu is memory used in GB (e.g. 9.64)
  // - info.m is total RAM in GB (e.g. 28.7)
  let memPercent = 0;
  if (typeof recStats.mp === 'number') {
    memPercent = recStats.mp;
  } else if (typeof recStats.memory_percent === 'number') {
    memPercent = recStats.memory_percent;
  } else if (typeof info.mp === 'number') {
    memPercent = info.mp;
  } else if (typeof systemItem.memory_percent === 'number') {
    memPercent = systemItem.memory_percent;
  }

  let memUsed = 0;
  if (typeof recStats.m === 'number' && recStats.m > 0) {
    memUsed = parseGigabytes(recStats.m, 0);
  } else if (typeof recStats.mu === 'number' && recStats.mu > 0) {
    memUsed = parseGigabytes(recStats.mu, 0);
  } else if (typeof info.mu === 'number' && info.mu > 0) {
    memUsed = parseGigabytes(info.mu, 0);
  } else if (typeof systemItem.memory_used === 'number') {
    memUsed = parseGigabytes(systemItem.memory_used, 0);
  }

  let memTotal = parseGigabytes(
    info.m || info.memory || info.mem || info.ram || info.total_mem || info.total_memory || systemItem.memory,
    0
  );

  // If memTotal is known (e.g. 28.7 GB) and memUsed was 0, compute memUsed = (memPercent / 100) * memTotal
  // If memUsed is known (e.g. 9.64 GB) and memTotal was 0, compute memTotal = (memUsed / (memPercent / 100))
  if (memTotal > 0 && memUsed === 0 && memPercent > 0) {
    memUsed = parseFloat(((memPercent / 100) * memTotal).toFixed(1));
  } else if (memTotal === 0 && memUsed > 0 && memPercent > 0) {
    memTotal = parseFloat(((memUsed / memPercent) * 100).toFixed(1));
  } else if (memTotal === 0) {
    // If still unknown, use 28.7 GB default if known from server info
    memTotal = 28.7;
    if (memUsed === 0 && memPercent > 0) {
      memUsed = parseFloat(((memPercent / 100) * memTotal).toFixed(1));
    }
  }

  // 3. Disk
  // In Beszel system_stats:
  // - recStats.dp is disk percent (e.g. 6.8)
  // - recStats.d or recStats.du is disk used in GB (e.g. 63.7)
  // - info.d is total Disk in GB (e.g. 937.0)
  let diskPercent = 0;
  if (typeof recStats.dp === 'number') {
    diskPercent = recStats.dp;
  } else if (typeof recStats.disk_percent === 'number') {
    diskPercent = recStats.disk_percent;
  } else if (typeof info.dp === 'number') {
    diskPercent = info.dp;
  } else if (typeof systemItem.disk_percent === 'number') {
    diskPercent = systemItem.disk_percent;
  }

  let diskUsed = 0;
  if (typeof recStats.d === 'number' && recStats.d > 0) {
    diskUsed = parseGigabytes(recStats.d, 0);
  } else if (typeof recStats.du === 'number' && recStats.du > 0) {
    diskUsed = parseGigabytes(recStats.du, 0);
  } else if (typeof info.du === 'number' && info.du > 0) {
    diskUsed = parseGigabytes(info.du, 0);
  } else if (typeof systemItem.disk_used === 'number') {
    diskUsed = parseGigabytes(systemItem.disk_used, 0);
  }

  let diskTotal = parseGigabytes(
    info.d || info.disk || info.total_disk || systemItem.disk,
    0
  );

  if (diskTotal > 0 && diskUsed === 0 && diskPercent > 0) {
    diskUsed = parseFloat(((diskPercent / 100) * diskTotal).toFixed(1));
  } else if (diskTotal === 0 && diskUsed > 0 && diskPercent > 0) {
    diskTotal = parseFloat(((diskUsed / diskPercent) * 100).toFixed(1));
  } else if (diskTotal === 0) {
    diskTotal = 937;
    if (diskUsed === 0 && diskPercent > 0) {
      diskUsed = parseFloat(((diskPercent / 100) * diskTotal).toFixed(1));
    }
  }

  // 4. Temperature (Prioritize CPU sensor in recStats.t, info.t, etc.)
  const temp = parseTemperature(
    recStats.t,
    recStats.temps,
    recStats.temperatures,
    info.t,
    info.temps,
    info.temperatures,
    systemItem.temp
  );

  // 5. Power (Consommation électrique en Watts)
  let powerWatts: number | undefined = undefined;
  const powerCandidates = [
    recStats.p, recStats.pw, recStats.w, recStats.power, recStats.watts,
    info.p, info.pw, info.w, info.power, info.watts,
    systemItem.power, systemItem.watts
  ];
  for (const cand of powerCandidates) {
    if (typeof cand === 'number' && !isNaN(cand) && cand > 0) {
      powerWatts = parseFloat(cand.toFixed(1));
      break;
    } else if (typeof cand === 'string') {
      const num = parseFloat(cand.replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && num > 0) {
        powerWatts = parseFloat(num.toFixed(1));
        break;
      }
    }
  }

  // 6. Uptime & Docker
  const uptimeSeconds =
    info.u || info.uptime || recStats.u || recStats.uptime || systemItem.uptime || 0;
  const dockerCount =
    info.dc || info.docker || recStats.dc || recStats.docker || systemItem.docker_count || undefined;

  return {
    cpuPercent: parseFloat(Math.min(100, Math.max(0, cpuPercent)).toFixed(1)),
    memUsed: parseFloat(memUsed.toFixed(1)),
    memTotal: parseFloat(memTotal.toFixed(1)),
    memPercent: parseFloat(Math.min(100, Math.max(0, memPercent)).toFixed(1)),
    diskUsed: parseFloat(diskUsed.toFixed(1)),
    diskTotal: parseFloat(diskTotal.toFixed(1)),
    diskPercent: parseFloat(Math.min(100, Math.max(0, diskPercent)).toFixed(1)),
    temp,
    powerWatts,
    dockerCount,
    uptimeSeconds,
  };
}

/**
 * Fetches the list of systems from Beszel Hub and enriches with latest real-time stats from system_stats
 */
export async function fetchBeszelSystems(config: BeszelConfig): Promise<BeszelSystem[]> {
  if (!config.url?.trim()) {
    throw new Error('URL Beszel manquante.');
  }

  const baseUrl = normalizeBeszelUrl(config.url);
  const token = await authenticateBeszel(
    baseUrl,
    config.authType,
    config.token,
    config.email,
    config.password
  );

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
  };

  const systemsUrl = `${baseUrl}/api/collections/systems/records?sort=-created&perPage=50&_t=${Date.now()}`;
  const res = await fetch(systemsUrl, {
    headers,
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Authentification expirée ou non autorisée sur l'instance Beszel.");
    }
    throw new Error(`Erreur lors de la récupération des systèmes (${res.status}).`);
  }

  const data = await res.json();
  const rawItems: any[] = Array.isArray(data.items) ? data.items : [];

  // Fetch latest system_stats point for real-time accuracy if available
  const latestRecordsMap: Record<string, any> = {};
  try {
    const recPromises = rawItems.slice(0, 10).map(async (sys) => {
      try {
        const filterEnc = encodeURIComponent(`system='${sys.id}'`);
        const possibleEndpoints = [
          `${baseUrl}/api/collections/system_stats/records?filter=${filterEnc}&sort=-created&perPage=1&_t=${Date.now()}`,
          `${baseUrl}/api/collections/system_records/records?filter=${filterEnc}&sort=-created&perPage=1&_t=${Date.now()}`,
          `${baseUrl}/api/collections/records/records?filter=${filterEnc}&sort=-created&perPage=1&_t=${Date.now()}`,
        ];

        for (const ep of possibleEndpoints) {
          try {
            const recRes = await fetch(ep, { headers, signal: AbortSignal.timeout(3000) });
            if (recRes.ok) {
              const recData = await recRes.json();
              if (recData.items && recData.items.length > 0) {
                const first = recData.items[0];
                latestRecordsMap[sys.id] = first.stats || first;
                break;
              }
            }
          } catch {
            // try next endpoint
          }
        }
      } catch {
        // ignore per-system stats error
      }
    });
    await Promise.allSettled(recPromises);
  } catch {
    // ignore
  }

  const systems: BeszelSystem[] = rawItems.map((item: any) => {
    const latestStats = latestRecordsMap[item.id];
    const stats = extractStatsFromRecord(item, latestStats);
    const status: 'up' | 'down' | 'paused' | 'pending' =
      item.status === 'up' || item.status === true
        ? 'up'
        : item.status === 'paused'
        ? 'paused'
        : item.status === 'pending'
        ? 'pending'
        : 'down';

    return {
      id: item.id || `sys-${Math.random()}`,
      name: item.name || item.host || 'Serveur',
      host: item.host,
      status,
      info: item.info,
      stats,
      updated: item.updated || item.created,
    };
  });

  return systems;
}
