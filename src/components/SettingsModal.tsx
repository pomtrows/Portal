import React, { useState } from 'react';
import {
  X,
  Palette,
  Type,
  Clock,
  Check,
  Sliders,
  Sparkles,
  LayoutGrid,
  Car,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTheme, type Theme } from '../hooks/useTheme';
import { usePreferences, type FontSize, type SpacingLevel } from '../hooks/usePreferences';
import { testTomTomApiKey } from '../utils/traffic';

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

const PADDING_LEVELS: { id: SpacingLevel; level: number; label: string; desc: string }[] = [
  { id: 'xs', level: 1, label: 'Très compact', desc: 'Marge minime' },
  { id: 'sm', level: 2, label: 'Compact', desc: 'Marge réduite' },
  { id: 'md', level: 3, label: 'Normal', desc: 'Recommandé' },
  { id: 'lg', level: 4, label: 'Aéré', desc: 'Marge généreuse' },
  { id: 'xl', level: 5, label: 'Très aéré', desc: 'Marge large' },
];

const SPACING_LEVELS: { id: SpacingLevel; level: number; label: string; desc: string }[] = [
  { id: 'xs', level: 1, label: 'Très serré', desc: 'Écart minime' },
  { id: 'sm', level: 2, label: 'Serré', desc: 'Écart réduit' },
  { id: 'md', level: 3, label: 'Normal', desc: 'Recommandé' },
  { id: 'lg', level: 4, label: 'Espacé', desc: 'Écart généreux' },
  { id: 'xl', level: 5, label: 'Très espacé', desc: 'Écart large' },
];

const LINK_PADDING_LEVELS: { id: SpacingLevel; level: number; label: string; desc: string }[] = [
  { id: 'xs', level: 1, label: 'Très compact', desc: 'Bouton ultra-fin' },
  { id: 'sm', level: 2, label: 'Compact', desc: 'Bouton fin' },
  { id: 'md', level: 3, label: 'Normal', desc: 'Recommandé' },
  { id: 'lg', level: 4, label: 'Aéré', desc: 'Bouton large' },
  { id: 'xl', level: 5, label: 'Très aéré', desc: 'Bouton grand' },
];

