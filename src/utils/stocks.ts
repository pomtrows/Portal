import {
  ALL_STOCK_PRESETS,
  MAJOR_INDICES,
  TOP_20_CRYPTO,
  CAC40_CONSTITUENTS,
  SBF120_EXTRA_CONSTITUENTS,
  SP500_CONSTITUENTS,
  NASDAQ_CONSTITUENTS,
  resolvePresetInfo,
  type StockMarket,
} from './stockPresets';

export type { StockMarket };
export {
  ALL_STOCK_PRESETS,
  MAJOR_INDICES,
  TOP_20_CRYPTO,
  CAC40_CONSTITUENTS,
  SBF120_EXTRA_CONSTITUENTS,
  SP500_CONSTITUENTS,
  NASDAQ_CONSTITUENTS,
  resolvePresetInfo,
};

export interface StockItemConfig {
  symbol: string;
  name?: string;
  category?: 'index' | 'stock' | 'crypto' | 'forex' | 'commodity';
  market?: StockMarket;
}

export interface StockWidgetConfig {
  title?: string;
  symbols: StockItemConfig[];
  viewMode?: 'compact' | 'detailed';
}

export interface StockHistoryPoint {
  time: string;
  price: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  dayHigh?: number;
  dayLow?: number;
  previousClose?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  changeFrom52wHigh?: number;
  changeFrom52wLow?: number;
  sparkline?: number[];
  history?: StockHistoryPoint[];
  updatedAt: string;
}

export const POPULAR_STOCK_PRESETS: StockItemConfig[] = ALL_STOCK_PRESETS;

export const DEFAULT_STOCK_SYMBOLS: StockItemConfig[] = [
  { symbol: '^FCHI', name: 'CAC 40', category: 'index', market: 'cac40' },
  { symbol: '^GSPC', name: 'S&P 500', category: 'index', market: 'sp500' },
  { symbol: 'AAPL', name: 'Apple', category: 'stock', market: 'sp500' },
  { symbol: 'NVDA', name: 'NVIDIA', category: 'stock', market: 'sp500' },
  { symbol: 'BTC-USD', name: 'Bitcoin', category: 'crypto' },
];

export function enrichStockItem(item: StockItemConfig): StockItemConfig {
  const info = resolvePresetInfo(item.symbol);
  return {
    symbol: item.symbol,
    name: item.name || info?.name || item.symbol,
    category:
      item.category ||
      info?.category ||
      (item.symbol.startsWith('^') ? 'index' : item.symbol.includes('-USD') ? 'crypto' : 'stock'),
    market: item.market || info?.market,
  };
}

export function parseStockConfig(widgetUrl?: string): StockWidgetConfig {
  if (!widgetUrl) {
    return {
      title: 'Bourse & Marchés',
      symbols: DEFAULT_STOCK_SYMBOLS.map(enrichStockItem),
      viewMode: 'compact',
    };
  }

  try {
    const parsed = JSON.parse(widgetUrl);
    if (parsed.symbols && Array.isArray(parsed.symbols) && parsed.symbols.length > 0) {
      return {
        ...parsed,
        symbols: parsed.symbols.map(enrichStockItem),
      };
    }
  } catch {
    // fallback
  }

  return {
    title: 'Bourse & Marchés',
    symbols: DEFAULT_STOCK_SYMBOLS.map(enrichStockItem),
    viewMode: 'compact',
  };
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  const curSymbol =
    currency === 'EUR'
      ? '€'
      : currency === 'USD'
      ? '$'
      : currency === 'GBP'
      ? '£'
      : currency;

  if (price >= 1000) {
    return `${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curSymbol}`;
  } else if (price >= 1) {
    return `${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curSymbol}`;
  } else {
    return `${price.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ${curSymbol}`;
  }
}

const stockCache = new Map<string, { quote: StockQuote; timestamp: number }>();
const STOCK_CACHE_TTL = 45 * 1000; // 45s

