import React from 'react';
import { X, Search, Settings, LogOut, User, Plus, Trash2, Edit3 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { Page } from '../types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pages: Page[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  profile: 'perso' | 'pro';
  onChangeProfile: (p: 'perso' | 'pro') => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenAccountModal: () => void;
  onOpenSettingsModal: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  title,
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  searchQuery,
  onSearchChange,
  profile,
  onChangeProfile,
  isEditMode,
  onToggleEditMode,
  onOpenAccountModal,
  onOpenSettingsModal
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute inset-y-0 left-0 w-[280px] bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-2xl flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 bg-[var(--color-surface)] z-10">
          <h2 className="font-bold text-lg text-[var(--color-text-strong)] truncate pr-2">{title}</h2>
          <button onClick={onClose} className="p-2 bg-[var(--color-background)] rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] border border-[var(--color-border)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-6">
          {/* Profile Toggle */}
          <div className="flex bg-black/10 border border-[var(--color-border)] rounded-full p-1">
            <button 
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${profile === 'perso' ? 'bg-[var(--color-surface)] text-[var(--color-text-strong)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'}`}
              onClick={() => { onChangeProfile('perso'); onClose(); }}
            >
              Perso
            </button>
            <button 
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${profile === 'pro' ? 'bg-[var(--color-surface)] text-[var(--color-text-strong)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'}`}
              onClick={() => { onChangeProfile('pro'); onClose(); }}
            >
              Pro
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-[var(--color-text-muted)]" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)]"
            />
          </div>

          {/* Pages */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Pages</h3>
              {isEditMode && (
                <button onClick={onAddPage} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
                  <Plus size={16} />
                </button>
              )}
            </div>
            {pages.map(page => (
              <div key={page.id} className="relative group flex items-center">
                <button
                  onClick={() => { onSelectPage(page.id); onClose(); }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${
                    activePageId === page.id 
                      ? 'bg-[var(--color-primary)] text-white shadow-md' 
                      : 'bg-[var(--color-background)] text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] border border-[var(--color-border)]/50'
                  }`}
                >
                  {page.title}
                </button>
                {isEditMode && (
                  <button
                    onClick={() => onDeletePage(page.id)}
                    className="absolute right-2 p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto border-t border-[var(--color-border)] pt-4 flex flex-col gap-2">
            <button
              onClick={() => { onOpenSettingsModal(); onClose(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-background)] text-[var(--color-text-strong)] border border-[var(--color-border)] font-medium"
            >
              <Settings size={18} />
              <span>Paramètres</span>
            </button>

            <button
              onClick={() => { onToggleEditMode(); onClose(); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isEditMode 
                  ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' 
                  : 'bg-[var(--color-background)] text-[var(--color-text-strong)] border border-[var(--color-border)]'
              }`}
            >
              <Edit3 size={18} />
              <span>{isEditMode ? 'Terminer l\'édition' : 'Mode Édition'}</span>
            </button>
            
            <button
              onClick={() => { onOpenAccountModal(); onClose(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-background)] text-[var(--color-text-strong)] border border-[var(--color-border)]"
            >
              <User size={18} />
              <span>Mon Compte</span>
            </button>

            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20"
            >
              <LogOut size={18} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
