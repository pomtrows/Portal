import React, { useState } from 'react';
import type { Section } from '../types';
import {
  Search,
  Sparkles,
  Brain,
  Zap,
  Moon,
  Bot,
  Globe,
  Shield,
  Video,
  BookOpen,
  Code,
  ShoppingBag,
  MessageSquare,
  GripVertical,
  Edit2,
  Trash2,
  X,
  ArrowUpRight,
  History,
  Check
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ALL_SEARCH_ENGINES,
  parseSearchConfig,
  executeSearch,
  type SearchEngine
} from '../utils/searchEngines';

import { usePreferences } from '../hooks/usePreferences';

interface SearchWidgetCardProps {
  section: Section;
  isEditMode: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onUpdateSpan?: (sectionId: string, col_span: number) => void;
  maxAllowedSpan?: number;
}

const getEngineIcon = (iconName: string, size = 15) => {
  switch (iconName) {
    case 'Sparkles': return <Sparkles size={size} />;
    case 'Brain': return <Brain size={size} />;
    case 'Zap': return <Zap size={size} />;
    case 'Moon': return <Moon size={size} />;
    case 'Bot': return <Bot size={size} />;
    case 'Globe': return <Globe size={size} />;
    case 'Shield': return <Shield size={size} />;
    case 'Video': return <Video size={size} />;
    case 'BookOpen': return <BookOpen size={size} />;
    case 'Code': return <Code size={size} />;
    case 'ShoppingBag': return <ShoppingBag size={size} />;
    case 'MessageSquare': return <MessageSquare size={size} />;
    default: return <Search size={size} />;
  }
};

export const SearchWidgetCard: React.FC<SearchWidgetCardProps> = ({
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

  const config = parseSearchConfig(section.widget_url);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ai' | 'web'>('all');
  const [selectedEngineId, setSelectedEngineId] = useState<string>(config.defaultEngineId);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('portal_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter enabled engines based on config
  const enabledEngines = ALL_SEARCH_ENGINES.filter((e) =>
    config.enabledEngineIds.includes(e.id)
  );

  const filteredEngines = enabledEngines.filter((e) => {
    if (selectedCategory === 'all') return true;
    return e.category === selectedCategory;
  });

  const selectedEngine = enabledEngines.find((e) => e.id === selectedEngineId) || enabledEngines[0] || ALL_SEARCH_ENGINES[0];

  const handleSearch = (engine: SearchEngine) => {
    const trimmed = query.trim();
    if (trimmed) {
      // Save to recent searches
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      try {
        localStorage.setItem('portal_search_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    executeSearch(engine, trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(selectedEngine);
    }
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('portal_search_history');
    } catch {
      // ignore
    }
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
          <div className="p-1 rounded-lg bg-indigo-900/10 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 flex-shrink-0">
            <Search size={17} />
          </div>
          <h2 className={`${getTitleClass()} text-slate-950 dark:text-white truncate`} title={section.title || config.title}>
            {section.title || config.title}
          </h2>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
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

      {/* Search Input Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Rechercher avec ${selectedEngine.name}...`}
            className="w-full bg-slate-100/90 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-16 py-2 text-xs sm:text-sm font-semibold text-slate-950 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-inner"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none">
            {getEngineIcon(selectedEngine.icon, 15)}
          </div>

          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md transition-colors"
                title="Effacer"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSearch(selectedEngine)}
              className="p-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-sm"
              title={`Lancer la recherche sur ${selectedEngine.name}`}
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-between gap-1 p-0.5 bg-slate-200/80 dark:bg-black/40 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px]">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`flex-1 py-1 px-1.5 rounded-md font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-800 dark:bg-blue-600 text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('ai')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md font-bold transition-all ${
              selectedCategory === 'ai'
                ? 'bg-blue-800 dark:bg-blue-600 text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white'
            }`}
          >
            <Sparkles size={11} />
            <span>IA</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('web')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md font-bold transition-all ${
              selectedCategory === 'web'
                ? 'bg-blue-800 dark:bg-blue-600 text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white'
            }`}
          >
            <Globe size={11} />
            <span>Web</span>
          </button>
        </div>

        {/* Engine Pills Grid */}
        <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-0.5 scrollbar-thin">
          {filteredEngines.map((engine) => {
            const isSelected = engine.id === selectedEngineId;
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => {
                  setSelectedEngineId(engine.id);
                  if (query.trim()) {
                    handleSearch(engine);
                  }
                }}
                className={`flex items-center gap-1.5 py-1 px-2 rounded-lg border text-xs font-bold transition-all shadow-xs ${
                  isSelected
                    ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-extrabold'
                    : `bg-slate-100/90 dark:bg-slate-800/60 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100`
                }`}
                title={engine.description}
              >
                <span className="text-slate-700 dark:text-slate-300">
                  {getEngineIcon(engine.icon, 13)}
                </span>
                <span>{engine.name}</span>
                {isSelected && <Check size={11} className="text-blue-700 dark:text-sky-400" />}
              </button>
            );
          })}
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-slate-400 px-0.5">
              <span className="flex items-center gap-1">
                <History size={11} />
                <span>Recherches récentes</span>
              </span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="hover:text-red-600 transition-colors text-[10px]"
              >
                Effacer
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(term);
                    handleSearch(selectedEngine);
                  }}
                  className="py-0.5 px-2 rounded-md bg-slate-200/80 dark:bg-slate-800/50 hover:bg-blue-100 dark:hover:bg-slate-700 border border-slate-300/60 dark:border-slate-700/60 text-[11px] font-semibold text-slate-800 dark:text-slate-300 transition-colors truncate max-w-[130px]"
                  title={`Rechercher "${term}"`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