async function fetchFromYahooChart(symbol: string): Promise<StockQuote> {
  const cached = stockCache.get(symbol.toUpperCase());
  if (cached && Date.now() - cached.timestamp < STOCK_CACHE_TTL) {
    return cached.quote;
  }

  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=15m&range=1d`;
  
  // Fast CORS proxies and direct fetch
  const fetchUrls = [
    `https://cors-get-proxy.sirjosh.workers.dev/?url=${encodeURIComponent(targetUrl)}`,
    `https://proxy.cors.sh/${targetUrl}`,
    targetUrl,
  ];

  for (const url of fetchUrls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const meta = result.meta;
      const price = meta.regularMarketPrice ?? meta.previousClose ?? 0;
      const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change = price - previousClose;
      const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
      const currency = meta.currency || (symbol.endsWith('.PA') ? 'EUR' : 'USD');
      
      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0]?.close || [];
      const history: StockHistoryPoint[] = [];
      const sparkline: number[] = [];

      for (let i = 0; i < quotes.length; i++) {
        const val = quotes[i];
        if (typeof val === 'number' && !isNaN(val)) {
          sparkline.push(val);
          const t = timestamps[i];
          const timeStr = t
            ? new Date(t * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : `${i}`;
          history.push({ time: timeStr, price: val });
        }
      }

      const fiftyTwoWeekHigh = meta.fiftyTwoWeekHigh;
      const fiftyTwoWeekLow = meta.fiftyTwoWeekLow;
      const changeFrom52wHigh =
        fiftyTwoWeekHigh && fiftyTwoWeekHigh > 0
          ? ((price - fiftyTwoWeekHigh) / fiftyTwoWeekHigh) * 100
          : undefined;
      const changeFrom52wLow =
        fiftyTwoWeekLow && fiftyTwoWeekLow > 0
          ? ((price - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100
          : undefined;

      const foundPreset = POPULAR_STOCK_PRESETS.find((p) => p.symbol.toUpperCase() === symbol.toUpperCase());
      const displayName = foundPreset?.name || meta.shortName || meta.symbol || symbol;

      const quote: StockQuote = {
        symbol: meta.symbol || symbol,
        name: displayName,
        price,
        currency,
        change,
        changePercent,
        dayHigh: meta.regularMarketDayHigh,
        dayLow: meta.regularMarketDayLow,
        previousClose,
        fiftyTwoWeekHigh,
        fiftyTwoWeekLow,
        changeFrom52wHigh,
        changeFrom52wLow,
        sparkline,
        history,
        updatedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      stockCache.set(symbol.toUpperCase(), { quote, timestamp: Date.now() });
      return quote;
    } catch {
      // try next proxy
    }
  }

  // Fallback for crypto (e.g. BTC-USD -> BTCUSDT on Binance public API)
  if (symbol.endsWith('-USD')) {
    try {
      const binanceSym = symbol.replace('-USD', 'USDT').toUpperCase();
      const [tickerRes, klinesRes] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSym}`, {
          signal: AbortSignal.timeout(2500),
        }),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=15m&limit=30`, {
          signal: AbortSignal.timeout(2500),
        }).catch(() => null),
      ]);

      if (tickerRes.ok) {
        const bData = await tickerRes.json();
        const price = parseFloat(bData.lastPrice);
        const changePercent = parseFloat(bData.priceChangePercent);
        const change = parseFloat(bData.priceChange);
        const foundPreset = POPULAR_STOCK_PRESETS.find((p) => p.symbol.toUpperCase() === symbol.toUpperCase());

        let history: StockHistoryPoint[] = [];
        let sparkline: number[] = [];
        if (klinesRes && klinesRes.ok) {
          const klines = await klinesRes.json();
          if (Array.isArray(klines)) {
            history = klines.map((k: any) => ({
              time: new Date(k[0]).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              price: parseFloat(k[4]),
            }));
            sparkline = history.map((h) => h.price);
          }
        }

        return {
          symbol,
          name: foundPreset?.name || symbol,
          price,
          currency: 'USD',
          change,
          changePercent,
          previousClose: price - change,
          sparkline,
          history,
          updatedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        };
      }
    } catch {
      // ignore
    }
  }

  throw new Error(`Impossible de récupérer les cours pour ${symbol}`);
}

export async function fetchStockQuotes(symbols: StockItemConfig[]): Promise<Record<string, StockQuote>> {
  const results: Record<string, StockQuote> = {};
  const BATCH_SIZE = 15;

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const chunk = symbols.slice(i, i + BATCH_SIZE);
    const promises = chunk.map(async (item) => {
      try {
        const quote = await fetchFromYahooChart(item.symbol);
        if (item.name) {
          quote.name = item.name;
        }
        results[item.symbol] = quote;
      } catch (err) {
        console.warn(`Failed to fetch stock for ${item.symbol}:`, err);
      }
    });
    await Promise.allSettled(promises);
  }

  return results;
}

