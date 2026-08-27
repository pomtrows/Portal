import { useState, useEffect } from 'react';
import type { Section, LinkItem } from '../types';
import { searchCities, parseWeatherConfig, type WeatherLocation } from '../utils/weather';
import { Search, MapPin, Navigation, Loader2, Check } from 'lucide-react';

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Partial<Section>) => void;
  initialData?: Section | null;
}

export const SectionModal: React.FC<SectionModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
    } else {
      setTitle('');
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
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors">
            Annuler
          </button>
          <button 
            onClick={() => {
              if (title.trim()) {
                onSave({ title });
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

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setWidgetUrl(initialData.widget_url || '');
      setDisplayLimit(initialData.display_limit || 10);
    } else {
      setTitle('');
      setWidgetUrl('');
      setDisplayLimit(10);
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
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      const loc = parseWeatherConfig(initialData.widget_url);
      setSelectedLocation(loc);
      setSearchQuery(loc.name);
    } else {
      setTitle('Météo');
      setSelectedLocation({ name: 'Paris', latitude: 48.8566, longitude: 2.3522, country: 'France' });
      setSearchQuery('');
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
                  widget_url: JSON.stringify(selectedLocation),
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


