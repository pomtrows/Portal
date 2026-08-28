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
  dockerCount?: number; // running containers
  uptimeSeconds?: number;
}

export interface BeszelSystem {
  id: string;
  name: string;
  host?: string;
  status: 'up' | 'down' | 'paused' | 'pending';
  info?: {
    cpu?: number;
    cores?: number;
    m?: number; // total memory
    d?: number; // total disk
    k?: string; // kernel
    u?: number; // uptime
    t?: number; // temp
    dc?: number; // docker count
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
    authType: 'token',
    systemId: 'all',
    title: 'Monitoring Beszel',
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
      title: parsed.title || 'Monitoring Beszel',
      col_span: parsed.col_span || 1,
      row_span: parsed.row_span || 1,
    };
  } catch {
    return defaultConfig;
  }
}

/**
 * Normalizes Beszel URL by stripping trailing slash
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

  // PocketBase auth endpoints (try users then admins)
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
 * Parses Beszel stats payload from systems collection record or system_records
 */
function extractStatsFromRecord(item: any): BeszelStats {
  const info = item.info || {};

  // Extract CPU percent
  let cpuPercent = 0;
  if (typeof info.cpu === 'number') {
    cpuPercent = Math.round(info.cpu);
  } else if (typeof item.cpu === 'number') {
    cpuPercent = Math.round(item.cpu);
  } else if (typeof item.stats?.cpu === 'number') {
    cpuPercent = Math.round(item.stats.cpu);
  }

  // Extract Memory
  let memTotal = (info.m || info.memory || item.memory || 16 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024);
  let memUsed = (info.mu || item.memory_used || item.stats?.mu || 0) / (1024 * 1024 * 1024);
  let memPercent = (info.mp || item.memory_percent || item.stats?.mp || 0);

  if (memPercent === 0 && memTotal > 0 && memUsed > 0) {
    memPercent = Math.round((memUsed / memTotal) * 100);
  } else if (memUsed === 0 && memPercent > 0 && memTotal > 0) {
    memUsed = parseFloat(((memPercent / 100) * memTotal).toFixed(1));
  }

  // Extract Disk
  let diskTotal = (info.d || info.disk || item.disk || 100 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024);
  let diskUsed = (info.du || item.disk_used || item.stats?.du || 0) / (1024 * 1024 * 1024);
  let diskPercent = (info.dp || item.disk_percent || item.stats?.dp || 0);

  if (diskPercent === 0 && diskTotal > 0 && diskUsed > 0) {
    diskPercent = Math.round((diskUsed / diskTotal) * 100);
  } else if (diskUsed === 0 && diskPercent > 0 && diskTotal > 0) {
    diskUsed = parseFloat(((diskPercent / 100) * diskTotal).toFixed(1));
  }

  // Extract Uptime, Temp, Docker
  const uptimeSeconds = info.u || info.uptime || item.uptime || 0;
  const temp = info.t || info.temp || item.temp || undefined;
  const dockerCount = info.dc || info.docker || item.docker_count || undefined;

  return {
    cpuPercent: Math.min(100, Math.max(0, cpuPercent)),
    memUsed: parseFloat(memUsed.toFixed(1)),
    memTotal: parseFloat(memTotal.toFixed(1)),
    memPercent: Math.min(100, Math.max(0, Math.round(memPercent))),
    diskUsed: parseFloat(diskUsed.toFixed(1)),
    diskTotal: parseFloat(diskTotal.toFixed(1)),
    diskPercent: Math.min(100, Math.max(0, Math.round(diskPercent))),
    temp: temp ? Math.round(temp) : undefined,
    dockerCount,
    uptimeSeconds,
  };
}

/**
 * Fetches the list of systems from Beszel Hub
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
  const rawItems = Array.isArray(data.items) ? data.items : [];

  const systems: BeszelSystem[] = rawItems.map((item: any) => {
    const stats = extractStatsFromRecord(item);
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
