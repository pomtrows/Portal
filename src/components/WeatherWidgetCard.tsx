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
  Thermometer
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
              className="cursor-grab hover:bg-black/10 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors -ml-2"
              title="Déplacer le widget"
            >
              <GripVertical size={20} />
            </div>
          )}
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <CloudSun size={18} />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-strong)] truncate max-w-[200px]">
            {section.title || location.name}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={loadWeather}
            disabled={loading}
            className={`p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-black/10 rounded-md transition-all ${
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
                className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                title="Modifier le widget"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDeleteSection(section.id)}
                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                title="Supprimer le widget"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 space-y-4 max-h-[580px] overflow-y-auto pr-1">
        {loading && !data && (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-20 bg-black/10 rounded-xl"></div>
            <div className="h-16 bg-black/10 rounded-xl"></div>
            <div className="h-32 bg-black/10 rounded-xl"></div>
          </div>
        )}

        {error && !data && (
          <div className="py-6 px-4 text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              onClick={loadWeather}
              className="mt-2 text-xs font-semibold px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-md transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Current Weather Card */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-500/10 via-[var(--color-surface)] to-indigo-500/10 border border-sky-500/20 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
                    <MapPin size={13} className="text-sky-400" />
                    <span>
                      {data.location.name}
                      {data.location.country ? `, ${data.location.country}` : ''}
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-[var(--color-text-strong)] tracking-tight mt-1">
                    {data.current.temp}°C
                  </div>
                  <div className="text-xs font-medium text-[var(--color-text)] mt-0.5">
                    {getWeatherInfo(data.current.weatherCode, data.current.isDay).label}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <WeatherIcon
                    code={data.current.weatherCode}
                    isDay={data.current.isDay}
                    size={42}
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Ressenti {data.current.apparentTemp}°
                  </span>
                </div>
              </div>

              {/* Current details row */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[var(--color-border)]/50 text-[11px] text-[var(--color-text-muted)]">
                <div className="flex items-center gap-1">
                  <Thermometer size={13} className="text-amber-400/80" />
                  <span>
                    {data.daily[0]?.tempMin}° / {data.daily[0]?.tempMax}°
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplets size={13} className="text-sky-400/80" />
                  <span>{data.current.humidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind size={13} className="text-teal-400/80" />
                  <span>{data.current.windSpeed} km/h</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between gap-1 p-1 bg-black/15 rounded-lg border border-[var(--color-border)]/50 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('hourly')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-medium transition-all ${
                  activeTab === 'hourly'
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Clock size={13} />
                <span>Par heure (24h)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-medium transition-all ${
                  activeTab === 'daily'
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Calendar size={13} />
                <span>7 prochains jours</span>
              </button>
            </div>

            {/* Hourly Forecast */}
            {activeTab === 'hourly' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] px-1 font-medium">
                  <span>Prochaines 24 heures</span>
                  <span>{data.hourly.length} créneaux</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-white/10">
                  {data.hourly.map((hour, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 flex flex-col items-center justify-between p-2 rounded-xl bg-black/10 hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)]/40 min-w-[62px] transition-colors"
                    >
                      <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                        {idx === 0 ? 'Maint.' : formatHour(hour.time)}
                      </span>
                      <div className="my-1.5">
                        <WeatherIcon
                          code={hour.weatherCode}
                          isDay={hour.isDay}
                          size={22}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--color-text-strong)]">
                        {hour.temp}°
                      </span>
                      {hour.precipitationProb > 0 ? (
                        <span className="text-[10px] text-sky-400 font-semibold mt-0.5">
                          {hour.precipitationProb}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-transparent mt-0.5">-</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7-Day Forecast */}
            {activeTab === 'daily' && (
              <div className="space-y-1.5">
                <div className="text-[11px] text-[var(--color-text-muted)] px-1 font-medium">
                  Prévisions sur 7 jours
                </div>
                <div className="space-y-1.5">
                  {data.daily.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-black/10 hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)]/40 transition-colors text-xs"
                    >
                      {/* Day name */}
                      <div className="w-20 font-semibold text-[var(--color-text-strong)] truncate">
                        {day.dayName}
                      </div>

                      {/* Icon and label */}
                      <div className="flex items-center gap-1.5 flex-1 justify-center">
                        <WeatherIcon code={day.weatherCode} isDay={true} size={18} />
                        {day.precipitationProbMax > 20 && (
                          <span className="text-[10px] text-sky-400 font-medium">
                            {day.precipitationProbMax}%
                          </span>
                        )}
                      </div>

                      {/* Min / Max Temperature Bar */}
                      <div className="flex items-center gap-2 justify-end w-24">
                        <span className="text-[var(--color-text-muted)] font-medium">
                          {day.tempMin}°
                        </span>
                        <div className="w-12 h-1.5 rounded-full bg-black/20 overflow-hidden relative">
                          <div
                            className="absolute h-full bg-gradient-to-r from-sky-400 to-amber-400 rounded-full"
                            style={{
                              left: '10%',
                              right: '10%',
                            }}
                          />
                        </div>
                        <span className="font-bold text-[var(--color-text-strong)]">
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