export function getStockDetailsUrl(symbol: string): string {
  if (symbol.startsWith('^')) {
    return `https://fr.finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
  }
  if (symbol.includes('-USD')) {
    return `https://www.coingecko.com/fr/pieces/${symbol.replace('-USD', '').toLowerCase()}`;
  }
  return `https://fr.finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
}

export type StockChartRange = '1d' | '1mo' | '6mo' | '1y' | '5y';

export interface StockRangeConfig {
  key: StockChartRange;
  label: string;
  fullLabel: string;
  interval: string;
}

export const STOCK_CHART_RANGES: StockRangeConfig[] = [
  { key: '1d', label: '1J', fullLabel: "1 Jour", interval: '15m' },
  { key: '1mo', label: '1M', fullLabel: '1 Mois', interval: '1d' },
  { key: '6mo', label: '6M', fullLabel: '6 Mois', interval: '1d' },
  { key: '1y', label: '1A', fullLabel: '1 An', interval: '1wk' },
  { key: '5y', label: '5A', fullLabel: '5 Ans', interval: '1mo' },
];

export interface ChartHistoryResult {
  history: StockHistoryPoint[];
  firstPrice: number;
  lastPrice: number;
  change: number;
  changePercent: number;
  low: number;
  high: number;
}

export async function fetchStockChartHistory(
  symbol: string,
  rangeKey: StockChartRange = '1d'
): Promise<ChartHistoryResult> {
  const intervals: Record<StockChartRange, string> = {
    '1d': '15m',
    '1mo': '1d',
    '6mo': '1d',
    '1y': '1wk',
    '5y': '1mo',
  };
  const interval = intervals[rangeKey] || '1d';
  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${rangeKey}`;
  const fetchUrls = [
    `https://cors-get-proxy.sirjosh.workers.dev/?url=${encodeURIComponent(targetUrl)}`,
    `https://proxy.cors.sh/${targetUrl}`,
    targetUrl,
  ];

  for (const url of fetchUrls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) continue;
      const data = await res.json();
      const res0 = data?.chart?.result?.[0];
      if (!res0) continue;

      const timestamps = res0.timestamp || [];
      const quotes = res0.indicators?.quote?.[0]?.close || [];
      const history: StockHistoryPoint[] = [];

      for (let i = 0; i < quotes.length; i++) {
        const val = quotes[i];
        if (typeof val === 'number' && !isNaN(val)) {
          const t = timestamps[i];
          const d = new Date(t * 1000);
          const timeStr =
            rangeKey === '1d'
              ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : rangeKey === '1mo' || rangeKey === '6mo'
              ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              : d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
          history.push({ time: timeStr, price: val });
        }
      }

      if (history.length > 0) {
        const prices = history.map((h) => h.price);
        const meta = res0.meta;
        const first = rangeKey === '1d' && meta?.previousClose ? meta.previousClose : history[0].price;
        const last = history[history.length - 1].price;
        const change = last - first;
        const changePercent = first !== 0 ? (change / first) * 100 : 0;
        return {
          history,
          firstPrice: first,
          lastPrice: last,
          change,
          changePercent,
          low: Math.min(...prices),
          high: Math.max(...prices),
        };
      }
    } catch {
      // try next proxy
    }
  }

  // Fallback for crypto
  if (symbol.endsWith('-USD')) {
    try {
      const binanceSym = symbol.replace('-USD', 'USDT').toUpperCase();
      const binanceIntervals: Record<StockChartRange, [string, number]> = {
        '1d': ['15m', 30],
        '1mo': ['1d', 30],
        '6mo': ['1d', 180],
        '1y': ['1w', 52],
        '5y': ['1M', 60],
      };
      const [bInt, bLim] = binanceIntervals[rangeKey] || ['1d', 30];
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=${bInt}&limit=${bLim}`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (res.ok) {
        const klines = await res.json();
        if (Array.isArray(klines) && klines.length > 0) {
          const history: StockHistoryPoint[] = klines.map((k: any) => {
            const d = new Date(k[0]);
            const timeStr =
              rangeKey === '1d'
                ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                : rangeKey === '1mo' || rangeKey === '6mo'
                ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            return { time: timeStr, price: parseFloat(k[4]) };
          });
          const prices = history.map((h) => h.price);
          const first = history[0].price;
          const last = history[history.length - 1].price;
          const change = last - first;
          const changePercent = first !== 0 ? (change / first) * 100 : 0;
          return {
            history,
            firstPrice: first,
            lastPrice: last,
            change,
            changePercent,
            low: Math.min(...prices),
            high: Math.max(...prices),
          };
        }
      }
    } catch {
      // ignore
    }
  }

  throw new Error(`Données de graphique indisponibles pour ${symbol}`);
}
