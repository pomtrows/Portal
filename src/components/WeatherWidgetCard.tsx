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
  Umbrella,
  ChevronDown
, ArrowRight} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  fetchWeatherData,
  parseWeatherConfig,
  getWeatherInfo,
  type WeatherData
} from '../utils/weather';
import { usePreferences } from '../hooks/usePreferences';

interface WeatherWidgetCardProps {
  section: Section;
  isEditMode: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onTransferSection?: (section: Section) => void;
  onUpdateSpan?: (sectionId: string, col_span: number) => void;
  onUpdateHeight?: (sectionId: string, row_span: number) => void;
  maxAllowedSpan?: number;
}

export const WeatherIcon: React.FC<{
  code: number;
  isDay?: boolean;
  className?: string;
  size?: number;
}> = ({ code, isDay = true, className = '', size = 18 }) => {
  const info = getWeatherInfo(code, isDay);
  const iconClass = `${info.colorClass} ${className}`;

  switch (info.icon) {
    case 'Sun':
      return <Sun size={size} className={iconClass} />;
    case 'SunMedium':
      return <SunMedium size={size} className={iconClass} />;
    case 'Moon':
      return <Moon size={size} className={iconClass} />;
    case 'CloudSun':
      return <CloudSun size={size} className={iconClass} />;
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
    default:
      return <Sun size={size} className={iconClass} />;
  }
};

