import React from 'react';
import type { Section, LinkItem } from '../types';
import { ItemCard } from './ItemCard';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
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
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { usePreferences } from '../hooks/usePreferences';

interface SectionCardProps {
  section: Section;
  isEditMode: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onAddItem: (sectionId: string) => void;
  onEditItem: (sectionId: string, item: LinkItem) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
  onReorderItems?: (sectionId: string, items: LinkItem[]) => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  isEditMode,
  onEditSection,
  onDeleteSection,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItems
}) => {
  const { fontSizeSection } = usePreferences();

  // Sortable hook for the Section itself
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Sensors for the inner DndContext (Items)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEndItems = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderItems) return;

    const oldIndex = section.items.findIndex(i => i.id === active.id);
    const newIndex = section.items.findIndex(i => i.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(section.items, oldIndex, newIndex);
      onReorderItems(section.id, newItems);
    }
  };

  const getTitleClass = () => {
    switch (fontSizeSection) {
      case 'compact': return 'text-xs sm:text-sm font-bold';
      case 'large': return 'text-base sm:text-lg font-bold';
      default: return 'text-sm sm:text-base font-bold';
    }
  };

  const getInnerGridClass = () => {
    const span = section.col_span || 1;
    if (span === 1) return 'grid-cols-1';
    if (span === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (span === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div ref={setNodeRef} style={style} className={"glass-panel p-3 sm:p-4 w-full min-w-0 " + (isDragging ? 'z-50 shadow-2xl ring-2 ring-[var(--color-primary)]' : '')}>
      <div className="flex items-center justify-between mb-3 group gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isEditMode && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-black/10 p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors -ml-1 flex-shrink-0"
              title="Déplacer la section"
            >
              <GripVertical size={16} />
            </div>
          )}
          <h2 className={`${getTitleClass()} text-[var(--color-text-strong)] truncate min-w-0`} title={section.title}>
            {section.title}
          </h2>
        </div>

        {isEditMode && (
          <div className="flex items-center gap-0.5 flex-shrink-0 transition-opacity">
            <button
              onClick={() => onAddItem(section.id)}
              className="p-1 text-green-400 hover:bg-green-400/10 rounded-md transition-colors"
              title="Ajouter un lien"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => onEditSection(section)}
              className="p-1 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
              title="Modifier la section"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDeleteSection(section.id)}
              className="p-1 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
              title="Supprimer la section"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndItems}
      >
        <SortableContext items={section.items.map(i => i.id)} strategy={rectSortingStrategy}>
          <div className={`grid ${getInnerGridClass()} gap-2.5 w-full min-w-0`}>
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
              <div className="col-span-full py-6 text-center text-sm text-[var(--color-text-muted)] border-2 border-dashed border-[var(--color-border)] rounded-xl">
                Aucun lien dans cette section.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
