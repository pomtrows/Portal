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
}

export interface RouteResult {
  durationSeconds: number;
  durationMinutes: number;
  durationFormatted: string;
  distanceKm: number;
  distanceFormatted: string;
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

export async function calculateRoute(start: TrafficLocation, end: TrafficLocation): Promise<RouteResult> {
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
  const durationMinutes = Math.round(durationSeconds / 60);

  return {
    durationSeconds,
    durationMinutes,
    durationFormatted: formatDuration(durationSeconds),
    distanceKm,
    distanceFormatted: `${distanceKm} km`,
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