export const WeatherWidgetCard: React.FC<WeatherWidgetCardProps> = ({
  section,
  isEditMode,
  onEditSection,
  onDeleteSection,
  onTransferSection,
  onUpdateSpan,
  onUpdateHeight,
  maxAllowedSpan = 8,
}) => {
  const { fontSizeSection, sectionPadding } = usePreferences();
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

  const getPaddingClass = () => {
    switch (sectionPadding) {
      case 'xs': return 'p-1.5 sm:p-2';
      case 'sm': return 'p-2 sm:p-2.5';
      case 'lg': return 'p-3.5 sm:p-4';
      case 'xl': return 'p-4 sm:p-5';
      default: return 'p-2.5 sm:p-3';
    }
  };

  const getTitleClass = () => {
    switch (fontSizeSection) {
      case 'compact': return 'text-xs sm:text-sm font-bold';
      case 'large': return 'text-base sm:text-lg font-bold';
      default: return 'text-sm sm:text-base font-bold';
    }
  };

  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');
  const [expandedDayDate, setExpandedDayDate] = useState<string | null>(null);

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

    // Auto-refresh weather every 15 minutes
    const interval = setInterval(() => {
      loadWeather();
    }, 900_000);

    // Refresh when user comes back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadWeather();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      className={`glass-panel ${getPaddingClass()} w-full h-auto md:h-full flex flex-col ${
        isDragging ? 'z-50 shadow-2xl ring-2 ring-[var(--color-primary)]' : ''
      }`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[var(--color-border)]">
        <div
          className={`flex items-center gap-1.5 min-w-0 flex-1 ${isEditMode ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
          {...(isEditMode ? { ...attributes, ...listeners } : {})}
        >
          {isEditMode && (
            <div
              className="hover:bg-black/10 p-1 rounded-lg text-slate-800 dark:text-slate-200 transition-colors -ml-1 flex-shrink-0"
              title="Cliquer et glisser pour déplacer le widget"
            >
              <GripVertical size={18} />
            </div>
          )}
          {!isEditMode && (
            <div className="p-1 rounded-lg bg-blue-900/10 dark:bg-sky-500/15 text-blue-800 dark:text-sky-300 flex-shrink-0">
              <CloudSun size={17} />
            </div>
          )}
          <h2 className={`${getTitleClass()} text-slate-950 dark:text-white truncate`} title={section.title || location.name}>
            {section.title || location.name}
          </h2>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={loadWeather}
            disabled={loading}
            className={`p-1 text-slate-700 dark:text-slate-300 hover:text-blue-800 dark:hover:text-sky-300 hover:bg-black/10 rounded-md transition-all ${
              loading ? 'animate-spin' : ''
            }`}
            title="Actualiser la météo"
          >
            <RotateCw size={15} />
          </button>

          {isEditMode && (
            <>
              {onUpdateSpan && (
                <div
                  className="flex items-center bg-black/10 dark:bg-white/10 rounded-md px-1 py-0.5 text-xs font-bold gap-1 text-slate-800 dark:text-slate-200 mr-0.5"
                  title="Largeur du widget (nombre de colonnes)"
                >
                  <button
                    type="button"
                    onClick={() => onUpdateSpan(section.id, Math.max(1, (section.col_span || 1) - 1))}
                    disabled={(section.col_span || 1) <= 1}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                    title="Réduire d'une colonne"
                  >
                    -
                  </button>
                  <span className="text-[11px] select-none font-semibold px-0.5">
                    {section.col_span || 1} col{(section.col_span || 1) > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateSpan(section.id, Math.min(maxAllowedSpan, (section.col_span || 1) + 1))}
                    disabled={(section.col_span || 1) >= maxAllowedSpan}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                    title="Étendre d'une colonne"
                  >
                    +
                  </button>
                </div>
              )}
              {onUpdateHeight && (
                <div
                  className="flex items-center bg-black/10 dark:bg-white/10 rounded-md px-1 py-0.5 text-xs font-bold gap-1 text-slate-800 dark:text-slate-200 mr-0.5"
                  title="Hauteur du widget (nombre de lignes de grille)"
                >
                  <button
                    type="button"
                    onClick={() => onUpdateHeight(section.id, Math.max(3, (section.row_span || 7) - 1))}
                    disabled={(section.row_span || 7) <= 3}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                    title="Diminuer la hauteur"
                  >
                    -
                  </button>
                  <span className="text-[11px] select-none font-semibold px-0.5">
                    H: {section.row_span || 7}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateHeight(section.id, Math.min(25, (section.row_span || 7) + 1))}
                    disabled={(section.row_span || 7) >= 25}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                    title="Augmenter la hauteur"
                  >
                    +
                  </button>
                </div>
              )}
              {onTransferSection && (
              <button
                onClick={() => onTransferSection(section)}
                className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors"
                title="Transférer ou Dupliquer"
              >
                <ArrowRight size={16} />
              </button>
            )}
            <button
                onClick={() => onEditSection(section)}
                className="p-1 text-blue-700 dark:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                title="Modifier le widget"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => onDeleteSection(section.id)}
                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                title="Supprimer le widget"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 space-y-2.5 max-h-[580px] overflow-y-auto pr-0.5">
        {loading && !data && (
          <div className="space-y-2 py-2 animate-pulse">
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        )}

        {error && !data && (
          <div className="py-4 px-3 text-center text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800/50 rounded-xl flex flex-col items-center gap-1.5">
            <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
            <span className="font-medium">{error}</span>
            <button
              onClick={loadWeather}
              className="mt-1 text-xs font-bold px-2.5 py-1 bg-red-200 dark:bg-red-900/60 hover:bg-red-300 dark:hover:bg-red-800/80 rounded-md transition-colors text-red-900 dark:text-red-100"
            >
              Réessayer
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Current Weather Card */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/90 dark:bg-slate-800/60 border border-blue-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-blue-900 dark:text-sky-300 font-bold truncate max-w-[130px]">
                    <MapPin size={12} className="text-blue-700 dark:text-sky-400 flex-shrink-0" />
                    <span className="truncate">
                      {data.location.name}
                      {data.location.country ? `, ${data.location.country}` : ''}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight mt-0.5">
                    {data.current.temp}°C
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {getWeatherInfo(data.current.weatherCode, data.current.isDay).label}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <WeatherIcon
                    code={data.current.weatherCode}
                    isDay={data.current.isDay}
                    size={38}
                  />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    Ressenti {data.current.apparentTemp}°
                  </span>
                </div>
              </div>

              {/* Current details row */}
              <div className="grid grid-cols-3 gap-1 mt-2 pt-1.5 border-t border-blue-200/80 dark:border-slate-700/80 text-[11px] text-slate-800 dark:text-slate-200 font-medium">
                <div className="flex items-center gap-0.5 truncate">
                  <Thermometer size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="truncate">
                    {data.daily[0]?.tempMin}° / {data.daily[0]?.tempMax}°
                  </span>
                </div>
                <div className="flex items-center gap-0.5 justify-center">
                  <Droplets size={12} className="text-blue-700 dark:text-sky-400 flex-shrink-0" />
                  <span>{data.current.humidity}%</span>
                </div>
                <div className="flex items-center gap-0.5 justify-end">
                  <Wind size={12} className="text-teal-700 dark:text-teal-400 flex-shrink-0" />
                  <span>{data.current.windSpeed} km/h</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between gap-1 p-1 bg-slate-200/80 dark:bg-black/40 rounded-lg border border-slate-300 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('hourly')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md font-bold transition-all ${
                  activeTab === 'hourly'
                    ? 'bg-blue-800 dark:bg-blue-600 text-white shadow-sm'
                    : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white'
                }`}
              >
                <Clock size={13} />
                <span>24h</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md font-bold transition-all ${
                  activeTab === 'daily'
                    ? 'bg-blue-800 dark:bg-blue-600 text-white shadow-sm'
                    : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white'
                }`}
              >
                <Calendar size={13} />
                <span>7 jours</span>
              </button>
            </div>

            {/* Hourly Forecast (LIST VIEW) */}
            {activeTab === 'hourly' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 dark:text-slate-200 px-1">
                  <span>Prévisions sur 24h</span>
                  <span className="text-[10px] text-slate-700 dark:text-slate-400">
                    {data.hourly.length}h
                  </span>
                </div>
                <div className="space-y-1 max-h-[290px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {data.hourly.map((hour, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100/90 dark:bg-slate-800/50 hover:bg-slate-200/90 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/50 transition-colors text-xs"
                    >
                      {/* Hour label */}
                      <div className="font-bold text-slate-950 dark:text-white text-xs flex items-center gap-1 whitespace-nowrap min-w-[55px]">
                        <Clock size={11} className="text-slate-500 dark:text-slate-400" />
                        <span>{idx === 0 ? 'Maint.' : formatHour(hour.time)}</span>
                      </div>

                      {/* Icon + Rain % */}
                      <div className="flex items-center gap-1.5 flex-1 justify-center min-w-0">
                        <WeatherIcon
                          code={hour.weatherCode}
                          isDay={hour.isDay}
                          size={16}
                        />
                        {hour.precipitationProb > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-800 dark:text-sky-300 whitespace-nowrap">
                            <Umbrella size={10} className="text-blue-700 dark:text-sky-400" />
                            {hour.precipitationProb}%
                          </span>
                        )}
                      </div>

                      {/* Temperature */}
                      <div className="text-right font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm whitespace-nowrap min-w-[32px]">
                        {hour.temp}°
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7-Day Forecast (LIST VIEW WITH HOURLY EXPANSION) */}
            {activeTab === 'daily' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 dark:text-slate-200 px-1">
                  <span>Prévisions sur 7 jours</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    Cliquez pour voir les heures
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {data.daily.map((day, idx) => {
                    const isExpanded = expandedDayDate === day.date;
                    return (
                      <div
                        key={day.date || idx}
                        className={`rounded-lg transition-all border ${
                          isExpanded
                            ? 'bg-blue-50/70 dark:bg-slate-800/80 border-blue-300 dark:border-blue-700/60 shadow-sm'
                            : 'bg-slate-100/90 dark:bg-slate-800/50 hover:bg-slate-200/90 dark:hover:bg-slate-700/60 border-slate-200/80 dark:border-slate-700/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedDayDate(isExpanded ? null : day.date)}
                          className="w-full flex items-center justify-between gap-1.5 py-1.5 px-2 cursor-pointer select-none text-left"
                          title={isExpanded ? 'Masquer les heures' : 'Afficher le détail heure par heure'}
                        >
                          {/* Day name + expand indicator */}
                          <div className="flex items-center gap-1 font-bold text-slate-950 dark:text-white text-xs truncate min-w-[75px] max-w-[105px]">
                            <ChevronDown
                              size={13}
                              className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                                isExpanded ? 'rotate-180 text-blue-600 dark:text-sky-400' : ''
                              }`}
                            />
                            <span className="truncate">{day.dayName}</span>
                          </div>

                          {/* Icon + Rain % */}
                          <div className="flex items-center gap-1.5 flex-1 justify-center min-w-0">
                            <WeatherIcon code={day.weatherCode} isDay={true} size={16} />
                            {day.precipitationProbMax > 20 && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-800 dark:text-sky-300 whitespace-nowrap">
                                <Umbrella size={10} className="text-blue-700 dark:text-sky-400" />
                                {day.precipitationProbMax}%
                              </span>
                            )}
                          </div>

                          {/* Min / Max Temperature */}
                          <div className="flex items-center gap-1 justify-end font-bold text-xs whitespace-nowrap min-w-[50px]">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">
                              {day.tempMin}°
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 font-normal">/</span>
                            <span className="font-extrabold text-slate-950 dark:text-white">
                              {day.tempMax}°
                            </span>
                          </div>
                        </button>

                        {/* Hourly breakdown for this specific day */}
                        {isExpanded && (
                          <div className="px-2 pb-2 pt-1 border-t border-blue-200/60 dark:border-slate-700/60 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-blue-900 dark:text-sky-300 px-0.5 mb-1">
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                Prévisions heure par heure ({day.dayName})
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                {day.hourly?.length || 0}h
                              </span>
                            </div>

                            {day.hourly && day.hourly.length > 0 ? (
                              <div className="space-y-1 max-h-[190px] overflow-y-auto pr-0.5 scrollbar-thin">
                                {day.hourly.map((h, hIdx) => (
                                  <div
                                    key={hIdx}
                                    className="flex items-center justify-between gap-1.5 py-1 px-1.5 rounded-md bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40 text-xs"
                                  >
                                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] flex items-center gap-1 min-w-[46px]">
                                      <Clock size={10} className="text-slate-400" />
                                      <span>{formatHour(h.time)}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-1 justify-center min-w-0">
                                      <WeatherIcon code={h.weatherCode} isDay={h.isDay} size={14} />
                                      {h.precipitationProb > 0 && (
                                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 dark:text-sky-300 whitespace-nowrap">
                                          <Umbrella size={9} className="text-blue-600 dark:text-sky-400" />
                                          {h.precipitationProb}%
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-right font-bold text-slate-900 dark:text-white text-xs min-w-[30px]">
                                      {h.temp}°
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 py-1 text-center italic">
                                Données horaires non disponibles
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
