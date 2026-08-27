import { useState } from 'react';
import { Search, Settings, Edit3, X, Check, Palette, LogOut, User, LayoutGrid, Menu } from 'lucide-react';
import { useTheme, type Theme } from '../hooks/useTheme';
import { useLayout, type ColumnCount } from '../hooks/useLayout';
import { supabase } from '../utils/supabase';

interface HeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activePageId?: string | null;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenAccountModal: () => void;
  onOpenSettingsModal: () => void;
  profile: 'perso' | 'pro';
  onChangeProfile: (p: 'perso' | 'pro') => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onTitleChange,
  searchQuery,
  onSearchChange,
  activePageId,
  isEditMode,
  onToggleEditMode,
  onOpenAccountModal,
  onOpenSettingsModal,
  profile,
  onChangeProfile,
  onOpenMobileMenu
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const { theme, setTheme } = useTheme();
  const { columnCount, setColumnCount } = useLayout(activePageId);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onTitleChange(tempTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 rounded-none mb-2 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between relative gap-2 sm:gap-4">
      
      {/* MOBILE BURGER (Left on mobile, hidden on PC) */}
      <div className="md:hidden flex items-center justify-start flex-shrink-0 w-10">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-1 text-[var(--color-text-strong)] hover:bg-black/10 rounded-lg transition-colors"
          title="Menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* TITLE (Centered on mobile, left on PC) */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 justify-center md:justify-start">
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5 sm:gap-2 w-full max-w-xs sm:max-w-sm min-w-0 justify-center">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-lg sm:text-xl font-bold focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] flex-1 min-w-0 text-center md:text-left"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            />
            <button onClick={handleTitleSubmit} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-md transition-colors flex-shrink-0">
              <Check size={18} />
            </button>
            <button onClick={() => setIsEditingTitle(false)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group min-w-0 justify-center">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-strong)] tracking-tight truncate whitespace-nowrap text-center md:text-left">
              {title}
            </h1>
            {isEditMode && (
              <button
                onClick={() => {
                  setTempTitle(title);
                  setIsEditingTitle(true);
                }}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all flex-shrink-0"
                title="Renommer le portail"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* MOBILE RIGHT SPACER (Balances the burger button so title is dead-centered) */}
      <div className="md:hidden flex-shrink-0 w-10 pointer-events-none" aria-hidden="true" />

      {/* PC CENTER (Search & Toggle) */}
      <div className="hidden md:flex flex-row items-center gap-4 flex-1 justify-center">
        <div className="relative w-full max-w-sm">
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

        <div className="flex bg-black/10 border border-[var(--color-border)] rounded-full p-1 w-40 flex-shrink-0">
          <button 
             className={`flex-1 py-1 rounded-full text-sm font-semibold transition-all ${profile === 'perso' ? 'bg-[var(--color-surface)] text-[var(--color-text-strong)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'}`}
             onClick={() => onChangeProfile('perso')}
          >
            Perso
          </button>
          <button 
             className={`flex-1 py-1 rounded-full text-sm font-semibold transition-all ${profile === 'pro' ? 'bg-[var(--color-surface)] text-[var(--color-text-strong)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'}`}
             onClick={() => onChangeProfile('pro')}
          >
            Pro
          </button>
        </div>
      </div>

      {/* PC RIGHT (Tools) */}
      <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
        <div className="relative group">
          <button className="flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-black/10 transition-colors" title="Mise en page">
            <LayoutGrid size={20} />
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-[380px] overflow-y-auto">
            <div className="px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)]">
              Colonnes de la page
            </div>
            {([1, 2, 3, 4, 5, 6, 7, 8] as ColumnCount[]).map((c) => (
              <button
                key={c}
                onClick={() => setColumnCount(c)}
                className={`w-full text-left px-4 py-1.5 text-sm transition-colors last:rounded-b-lg ${
                  columnCount === c ? 'bg-[var(--color-primary)] text-white font-medium' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {c} colonne{c > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="relative group">
          <button className="flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-black/10 transition-colors">
            <Palette size={20} />
          </button>
          <div className="absolute right-0 top-full mt-2 w-36 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {(['light', 'tokyo-night', 'nord', 'dracula', 'midnight'] as Theme[]).map((t) => (
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
          onClick={onOpenSettingsModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-[var(--color-text)] bg-black/10 hover:bg-black/20 border border-[var(--color-border)] transition-all"
          title="Paramètres du portail"
        >
          <Settings size={17} />
          <span>Paramètres</span>
        </button>

        <button
          onClick={onToggleEditMode}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all duration-200 ${
            isEditMode 
              ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' 
              : 'bg-black/20 hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
          }`}
        >
          <Edit3 size={17} />
          <span>{isEditMode ? 'Terminer' : 'Éditer'}</span>
        </button>

        <button
          onClick={onOpenAccountModal}
          className="flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-black/10 transition-colors ml-2"
          title="Mon Compte"
        >
          <User size={20} />
        </button>

        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors ml-2"
          title="Se déconnecter"
        >
          <LogOut size={20} />
        </button>
      </div>

    </header>
  );
};
