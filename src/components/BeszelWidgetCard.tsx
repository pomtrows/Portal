import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Section } from '../types';
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  RotateCw,
  Edit2,
  Trash2,
  GripVertical,
  ExternalLink,
  AlertCircle,
  Thermometer,
  Boxes,
  Zap,
  CheckCircle2,
  XCircle,
  PauseCircle, ArrowRight} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  fetchBeszelSystems,
  parseBeszelConfig,
  formatUptime,
  formatGigabytes,
  normalizeBeszelUrl,
  type BeszelSystem,
} from '../utils/beszel';
import { usePreferences } from '../hooks/usePreferences';

interface BeszelWidgetCardProps {
  section: Section;
  isEditMode: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onTransferSection?: (section: Section) => void;
  onUpdateSpan?: (sectionId: string, col_span: number) => void;
  onUpdateHeight?: (sectionId: string, row_span: number) => void;
  maxAllowedSpan?: number;
}

export const BeszelWidgetCard: React.FC<BeszelWidgetCardProps> = ({
  section,
  isEditMode,
  onEditSection,
  onDeleteSection,
  onTransferSection,
  onUpdateSpan,
  onUpdateHeight,
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
      case 'compact':
        return 'text-xs sm:text-sm font-bold';
      case 'large':
        return 'text-base sm:text-lg font-bold';
      default:
        return 'text-sm sm:text-base font-bold';
    }
  };

  const config = useMemo(() => parseBeszelConfig(section.widget_url), [section.widget_url]);
  const [systems, setSystems] = useState<BeszelSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!config.url) {
      setError('Veuillez configurer l\'URL de votre instance Beszel.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchBeszelSystems(config);
      if (isMountedRef.current) {
        setSystems(data);
        setLastUpdated(
          new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      }
    } catch (err: any) {
      console.error('Error fetching Beszel systems:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Impossible de se connecter au serveur Beszel.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [config]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    // Auto-refresh every 20 seconds
    const interval = setInterval(() => {
      loadData();
    }, 20_000);

    // Refresh when user returns to this browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  // Selected system or all systems
  const targetSystem =
    config.systemId && config.systemId !== 'all'
      ? systems.find((s) => s.id === config.systemId)
      : systems.length === 1
      ? systems[0]
      : null;

  const getGaugeColor = (percent: number) => {
    if (percent >= 85) return 'bg-rose-500 text-rose-500';
    if (percent >= 70) return 'bg-amber-500 text-amber-500';
    return 'bg-emerald-500 text-emerald-500';
  };

  const getStatusBadge = (status: BeszelSystem['status']) => {
    switch (status) {
      case 'up':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 size={11} className="stroke-[2.5]" />
            <span>En ligne</span>
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
            <PauseCircle size={11} className="stroke-[2.5]" />
            <span>En pause</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25">
            <XCircle size={11} className="stroke-[2.5]" />
            <span>Hors ligne</span>
          </span>
        );
    }
  };

  const hubUrl = config.url ? normalizeBeszelUrl(config.url) : '#';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        'glass-panel p-3 sm:p-3.5 w-full h-full flex flex-col min-w-0 ' +
        (isDragging ? 'z-50 shadow-2xl ring-2 ring-[var(--color-primary)]' : '')
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--color-border)] gap-1.5 min-w-0">
        <div
          className={`flex items-center gap-2 min-w-0 flex-1 ${
            isEditMode ? 'cursor-grab active:cursor-grabbing select-none' : ''
          }`}
          {...(isEditMode ? { ...attributes, ...listeners } : {})}
        >
          {isEditMode && (
            <div
              className="hover:bg-black/10 p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors -ml-1 flex-shrink-0"
              title="Cliquer et glisser pour déplacer le widget"
            >
              <GripVertical size={16} />
            </div>
          )}
          <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex-shrink-0">
            <Server size={17} />
          </div>
          <div className="min-w-0">
            <h2
              className={`${getTitleClass()} text-[var(--color-text-strong)] truncate min-w-0`}
              title={section.title || config.title}
            >
              {section.title || config.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {lastUpdated && !isEditMode && (
            <span
              className="text-[10px] text-[var(--color-text-muted)] hidden sm:inline-flex items-center gap-1"
              title={`Dernière actualisation à ${lastUpdated}`}
            >
              <Activity size={10} className="text-teal-500 animate-pulse" />
              <span>{lastUpdated}</span>
            </span>
          )}

          {config.url && (
            <a
              href={hubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-black/10 rounded-md transition-colors"
              title="Ouvrir le tableau de bord Beszel"
            >
              <ExternalLink size={14} />
            </a>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className={
              'p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-black/10 rounded-md transition-all ' +
              (loading ? 'animate-spin' : '')
            }
            title="Rafraîchir les métriques"
          >
            <RotateCw size={14} />
          </button>

          {isEditMode && (
            <>
              {onUpdateSpan && (
                <div
                  className="flex items-center bg-black/10 dark:bg-white/10 rounded-md px-1 py-0.5 text-xs font-bold gap-1 text-[var(--color-text-strong)] mr-0.5"
                  title="Largeur du widget (nombre de colonnes)"
                >
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSpan(
                        section.id,
                        Math.max(1, (section.col_span || 1) - 1)
                      )
                    }
                    disabled={(section.col_span || 1) <= 1}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                    title="Réduire d'une colonne"
                  >
                    -
                  </button>
                  <span className="text-[11px] select-none font-semibold px-0.5">
                    {section.col_span || 1} col
                    {(section.col_span || 1) > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSpan(
                        section.id,
                        Math.min(
                          maxAllowedSpan,
                          (section.col_span || 1) + 1
                        )
                      )
                    }
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
                  className="flex items-center bg-black/10 dark:bg-white/10 rounded-md px-1 py-0.5 text-xs font-bold gap-1 text-[var(--color-text-strong)] mr-0.5"
                  title="Hauteur du widget (nombre de lignes de grille)"
                >
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateHeight(
                        section.id,
                        Math.max(4, (section.row_span || 6) - 1)
                      )
                    }
                    disabled={(section.row_span || 6) <= 4}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                    title="Diminuer la hauteur"
                  >
                    -
                  </button>
                  <span className="text-[11px] select-none font-semibold px-0.5">
                    H: {section.row_span || 6}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateHeight(
                        section.id,
                        Math.min(25, (section.row_span || 6) + 1)
                      )
                    }
                    disabled={(section.row_span || 6) >= 25}
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
                className="p-1 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors ml-0.5"
                title="Modifier le widget"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => onDeleteSection(section.id)}
                className="p-1 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                title="Supprimer le widget"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {loading && systems.length === 0 && (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)] text-xs">
            <RotateCw size={18} className="animate-spin text-teal-500" />
            <span>Connexion à Beszel...</span>
          </div>
        )}

        {error && systems.length === 0 && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center flex flex-col items-center gap-1.5 text-xs text-red-400">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              onClick={loadData}
              className="mt-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md transition-colors text-[11px]"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && systems.length === 0 && (
          <div className="py-6 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-xl">
            Aucun serveur trouvé sur cette instance Beszel.
          </div>
        )}

        {/* View 1: Single Targeted System */}
        {targetSystem && (
          <div className="space-y-3">
            {/* System Info Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-sm text-[var(--color-text-strong)] truncate">
                  {targetSystem.name}
                </div>
                {targetSystem.host && (
                  <div className="text-[11px] text-[var(--color-text-muted)] font-mono truncate">
                    {targetSystem.host}
                  </div>
                )}
              </div>
              {getStatusBadge(targetSystem.status)}
            </div>

            {/* Gauges Grid */}
            <div className="space-y-2 pt-1">
              {/* CPU */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-muted)]">
                    <Cpu size={13} className="text-teal-500" />
                    <span>CPU</span>
                  </span>
                  <span className="font-bold font-mono text-[var(--color-text-strong)]">
                    {targetSystem.stats.cpuPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getGaugeColor(
                      targetSystem.stats.cpuPercent
                    ).split(' ')[0]}`}
                    style={{ width: `${targetSystem.stats.cpuPercent}%` }}
                  />
                </div>
              </div>

              {/* Memory (RAM) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-muted)]">
                    <Activity size={13} className="text-sky-500" />
                    <span>RAM</span>
                  </span>
                  <span className="text-[11px] font-mono text-[var(--color-text-strong)]">
                    <span className="font-bold">{targetSystem.stats.memPercent}%</span>
                    <span className="text-[var(--color-text-muted)] ml-1">
                      ({formatGigabytes(targetSystem.stats.memUsed)} /{' '}
                      {formatGigabytes(targetSystem.stats.memTotal)})
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getGaugeColor(
                      targetSystem.stats.memPercent
                    ).split(' ')[0]}`}
                    style={{ width: `${targetSystem.stats.memPercent}%` }}
                  />
                </div>
              </div>

              {/* Disk */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-muted)]">
                    <HardDrive size={13} className="text-indigo-500" />
                    <span>Disque</span>
                  </span>
                  <span className="text-[11px] font-mono text-[var(--color-text-strong)]">
                    <span className="font-bold">{targetSystem.stats.diskPercent}%</span>
                    <span className="text-[var(--color-text-muted)] ml-1">
                      ({formatGigabytes(targetSystem.stats.diskUsed)} /{' '}
                      {formatGigabytes(targetSystem.stats.diskTotal)})
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getGaugeColor(
                      targetSystem.stats.diskPercent
                    ).split(' ')[0]}`}
                    style={{ width: `${targetSystem.stats.diskPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Badges Footer */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--color-border)]/50 text-[11px] text-[var(--color-text-muted)]">
              {targetSystem.stats.uptimeSeconds !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock size={12} className="opacity-70" />
                  <span>Uptime : {formatUptime(targetSystem.stats.uptimeSeconds)}</span>
                </div>
              )}
              {targetSystem.stats.powerWatts !== undefined && (
                <div className="flex items-center gap-1 font-mono text-amber-600 dark:text-amber-400 font-semibold" title="Consommation électrique instantanée">
                  <Zap size={12} className="text-amber-500 fill-amber-500/20" />
                  <span>{targetSystem.stats.powerWatts} W</span>
                </div>
              )}
              {targetSystem.stats.temp !== undefined && (
                <div className="flex items-center gap-1 ml-auto font-mono">
                  <Thermometer size={12} className="text-amber-500" />
                  <span>{targetSystem.stats.temp}°C</span>
                </div>
              )}
              {targetSystem.stats.dockerCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Boxes size={12} className="text-sky-500" />
                  <span>{targetSystem.stats.dockerCount} docker</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View 2: Multi-Systems Overview List */}
        {!targetSystem && systems.length > 0 && (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {systems.map((sys) => (
              <div
                key={sys.id}
                className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--color-border)]/60 hover:border-teal-500/40 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="font-bold text-xs text-[var(--color-text-strong)] truncate">
                    {sys.name}
                  </div>
                  {getStatusBadge(sys.status)}
                </div>

                {/* Mini Gauges Row */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mb-0.5">
                      <span>CPU</span>
                      <span className="font-mono font-bold text-[var(--color-text-strong)]">
                        {sys.stats.cpuPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getGaugeColor(
                          sys.stats.cpuPercent
                        ).split(' ')[0]}`}
                        style={{ width: `${sys.stats.cpuPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mb-0.5">
                      <span>RAM</span>
                      <span className="font-mono font-bold text-[var(--color-text-strong)]">
                        {sys.stats.memPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getGaugeColor(
                          sys.stats.memPercent
                        ).split(' ')[0]}`}
                        style={{ width: `${sys.stats.memPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {sys.stats.uptimeSeconds !== undefined && (
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] pt-0.5">
                    <span>Uptime : {formatUptime(sys.stats.uptimeSeconds)}</span>
                    {sys.stats.dockerCount !== undefined && (
                      <span>{sys.stats.dockerCount} conteneurs</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
