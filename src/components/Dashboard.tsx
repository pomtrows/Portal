import React, { useState, useEffect } from 'react';
import type { Section, LinkItem } from '../types';
import { SectionCard } from './SectionCard';
import { RssWidgetCard } from './RssWidgetCard';
import { WeatherWidgetCard } from './WeatherWidgetCard';
import { TrafficWidgetCard } from './TrafficWidgetCard';
import { Plus, Rss, CloudSun, Car } from 'lucide-react';
import { useLayout } from '../hooks/useLayout';
import {
  DndContext,
  closestCorners,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

interface DashboardProps {
  sections: Section[];
  searchQuery: string;
  isEditMode: boolean;
  onAddSection: () => void;
  onAddRssWidget: () => void;
  onAddWeatherWidget: () => void;
  onAddTrafficWidget: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onAddItem: (sectionId: string) => void;
  onEditItem: (sectionId: string, item: LinkItem) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
  onReorderSections: (sections: Section[]) => void;
  onReorderItems: (sectionId: string, items: LinkItem[]) => void;
}

function distributeSections(sections: Section[], columnCount: number): Section[][] {
  const cols: Section[][] = Array.from({ length: columnCount }, () => []);
  const sorted = [...sections].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const hasEncodedCol = sorted.some(s => (s.position !== undefined && s.position >= 1000) || s.column_index !== undefined);

  if (hasEncodedCol) {
    sorted.forEach(s => {
      let col = s.column_index !== undefined 
        ? s.column_index 
        : Math.floor((s.position ?? 0) / 1000);
      if (col < 0 || col >= columnCount) {
        col = Math.min(Math.max(0, col % columnCount), columnCount - 1);
      }
      cols[col].push(s);
    });
  } else {
    sorted.forEach((s, idx) => {
      const col = (s.position !== undefined ? s.position : idx) % columnCount;
      cols[col].push(s);
    });
  }

  return cols;
}

interface ColumnDropContainerProps {
  id: string;
  colIdx: number;
  sections: Section[];
  isEditMode: boolean;
  renderSection: (section: Section) => React.ReactNode;
}

const ColumnDropContainer: React.FC<ColumnDropContainerProps> = ({
  id,
  colIdx,
  sections,
  isEditMode,
  renderSection,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: !isEditMode,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-4 min-w-0 w-full transition-all duration-200 rounded-2xl ${
        isOver && isEditMode ? 'bg-[var(--color-primary)]/10 ring-2 ring-dashed ring-[var(--color-primary)] min-h-[140px]' : ''
      }`}
    >
      <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {sections.map(renderSection)}
      </SortableContext>

      {isEditMode && sections.length === 0 && (
        <div className="min-h-[140px] border-2 border-dashed border-[var(--color-border)]/60 hover:border-[var(--color-primary)]/50 rounded-2xl flex flex-col items-center justify-center p-4 text-xs text-[var(--color-text-muted)] text-center transition-colors">
          <span className="font-semibold">Colonne {colIdx + 1} vide</span>
          <span className="text-[11px] opacity-70 mt-1">Déposez une section ici</span>
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  sections,
  searchQuery,
  isEditMode,
  onAddSection,
  onAddRssWidget,
  onAddWeatherWidget,
  onAddTrafficWidget,
  onEditSection,
  onDeleteSection,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderSections,
  onReorderItems,
}) => {
  const { columnCount } = useLayout();
  const [activeId, setActiveId] = useState<string | null>(null);

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
    if (section.type === 'rss' || section.type === 'weather' || section.type === 'traffic') {
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
  }).filter((section): section is Section => section !== null && (section.type === 'rss' || section.type === 'weather' || section.type === 'traffic' || section.items.length > 0 || isEditMode));

  const [columns, setColumns] = useState<Section[][]>(() => distributeSections(filteredSections, columnCount));

  useEffect(() => {
    if (!activeId) {
      setColumns(distributeSections(filteredSections, columnCount));
    }
  }, [filteredSections, columnCount, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCorners(args);
  };

  const findColumnIndex = (id: string, currentCols: Section[][]): number => {
    if (id.startsWith('col-')) {
      const idx = parseInt(id.replace('col-', ''), 10);
      return idx >= 0 && idx < columnCount ? idx : -1;
    }
    return currentCols.findIndex(col => col.some(item => item.id === id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = String(active.id);
    const overItemId = String(over.id);

    const fromCol = findColumnIndex(activeItemId, columns);
    const toCol = findColumnIndex(overItemId, columns);

    if (fromCol === -1 || toCol === -1 || fromCol === toCol) {
      return;
    }

    setColumns(prevCols => {
      const newCols = prevCols.map(col => [...col]);
      const activeItemIndex = newCols[fromCol].findIndex(item => item.id === activeItemId);
      if (activeItemIndex === -1) return prevCols;

      const [movedItem] = newCols[fromCol].splice(activeItemIndex, 1);

      if (overItemId.startsWith('col-')) {
        newCols[toCol].push(movedItem);
      } else {
        const overItemIndex = newCols[toCol].findIndex(item => item.id === overItemId);
        const insertIndex = overItemIndex !== -1 ? overItemIndex : newCols[toCol].length;
        newCols[toCol].splice(insertIndex, 0, movedItem);
      }

      return newCols;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItemId = String(active.id);
    const overItemId = String(over.id);

    const fromCol = findColumnIndex(activeItemId, columns);
    const toCol = findColumnIndex(overItemId, columns);

    let finalCols = columns;

    if (fromCol !== -1 && toCol !== -1) {
      if (fromCol === toCol && activeItemId !== overItemId && !overItemId.startsWith('col-')) {
        const colItems = [...columns[fromCol]];
        const oldIndex = colItems.findIndex(i => i.id === activeItemId);
        const newIndex = colItems.findIndex(i => i.id === overItemId);
        if (oldIndex !== -1 && newIndex !== -1) {
          finalCols = columns.map((col, idx) => 
            idx === fromCol ? arrayMove(colItems, oldIndex, newIndex) : col
          );
          setColumns(finalCols);
        }
      }
    }

    // Flatten finalCols with exact column index and position
    const flattened: Section[] = [];
    finalCols.forEach((col, colIdx) => {
      col.forEach((sec, rowIdx) => {
        flattened.push({
          ...sec,
          position: colIdx * 1000 + rowIdx,
          column_index: colIdx,
        });
      });
    });

    onReorderSections(flattened);
  };

  const renderSection = (section: Section) => {
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
    if (section.type === 'traffic') {
      return (
        <TrafficWidgetCard
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
  };

  return (
    <div className="w-full max-w-[1920px] 2xl:max-w-[98%] mx-auto px-4 sm:px-6 pb-12">
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={getColumnsClass()}>
          {columns.map((colSections, colIdx) => (
            <ColumnDropContainer
              key={colIdx}
              id={`col-${colIdx}`}
              colIdx={colIdx}
              sections={colSections}
              isEditMode={isEditMode}
              renderSection={renderSection}
            />
          ))}
        </div>
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
        </div>
      )}
    </div>
  );
};
