import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  fetchStockChartHistory,
  formatPrice,
  getStockDetailsUrl,
  STOCK_CHART_RANGES,
  type StockQuote,
  type StockItemConfig,
  type StockChartRange,
  type ChartHistoryResult,
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

const StockEvolutionChart: React.FC<{
  quote?: StockQuote;
  item?: StockItemConfig;
}> = ({ quote, item }) => {
  const [selectedRange, setSelectedRange] = useState<StockChartRange>('1d');
  const [rangeData, setRangeData] = useState<ChartHistoryResult | null>(null);
  const [loadingRange, setLoadingRange] = useState<boolean>(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const cacheRef = React.useRef<Record<string, ChartHistoryResult>>({});

  const symbol = item?.symbol || quote?.symbol || '';
  const displayName = item?.name || quote?.name || symbol;

  // Load chart history whenever symbol or selectedRange changes
  useEffect(() => {
    if (!symbol) return;
    const cacheKey = `${symbol}_${selectedRange}`;

    if (cacheRef.current[cacheKey]) {
      setRangeData(cacheRef.current[cacheKey]);
      return;
    }

    let isMounted = true;
    setLoadingRange(true);

    fetchStockChartHistory(symbol, selectedRange)
      .then((data) => {
        if (!isMounted) return;
        cacheRef.current[cacheKey] = data;
        setRangeData(data);
      })
      .catch((err) => {
        console.warn(`Chart history failed for ${symbol} (${selectedRange}):`, err);
      })
      .finally(() => {
        if (isMounted) setLoadingRange(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol, selectedRange]);

  if (!quote && !item) return null;

  // Determine current active history points
  const history =
    rangeData?.history && rangeData.history.length > 1
      ? rangeData.history
      : selectedRange === '1d' && quote?.history && quote.history.length > 1
      ? quote.history
      : quote?.sparkline && quote.sparkline.length > 1
      ? quote.sparkline.map((p, i) => ({ time: `${i}`, price: p }))
      : quote?.previousClose !== undefined && quote?.price !== undefined
      ? [
          { time: 'Précédent', price: quote.previousClose },
          { time: 'Actuel', price: quote.price },
        ]
      : [];

  const prices = history.map((h) => h.price);
  const minP = rangeData?.low ?? (prices.length > 0 ? Math.min(...prices) : 0);
  const maxP = rangeData?.high ?? (prices.length > 0 ? Math.max(...prices) : 1);
  const range = maxP - minP || 1;

  // Change & Percentage for selected period
  const changePercent =
    rangeData?.changePercent !== undefined
      ? rangeData.changePercent
      : (quote?.changePercent ?? 0);

  const isPositive = changePercent >= 0;

  const width = 320;
  const height = 75;
  const padX = 8;
  const padY = 8;

  // Build SVG path coordinates
  const pointsCoords = history.map((h, i) => {
    const x = padX + (i / Math.max(1, history.length - 1)) * (width - 2 * padX);
    const y = height - padY - ((h.price - minP) / range) * (height - 2 * padY);
    return { x, y, ...h };
  });

  const pathD =
    pointsCoords.length > 0
      ? `M ${pointsCoords[0].x} ${pointsCoords[0].y} ` +
        pointsCoords
          .slice(1)
          .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(' ')
      : '';

  const areaD =
    pointsCoords.length > 0
      ? `${pathD} L ${pointsCoords[pointsCoords.length - 1].x.toFixed(1)} ${height} L ${pointsCoords[0].x.toFixed(1)} ${height} Z`
      : '';

  const activePoint =
    hoverIndex !== null && pointsCoords[hoverIndex] ? pointsCoords[hoverIndex] : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (pointsCoords.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (mouseX - padX) / (width - 2 * padX)));
    const closestIdx = Math.round(ratio * (pointsCoords.length - 1));
    setHoverIndex(closestIdx);
  };

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const gradientId = `stock-grad-${symbol.replace(/[^a-zA-Z0-9]/g, '')}-${selectedRange}`;

  const currentRangeConfig = STOCK_CHART_RANGES.find((r) => r.key === selectedRange);

  return (
    <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-xs mb-2">
      {/* Top row: Name, price, change */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-xs text-slate-950 dark:text-white truncate">
            {displayName}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>{currentRangeConfig?.fullLabel || 'Évolution'}</span>
            {activePoint && (
              <span className="text-blue-600 dark:text-sky-400 font-bold">
                {activePoint.time} : {formatPrice(activePoint.price, quote?.currency)}
              </span>
            )}
          </div>
        </div>

        <div className="text-right flex items-center gap-1.5 flex-shrink-0">
          <div className="text-sm sm:text-base font-black text-slate-950 dark:text-white tracking-tight">
            {quote ? formatPrice(quote.price, quote.currency) : '--'}
          </div>
          {(quote || rangeData) && (
            <div
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-0.5 ${
                isPositive
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
              }`}
            >
              {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span>
                {changePercent >= 0 ? '+' : ''}
                {changePercent.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Range Selection Pills (1J, 1M, 6M, 1A, 5A) */}
      <div className="flex items-center justify-between gap-1 my-1.5">
        <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-lg w-full">
          {STOCK_CHART_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setSelectedRange(r.key)}
              className={`flex-1 py-0.5 px-1 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer select-none ${
                selectedRange === r.key
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={r.fullLabel}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full h-[75px] pt-1">
        {pointsCoords.length > 1 ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className={`w-full h-full overflow-visible select-none cursor-crosshair transition-opacity duration-150 ${
              loadingRange ? 'opacity-50' : 'opacity-100'
            }`}
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            <path d={areaD} fill={`url(#${gradientId})`} />

            {/* Main Line */}
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hover Indicator */}
            {activePoint && (
              <g>
                <line
                  x1={activePoint.x}
                  y1={0}
                  x2={activePoint.x}
                  y2={height}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  className="text-slate-400 dark:text-slate-500"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="4"
                  fill={strokeColor}
                  className="stroke-white dark:stroke-slate-900"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 italic">
            {loadingRange ? 'Chargement du graphique...' : 'Données graphiques en cours de chargement...'}
          </div>
        )}
      </div>

      {/* Low / Start / High footer */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-medium">
        <span>
          Bas: {minP ? formatPrice(minP, quote?.currency) : '--'}
        </span>
        <span>
          {selectedRange === '1d' ? 'Préc:' : 'Début:'}{' '}
          {rangeData?.firstPrice
            ? formatPrice(rangeData.firstPrice, quote?.currency)
            : quote?.previousClose
            ? formatPrice(quote.previousClose, quote?.currency)
            : '--'}
        </span>
        <span>
          Haut: {maxP ? formatPrice(maxP, quote?.currency) : '--'}
        </span>
      </div>
    </div>
  );
};

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

  const config = useMemo(() => parseStockConfig(section.widget_url), [section.widget_url]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const conf = parseStockConfig(section.widget_url);
    if (!conf.symbols || conf.symbols.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStockQuotes(conf.symbols);
      setQuotes(data);
    } catch (err: any) {
      console.error('Error fetching stock quotes:', err);
      setError(err?.message || 'Erreur lors de la récupération des cours.');
    } finally {
      setLoading(false);
    }
  }, [section.widget_url]);

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
  const categories = useMemo(() => [
    'all',
    ...Array.from(new Set(config.symbols.map((s) => s.category).filter(Boolean)))
  ], [config.symbols]);

  const filteredSymbols = useMemo(() => config.symbols.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  }), [config.symbols, activeCategory]);

  // Active selected item for the top chart (defaults to the first item)
  const activeSelectedSymbol = selectedSymbol && config.symbols.some((s) => s.symbol === selectedSymbol)
    ? selectedSymbol
    : filteredSymbols[0]?.symbol || config.symbols[0]?.symbol;

  const activeSelectedQuote = quotes[activeSelectedSymbol];
  const activeSelectedItem = config.symbols.find((s) => s.symbol === activeSelectedSymbol);

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

      {/* Selected Asset Evolution Chart */}
      {activeSelectedSymbol && (
        <StockEvolutionChart quote={activeSelectedQuote} item={activeSelectedItem} />
      )}

      {/* Category Pills Filter (if multiple categories) */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1 mb-2 overflow-x-auto scrollbar-none pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat || 'all')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
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

      {/* Widget Body / List of Assets */}
      <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
        {loading && Object.keys(quotes).length === 0 ? (
          <div className="space-y-1.5 py-1 animate-pulse">
            {filteredSymbols.map((item) => (
              <div
                key={item.symbol}
                className="h-12 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/40 dark:border-slate-700/40"
              ></div>
            ))}
          </div>
        ) : error && Object.keys(quotes).length === 0 ? (
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
        ) : (
          <>
            {filteredSymbols.map((item) => {
              const quote = quotes[item.symbol];
              const isPositive = quote ? quote.changePercent > 0 : false;
              const isNegative = quote ? quote.changePercent < 0 : false;
              const isSelected = item.symbol === activeSelectedSymbol;

              return (
                <div
                  key={item.symbol}
                  onClick={() => setSelectedSymbol(item.symbol)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer group border ${
                    isSelected
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] shadow-xs'
                      : 'bg-slate-100/90 dark:bg-slate-800/50 hover:bg-black/5 dark:hover:bg-white/10 border-slate-200/80 dark:border-slate-700/50'
                  }`}
                >
                  {/* Asset Name */}
                  <div className="min-w-0 flex-1 pr-2">
                    <span
                      className={`font-bold text-xs truncate block transition-colors ${
                        isSelected
                          ? 'text-[var(--color-primary)] font-extrabold'
                          : 'text-slate-950 dark:text-white group-hover:text-[var(--color-primary)]'
                      }`}
                    >
                      {item.name || quote?.name || item.symbol}
                    </span>
                  </div>

                  {/* Price & Variation Badge */}
                  <div className="text-right flex items-center gap-2 flex-shrink-0">
                    <div className="text-xs font-black text-slate-950 dark:text-white tracking-tight">
                      {quote ? formatPrice(quote.price, quote.currency) : '--'}
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

                    <a
                      href={getStockDetailsUrl(item.symbol)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md text-slate-400 hover:text-[var(--color-primary)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 -mr-0.5"
                      title="Ouvrir la fiche détaillée"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}

            {filteredSymbols.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500">
                Aucun symbole dans cette catégorie.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
