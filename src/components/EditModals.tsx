import { useState, useEffect } from 'react';
import type { Section, LinkItem } from '../types';
import { searchCities, parseWeatherConfig, type WeatherLocation } from '../utils/weather';
import { searchAddresses, parseTrafficConfig, calculateRoute, type TrafficLocation, type RouteResult } from '../utils/traffic';
import { ALL_SEARCH_ENGINES, parseSearchConfig, type SearchWidgetConfig } from '../utils/searchEngines';
import {
  DEFAULT_STOCK_SYMBOLS,
  MAJOR_INDICES,
  TOP_20_CRYPTO,
  CAC40_CONSTITUENTS,
  SBF120_EXTRA_CONSTITUENTS,
  SP500_CONSTITUENTS,
  NASDAQ_CONSTITUENTS,
  ALL_STOCK_PRESETS,
  parseStockConfig,
  type StockItemConfig,
  type StockWidgetConfig,
} from '../utils/stocks';
import {
  parseBeszelConfig,
  fetchBeszelSystems,
  type BeszelConfig,
  type BeszelSystem,
} from '../utils/beszel';
import {
  Search,
  MapPin,
  Navigation,
  Loader2,
  Check,
  Car,
  Clock,
  Sparkles,
  Globe,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Server,
  Key,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ColumnSpanSelector: React.FC<{
  value: number;
  onChange: (val: number) => void;
  label?: string;
}> = ({ value, onChange, label = 'Largeur (Nombre de colonnes)' }) => {
  return (
    <div>
      <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1.5">
        {label}
      </label>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
              value === c
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm ring-2 ring-[var(--color-primary)]/20'
                : 'border-[var(--color-border)] bg-black/5 hover:bg-black/10 text-[var(--color-text)]'
            }`}
          >
            {c} {c > 1 ? 'cols' : 'col'}
          </button>
        ))}
      </div>
    </div>
  );
};

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Partial<Section>) => void;
  initialData?: Section | null;
}

export const SectionModal: React.FC<SectionModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [colSpan, setColSpan] = useState<number>(1);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setColSpan(initialData.col_span || 1);
    } else {
      setTitle('');
      setColSpan(1);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[var(--color-text-strong)] mb-4">
          {initialData ? 'Modifier la section' : 'Nouvelle section'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Titre de la section</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)]"
              autoFocus
            />
          </div>

          <ColumnSpanSelector value={colSpan} onChange={setColSpan} />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors">
            Annuler
          </button>
          <button 
            onClick={() => {
              if (title.trim()) {
                onSave({ title, col_span: colSpan });
                onClose();
              }
            }}
            className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<LinkItem>) => void;
  initialData?: LinkItem | null;
}

export const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setUrl(initialData.url);
      setDescription(initialData.description || '');
      setIcon(initialData.icon || '');
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setIcon('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[var(--color-text-strong)] mb-4">
          {initialData ? 'Modifier le lien' : 'Nouveau lien'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Description (optionnelle)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Icône (Nom Lucide ou URL)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="ex: Github, Tv, ou https://..."
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)]"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors">
            Annuler
          </button>
          <button 
            onClick={() => {
              if (title.trim() && url.trim()) {
                onSave({ title, url, description, icon });
                onClose();
              }
            }}
            className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

interface RssModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Partial<Section>) => void;
  initialData?: Section | null;
}
export const RssModal: React.FC<RssModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [widgetUrl, setWidgetUrl] = useState('');
  const [displayLimit, setDisplayLimit] = useState<number>(10);
  const [colSpan, setColSpan] = useState<number>(1);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setWidgetUrl(initialData.widget_url || '');
      setDisplayLimit(initialData.display_limit || 10);
      setColSpan(initialData.col_span || 1);
    } else {
      setTitle('');
      setWidgetUrl('');
      setDisplayLimit(10);
      setColSpan(1);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[var(--color-text-strong)] mb-4">
          {initialData ? 'Modifier le flux RSS' : 'Nouveau widget RSS'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Titre du widget</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Actualités Le Monde, Tech News..."
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">URL du flux RSS (XML)</label>
            <input
              type="url"
              value={widgetUrl}
              onChange={(e) => setWidgetUrl(e.target.value)}
              placeholder="https://example.com/rss.xml"
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Nombre d'articles à afficher</label>
            <select
              value={displayLimit}
              onChange={(e) => setDisplayLimit(Number(e.target.value))}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] cursor-pointer"
            >
              <option value={5}>5 articles</option>
              <option value={8}>8 articles</option>
              <option value={10}>10 articles (par défaut)</option>
              <option value={15}>15 articles</option>
              <option value={20}>20 articles</option>
              <option value={25}>25 articles</option>
              <option value={30}>30 articles</option>
            </select>
          </div>

          <ColumnSpanSelector value={colSpan} onChange={setColSpan} />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors">
            Annuler
          </button>
          <button 
            onClick={() => {
              if (title.trim() && widgetUrl.trim()) {
                onSave({ 
                  title: title.trim(), 
                  widget_url: widgetUrl.trim(), 
                  display_limit: displayLimit,
                  col_span: colSpan,
                  type: 'rss'
                });
                onClose();
              }
            }}
            className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Partial<Section>) => void;
  initialData?: Section | null;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation | null>(null);
  const [colSpan, setColSpan] = useState<number>(1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      const loc = parseWeatherConfig(initialData.widget_url);
      setSelectedLocation(loc);
      setSearchQuery(loc.name);
      setColSpan(initialData.col_span || (loc as any)?.col_span || 1);
    } else {
      setTitle('Météo');
      setSelectedLocation({ name: 'Paris', latitude: 48.8566, longitude: 2.3522, country: 'France' });
      setSearchQuery('');
      setColSpan(1);
    }
    setResults([]);
    setGeoError(null);
  }, [initialData, isOpen]);

  // Debounced city search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchCities(searchQuery);
      setResults(res);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (loc: WeatherLocation) => {
    setSelectedLocation(loc);
    setSearchQuery(loc.name);
    setResults([]);
    if (!title || title === 'Météo' || title.startsWith('Météo ')) {
      setTitle(`Météo ${loc.name}`);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));

        // Try reverse geocoding or fallback to "Ma position"
        let name = 'Ma position';
        try {
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${lat},${lon}&count=1&language=fr&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results[0]) {
              name = data.results[0].name;
            }
          }
        } catch {
          // ignore error
        }

        const loc: WeatherLocation = {
          name,
          latitude: lat,
          longitude: lon,
        };

        setSelectedLocation(loc);
        setSearchQuery(name);
        setTitle(`Météo ${name}`);
        setIsLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setGeoError('Impossible de récupérer votre position.');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <h2 className="text-xl font-bold text-[var(--color-text-strong)]">
          {initialData ? 'Modifier le widget Météo' : 'Nouveau widget Météo'}
        </h2>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Titre du widget
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Météo Paris"
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] text-sm"
          />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-[var(--color-text-muted)]">
              Ville ou localisation
            </label>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
            >
              {isLocating ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Navigation size={12} />
              )}
              <span>Détecter ma position</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une ville (ex: Paris, Marseille, Lyon, Tokyo...)"
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md pl-9 pr-8 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] text-sm"
              autoFocus
            />
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            {isSearching && (
              <Loader2
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] animate-spin"
              />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto divide-y divide-[var(--color-border)]/50">
              {results.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[var(--color-surface-hover)] flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-sky-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-[var(--color-text-strong)]">
                        {loc.name}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                    {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          )}

          {geoError && (
            <div className="text-xs text-red-400 mt-1.5">{geoError}</div>
          )}
        </div>

        {/* Selected location summary */}
        {selectedLocation && (
          <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-sky-400 flex-shrink-0" />
              <div>
                <div className="font-bold text-[var(--color-text-strong)]">
                  {selectedLocation.name}
                  {selectedLocation.country ? `, ${selectedLocation.country}` : ''}
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  Lat: {selectedLocation.latitude.toFixed(4)}, Lon: {selectedLocation.longitude.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        )}

        <ColumnSpanSelector value={colSpan} onChange={setColSpan} />

        <div className="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!selectedLocation}
            onClick={() => {
              if (selectedLocation) {
                onSave({
                  title: title.trim() || `Météo ${selectedLocation.name}`,
                  widget_url: JSON.stringify({ ...selectedLocation, col_span: colSpan }),
                  col_span: colSpan,
                  type: 'weather',
                });
                onClose();
              }
            }}
            className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

interface TrafficModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Partial<Section>) => void;
  initialData?: Section | null;
}

export const TrafficModal: React.FC<TrafficModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [startResults, setStartResults] = useState<TrafficLocation[]>([]);
  const [endResults, setEndResults] = useState<TrafficLocation[]>([]);
  const [selectedStart, setSelectedStart] = useState<TrafficLocation | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<TrafficLocation | null>(null);
  const [colSpan, setColSpan] = useState<number>(1);
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingEnd, setIsSearchingEnd] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [previewRoute, setPreviewRoute] = useState<RouteResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      const conf = parseTrafficConfig(initialData.widget_url);
      setSelectedStart(conf.start);
      setSelectedEnd(conf.end);
      setStartQuery(conf.start.name);
      setEndQuery(conf.end.name);
      setColSpan(initialData.col_span || (conf as any)?.col_span || 1);
    } else {
      setTitle('Maison ➔ Travail');
      setSelectedStart(null);
      setSelectedEnd(null);
      setStartQuery('');
      setEndQuery('');
      setColSpan(1);
    }
    setStartResults([]);
    setEndResults([]);
    setPreviewRoute(null);
  }, [initialData, isOpen]);

  // Search start
  useEffect(() => {
    if (!startQuery.trim() || startQuery.trim().length < 2 || (selectedStart && selectedStart.name === startQuery)) {
      setStartResults([]);
      setIsSearchingStart(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingStart(true);
      const res = await searchAddresses(startQuery);
      setStartResults(res);
      setIsSearchingStart(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [startQuery, selectedStart]);

  // Search end
  useEffect(() => {
    if (!endQuery.trim() || endQuery.trim().length < 2 || (selectedEnd && selectedEnd.name === endQuery)) {
      setEndResults([]);
      setIsSearchingEnd(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingEnd(true);
      const res = await searchAddresses(endQuery);
      setEndResults(res);
      setIsSearchingEnd(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [endQuery, selectedEnd]);

  // Preview route calculation when both start and end are selected
  useEffect(() => {
    if (selectedStart && selectedEnd) {
      setPreviewLoading(true);
      calculateRoute(selectedStart, selectedEnd)
        .then((res) => {
          setPreviewRoute(res);
        })
        .catch((err) => {
          console.warn('Preview route failed:', err);
          setPreviewRoute(null);
        })
        .finally(() => {
          setPreviewLoading(false);
        });
    } else {
      setPreviewRoute(null);
    }
  }, [selectedStart, selectedEnd]);

  const handleDetectStartLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));

        let name = 'Ma position actuelle';
        let address = `${lat}, ${lon}`;
        try {
          const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`);
          if (res.ok) {
            const data = await res.json();
            if (data.features && data.features[0]) {
              name = data.features[0].properties.label || name;
              address = data.features[0].properties.context || address;
            }
          }
        } catch {
          // ignore
        }

        const loc: TrafficLocation = {
          name,
          address,
          latitude: lat,
          longitude: lon,
        };

        setSelectedStart(loc);
        setStartQuery(name);
        setStartResults([]);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-900/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
            <Car size={20} />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-strong)]">
            {initialData ? 'Modifier le trajet' : 'Nouveau trajet en voiture'}
          </h2>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Titre du trajet
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Maison ➔ Travail"
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] text-sm"
          />
        </div>

        {/* Departure Address */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Point de départ (A)</span>
            </label>
            <button
              type="button"
              onClick={handleDetectStartLocation}
              disabled={isLocating}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:opacity-80 flex items-center gap-1 transition-colors"
            >
              {isLocating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
              <span>Ma position</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={startQuery}
              onChange={(e) => {
                setStartQuery(e.target.value);
                if (selectedStart && selectedStart.name !== e.target.value) {
                  setSelectedStart(null);
                }
              }}
              placeholder="Adresse, rue, code postal, ville de départ..."
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md pl-9 pr-8 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] text-sm"
            />
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
            {isSearchingStart && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] animate-spin" />
            )}
          </div>

          {/* Autocomplete Start */}
          {startResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden z-30 max-h-40 overflow-y-auto divide-y divide-[var(--color-border)]/50">
              {startResults.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedStart(loc);
                    setStartQuery(loc.name);
                    setStartResults([]);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-hover)] flex flex-col text-xs transition-colors"
                >
                  <span className="font-bold text-[var(--color-text-strong)] truncate">{loc.name}</span>
                  {loc.address && <span className="text-[11px] text-[var(--color-text-muted)] truncate">{loc.address}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Arrival Address */}
        <div className="relative">
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span>Point d'arrivée (B)</span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={endQuery}
              onChange={(e) => {
                setEndQuery(e.target.value);
                if (selectedEnd && selectedEnd.name !== e.target.value) {
                  setSelectedEnd(null);
                }
              }}
              placeholder="Adresse ou destination d'arrivée..."
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md pl-9 pr-8 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] text-sm"
            />
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600 dark:text-red-400" />
            {isSearchingEnd && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] animate-spin" />
            )}
          </div>

          {/* Autocomplete End */}
          {endResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden z-20 max-h-40 overflow-y-auto divide-y divide-[var(--color-border)]/50">
              {endResults.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedEnd(loc);
                    setEndQuery(loc.name);
                    setEndResults([]);
                    if (!title || title === 'Maison ➔ Travail') {
                      setTitle(`${selectedStart ? selectedStart.name : 'Départ'} ➔ ${loc.name}`);
                    }
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-hover)] flex flex-col text-xs transition-colors"
                >
                  <span className="font-bold text-[var(--color-text-strong)] truncate">{loc.name}</span>
                  {loc.address && <span className="text-[11px] text-[var(--color-text-muted)] truncate">{loc.address}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Route Preview */}
        {previewLoading && (
          <div className="p-3 rounded-lg bg-black/10 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)] animate-pulse">
            <Loader2 size={14} className="animate-spin" />
            <span>Calcul du temps de route...</span>
          </div>
        )}

        {previewRoute && !previewLoading && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <div className="font-bold text-[var(--color-text-strong)]">
                  Temps estimé : {previewRoute.durationFormatted}
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  Distance : {previewRoute.distanceFormatted}
                </div>
              </div>
            </div>
            <Check size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
        )}

        <ColumnSpanSelector value={colSpan} onChange={setColSpan} />

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!selectedStart || !selectedEnd}
            onClick={() => {
              if (selectedStart && selectedEnd) {
                const finalTitle = title.trim() || `${selectedStart.name} ➔ ${selectedEnd.name}`;
                onSave({
                  title: finalTitle,
                  widget_url: JSON.stringify({
                    start: selectedStart,
                    end: selectedEnd,
                    title: finalTitle,
                    col_span: colSpan,
                  }),
                  col_span: colSpan,
                  type: 'traffic',
                });
                onClose();
              }
            }}
            className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Partial<Section>) => void;
  initialData?: Section | null;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [defaultEngineId, setDefaultEngineId] = useState<string>('google');
  const [enabledEngineIds, setEnabledEngineIds] = useState<string[]>([]);
  const [colSpan, setColSpan] = useState<number>(1);

  const [orderedEngineIds, setOrderedEngineIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      const conf = parseSearchConfig(initialData.widget_url);
      setDefaultEngineId(conf.defaultEngineId);
      setEnabledEngineIds(conf.enabledEngineIds);
      const allIds = ALL_SEARCH_ENGINES.map((e) => e.id);
      const existing = conf.enabledEngineIds || [];
      const remaining = allIds.filter((id) => !existing.includes(id));
      setOrderedEngineIds([...existing, ...remaining]);
      setColSpan(initialData.col_span || (conf as any)?.col_span || 1);
    } else {
      setTitle('Hub de recherche & IA');
      setDefaultEngineId('google');
      const allIds = ALL_SEARCH_ENGINES.map((e) => e.id);
      setEnabledEngineIds(allIds);
      setOrderedEngineIds(allIds);
      setColSpan(1);
    }
  }, [initialData, isOpen]);

  const toggleEngine = (id: string) => {
    if (enabledEngineIds.includes(id)) {
      // Don't allow unchecking everything
      if (enabledEngineIds.length > 1) {
        const updated = enabledEngineIds.filter((e) => e !== id);
        setEnabledEngineIds(updated);
        if (defaultEngineId === id && updated.length > 0) {
          setDefaultEngineId(updated[0]);
        }
      }
    } else {
      setEnabledEngineIds([...enabledEngineIds, id]);
    }
  };

  const moveEngine = (id: string, delta: number, category: 'ai' | 'web') => {
    const categoryEngines = orderedEngineIds
      .map((eid) => ALL_SEARCH_ENGINES.find((e) => e.id === eid))
      .filter((e): e is (typeof ALL_SEARCH_ENGINES)[0] => e !== undefined && e.category === category);

    const curIdx = categoryEngines.findIndex((e) => e.id === id);
    const targetIdx = curIdx + delta;
    if (targetIdx < 0 || targetIdx >= categoryEngines.length) return;

    const targetEngine = categoryEngines[targetIdx];
    const newOrdered = [...orderedEngineIds];
    const posA = newOrdered.indexOf(id);
    const posB = newOrdered.indexOf(targetEngine.id);
    newOrdered[posA] = targetEngine.id;
    newOrdered[posB] = id;
    setOrderedEngineIds(newOrdered);

    // Keep enabledEngineIds ordered consistently
    const newEnabled = newOrdered.filter((eid) => enabledEngineIds.includes(eid));
    setEnabledEngineIds(newEnabled);
  };

  if (!isOpen) return null;

  const aiEngines = orderedEngineIds
    .map((eid) => ALL_SEARCH_ENGINES.find((e) => e.id === eid))
    .filter((e): e is (typeof ALL_SEARCH_ENGINES)[0] => e !== undefined && e.category === 'ai');

  const webEngines = orderedEngineIds
    .map((eid) => ALL_SEARCH_ENGINES.find((e) => e.id === eid))
    .filter((e): e is (typeof ALL_SEARCH_ENGINES)[0] => e !== undefined && e.category === 'web');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-900/10 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300">
            <Search size={20} />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-strong)]">
            {initialData ? 'Modifier le hub de recherche' : 'Nouveau hub de recherche & IA'}
          </h2>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Titre du widget
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Hub de recherche & IA"
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] text-sm font-medium"
          />
        </div>

        {/* Default Engine */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Moteur par défaut (lancé lors de l'appui sur Entrée)
          </label>
          <select
            value={defaultEngineId}
            onChange={(e) => setDefaultEngineId(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] text-sm font-semibold cursor-pointer"
          >
            {orderedEngineIds
              .filter((id) => enabledEngineIds.includes(id))
              .map((id) => ALL_SEARCH_ENGINES.find((e) => e.id === id))
              .filter((e): e is (typeof ALL_SEARCH_ENGINES)[0] => !!e)
              .map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.category === 'ai' ? '🤖 ' : '🔍 '} {engine.name} ({engine.description})
                </option>
              ))}
          </select>
        </div>

        {/* Enabled Engines selection with Reordering */}
        <div className="space-y-3 pt-1">
          {/* AI Assistants */}
          <div>
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between gap-1.5 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>IA (Cochez pour activer, flèches pour réordonner)</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aiEngines.map((engine, idx) => {
                const isChecked = enabledEngineIds.includes(engine.id);
                return (
                  <div
                    key={engine.id}
                    className={`flex items-center justify-between p-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      isChecked
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/40 text-indigo-950 dark:text-indigo-200 shadow-xs'
                        : 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 py-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEngine(engine.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="truncate">{engine.name}</span>
                    </label>

                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={() => moveEngine(engine.id, -1, 'ai')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 transition-colors"
                        title="Déplacer vers la gauche"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEngine(engine.id, 1, 'ai')}
                        disabled={idx === aiEngines.length - 1}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 transition-colors"
                        title="Déplacer vers la droite"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Web Search Engines */}
          <div>
            <div className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center justify-between gap-1.5 mb-2">
              <span className="flex items-center gap-1.5">
                <Globe size={13} />
                <span>Moteurs Web & Médias (Flèches pour réordonner)</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {webEngines.map((engine, idx) => {
                const isChecked = enabledEngineIds.includes(engine.id);
                return (
                  <div
                    key={engine.id}
                    className={`flex items-center justify-between p-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      isChecked
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500/40 text-sky-950 dark:text-sky-200 shadow-xs'
                        : 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 py-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEngine(engine.id)}
                        className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <span className="truncate">{engine.name}</span>
                    </label>

                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={() => moveEngine(engine.id, -1, 'web')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 transition-colors"
                        title="Déplacer vers la gauche"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEngine(engine.id, 1, 'web')}
                        disabled={idx === webEngines.length - 1}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 transition-colors"
                        title="Déplacer vers la droite"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ColumnSpanSelector value={colSpan} onChange={setColSpan} />

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={enabledEngineIds.length === 0}
            onClick={() => {
              const orderedEnabled = orderedEngineIds.filter((id) => enabledEngineIds.includes(id));
              const conf: SearchWidgetConfig & { col_span?: number } = {
                title: title.trim() || 'Hub de recherche & IA',
                defaultEngineId,
                enabledEngineIds: orderedEnabled,
                col_span: colSpan,
              };
              onSave({
                title: conf.title,
                widget_url: JSON.stringify(conf),
                col_span: colSpan,
                type: 'search',
              });
              onClose();
            }}
            className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Partial<Section>) => void;
  initialData?: Section | null;
}

export const StockModal: React.FC<StockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [symbols, setSymbols] = useState<StockItemConfig[]>(DEFAULT_STOCK_SYMBOLS);
  const [customSymbol, setCustomSymbol] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'stock' | 'index' | 'crypto' | 'forex' | 'commodity'>('stock');
  const [colSpan, setColSpan] = useState<number>(1);
  const [presetGroup, setPresetGroup] = useState<'all' | 'cac40' | 'sbf120' | 'sp500' | 'nasdaq' | 'crypto' | 'index'>('cac40');
  const [presetSearch, setPresetSearch] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || 'Bourse & Marchés');
      const conf = parseStockConfig(initialData.widget_url);
      setSymbols(conf.symbols || DEFAULT_STOCK_SYMBOLS);
      setColSpan(initialData.col_span || 1);
    } else {
      setTitle('Bourse & Marchés');
      setSymbols(DEFAULT_STOCK_SYMBOLS);
      setColSpan(1);
    }
  }, [initialData, isOpen]);

  const handleTogglePreset = (preset: StockItemConfig) => {
    const isAdded = symbols.some((s) => s.symbol.toUpperCase() === preset.symbol.toUpperCase());
    if (isAdded) {
      setSymbols(symbols.filter((s) => s.symbol.toUpperCase() !== preset.symbol.toUpperCase()));
    } else {
      setSymbols([...symbols, preset]);
    }
  };

  const getGroupPresets = (group: typeof presetGroup): StockItemConfig[] => {
    switch (group) {
      case 'index': return MAJOR_INDICES;
      case 'cac40': return CAC40_CONSTITUENTS;
      case 'sbf120': return [...CAC40_CONSTITUENTS, ...SBF120_EXTRA_CONSTITUENTS];
      case 'sp500': return SP500_CONSTITUENTS;
      case 'nasdaq': return NASDAQ_CONSTITUENTS;
      case 'crypto': return TOP_20_CRYPTO;
      case 'all': return ALL_STOCK_PRESETS;
    }
  };

  const currentGroupPresets = getGroupPresets(presetGroup);
  const displayedPresets = currentGroupPresets.filter((p) => {
    if (!presetSearch.trim()) return true;
    const q = presetSearch.toLowerCase();
    const name = p.name || '';
    return name.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q);
  });

  const handleAddAllGroup = (groupPresets: StockItemConfig[]) => {
    const existing = new Set(symbols.map((s) => s.symbol.toUpperCase()));
    const toAdd = groupPresets.filter((p) => !existing.has(p.symbol.toUpperCase()));
    setSymbols([...symbols, ...toAdd]);
  };

  const handleRemoveAllGroup = (groupPresets: StockItemConfig[]) => {
    const toRemove = new Set(groupPresets.map((p) => p.symbol.toUpperCase()));
    setSymbols(symbols.filter((s) => !toRemove.has(s.symbol.toUpperCase())));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSym = customSymbol.trim().toUpperCase();
    if (!cleanSym) return;
    if (symbols.some((s) => s.symbol.toUpperCase() === cleanSym)) return;

    setSymbols([
      ...symbols,
      {
        symbol: cleanSym,
        name: customName.trim() || cleanSym,
        category: customCategory,
      },
    ]);
    setCustomSymbol('');
    setCustomName('');
  };

  const handleRemoveSymbol = (symbolToRemove: string) => {
    setSymbols(symbols.filter((s) => s.symbol !== symbolToRemove));
  };

  const moveSymbol = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= symbols.length) return;
    const newSymbols = [...symbols];
    const [moved] = newSymbols.splice(index, 1);
    newSymbols.splice(targetIndex, 0, moved);
    setSymbols(newSymbols);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-900/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-strong)]">
              {initialData ? 'Modifier le widget Bourse' : 'Nouveau widget Bourse & Marchés'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Titre du widget
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Bourse & Marchés, Mes Actions, Cryptos..."
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] text-sm"
          />
        </div>

        {/* Categorized Popular Presets */}
        <div className="space-y-2 p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--color-border)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5">
              <span>Bibliothèque de symboles & indices</span>
              <span className="text-[10px] font-normal text-slate-500">
                ({displayedPresets.length} disponibles)
              </span>
            </label>

            {/* Quick Bulk Add / Remove Buttons */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => handleAddAllGroup(displayedPresets)}
                className="px-2 py-0.5 rounded bg-[var(--color-primary)] text-white font-bold hover:opacity-90 transition-opacity"
              >
                + Tout ajouter ({displayedPresets.length})
              </button>
              <button
                type="button"
                onClick={() => handleRemoveAllGroup(displayedPresets)}
                className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold hover:bg-black/20 transition-colors"
              >
                Retirer
              </button>
            </div>
          </div>

          {/* Preset Group Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5 text-xs">
            {[
              { key: 'cac40', label: 'CAC 40 (40)' },
              { key: 'sbf120', label: 'SBF 120 (120)' },
              { key: 'sp500', label: 'S&P 500' },
              { key: 'nasdaq', label: 'Nasdaq' },
              { key: 'crypto', label: 'Crypto (Top 20)' },
              { key: 'index', label: 'Indices' },
              { key: 'all', label: 'Tous' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPresetGroup(tab.key as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  presetGroup === tab.key
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-black/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Preset search input */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={presetSearch}
              onChange={(e) => setPresetSearch(e.target.value)}
              placeholder="Rechercher par nom ou symbole (ex: Total, Apple, BTC)..."
              className="w-full pl-8 pr-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Presets Chips List */}
          <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-1.5 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
            {displayedPresets.map((preset) => {
              const isAdded = symbols.some((s) => s.symbol.toUpperCase() === preset.symbol.toUpperCase());
              return (
                <button
                  key={preset.symbol}
                  type="button"
                  onClick={() => handleTogglePreset(preset)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-border)] text-slate-800 dark:text-slate-200'
                  }`}
                  title={isAdded ? 'Cliquer pour retirer du widget' : 'Cliquer pour ajouter au widget'}
                >
                  <span className="truncate max-w-[120px]">{preset.name}</span>
                  <span className="text-[9px] opacity-70">({preset.symbol})</span>
                  {isAdded ? <Check size={11} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0" /> : <Plus size={11} className="opacity-60 flex-shrink-0" />}
                </button>
              );
            })}
            {displayedPresets.length === 0 && (
              <div className="w-full py-4 text-center text-xs text-slate-400 italic">
                Aucun symbole trouvé pour &quot;{presetSearch}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Add Custom Symbol */}
        <form onSubmit={handleAddCustom} className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--color-border)] space-y-2">
          <label className="block text-xs font-bold text-[var(--color-text-strong)]">
            Ajouter un symbole personnalisé (Yahoo Finance / Ticker)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value)}
              placeholder="Symbole (ex: TSLA, MC.PA)"
              className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
            />
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nom (ex: Tesla, LVMH)"
              className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
            />
            <select
              value={customCategory}
              onChange={(e: any) => setCustomCategory(e.target.value)}
              className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="stock">Action</option>
              <option value="index">Indice</option>
              <option value="crypto">Crypto</option>
              <option value="forex">Devise</option>
              <option value="commodity">Matière première</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={!customSymbol.trim()}
            className="w-full py-1.5 rounded-md bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            + Ajouter au widget
          </button>
        </form>

        {/* Selected Symbols List */}
        <div>
          <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1.5">
            Symboles suivis ({symbols.length})
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {symbols.map((item, idx) => (
              <div
                key={item.symbol}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs"
              >
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <span className="font-bold text-[var(--color-text-strong)] truncate">
                    {item.name || item.symbol}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    {item.symbol}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSymbol(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"
                    title="Monter"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSymbol(idx, 1)}
                    disabled={idx === symbols.length - 1}
                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"
                    title="Descendre"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSymbol(item.symbol)}
                    className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors ml-1"
                    title="Supprimer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {symbols.length === 0 && (
              <div className="py-4 text-center text-xs text-[var(--color-text-muted)]">
                Veuillez ajouter au moins un symbole ci-dessus.
              </div>
            )}
          </div>
        </div>

        <ColumnSpanSelector value={colSpan} onChange={setColSpan} />

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={symbols.length === 0}
            onClick={() => {
              const conf: StockWidgetConfig & { col_span?: number } = {
                title: title.trim() || 'Bourse & Marchés',
                symbols,
                col_span: colSpan,
              };
              onSave({
                title: conf.title,
                widget_url: JSON.stringify(conf),
                col_span: colSpan,
                type: 'stocks',
              });
              onClose();
            }}
            className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export interface BeszelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Partial<Section>) => void;
  initialData?: Section | null;
}

export const BeszelModal: React.FC<BeszelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [authType, setAuthType] = useState<'token' | 'password'>('token');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [systemId, setSystemId] = useState('all');
  const [colSpan, setColSpan] = useState(1);

  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [availableSystems, setAvailableSystems] = useState<BeszelSystem[]>([]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setColSpan(initialData.col_span || 1);
      const conf = parseBeszelConfig(initialData.widget_url);
      setUrl(conf.url || '');
      setAuthType(conf.authType || (conf.token ? 'token' : 'password'));
      setToken(conf.token || '');
      setEmail(conf.email || '');
      setPassword(conf.password || '');
      setSystemId(conf.systemId || 'all');
    } else {
      setTitle('Monitoring Serveurs');
      setUrl('');
      setAuthType('token');
      setToken('');
      setEmail('');
      setPassword('');
      setSystemId('all');
      setColSpan(1);
    }
    setTestSuccess(false);
    setTestError(null);
    setAvailableSystems([]);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestError("Veuillez renseigner l'URL de votre instance Beszel.");
      return;
    }

    setIsTesting(true);
    setTestError(null);
    setTestSuccess(false);

    try {
      const config: BeszelConfig = {
        url: url.trim(),
        authType,
        token: token.trim(),
        email: email.trim(),
        password: password.trim(),
        systemId,
      };

      const systems = await fetchBeszelSystems(config);
      setAvailableSystems(systems);
      setTestSuccess(true);
      if (systems.length > 0 && systemId !== 'all' && !systems.some((s) => s.id === systemId)) {
        setSystemId(systems[0].id);
      }
    } catch (err: any) {
      setTestError(err.message || 'Échec de connexion au serveur Beszel.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!url.trim()) return;

    const selectedSys = availableSystems.find((s) => s.id === systemId);
    const finalConfig: BeszelConfig = {
      url: url.trim(),
      authType,
      token: token.trim(),
      email: email.trim(),
      password: password.trim(),
      systemId,
      systemName: selectedSys ? selectedSys.name : systemId === 'all' ? 'Tous les serveurs' : '',
      title: title.trim() || 'Monitoring Beszel',
      col_span: colSpan,
    };

    onSave({
      title: finalConfig.title,
      widget_url: JSON.stringify(finalConfig),
      col_span: colSpan,
      type: 'beszel',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Server size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-strong)]">
                {initialData ? 'Modifier le widget Beszel' : 'Ajouter un widget Beszel'}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Monitoring de vos serveurs (CPU, RAM, Disque, Docker, Uptime)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-black/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1">
              Titre du widget
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Serveurs Production, VPS OVH..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* URL Instance Beszel */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1">
              URL de votre Hub Beszel <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://beszel.votre-domaine.com"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              L'adresse web où est hébergé votre serveur Beszel Hub.
            </p>
          </div>

          {/* Méthode d'authentification */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1.5">
              Méthode d'authentification
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAuthType('token')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  authType === 'token'
                    ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-2 ring-teal-500/20'
                    : 'border-[var(--color-border)] bg-black/5 hover:bg-black/10 text-[var(--color-text-muted)]'
                }`}
              >
                <Key size={14} />
                <span>Token API / PocketBase</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthType('password')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  authType === 'password'
                    ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-2 ring-teal-500/20'
                    : 'border-[var(--color-border)] bg-black/5 hover:bg-black/10 text-[var(--color-text-muted)]'
                }`}
              >
                <Mail size={14} />
                <span>Email & Mot de passe</span>
              </button>
            </div>
          </div>

          {/* Token input */}
          {authType === 'token' && (
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1">
                Token API ou Token d'accès
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Token généré depuis votre compte ou les paramètres Beszel/PocketBase.
              </p>
            </div>
          )}

          {/* Email & Password inputs */}
          {authType === 'password' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@domaine.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tester la connexion button */}
          <div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url.trim()}
              className="w-full py-2 px-3 rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <Server size={14} />
                  <span>Tester la connexion & Charger les serveurs</span>
                </>
              )}
            </button>

            {testSuccess && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>
                  Connexion réussie ! {availableSystems.length} serveur(s) détecté(s).
                </span>
              </div>
            )}

            {testError && (
              <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{testError}</span>
              </div>
            )}
          </div>

          {/* Choix du serveur à afficher */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1">
              Serveur à afficher dans le widget
            </label>
            <select
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">📊 Tous les serveurs (Vue synthétique globale)</option>
              {availableSystems.map((sys) => (
                <option key={sys.id} value={sys.id}>
                  🖥️ {sys.name} {sys.host ? `(${sys.host})` : ''} -{' '}
                  {sys.status === 'up' ? '🟢 En ligne' : '🔴 Hors ligne'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Vous pouvez afficher un serveur spécifique avec ses jauges détaillées ou l'ensemble de votre flotte.
            </p>
          </div>

          {/* Largeur en colonnes */}
          <ColumnSpanSelector value={colSpan} onChange={setColSpan} />
        </div>

        {/* Footer Buttons */}
        <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!url.trim()}
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};
