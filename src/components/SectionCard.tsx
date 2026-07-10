import React from 'react';
import type { Section, LinkItem } from '../types';
import { ItemCard } from './ItemCard';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface SectionCardProps {
  section: Section;
  isEditMode: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onAddItem: (sectionId: string) => void;
  onEditItem: (sectionId: string, item: LinkItem) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  isEditMode,
  onEditSection,
  onDeleteSection,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) => {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6 group">
        <h2 className="text-xl font-bold text-[var(--color-text-strong)] flex items-center gap-2">
          {section.title}
        </h2>
        {isEditMode && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddItem(section.id)}
              className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-md transition-colors"
              title="Ajouter un lien"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => onEditSection(section)}
              className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
              title="Modifier la section"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => onDeleteSection(section.id)}
              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
              title="Supprimer la section"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {section.items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isEditMode={isEditMode}
            onEdit={(editedItem) => onEditItem(section.id, editedItem)}
            onDelete={(itemId) => onDeleteItem(section.id, itemId)}
          />
        ))}
        {section.items.length === 0 && (
          <div className="col-span-full py-8 text-center text-[var(--color-text-muted)] border-2 border-dashed border-[var(--color-border)] rounded-xl">
            Aucun lien dans cette section.
          </div>
        )}
      </div>
    </div>
  );
};
