export interface TrafficLocation {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
}

export interface TrafficConfig {
  start: TrafficLocation;
  end: TrafficLocation;
  title?: string;
  tomtomApiKey?: string;
}

export interface RouteResult {
  durationSeconds: number;
  durationMinutes: number;
  durationFormatted: string;
  noTrafficDurationSeconds?: number;
  noTrafficDurationFormatted?: string;
  trafficDelaySeconds?: number;
  trafficDelayMinutes?: number;
  trafficStatus?: 'fluid' | 'moderate' | 'heavy';
  distanceKm: number;
  distanceFormatted: string;
  provider: 'tomtom' | 'osrm';
  updatedAt: string;
}

export async function searchAddresses(query: string): Promise<TrafficLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const results: TrafficLocation[] = [];

  // 1. Try French BAN API (Adresse Data Gouv) - super fast and accurate
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(trimmed)}&limit=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.features && Array.isArray(data.features)) {
        for (const f of data.features) {
          if (f.geometry?.coordinates && f.geometry.coordinates.length >= 2) {
            const [lon, lat] = f.geometry.coordinates;
            results.push({
              name: f.properties.label || f.properties.name || trimmed,
              address: f.properties.context || f.properties.postcode + ' ' + (f.properties.city || ''),
              city: f.properties.city || '',
              latitude: lat,
              longitude: lon,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('BAN address search failed:', err);
  }

  // 2. If no or few results, query Photon (worldwide OSM)
  if (results.length < 3) {
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lang=fr&limit=5`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data.features && Array.isArray(data.features)) {
          for (const f of data.features) {
            if (f.geometry?.coordinates && f.geometry.coordinates.length >= 2) {
              const [lon, lat] = f.geometry.coordinates;
              const props = f.properties || {};
              const title = [props.housenumber, props.street || props.name].filter(Boolean).join(' ') || props.name || trimmed;
              const sub = [props.postcode, props.city, props.country].filter(Boolean).join(', ');
              
              // avoid duplicate coordinates
              if (!results.some(r => Math.abs(r.latitude - lat) < 0.001 && Math.abs(r.longitude - lon) < 0.001)) {
                results.push({
                  name: title,
                  address: sub,
                  city: props.city || '',
                  latitude: lat,
                  longitude: lon,
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Photon address search failed:', err);
    }
  }

  return results.slice(0, 6);
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes < 10 ? '0' : ''}${minutes} min`;
}

export async function testTomTomApiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  const trimmed = apiKey.trim();
  if (!trimmed) return { ok: false, message: 'Clé API vide' };

  try {
    // Quick test route between Paris and CDG
    const url = `https://api.tomtom.com/routing/1/calculateRoute/48.8566,2.3522:49.0097,2.5479/json?key=${encodeURIComponent(trimmed)}&traffic=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        return { ok: true, message: 'Clé API TomTom valide et opérationnelle !' };
      }
    }
    if (res.status === 403 || res.status === 401) {
      return { ok: false, message: 'Clé API TomTom invalide ou expirée.' };
    }
    return { ok: false, message: `Erreur TomTom (${res.status})` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erreur lors du test de connexion TomTom.' };
  }
}

export async function calculateRouteWithTomTom(
  start: TrafficLocation,
  end: TrafficLocation,
  apiKey: string
): Promise<RouteResult> {
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${start.latitude},${start.longitude}:${end.latitude},${end.longitude}/json?key=${encodeURIComponent(apiKey.trim())}&traffic=true&travelMode=car`;

  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) {
    throw new Error(`Erreur TomTom (${res.status})`);
  }

  const data = await res.json();
  if (!data.routes || data.routes.length === 0 || !data.routes[0].summary) {
    throw new Error("Aucun itinéraire TomTom trouvé.");
  }

  const summary = data.routes[0].summary;
  const durationSeconds = summary.travelTimeInSeconds; // live travel time with traffic
  const trafficDelaySeconds = summary.trafficDelayInSeconds || 0;
  const noTrafficDurationSeconds = Math.max(0, durationSeconds - trafficDelaySeconds);
  const distanceKm = parseFloat((summary.lengthInMeters / 1000).toFixed(1));
  const trafficDelayMinutes = Math.round(trafficDelaySeconds / 60);

  let trafficStatus: 'fluid' | 'moderate' | 'heavy' = 'fluid';
  if (trafficDelayMinutes >= 10) {
    trafficStatus = 'heavy';
  } else if (trafficDelayMinutes >= 3) {
    trafficStatus = 'moderate';
  }

  return {
    durationSeconds,
    durationMinutes: Math.round(durationSeconds / 60),
    durationFormatted: formatDuration(durationSeconds),
    noTrafficDurationSeconds,
    noTrafficDurationFormatted: formatDuration(noTrafficDurationSeconds),
    trafficDelaySeconds,
    trafficDelayMinutes,
    trafficStatus,
    distanceKm,
    distanceFormatted: `${distanceKm} km`,
    provider: 'tomtom',
    updatedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export async function calculateRoute(
  start: TrafficLocation,
  end: TrafficLocation,
  customApiKey?: string
): Promise<RouteResult> {
  const apiKey = (customApiKey || localStorage.getItem('portal-tomtom-api-key') || '').trim();

  // Try TomTom if key is present
  if (apiKey) {
    try {
      return await calculateRouteWithTomTom(start, end, apiKey);
    } catch (err) {
      console.warn('TomTom routing failed, falling back to OSRM:', err);
    }
  }

  // Fallback to OSRM (free OpenStreetMap routing)
  const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=false`;
  
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) {
    throw new Error(`Impossible de calculer l'itinéraire (${res.status})`);
  }

  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error("Aucun itinéraire routier trouvé entre ces deux adresses.");
  }

  const route = data.routes[0];
  const durationSeconds = route.duration; // in seconds
  const distanceMeters = route.distance; // in meters
  const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));

  return {
    durationSeconds,
    durationMinutes: Math.round(durationSeconds / 60),
    durationFormatted: formatDuration(durationSeconds),
    distanceKm,
    distanceFormatted: `${distanceKm} km`,
    provider: 'osrm',
    updatedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function parseTrafficConfig(widgetUrl?: string): TrafficConfig {
  const defaultStart: TrafficLocation = {
    name: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    address: 'Paris, France',
  };
  const defaultEnd: TrafficLocation = {
    name: 'Aéroport Paris-Charles de Gaulle',
    latitude: 49.0097,
    longitude: 2.5479,
    address: 'Roissy-en-France',
  };

  if (!widgetUrl) {
    return { start: defaultStart, end: defaultEnd, title: 'Trajet' };
  }

  try {
    const parsed = JSON.parse(widgetUrl);
    if (parsed.start && parsed.end) {
      return parsed;
    }
  } catch {
    // ignore parse error
  }

  return { start: defaultStart, end: defaultEnd, title: 'Trajet' };
}

export function getGoogleMapsUrl(start: TrafficLocation, end: TrafficLocation): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&travelmode=driving`;
}

export function getWazeUrl(end: TrafficLocation): string {
  return `https://waze.com/ul?ll=${end.latitude},${end.longitude}&navigate=yes`;
}
