
import type { Section, LinkItem } from '../types';
import { SectionCard } from './SectionCard';
import { Plus } from 'lucide-react';

interface DashboardProps {
  sections: Section[];
  searchQuery: string;
  isEditMode: boolean;
  onAddSection: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onAddItem: (sectionId: string) => void;
  onEditItem: (sectionId: string, item: LinkItem) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sections,
  searchQuery,
  isEditMode,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) => {
  // Filter sections and items based on search query
  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(section => section.items.length > 0 || isEditMode); // In edit mode, show empty sections

  return (
    <div className="max-w-7xl mx-auto px-6 pb-12 space-y-8">
      {filteredSections.map(section => (
        <SectionCard
          key={section.id}
          section={section}
          isEditMode={isEditMode}
          onEditSection={onEditSection}
          onDeleteSection={onDeleteSection}
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      ))}

      {filteredSections.length === 0 && !isEditMode && (
        <div className="text-center py-20 text-[var(--color-text-muted)] text-lg">
          Aucun résultat trouvé pour "{searchQuery}"
        </div>
      )}

      {isEditMode && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onAddSection}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all font-medium"
          >
            <Plus size={20} />
            <span>Ajouter une section</span>
          </button>
        </div>
      )}
    </div>
  );
};
