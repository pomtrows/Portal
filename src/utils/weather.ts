export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  weatherCode: number;
  precipitationProb: number;
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  weatherCode: number;
  tempMin: number;
  tempMax: number;
  precipitationProbMax: number;
  uvIndexMax?: number;
}

export interface CurrentWeather {
  temp: number;
  apparentTemp: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  updatedAt: string;
}

export interface WeatherCodeInfo {
  label: string;
  icon: string;
  colorClass: string;
}

export function getWeatherInfo(code: number, isDay: boolean = true): WeatherCodeInfo {
  switch (code) {
    case 0:
      return isDay
        ? { label: 'Ensoleillé', icon: 'Sun', colorClass: 'text-amber-500 dark:text-amber-400' }
        : { label: 'Nuit claire', icon: 'Moon', colorClass: 'text-indigo-700 dark:text-indigo-300' };
    case 1:
      return isDay
        ? { label: 'Peu nuageux', icon: 'SunMedium', colorClass: 'text-amber-600 dark:text-amber-300' }
        : { label: 'Peu nuageux', icon: 'CloudMoon', colorClass: 'text-indigo-700 dark:text-indigo-300' };
    case 2:
      return isDay
        ? { label: 'Éclaircies', icon: 'CloudSun', colorClass: 'text-blue-700 dark:text-sky-300' }
        : { label: 'Éclaircies', icon: 'CloudMoon', colorClass: 'text-indigo-700 dark:text-indigo-300' };
    case 3:
      return { label: 'Couvert', icon: 'Cloud', colorClass: 'text-slate-700 dark:text-slate-300' };
    case 45:
    case 48:
      return { label: 'Brouillard', icon: 'CloudFog', colorClass: 'text-slate-700 dark:text-slate-300' };
    case 51:
    case 53:
    case 55:
      return { label: 'Bruine', icon: 'CloudDrizzle', colorClass: 'text-blue-700 dark:text-sky-400' };
    case 56:
    case 57:
      return { label: 'Bruine verglaçante', icon: 'CloudSnow', colorClass: 'text-blue-800 dark:text-cyan-300' };
    case 61:
      return { label: 'Pluie faible', icon: 'CloudRain', colorClass: 'text-blue-700 dark:text-blue-400' };
    case 63:
      return { label: 'Pluie modérée', icon: 'CloudRain', colorClass: 'text-blue-800 dark:text-blue-400' };
    case 65:
      return { label: 'Forte pluie', icon: 'CloudRain', colorClass: 'text-blue-900 dark:text-blue-300' };
    case 66:
    case 67:
      return { label: 'Pluie verglaçante', icon: 'CloudSnow', colorClass: 'text-blue-800 dark:text-cyan-400' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { label: 'Neige', icon: 'CloudSnow', colorClass: 'text-sky-700 dark:text-sky-200' };
    case 80:
    case 81:
    case 82:
      return { label: 'Averses', icon: 'CloudRain', colorClass: 'text-blue-700 dark:text-blue-400' };
    case 85:
    case 86:
      return { label: 'Averses de neige', icon: 'CloudSnow', colorClass: 'text-sky-700 dark:text-sky-200' };
    case 95:
      return { label: 'Orage', icon: 'CloudLightning', colorClass: 'text-amber-600 dark:text-yellow-400' };
    case 96:
    case 99:
      return { label: 'Orage avec grêle', icon: 'CloudLightning', colorClass: 'text-amber-700 dark:text-amber-500' };
    default:
      return { label: 'Variable', icon: 'CloudSun', colorClass: 'text-blue-700 dark:text-sky-300' };
  }
}

export async function searchCities(query: string): Promise<WeatherLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=6&language=fr&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => ({
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country,
      admin1: item.admin1,
    }));
  } catch (err) {
    console.error('Error searching cities:', err);
    return [];
  }
}

export async function fetchWeatherData(location: WeatherLocation): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max',
    timezone: 'auto',
    forecast_days: '8',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) {
    throw new Error(`Erreur météo (${res.status})`);
  }

  const data = await res.json();

  const current: CurrentWeather = {
    temp: Math.round(data.current?.temperature_2m ?? 0),
    apparentTemp: Math.round(data.current?.apparent_temperature ?? 0),
    humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
    windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
    weatherCode: data.current?.weather_code ?? 0,
    isDay: data.current?.is_day === 1,
    time: data.current?.time ?? new Date().toISOString(),
  };

  const hourlyTimes: string[] = data.hourly?.time || [];
  const hourlyTemps: number[] = data.hourly?.temperature_2m || [];
  const hourlyCodes: number[] = data.hourly?.weather_code || [];
  const hourlyPrecip: number[] = data.hourly?.precipitation_probability || [];
  const hourlyIsDay: number[] = data.hourly?.is_day || [];

  const nowTime = new Date(current.time).getTime();
  let startIndex = 0;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const t = new Date(hourlyTimes[i]).getTime();
    if (t >= nowTime) {
      startIndex = i;
      break;
    }
  }

  const hourly: HourlyForecast[] = [];
  const hoursToTake = Math.min(24, hourlyTimes.length - startIndex);
  for (let i = 0; i < hoursToTake; i++) {
    const idx = startIndex + i;
    hourly.push({
      time: hourlyTimes[idx],
      temp: Math.round(hourlyTemps[idx]),
      weatherCode: hourlyCodes[idx],
      precipitationProb: hourlyPrecip[idx] ?? 0,
      isDay: hourlyIsDay[idx] === 1,
    });
  }

  const dailyDates: string[] = data.daily?.time || [];
  const dailyCodes: number[] = data.daily?.weather_code || [];
  const dailyTempMax: number[] = data.daily?.temperature_2m_max || [];
  const dailyTempMin: number[] = data.daily?.temperature_2m_min || [];
  const dailyPrecip: number[] = data.daily?.precipitation_probability_max || [];
  const dailyUv: number[] = data.daily?.uv_index_max || [];

  const daily: DailyForecast[] = [];
  const daysCount = Math.min(7, dailyDates.length);
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  for (let i = 0; i < daysCount; i++) {
    const dateObj = new Date(dailyDates[i] + 'T00:00:00');
    let dayName = dayNames[dateObj.getDay()];
    if (i === 0) dayName = "Aujourd'hui";
    else if (i === 1) dayName = 'Demain';

    daily.push({
      date: dailyDates[i],
      dayName,
      weatherCode: dailyCodes[i],
      tempMin: Math.round(dailyTempMin[i]),
      tempMax: Math.round(dailyTempMax[i]),
      precipitationProbMax: dailyPrecip[i] ?? 0,
      uvIndexMax: dailyUv[i],
    });
  }

  return {
    location,
    current,
    hourly,
    daily,
    updatedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function parseWeatherConfig(widgetUrl?: string): WeatherLocation {
  if (!widgetUrl) {
    return { name: 'Paris', latitude: 48.8566, longitude: 2.3522, country: 'France' };
  }

  try {
    const parsed = JSON.parse(widgetUrl);
    if (parsed.latitude !== undefined && parsed.longitude !== undefined) {
      return parsed;
    }
  } catch {
    if (widgetUrl.includes(',')) {
      const [coords, name] = widgetUrl.split('|');
      const [lat, lon] = coords.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { name: name || 'Position', latitude: lat, longitude: lon };
      }
    }
  }

  return { name: 'Paris', latitude: 48.8566, longitude: 2.3522, country: 'France' };
}
