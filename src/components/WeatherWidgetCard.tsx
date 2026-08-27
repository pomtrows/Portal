import React, { useState, useEffect, useCallback } from 'react';
import type { Section } from '../types';
import {
  Sun,
  SunMedium,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  GripVertical,
  RotateCw,
  Edit2,
  Trash2,
  AlertCircle,
  MapPin,
  Clock,
  Calendar,
  Thermometer,
  Umbrella
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  fetchWeatherData,
  parseWeatherConfig,
  getWeatherInfo,
  type WeatherData
} from '../utils/weather';

interface WeatherWidgetCardProps {
  section: Section;
  isEditMode: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
}

export const WeatherIcon: React.FC<{
  code: number;
  isDay?: boolean;
  className?: string;
  size?: number;
}> = ({ code, isDay = true, className = '', size = 20 }) => {
  const info = getWeatherInfo(code, isDay);
  const iconClass = `${info.colorClass} ${className}`;

  switch (info.icon) {
    case 'Sun':
      return <Sun size={size} className={iconClass} />;
    case 'SunMedium':
      return <SunMedium size={size} className={iconClass} />;
    case 'Moon':
      return <Moon size={size} className={iconClass} />;
    case 'CloudMoon':
      return <CloudMoon size={size} className={iconClass} />;
    case 'Cloud':
      return <Cloud size={size} className={iconClass} />;
    case 'CloudFog':
      return <CloudFog size={size} className={iconClass} />;
    case 'CloudDrizzle':
      return <CloudDrizzle size={size} className={iconClass} />;
    case 'CloudRain':
      return <CloudRain size={size} className={iconClass} />;
    case 'CloudSnow':
      return <CloudSnow size={size} className={iconClass} />;
    case 'CloudLightning':
      return <CloudLightning size={size} className={iconClass} />;
    case 'CloudSun':
    default:
      return <CloudSun size={size} className={iconClass} />;
  }
};

