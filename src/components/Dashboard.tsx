import React from 'react';
import type { Section, LinkItem } from '../types';
import { SectionCard } from './SectionCard';
import { Plus } from 'lucide-react';
import { useLayout } from '../hooks/useLayout';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

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
  onReorderSections: (sections: Section[]) => void;
  onReorderItems: (sectionId: string, items: LinkItem[]) => void;
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
  onReorderSections,
  onReorderItems
}) => {
  const { columnCount } = useLayout();

  const getColumnsClass = () => {
    switch (columnCount) {
      case 1: return 'grid grid-cols-1 gap-6 items-start';
      case 2: return 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start';
      case 3: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start';
      case 4: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start';
      case 5: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 items-start';
      default: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start';
    }
  };

  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(section => section.items.length > 0 || isEditMode);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newSections = arrayMove(sections, oldIndex, newIndex);
      onReorderSections(newSections);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 pb-12">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredSections.map(s => s.id)} strategy={rectSortingStrategy}>
          <div className={getColumnsClass()}>
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
                onReorderItems={onReorderItems}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
