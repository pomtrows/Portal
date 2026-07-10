import { useState } from 'react';
import { Search, Settings, Edit3, X, Check, Palette } from 'lucide-react';
import { useTheme, type Theme } from '../hooks/useTheme';

interface HeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onTitleChange,
  searchQuery,
  onSearchChange,
  isEditMode,
  onToggleEditMode
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const { theme, setTheme } = useTheme();

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onTitleChange(tempTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 rounded-none mb-8 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-xl font-bold focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)]"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            />
            <button onClick={handleTitleSubmit} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-md transition-colors">
              <Check size={20} />
            </button>
            <button onClick={() => setIsEditingTitle(false)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors">
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="text-2xl font-bold text-[var(--color-text-strong)] tracking-tight">
              {title}
            </h1>
            {isEditMode && (
              <button
                onClick={() => {
                  setTempTitle(title);
                  setIsEditingTitle(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all"
                title="Renommer le portail"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-[var(--color-text-muted)]" />
          </div>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-black/20 border border-[var(--color-border)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:bg-black/40 transition-all placeholder:text-[var(--color-text-muted)] text-[var(--color-text-strong)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="relative group">
          <button className="flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-black/10 transition-colors">
            <Palette size={20} />
          </button>
          <div className="absolute right-0 top-full mt-2 w-36 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {(['tokyo-night', 'light', 'nord', 'dracula', 'midnight'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`w-full text-left px-4 py-2 text-sm capitalize transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  theme === t ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {t.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onToggleEditMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isEditMode 
              ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' 
              : 'bg-black/20 hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
          }`}
        >
          <Settings size={18} className={isEditMode ? 'animate-spin-slow' : ''} />
          <span>{isEditMode ? 'Terminer' : 'Éditer'}</span>
        </button>
      </div>
    </header>
  );
};