const ICON_SIZE_LEVELS: { id: SpacingLevel; level: number; label: string; desc: string }[] = [
  { id: 'xs', level: 1, label: 'Très petite', desc: 'Icône mini' },
  { id: 'sm', level: 2, label: 'Petite', desc: 'Icône discrète' },
  { id: 'md', level: 3, label: 'Normale', desc: 'Recommandé' },
  { id: 'lg', level: 4, label: 'Grande', desc: 'Mise en avant' },
  { id: 'xl', level: 5, label: 'Très grande', desc: 'Grand format' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'spacing' | 'fonts' | 'schedule' | 'traffic'>('theme');
  const { theme, setTheme } = useTheme();
  const {
    fontSizeSection,
    setFontSizeSection,
    fontSizeLinks,
    setFontSizeLinks,
    fontSizeRss,
    setFontSizeRss,
    sectionPadding,
    setSectionPadding,
    linkSpacing,
    setLinkSpacing,
    linkPadding,
    setLinkPadding,
    iconSize,
    setIconSize,
    schedule,
    setSchedule,
    tomtomApiKey,
    setTomTomApiKey,
    getCurrentScheduledProfile,
  } = usePreferences();

  const [apiKeyInput, setApiKeyInput] = useState<string>(() => tomtomApiKey || '');
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Completely transparent backdrop to allow instant live preview without dimming or blur */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />
      <div className="w-full max-w-3xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative z-10">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-[var(--color-primary)]">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-strong)] leading-tight">Paramètres du Portail</h2>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">Personnalisez votre affichage et vos automatismes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-black/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--color-border)] bg-black/5 dark:bg-black/20 px-3 sm:px-4 pt-1.5 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap flex-1 sm:flex-initial ${
              activeTab === 'theme'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)] shadow-xs'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
            }`}
          >
            <Palette size={14} />
            <span>Thèmes</span>
          </button>
          <button
            onClick={() => setActiveTab('spacing')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap flex-1 sm:flex-initial ${
              activeTab === 'spacing'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)] shadow-xs'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Espacements</span>
          </button>
          <button
            onClick={() => setActiveTab('fonts')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap flex-1 sm:flex-initial ${
              activeTab === 'fonts'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)] shadow-xs'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
            }`}
          >
            <Type size={14} />
            <span>Polices</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap flex-1 sm:flex-initial ${
              activeTab === 'schedule'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)] shadow-xs'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
            }`}
          >
            <Clock size={14} />
            <span>Planning</span>
          </button>
          <button
            onClick={() => setActiveTab('traffic')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap flex-1 sm:flex-initial ${
              activeTab === 'traffic'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)] shadow-xs'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
            }`}
          >
            <Car size={14} />
            <span>Info Trafic</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-4.5 overflow-y-auto space-y-4 flex-1">

          {/* TAB 1: THÈMES */}
          {activeTab === 'theme' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-strong)] mb-0.5">Thème visuel</h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Choisissez l'apparence générale et les contrastes de votre portail.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {THEMES.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] bg-black/10 shadow-md'
                          : 'border-[var(--color-border)] hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg border ${t.bg} ${t.border} flex items-center justify-center shadow-inner`}>
                          <div className={`w-3 h-3 rounded-full ${t.primary}`} />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-[var(--color-text-strong)]">
                          {t.name}
                        </span>
                      </div>
                      {isSelected && <Check size={16} className="text-[var(--color-primary)]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ESPACEMENTS & MARGES (Ultra-compact sans scroll) */}
          {activeTab === 'spacing' && (
            <div className="space-y-3">
              {/* Section 1: Section Padding */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">
                    Marge intérieure des sections & widgets
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold">
                    Niveau {PADDING_LEVELS.find(p => p.id === sectionPadding)?.level || 3}/5 : {PADDING_LEVELS.find(p => p.id === sectionPadding)?.label}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {PADDING_LEVELS.map((item) => {
                    const isSelected = sectionPadding === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSectionPadding(item.id)}
                        className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center min-h-[46px] ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)] font-extrabold shadow-xs'
                            : 'border-[var(--color-border)] bg-black/5 hover:bg-black/10 text-[var(--color-text)] font-semibold'
                        }`}
                      >
                        <div className="text-[11px] font-black leading-tight">Niv. {item.level}</div>
                        <div className="text-[10px] font-bold truncate max-w-full leading-tight opacity-90">{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Link Spacing */}
              <div className="pt-2.5 border-t border-[var(--color-border)]/60">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">
                    Écartement entre les liens
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold">
                    Niveau {SPACING_LEVELS.find(s => s.id === linkSpacing)?.level || 3}/5 : {SPACING_LEVELS.find(s => s.id === linkSpacing)?.label}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {SPACING_LEVELS.map((item) => {
                    const isSelected = linkSpacing === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setLinkSpacing(item.id)}
                        className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center min-h-[46px] ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)] font-extrabold shadow-xs'
                            : 'border-[var(--color-border)] bg-black/5 hover:bg-black/10 text-[var(--color-text)] font-semibold'
                        }`}
                      >
                        <div className="text-[11px] font-black leading-tight">Niv. {item.level}</div>
                        <div className="text-[10px] font-bold truncate max-w-full leading-tight opacity-90">{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Link Padding (Épaisseur des boutons) */}
              <div className="pt-2.5 border-t border-[var(--color-border)]/60">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">
                    Marge intérieure des liens (Épaisseur des boutons)
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold">
                    Niveau {LINK_PADDING_LEVELS.find(l => l.id === linkPadding)?.level || 3}/5 : {LINK_PADDING_LEVELS.find(l => l.id === linkPadding)?.label}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {LINK_PADDING_LEVELS.map((item) => {
                    const isSelected = linkPadding === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setLinkPadding(item.id)}
                        className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center min-h-[46px] ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)] font-extrabold shadow-xs'
                            : 'border-[var(--color-border)] bg-black/5 hover:bg-black/10 text-[var(--color-text)] font-semibold'
                        }`}
                      >
                        <div className="text-[11px] font-black leading-tight">Niv. {item.level}</div>
                        <div className="text-[10px] font-bold truncate max-w-full leading-tight opacity-90">{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Link Icon Size */}
              <div className="pt-2.5 border-t border-[var(--color-border)]/60">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">
                    Taille des icônes des liens
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold">
                    Niveau {ICON_SIZE_LEVELS.find(i => i.id === iconSize)?.level || 3}/5 : {ICON_SIZE_LEVELS.find(i => i.id === iconSize)?.label}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {ICON_SIZE_LEVELS.map((item) => {
                    const isSelected = iconSize === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setIconSize(item.id)}
                        className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center min-h-[46px] ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)] font-extrabold shadow-xs'
                            : 'border-[var(--color-border)] bg-black/5 hover:bg-black/10 text-[var(--color-text)] font-semibold'
                        }`}
                      >
                        <div className="text-[11px] font-black leading-tight">Niv. {item.level}</div>
                        <div className="text-[10px] font-bold truncate max-w-full leading-tight opacity-90">{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TAILLES DE POLICE */}
          {activeTab === 'fonts' && (
            <div className="space-y-6">
              {/* Section Titles Font Size */}
              <div className="space-y-2.5">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-strong)]">
                    Taille de police des Sections & Widgets
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Ajuste la taille des titres de vos sections et de vos widgets (Flux RSS, Météo, Trajet, Recherche).
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
                        <div className={`text-slate-500 dark:text-slate-400 mt-1 truncate font-bold ${
                          size === 'compact' ? 'text-xs' : size === 'normal' ? 'text-sm' : 'text-base'
                        }`}>
                          Titre Section / Widget
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Links Font Size */}
              <div className="space-y-2.5 pt-4 border-t border-[var(--color-border)]">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-strong)]">
                    Taille de police des Liens
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Ajuste la taille des titres et des descriptions de vos raccourcis.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {(['compact', 'normal', 'large'] as FontSize[]).map((size) => {
                    const isSelected = fontSizeLinks === size;
                    const labels = { compact: 'Compact', normal: 'Normal', large: 'Grand' };
                    return (
                      <button
                        key={size}
                        onClick={() => setFontSizeLinks(size)}
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
                          Nom du lien
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

          {/* TAB 5: INFO TRAFIC & CLÉ API */}
          {activeTab === 'traffic' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-strong)] mb-0.5 flex items-center gap-2">
                  <Car size={16} className="text-emerald-700 dark:text-emerald-400" />
                  <span>Calcul d'itinéraires & Trafic temps réel (TomTom)</span>
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Activez le calcul de trajet avec prise en compte des bouchons et des retards en direct.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-black/5 dark:bg-white/5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5">
                      <Key size={14} className="text-[var(--color-primary)]" />
                      <span>Clé API TomTom Routing</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      TomTom offre <strong>2 500 requêtes gratuites par jour</strong> (sans carte bancaire requise).
                    </p>
                  </div>
                  <a
                    href="https://developer.tomtom.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline flex-shrink-0 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                  >
                    <span>Créer une clé gratuite</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setTestResult(null);
                      }}
                      placeholder="Collez votre clé API TomTom ici..."
                      className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-3 pr-20 py-2 text-xs font-mono text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)] shadow-inner"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {apiKeyInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setApiKeyInput('');
                            setTomTomApiKey('');
                            setTestResult(null);
                          }}
                          className="px-2 py-1 text-[11px] font-bold text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Effacer la clé"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!apiKeyInput.trim() || isTestingKey}
                      onClick={async () => {
                        setIsTestingKey(true);
                        setTestResult(null);
                        const res = await testTomTomApiKey(apiKeyInput);
                        setIsTestingKey(false);
                        setTestResult(res);
                        if (res.ok) {
                          setTomTomApiKey(apiKeyInput);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                      {isTestingKey ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      <span>Tester & Enregistrer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTomTomApiKey(apiKeyInput);
                        setTestResult({ ok: true, message: 'Clé enregistrée !' });
                      }}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white px-2 py-1"
                    >
                      Enregistrer sans tester
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                        testResult.ok
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {testResult.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status banner */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                <div className="font-bold text-slate-950 dark:text-white">
                  Moteur actuellement actif :{' '}
                  <span className={tomtomApiKey ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : 'text-blue-700 dark:text-blue-400 font-extrabold'}>
                    {tomtomApiKey ? 'TomTom Routing (Trafic live activé)' : 'OSRM (OpenStreetMap - Sans trafic live)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300">
                  {tomtomApiKey
                    ? 'Vos widgets de trajet calculent les temps de parcours en temps réel avec les bouchons et retards.'
                    : 'Renseignez une clé API TomTom ci-dessus pour activer les retards de circulation en direct.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 border-t border-[var(--color-border)] flex items-center justify-end bg-black/5 dark:bg-black/20">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
