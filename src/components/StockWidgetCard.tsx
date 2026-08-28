import React, { useState, useEffect, useCallback } from 'react';
import type { Section } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCw,
  Edit2,
  Trash2,
  AlertCircle,
  GripVertical,
  ExternalLink
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  parseStockConfig,
  fetchStockQuotes,
  formatPrice,
  getStockDetailsUrl,
  type StockQuote
} from '../utils/stocks';
import { usePreferences } from '../hooks/usePreferences';

interface StockWidgetCardProps {
  section: Section;
  isEditMode: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onUpdateSpan?: (sectionId: string, col_span: number) => void;
  onUpdateHeight?: (sectionId: string, row_span: number) => void;
  maxAllowedSpan?: number;
}

export const StockWidgetCard: React.FC<StockWidgetCardProps> = ({
  section,
  isEditMode,
  onEditSection,
  onDeleteSection,
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

  const config = parseStockConfig(section.widget_url);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const loadData = useCallback(async () => {
    if (!config.symbols || config.symbols.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStockQuotes(config.symbols);
      setQuotes(data);
    } catch (err: any) {
      console.error('Error fetching stock quotes:', err);
      setError(err?.message || 'Erreur lors de la récupération des cours.');
    } finally {
      setLoading(false);
    }
  }, [config.symbols]);

  useEffect(() => {
    loadData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadData();
    }, 60_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  // Categories available in the configured symbols
  const categories = ['all', ...Array.from(new Set(config.symbols.map((s) => s.category).filter(Boolean)))];

  const filteredSymbols = config.symbols.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'all': return 'Tous';
      case 'index': return 'Indices';
      case 'stock': return 'Actions';
      case 'crypto': return 'Crypto';
      case 'forex': return 'Devises';
      case 'commodity': return 'Matières';
      default: return cat;
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
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[var(--color-border)]">
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
            <div className="p-1 rounded-lg bg-emerald-900/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex-shrink-0">
              <TrendingUp size={17} />
            </div>
          )}
          <h2 className={`${getTitleClass()} text-slate-950 dark:text-white truncate`} title={config.title || section.title}>
            {config.title || section.title || 'Bourse & Marchés'}
          </h2>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className={`p-1 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-black/10 rounded-md transition-all ${
              loading ? 'animate-spin' : ''
            }`}
            title="Actualiser les cours"
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
                    onClick={() => onUpdateHeight(section.id, Math.max(3, (section.row_span || 6) - 1))}
                    disabled={(section.row_span || 6) <= 3}
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
                    onClick={() => onUpdateHeight(section.id, Math.min(25, (section.row_span || 6) + 1))}
                    disabled={(section.row_span || 6) >= 25}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                    title="Augmenter la hauteur"
                  >
                    +
                  </button>
                </div>
              )}
              <button
                onClick={() => onEditSection(section)}
                className="p-1 text-blue-700 dark:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                title="Modifier les symboles suivis"
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

      {/* Category Pills Filter (if multiple categories) */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1 mb-2 overflow-x-auto scrollbar-none pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat || 'all')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-black/10'
              }`}
            >
              {getCategoryLabel(cat || 'all')}
            </button>
          ))}
        </div>
      )}

      {/* Widget Body */}
      <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
        {loading && Object.keys(quotes).length === 0 && (
          <div className="space-y-1.5 py-1 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        )}

        {error && Object.keys(quotes).length === 0 && (
          <div className="py-4 px-3 text-center text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800/50 rounded-xl flex flex-col items-center gap-1.5">
            <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
            <span className="font-medium">{error}</span>
            <button
              onClick={loadData}
              className="mt-1 text-xs font-bold px-2.5 py-1 bg-red-200 dark:bg-red-900/60 hover:bg-red-300 dark:hover:bg-red-800/80 rounded-md transition-colors text-red-900 dark:text-red-100"
            >
              Réessayer
            </button>
          </div>
        )}

        {filteredSymbols.map((item) => {
          const quote = quotes[item.symbol];
          const isPositive = quote ? quote.changePercent > 0 : false;
          const isNegative = quote ? quote.changePercent < 0 : false;

          return (
            <a
              key={item.symbol}
              href={getStockDetailsUrl(item.symbol)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/50 hover:bg-black/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-slate-700/50 transition-all group"
            >
              {/* Asset Name & Ticker */}
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-950 dark:text-white truncate group-hover:text-[var(--color-primary)] transition-colors">
                    {item.name || quote?.name || item.symbol}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                    {item.symbol}
                  </span>
                </div>
                {item.category && (
                  <div className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {getCategoryLabel(item.category)}
                  </div>
                )}
              </div>

              {/* Price & Variation Badge */}
              <div className="text-right flex items-center gap-2 flex-shrink-0">
                <div>
                  <div className="text-xs font-black text-slate-950 dark:text-white tracking-tight">
                    {quote ? formatPrice(quote.price, quote.currency) : '--'}
                  </div>
                  {quote?.previousClose !== undefined && (
                    <div className="text-[9px] text-slate-600 dark:text-slate-400">
                      Préc: {formatPrice(quote.previousClose, quote.currency)}
                    </div>
                  )}
                </div>

                {/* Change % Badge */}
                <div
                  className={`min-w-[62px] px-1.5 py-1 rounded-lg text-right font-extrabold text-[11px] flex items-center justify-end gap-0.5 ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                      : isNegative
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                      : 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp size={11} className="text-emerald-700 dark:text-emerald-400" />
                  ) : isNegative ? (
                    <TrendingDown size={11} className="text-red-600 dark:text-red-400" />
                  ) : (
                    <Minus size={11} className="text-slate-500" />
                  )}
                  <span>
                    {quote
                      ? `${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%`
                      : '0.00%'}
                  </span>
                </div>

                <ExternalLink
                  size={12}
                  className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-0.5"
                />
              </div>
            </a>
          );
        })}

        {filteredSymbols.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-500">
            Aucun symbole dans cette catégorie.
          </div>
        )}
      </div>
    </div>
  );
};
