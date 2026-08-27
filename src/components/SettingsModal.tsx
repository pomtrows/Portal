import React, { useState } from 'react';
import {
  X,
  LayoutGrid,
  Palette,
  Type,
  Clock,
  Check,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useLayout, type ColumnCount } from '../hooks/useLayout';
import { useTheme, type Theme } from '../hooks/useTheme';
import { usePreferences, type FontSize } from '../hooks/usePreferences';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEMES: { id: Theme; name: string; bg: string; border: string; primary: string }[] = [
  { id: 'light', name: 'Clair (Light)', bg: 'bg-slate-100', border: 'border-slate-300', primary: 'bg-blue-600' },
  { id: 'tokyo-night', name: 'Tokyo Night', bg: 'bg-[#1a1b26]', border: 'border-[#414868]', primary: 'bg-[#7aa2f7]' },
  { id: 'nord', name: 'Nord', bg: 'bg-[#2e3440]', border: 'border-[#4c566a]', primary: 'bg-[#88c0d0]' },
  { id: 'dracula', name: 'Dracula', bg: 'bg-[#282a36]', border: 'border-[#6272a4]', primary: 'bg-[#bd93f9]' },
  { id: 'midnight', name: 'Midnight (OLED)', bg: 'bg-black', border: 'border-neutral-800', primary: 'bg-indigo-500' },
];

