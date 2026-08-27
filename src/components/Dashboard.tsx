import React, { useState, useMemo } from 'react';
import type { Section, LinkItem } from '../types';
import { SectionCard } from './SectionCard';
import { RssWidgetCard } from './RssWidgetCard';
import { WeatherWidgetCard } from './WeatherWidgetCard';
import { TrafficWidgetCard } from './TrafficWidgetCard';
import { SearchWidgetCard } from './SearchWidgetCard';
import { Plus, Rss, CloudSun, Car, Search } from 'lucide-react';
import { useLayout } from '../hooks/useLayout';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

interface DashboardProps {
  sections: Section[];
  searchQuery: string;
  activePageId?: string | null;
  isEditMode: boolean;
  onAddSection: () => void;
  onAddRssWidget: () => void;
  onAddWeatherWidget: () => void;
  onAddTrafficWidget: () => void;
  onAddSearchWidget: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onAddItem: (sectionId: string) => void;
  onEditItem: (sectionId: string, item: LinkItem) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
  onReorderSections: (sections: Section[]) => void;
  onReorderItems: (sectionId: string, items: LinkItem[]) => void;
  onUpdateSectionSpan?: (sectionId: string, col_span: number) => void;
}

function getColSpanClass(colSpan: number, maxCols: number): string {
  const span = Math.min(Math.max(1, colSpan), maxCols);
  switch (span) {
    case 1:
      return 'col-span-1';
    case 2:
      return 'col-span-1 sm:col-span-2';
    case 3:
      return 'col-span-1 sm:col-span-2 lg:col-span-3';
    case 4:
      return 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4';
    case 5:
      return 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5';
    case 6:
      return 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6';
    case 7:
      return 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-7';
    case 8:
      return 'col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-6 xl:col-span-8';
    default:
      return 'col-span-1';
  }
}

export const Dashboard: React.FC<DashboardProps> = ({
  sections,
  searchQuery,
  activePageId,
  isEditMode,
  onAddSection,
  onAddRssWidget,
  onAddWeatherWidget,
  onAddTrafficWidget,
  onAddSearchWidget,
  onEditSection,
  onDeleteSection,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderSections,
  onReorderItems,
  onUpdateSectionSpan,
}) => {
  const { columnCount } = useLayout(activePageId);
  const [, setActiveId] = useState<string | null>(null);

  const getColumnsClass = () => {
    switch (columnCount) {
      case 1: return 'grid-cols-1 gap-4 lg:gap-6';
      case 2: return 'grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6';
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6';
      case 4: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 lg:gap-5';
      case 5: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4';
      case 6: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-3.5';
      case 7: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 lg:gap-3';
      case 8: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 lg:gap-3';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6';
    }
  };

  const filteredSections = useMemo(() => {
    const sorted = [...sections].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return sorted.map(section => {
      if (section.type === 'rss' || section.type === 'weather' || section.type === 'traffic' || section.type === 'search') {
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
    }).filter((section): section is Section => section !== null && (section.type === 'rss' || section.type === 'weather' || section.type === 'traffic' || section.type === 'search' || section.items.length > 0 || isEditMode));
  }, [sections, searchQuery, isEditMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = filteredSections.findIndex(s => s.id === active.id);
    const newIndex = filteredSections.findIndex(s => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(filteredSections, oldIndex, newIndex);
      const withPositions = reordered.map((sec, idx) => ({
        ...sec,
        position: idx,
      }));
      onReorderSections(withPositions);
    }
  };

  const renderSection = (section: Section) => {
    const cardProps = {
      section,
      isEditMode,
      onEditSection,
      onDeleteSection,
      onUpdateSpan: onUpdateSectionSpan,
      maxAllowedSpan: columnCount,
    };

    if (section.type === 'rss') {
      return <RssWidgetCard key={section.id} {...cardProps} />;
    }
    if (section.type === 'weather') {
      return <WeatherWidgetCard key={section.id} {...cardProps} />;
    }
    if (section.type === 'traffic') {
      return <TrafficWidgetCard key={section.id} {...cardProps} />;
    }
    if (section.type === 'search') {
      return <SearchWidgetCard key={section.id} {...cardProps} />;
    }
    return (
      <SectionCard
        key={section.id}
        {...cardProps}
        onAddItem={onAddItem}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        onReorderItems={onReorderItems}
      />
    );
  };

  return (
    <div className="w-full max-w-[1920px] 2xl:max-w-[98%] mx-auto px-4 sm:px-6 pb-12">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredSections.map(s => s.id)}
          strategy={rectSortingStrategy}
        >
          <div className={`grid ${getColumnsClass()} items-start`}>
            {filteredSections.map((section) => {
              const span = Math.min(section.col_span || 1, columnCount);
              return (
                <div
                  key={section.id}
                  className={`w-full min-w-0 transition-all duration-150 ${getColSpanClass(span, columnCount)}`}
                  style={{
                    gridColumn: `span ${span} / span ${span}`,
                  }}
                >
                  {renderSection(section)}
                </div>
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
          <button
            onClick={onAddTrafficWidget}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all font-medium"
          >
            <Car size={20} />
            <span>Ajouter un trajet</span>
          </button>
          <button
            onClick={onAddSearchWidget}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-indigo-500/40 text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all font-medium"
          >
            <Search size={20} />
            <span>Ajouter une recherche</span>
          </button>
        </div>
      )}
    </div>
  );
};
