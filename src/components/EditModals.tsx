import { useState, useEffect } from 'react';
import type { Section, LinkItem } from '../types';

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
