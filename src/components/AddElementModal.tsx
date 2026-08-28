import React from 'react';
import { Plus, X, Layers, Rss, CloudSun, Car, Search } from 'lucide-react';

interface AddElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: () => void;
  onAddRssWidget: () => void;
  onAddWeatherWidget: () => void;
  onAddTrafficWidget: () => void;
  onAddSearchWidget: () => void;
}

export const AddElementModal: React.FC<AddElementModalProps> = ({
  isOpen,
  onClose,
  onAddSection,
  onAddRssWidget,
  onAddWeatherWidget,
  onAddTrafficWidget,
  onAddSearchWidget,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Plus size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-strong)]">
                Ajouter au tableau de bord
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Choisissez le type d'élément à ajouter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-black/10 transition-colors"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Section de liens */}
          <button
            onClick={() => {
              onClose();
              onAddSection();
            }}
            className="flex items-center gap-3.5 p-3 rounded-xl border border-[var(--color-border)] bg-black/5 hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)] text-left transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Layers size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors">
                Section de liens
              </div>
              <div className="text-xs text-[var(--color-text-muted)] truncate">
                Groupe de raccourcis & sites web favoris
              </div>
            </div>
          </button>

          {/* RSS */}
          <button
            onClick={() => {
              onClose();
              onAddRssWidget();
            }}
            className="flex items-center gap-3.5 p-3 rounded-xl border border-[var(--color-border)] bg-black/5 hover:bg-orange-500/10 hover:border-orange-500 text-left transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Rss size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-[var(--color-text-strong)] group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Flux d'actualités RSS
              </div>
              <div className="text-xs text-[var(--color-text-muted)] truncate">
                Affichage d'articles et news en temps réel
              </div>
            </div>
          </button>

          {/* Météo */}
          <button
            onClick={() => {
              onClose();
              onAddWeatherWidget();
            }}
            className="flex items-center gap-3.5 p-3 rounded-xl border border-[var(--color-border)] bg-black/5 hover:bg-sky-500/10 hover:border-sky-500 text-left transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <CloudSun size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-[var(--color-text-strong)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Widget Météo
              </div>
              <div className="text-xs text-[var(--color-text-muted)] truncate">
                Prévisions à 24h et 7 jours par ville
              </div>
            </div>
          </button>

          {/* Info Trafic */}
          <button
            onClick={() => {
              onClose();
              onAddTrafficWidget();
            }}
            className="flex items-center gap-3.5 p-3 rounded-xl border border-[var(--color-border)] bg-black/5 hover:bg-emerald-500/10 hover:border-emerald-500 text-left transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Car size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-[var(--color-text-strong)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Widget Info Trafic
              </div>
              <div className="text-xs text-[var(--color-text-muted)] truncate">
                Temps de trajet en direct (Maps & Waze)
              </div>
            </div>
          </button>

          {/* Hub de recherche */}
          <button
            onClick={() => {
              onClose();
              onAddSearchWidget();
            }}
            className="flex items-center gap-3.5 p-3 rounded-xl border border-[var(--color-border)] bg-black/5 hover:bg-indigo-500/10 hover:border-indigo-500 text-left transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Search size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-[var(--color-text-strong)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Hub de recherche & IA
              </div>
              <div className="text-xs text-[var(--color-text-muted)] truncate">
                Barre rapide ChatGPT, Claude, Gemini, Web...
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