export const WeatherWidgetCard: React.FC<WeatherWidgetCardProps> = ({
  section,
  isEditMode,
  onEditSection,
  onDeleteSection,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');

  const location = parseWeatherConfig(section.widget_url);

  const loadWeather = useCallback(async () => {
    const loc = parseWeatherConfig(section.widget_url);
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWeatherData(loc);
      setData(result);
    } catch (err: any) {
      console.error('Error loading weather:', err);
      setError(err?.message || 'Impossible de récupérer les prévisions météo.');
    } finally {
      setLoading(false);
    }
  }, [section.widget_url]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const formatHour = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-panel p-4 sm:p-5 w-full flex flex-col ${
        isDragging ? 'z-50 shadow-2xl ring-2 ring-[var(--color-primary)]' : ''
      }`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          {isEditMode && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-black/10 p-1.5 rounded-lg text-slate-800 dark:text-slate-200 transition-colors -ml-2"
              title="Déplacer le widget"
            >
              <GripVertical size={20} />
            </div>
          )}
          <div className="p-1.5 rounded-lg bg-blue-900/10 dark:bg-sky-500/15 text-blue-800 dark:text-sky-300">
            <CloudSun size={18} />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white truncate max-w-[200px]">
            {section.title || location.name}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={loadWeather}
            disabled={loading}
            className={`p-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-800 dark:hover:text-sky-300 hover:bg-black/10 rounded-md transition-all ${
              loading ? 'animate-spin' : ''
            }`}
            title="Actualiser la météo"
          >
            <RotateCw size={16} />
          </button>

          {isEditMode && (
            <>
              <button
                onClick={() => onEditSection(section)}
                className="p-1.5 text-blue-700 dark:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                title="Modifier le widget"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDeleteSection(section.id)}
                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                title="Supprimer le widget"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
        {loading && !data && (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        )}

        {error && !data && (
          <div className="py-6 px-4 text-center text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800/50 rounded-xl flex flex-col items-center gap-2">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
            <span className="font-medium">{error}</span>
            <button
              onClick={loadWeather}
              className="mt-2 text-xs font-bold px-3 py-1.5 bg-red-200 dark:bg-red-900/60 hover:bg-red-300 dark:hover:bg-red-800/80 rounded-md transition-colors text-red-900 dark:text-red-100"
            >
              Réessayer
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Current Weather Card */}
            <div className="p-4 rounded-xl bg-blue-50/90 dark:bg-slate-800/60 border border-blue-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-blue-900 dark:text-sky-300 font-bold">
                    <MapPin size={14} className="text-blue-700 dark:text-sky-400" />
                    <span>
                      {data.location.name}
                      {data.location.country ? `, ${data.location.country}` : ''}
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight mt-1">
                    {data.current.temp}°C
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {getWeatherInfo(data.current.weatherCode, data.current.isDay).label}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <WeatherIcon
                    code={data.current.weatherCode}
                    isDay={data.current.isDay}
                    size={44}
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    Ressenti {data.current.apparentTemp}°
                  </span>
                </div>
              </div>

              {/* Current details row */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-blue-200/80 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 font-medium">
                <div className="flex items-center gap-1">
                  <Thermometer size={14} className="text-amber-600 dark:text-amber-400" />
                  <span>
                    {data.daily[0]?.tempMin}° / {data.daily[0]?.tempMax}°
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplets size={14} className="text-blue-700 dark:text-sky-400" />
                  <span>{data.current.humidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind size={14} className="text-teal-700 dark:text-teal-400" />
                  <span>{data.current.windSpeed} km/h</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between gap-1 p-1 bg-slate-200/80 dark:bg-black/40 rounded-lg border border-slate-300 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('hourly')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-bold transition-all ${
                  activeTab === 'hourly'
                    ? 'bg-blue-800 dark:bg-blue-600 text-white shadow-md'
                    : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white'
                }`}
              >
                <Clock size={14} />
                <span>Par heure (24h)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-bold transition-all ${
                  activeTab === 'daily'
                    ? 'bg-blue-800 dark:bg-blue-600 text-white shadow-md'
                    : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white'
                }`}
              >
                <Calendar size={14} />
                <span>7 prochains jours</span>
              </button>
            </div>

            {/* Hourly Forecast (LIST VIEW) */}
            {activeTab === 'hourly' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-200 px-1">
                  <span>Prochaines 24 heures</span>
                  <span className="text-[11px] text-slate-700 dark:text-slate-400">
                    {data.hourly.length} créneaux
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {data.hourly.map((hour, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/50 hover:bg-slate-200/90 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/50 transition-colors text-xs"
                    >
                      {/* Hour label */}
                      <div className="w-24 font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-500 dark:text-slate-400" />
                        <span>{idx === 0 ? 'Maint.' : formatHour(hour.time)}</span>
                      </div>

                      {/* Icon + Weather Condition */}
                      <div className="flex items-center gap-2 flex-1 justify-center">
                        <WeatherIcon
                          code={hour.weatherCode}
                          isDay={hour.isDay}
                          size={18}
                        />
                        <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate max-w-[90px] hidden sm:inline">
                          {getWeatherInfo(hour.weatherCode, hour.isDay).label}
                        </span>
                        {hour.precipitationProb > 0 ? (
                          <span className="flex items-center gap-0.5 text-[11px] font-bold text-blue-800 dark:text-sky-300">
                            <Umbrella size={11} className="text-blue-700 dark:text-sky-400" />
                            {hour.precipitationProb}%
                          </span>
                        ) : null}
                      </div>

                      {/* Temperature */}
                      <div className="w-14 text-right font-extrabold text-slate-950 dark:text-white text-sm">
                        {hour.temp}°C
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7-Day Forecast (LIST VIEW) */}
            {activeTab === 'daily' && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-200 px-1">
                  Prévisions sur 7 jours
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {data.daily.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/50 hover:bg-slate-200/90 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/50 transition-colors text-xs"
                    >
                      {/* Day name */}
                      <div className="w-28 font-bold text-slate-950 dark:text-white truncate">
                        {day.dayName}
                      </div>

                      {/* Icon and label */}
                      <div className="flex items-center gap-2 flex-1 justify-center">
                        <WeatherIcon code={day.weatherCode} isDay={true} size={18} />
                        <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate max-w-[90px] hidden sm:inline">
                          {getWeatherInfo(day.weatherCode, true).label}
                        </span>
                        {day.precipitationProbMax > 20 && (
                          <span className="flex items-center gap-0.5 text-[11px] font-bold text-blue-800 dark:text-sky-300">
                            <Umbrella size={11} className="text-blue-700 dark:text-sky-400" />
                            {day.precipitationProbMax}%
                          </span>
                        )}
                      </div>

                      {/* Min / Max Temperature Bar */}
                      <div className="flex items-center gap-2 justify-end w-28">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">
                          {day.tempMin}°
                        </span>
                        <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden relative">
                          <div
                            className="absolute h-full bg-gradient-to-r from-blue-600 to-amber-500 rounded-full"
                            style={{
                              left: '10%',
                              right: '10%',
                            }}
                          />
                        </div>
                        <span className="font-extrabold text-slate-950 dark:text-white">
                          {day.tempMax}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
