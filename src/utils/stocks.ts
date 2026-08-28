export interface StockItemConfig {
  symbol: string;
  name?: string;
  category?: 'index' | 'stock' | 'crypto' | 'forex' | 'commodity';
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
  sparkline?: number[];
  history?: StockHistoryPoint[];
  updatedAt: string;
}

export const POPULAR_STOCK_PRESETS: StockItemConfig[] = [
  // Indices
  { symbol: '^FCHI', name: 'CAC 40', category: 'index' },
  { symbol: '^GSPC', name: 'S&P 500', category: 'index' },
  { symbol: '^IXIC', name: 'Nasdaq', category: 'index' },
  { symbol: '^GDAXI', name: 'DAX 40', category: 'index' },
  // Actions FR / EU
  { symbol: 'TTE.PA', name: 'TotalEnergies', category: 'stock' },
  { symbol: 'MC.PA', name: 'LVMH', category: 'stock' },
  { symbol: 'AIR.PA', name: 'Airbus', category: 'stock' },
  { symbol: 'OR.PA', name: "L'Oréal", category: 'stock' },
  { symbol: 'BNP.PA', name: 'BNP Paribas', category: 'stock' },
  { symbol: 'RMS.PA', name: 'Hermès', category: 'stock' },
  // Actions US
  { symbol: 'AAPL', name: 'Apple', category: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA', category: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft', category: 'stock' },
  { symbol: 'GOOGL', name: 'Google', category: 'stock' },
  { symbol: 'TSLA', name: 'Tesla', category: 'stock' },
  // Crypto & Devises
  { symbol: 'BTC-USD', name: 'Bitcoin', category: 'crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', category: 'crypto' },
  { symbol: 'SOL-USD', name: 'Solana', category: 'crypto' },
  { symbol: 'EURUSD=X', name: 'EUR / USD', category: 'forex' },
  { symbol: 'GC=F', name: 'Or (Gold)', category: 'commodity' },
];

export const DEFAULT_STOCK_SYMBOLS: StockItemConfig[] = [
  { symbol: '^FCHI', name: 'CAC 40', category: 'index' },
  { symbol: '^GSPC', name: 'S&P 500', category: 'index' },
  { symbol: 'AAPL', name: 'Apple', category: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA', category: 'stock' },
  { symbol: 'BTC-USD', name: 'Bitcoin', category: 'crypto' },
];

export function parseStockConfig(widgetUrl?: string): StockWidgetConfig {
  if (!widgetUrl) {
    return {
      title: 'Bourse & Marchés',
      symbols: DEFAULT_STOCK_SYMBOLS,
      viewMode: 'compact',
    };
  }

  try {
    const parsed = JSON.parse(widgetUrl);
    if (parsed.symbols && Array.isArray(parsed.symbols) && parsed.symbols.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }

  return {
    title: 'Bourse & Marchés',
    symbols: DEFAULT_STOCK_SYMBOLS,
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

async function fetchFromYahooChart(symbol: string): Promise<StockQuote> {
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

      const foundPreset = POPULAR_STOCK_PRESETS.find((p) => p.symbol.toUpperCase() === symbol.toUpperCase());
      const displayName = foundPreset?.name || meta.shortName || meta.symbol || symbol;

      return {
        symbol: meta.symbol || symbol,
        name: displayName,
        price,
        currency,
        change,
        changePercent,
        dayHigh: meta.regularMarketDayHigh,
        dayLow: meta.regularMarketDayLow,
        previousClose,
        sparkline,
        history,
        updatedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
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

  const promises = symbols.map(async (item) => {
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
