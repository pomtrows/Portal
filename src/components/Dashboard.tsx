import React from 'react';
import type { Section, LinkItem } from '../types';
import { SectionCard } from './SectionCard';
import { RssWidgetCard } from './RssWidgetCard';
import { WeatherWidgetCard } from './WeatherWidgetCard';
import { Plus, Rss, CloudSun } from 'lucide-react';
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
  onAddRssWidget: () => void;
  onAddWeatherWidget: () => void;
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
  onAddRssWidget,
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
      case 1: return 'grid grid-cols-1 gap-4 lg:gap-6 items-start';
      case 2: return 'grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 items-start';
      case 3: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 items-start';
      case 4: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 lg:gap-5 items-start';
      case 5: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 items-start';
      case 6: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-3.5 items-start';
      case 7: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 lg:gap-3 items-start';
      case 8: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 lg:gap-3 items-start';
      default: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 items-start';
    }
  };

  const filteredSections = sections.map(section => {
    if (section.type === 'rss' || section.type === 'weather') {
      const matches = section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (section.widget_url && section.widget_url.toLowerCase().includes(searchQuery.toLowerCase()));
      return matches || isEditMode ? section : null;
    }
    return {
      ...section,
      items: section.items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    };
  }).filter((section): section is Section => section !== null && (section.type === 'rss' || section.type === 'weather' || section.items.length > 0 || isEditMode));

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
    <div className="w-full max-w-[1920px] 2xl:max-w-[98%] mx-auto px-4 sm:px-6 pb-12">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredSections.map(s => s.id)} strategy={rectSortingStrategy}>
          <div className={getColumnsClass()}>
            {filteredSections.map(section => {
              if (section.type === 'rss') {
                return (
                  <RssWidgetCard
                    key={section.id}
                    section={section}
                    isEditMode={isEditMode}
                    onEditSection={onEditSection}
                    onDeleteSection={onDeleteSection}
                  />
                );
              }
              if (section.type === 'weather') {
                return (
                  <WeatherWidgetCard
                    key={section.id}
                    section={section}
                    isEditMode={isEditMode}
                    onEditSection={onEditSection}
                    onDeleteSection={onDeleteSection}
                  />
                );
              }
              return (
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
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {filteredSections.length === 0 && !isEditMode && (
        <div className="text-center py-20 text-[var(--color-text-muted)] text-lg">
          Aucun résultat trouvé pour "{searchQuery}"
        </div>
      )}

      {isEditMode && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            onClick={onAddSection}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all font-medium"
          >
            <Plus size={20} />
            <span>Ajouter une section</span>
          </button>
          <button
            onClick={onAddRssWidget}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-orange-500/40 text-orange-400 hover:text-orange-300 hover:border-orange-500 hover:bg-orange-500/10 transition-all font-medium"
          >
            <Rss size={20} />
            <span>Ajouter un flux RSS</span>
          </button>
          <button
            onClick={onAddWeatherWidget}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-sky-500/40 text-sky-400 hover:text-sky-300 hover:border-sky-500 hover:bg-sky-500/10 transition-all font-medium"
          >
            <CloudSun size={20} />
            <span>Ajouter la météo</span>
          </button>
        </div>
      )}
    </div>
  );
};
