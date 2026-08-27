import React, { useState, useEffect, useCallback } from 'react';
import type { Section } from '../types';
import {
  Car,
  ArrowRightLeft,
  RotateCw,
  Edit2,
  Trash2,
  AlertCircle,
  GripVertical,
  ExternalLink,
  Navigation,
  Clock
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  calculateRoute,
  parseTrafficConfig,
  getGoogleMapsUrl,
  getWazeUrl,
  type RouteResult,
  type TrafficLocation
} from '../utils/traffic';

import { usePreferences } from '../hooks/usePreferences';

interface TrafficWidgetCardProps {
  section: Section;
  isEditMode: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onUpdateSpan?: (sectionId: string, col_span: number) => void;
  maxAllowedSpan?: number;
}

export const TrafficWidgetCard: React.FC<TrafficWidgetCardProps> = ({
  section,
  isEditMode,
  onEditSection,
  onDeleteSection,
  onUpdateSpan,
  maxAllowedSpan = 8,
}) => {
  const { fontSizeSection } = usePreferences();
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

  const getTitleClass = () => {
    switch (fontSizeSection) {
      case 'compact': return 'text-xs sm:text-sm font-bold';
      case 'large': return 'text-base sm:text-lg font-bold';
      default: return 'text-sm sm:text-base font-bold';
    }
  };

  const initialConfig = parseTrafficConfig(section.widget_url);
  const [startLoc, setStartLoc] = useState<TrafficLocation>(initialConfig.start);
  const [endLoc, setEndLoc] = useState<TrafficLocation>(initialConfig.end);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when widget_url changes
  useEffect(() => {
    const conf = parseTrafficConfig(section.widget_url);
    setStartLoc(conf.start);
    setEndLoc(conf.end);
  }, [section.widget_url]);

  const loadRoute = useCallback(async (start: TrafficLocation, end: TrafficLocation) => {
    setLoading(true);
    setError(null);
    try {
      const res = await calculateRoute(start, end);
      setRoute(res);
    } catch (err: any) {
      console.error('Error calculating traffic route:', err);
      setError(err?.message || "Impossible d'obtenir le temps de trajet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (startLoc && endLoc) {
      loadRoute(startLoc, endLoc);
    }
  }, [startLoc, endLoc, loadRoute]);

  const handleSwapLocations = () => {
    const newStart = endLoc;
    const newEnd = startLoc;
    setStartLoc(newStart);
    setEndLoc(newEnd);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-panel p-3 sm:p-3.5 w-full h-full flex flex-col ${
        isDragging ? 'z-50 shadow-2xl ring-2 ring-[var(--color-primary)]' : ''
      }`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-1.5 min-w-0">
          {isEditMode && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-black/10 p-1 rounded-lg text-slate-800 dark:text-slate-200 transition-colors -ml-1 flex-shrink-0"
              title="Déplacer le widget"
            >
              <GripVertical size={18} />
            </div>
          )}
          <div className="p-1 rounded-lg bg-emerald-900/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex-shrink-0">
            <Car size={17} />
          </div>
          <h2 className={`${getTitleClass()} text-slate-950 dark:text-white truncate`} title={section.title || `${startLoc.name} ➔ ${endLoc.name}`}>
            {section.title || `${startLoc.name} ➔ ${endLoc.name}`}
          </h2>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={handleSwapLocations}
            className="p-1 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-black/10 rounded-md transition-all"
            title="Inverser départ et arrivée (Aller / Retour)"
          >
            <ArrowRightLeft size={15} />
          </button>
          <button
            onClick={() => loadRoute(startLoc, endLoc)}
            disabled={loading}
            className={`p-1 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-black/10 rounded-md transition-all ${
              loading ? 'animate-spin' : ''
            }`}
            title="Actualiser le temps de trajet"
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
              <button
                onClick={() => onEditSection(section)}
                className="p-1 text-blue-700 dark:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                title="Modifier le trajet"
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

      {/* Widget Body */}
      <div className="space-y-2.5">
        {loading && !route && (
          <div className="space-y-2 py-2 animate-pulse">
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        )}

        {error && !route && (
          <div className="py-4 px-3 text-center text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800/50 rounded-xl flex flex-col items-center gap-1.5">
            <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
            <span className="font-medium">{error}</span>
            <button
              onClick={() => loadRoute(startLoc, endLoc)}
              className="mt-1 text-xs font-bold px-2.5 py-1 bg-red-200 dark:bg-red-900/60 hover:bg-red-300 dark:hover:bg-red-800/80 rounded-md transition-colors text-red-900 dark:text-red-100"
            >
              Réessayer
            </button>
          </div>
        )}

        {route && (
          <>
            {/* Travel Time & Distance Card */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/70 dark:from-slate-800/80 dark:to-slate-800/40 border border-emerald-200/80 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                    <Clock size={13} className="text-emerald-700 dark:text-emerald-400" />
                    <span>Temps de trajet estimé</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight mt-0.5">
                    {route.durationFormatted}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Distance
                  </div>
                  <div className="text-base font-extrabold text-emerald-800 dark:text-emerald-400 mt-0.5">
                    {route.distanceFormatted}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Màj à {route.updatedAt}
                  </div>
                </div>
              </div>
            </div>

            {/* Departure and Destination itinerary */}
            <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 space-y-2 text-xs">
              {/* Start */}
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-950 dark:text-white truncate">
                    {startLoc.name}
                  </div>
                  {startLoc.address && startLoc.address !== startLoc.name && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      {startLoc.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Connecting line */}
              <div className="ml-2 pl-0.5 border-l-2 border-dashed border-slate-300 dark:border-slate-600 h-2"></div>

              {/* End */}
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  B
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-950 dark:text-white truncate">
                    {endLoc.name}
                  </div>
                  {endLoc.address && endLoc.address !== endLoc.name && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      {endLoc.address}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Direct Navigation Links */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <a
                href={getGoogleMapsUrl(startLoc, endLoc)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-200/90 hover:bg-blue-600 hover:text-white dark:bg-slate-800/80 dark:hover:bg-blue-600 text-slate-900 dark:text-slate-100 font-bold text-xs transition-all border border-slate-300 dark:border-slate-700 group"
              >
                <Navigation size={13} className="text-blue-700 dark:text-sky-400 group-hover:text-white transition-colors" />
                <span>Google Maps</span>
                <ExternalLink size={11} className="opacity-60" />
              </a>

              <a
                href={getWazeUrl(endLoc)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-200/90 hover:bg-sky-500 hover:text-white dark:bg-slate-800/80 dark:hover:bg-sky-500 text-slate-900 dark:text-slate-100 font-bold text-xs transition-all border border-slate-300 dark:border-slate-700 group"
              >
                <Car size={13} className="text-sky-700 dark:text-sky-400 group-hover:text-white transition-colors" />
                <span>Waze</span>
                <ExternalLink size={11} className="opacity-60" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
