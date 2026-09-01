import React, { useState, useEffect } from 'react';
import type { Page, Section } from '../types';
import { X, Copy, ArrowRight } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'section' | 'item' | null;
  targetId: string | null;
  pages: Page[];
  sections: Section[];
  onMove: (id: string, destinationId: string) => void;
  onDuplicate: (id: string, destinationId: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  pages,
  sections,
  onMove,
  onDuplicate,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedTarget('');
    }
  }, [isOpen]);

  if (!isOpen || !targetType || !targetId) return null;

  const isSection = targetType === 'section';

  const handleMove = () => {
    if (selectedTarget) {
      onMove(targetId, selectedTarget);
      onClose();
    }
  };

  const handleDuplicate = () => {
    if (selectedTarget) {
      onDuplicate(targetId, selectedTarget);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--color-text-strong)]">
            {isSection ? 'Transférer la section / le widget' : 'Transférer le lien'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            {isSection ? 'Page de destination' : 'Section de destination'}
          </label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-strong)] cursor-pointer text-sm"
          >
            <option value="" disabled>Sélectionnez une destination</option>
            {isSection
              ? pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} {p.profile === 'pro' ? '(Pro)' : '(Perso)'}
                  </option>
                ))
              : sections
                  .filter((s) => s.type === 'links' || !s.type)
                  .map((s) => {
                    const page = pages.find((p) => p.id === s.page_id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.title} {page ? `(Page : ${page.title} - ${page.profile === 'pro' ? 'Pro' : 'Perso'})` : ''}
                      </option>
                    );
                  })}
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-2 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!selectedTarget}
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy size={16} />
            <span>Copier</span>
          </button>
          <button
            type="button"
            disabled={!selectedTarget}
            onClick={handleMove}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight size={16} />
            <span>Déplacer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