const DAYS = [
  { id: 1, label: 'Lun', name: 'Lundi' },
  { id: 2, label: 'Mar', name: 'Mardi' },
  { id: 3, label: 'Mer', name: 'Mercredi' },
  { id: 4, label: 'Jeu', name: 'Jeudi' },
  { id: 5, label: 'Ven', name: 'Vendredi' },
  { id: 6, label: 'Sam', name: 'Samedi' },
  { id: 0, label: 'Dim', name: 'Dimanche' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'theme' | 'fonts' | 'schedule'>('layout');
  const { columnCount, setColumnCount } = useLayout();
  const { theme, setTheme } = useTheme();
  const {
    fontSizeSection,
    setFontSizeSection,
    fontSizeRss,
    setFontSizeRss,
    schedule,
    setSchedule,
    getCurrentScheduledProfile,
  } = usePreferences();

  if (!isOpen) return null;

  const toggleDay = (dayId: number) => {
    const isIncluded = schedule.proDays.includes(dayId);
    const newDays = isIncluded
      ? schedule.proDays.filter((d) => d !== dayId)
      : [...schedule.proDays, dayId];
    setSchedule({ ...schedule, proDays: newDays });
  };

  const currentModeNow = getCurrentScheduledProfile();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-[var(--color-primary)]">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-strong)]">Paramètres du Portail</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Personnalisez votre affichage et vos automatismes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-black/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--color-border)] bg-black/5 dark:bg-black/20 px-4 pt-2 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
              activeTab === 'layout'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)] shadow-xs'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
            }`}
          >
            <LayoutGrid size={15} />
            <span>Colonnes</span>
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
              activeTab === 'theme'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)] shadow-xs'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
            }`}
          >
            <Palette size={15} />
            <span>Style & Thème</span>
          </button>
          <button
            onClick={() => setActiveTab('fonts')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
              activeTab === 'fonts'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)] shadow-xs'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
            }`}
          >
            <Type size={15} />
            <span>Polices</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
              activeTab === 'schedule'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)] shadow-xs'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
            }`}
          >
            <Clock size={15} />
            <span>Planning Pro/Perso</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: COLONNES */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-strong)] mb-1">Nombre de colonnes</h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Définissez la grille d'affichage maximale pour les écrans larges (actuellement : {columnCount} colonne{columnCount > 1 ? 's' : ''}).
                </p>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {([1, 2, 3, 4, 5, 6, 7, 8] as ColumnCount[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setColumnCount(c)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      columnCount === c
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)] font-extrabold shadow-sm'
                        : 'border-[var(--color-border)] bg-black/5 hover:bg-black/10 text-[var(--color-text)] font-semibold'
                    }`}
                  >
                    <span className="text-lg">{c}</span>
                    <span className="text-[10px] opacity-75">{c > 1 ? 'cols' : 'col'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: THÈMES */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-strong)] mb-1">Thème visuel</h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Choisissez l'apparence générale et les contrastes de votre portail.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEMES.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] bg-black/10 shadow-md'
                          : 'border-[var(--color-border)] hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border ${t.bg} ${t.border} flex items-center justify-center shadow-inner`}>
                          <div className={`w-3.5 h-3.5 rounded-full ${t.primary}`} />
                        </div>
                        <span className="font-bold text-sm text-[var(--color-text-strong)]">
                          {t.name}
                        </span>
                      </div>
                      {isSelected && <Check size={18} className="text-[var(--color-primary)]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: TAILLES DE POLICE */}
          {activeTab === 'fonts' && (
            <div className="space-y-6">
              {/* Section Font Size */}
              <div className="space-y-2.5">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-strong)]">
                    Taille de police des Sections & Liens
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Ajuste la taille des titres de section et des liens favoris.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {(['compact', 'normal', 'large'] as FontSize[]).map((size) => {
                    const isSelected = fontSizeSection === size;
                    const labels = { compact: 'Compact', normal: 'Normal', large: 'Grand' };
                    return (
                      <button
                        key={size}
                        onClick={() => setFontSizeSection(size)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)] font-extrabold shadow-sm'
                            : 'border-[var(--color-border)] bg-black/5 hover:bg-black/10 text-[var(--color-text)] font-semibold'
                        }`}
                      >
                        <div className="text-sm font-bold">{labels[size]}</div>
                        <div className={`text-slate-500 dark:text-slate-400 mt-1 truncate ${
                          size === 'compact' ? 'text-[11px]' : size === 'normal' ? 'text-xs' : 'text-sm'
                        }`}>
                          Exemple de texte
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RSS Font Size */}
              <div className="space-y-2.5 pt-4 border-t border-[var(--color-border)]">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-strong)]">
                    Taille de police des Flux RSS
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Ajuste la taille des articles, résumés et dates dans les cartes RSS.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {(['compact', 'normal', 'large'] as FontSize[]).map((size) => {
                    const isSelected = fontSizeRss === size;
                    const labels = { compact: 'Compact', normal: 'Normal', large: 'Grand' };
                    return (
                      <button
                        key={size}
                        onClick={() => setFontSizeRss(size)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)] font-extrabold shadow-sm'
                            : 'border-[var(--color-border)] bg-black/5 hover:bg-black/10 text-[var(--color-text)] font-semibold'
                        }`}
                      >
                        <div className="text-sm font-bold">{labels[size]}</div>
                        <div className={`text-slate-500 dark:text-slate-400 mt-1 truncate ${
                          size === 'compact' ? 'text-[11px]' : size === 'normal' ? 'text-xs' : 'text-sm'
                        }`}>
                          Titre d'article
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PLANNING PRO / PERSO */}
          {activeTab === 'schedule' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-strong)] mb-1">
                  Bascule automatique Pro / Perso
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Configurez les jours et les heures où le portail doit s'ouvrir automatiquement sur votre profil Pro.
                </p>
              </div>

              {/* Enable Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 dark:bg-black/20 border border-[var(--color-border)]">
                <div className="flex items-center gap-2.5">
                  <Clock size={18} className="text-[var(--color-primary)]" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[var(--color-text-strong)]">
                      Activer la bascule horaire
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">
                      Bascule automatique à l'ouverture de l'application
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                </label>
              </div>

              {schedule.enabled && (
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                  {/* Days Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-2">
                      Jours de travail (Mode Pro)
                    </label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {DAYS.map((d) => {
                        const isSelected = schedule.proDays.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDay(d.id)}
                            className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-all ${
                              isSelected
                                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                                : 'bg-black/5 hover:bg-black/10 border-[var(--color-border)] text-[var(--color-text-muted)]'
                            }`}
                            title={d.name}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1">
                        Heure de début
                      </label>
                      <input
                        type="time"
                        value={schedule.proStartTime}
                        onChange={(e) => setSchedule({ ...schedule, proStartTime: e.target.value })}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1">
                        Heure de fin
                      </label>
                      <input
                        type="time"
                        value={schedule.proEndTime}
                        onChange={(e) => setSchedule({ ...schedule, proEndTime: e.target.value })}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>

                  {/* Live Status Summary */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[var(--color-primary)] flex-shrink-0" />
                      <div>
                        <span className="font-bold text-[var(--color-text-strong)]">
                          Mode actuel calculé :
                        </span>{' '}
                        <span className="font-extrabold uppercase text-[var(--color-primary)]">
                          {currentModeNow === 'pro' ? '👔 Pro' : '🏠 Perso'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--color-border)] flex items-center justify-end bg-black/5 dark:bg-black/20">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
