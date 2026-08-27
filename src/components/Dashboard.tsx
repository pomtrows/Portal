import React, { useState, useEffect } from 'react';
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
  columnCount: number;
  sections: Section[];
  isEditMode: boolean;
  renderSection: (section: Section, colIdx: number, columnCount: number) => React.ReactNode;
}

const ColumnDropContainer: React.FC<ColumnDropContainerProps> = ({
  id,
  colIdx,
  columnCount,
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
        {sections.map(s => renderSection(s, colIdx, columnCount))}
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

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const sourceColIdx = findColumnIndex(activeIdStr, columns);
    const targetColIdx = findColumnIndex(overIdStr, columns);

    if (sourceColIdx === -1 || targetColIdx === -1 || sourceColIdx === targetColIdx) {
      return;
    }

    setColumns(prevCols => {
      const newCols = prevCols.map(col => [...col]);
      const sourceCol = newCols[sourceColIdx];
      const targetCol = newCols[targetColIdx];

      const activeItemIndex = sourceCol.findIndex(item => item.id === activeIdStr);
      if (activeItemIndex === -1) return prevCols;

      const [movedItem] = sourceCol.splice(activeItemIndex, 1);

      if (overIdStr.startsWith('col-')) {
        targetCol.push(movedItem);
      } else {
        const overItemIndex = targetCol.findIndex(item => item.id === overIdStr);
        if (overItemIndex !== -1) {
          targetCol.splice(overItemIndex, 0, movedItem);
        } else {
          targetCol.push(movedItem);
        }
      }

      return newCols;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const sourceColIdx = findColumnIndex(activeIdStr, columns);
    const targetColIdx = findColumnIndex(overIdStr, columns);

    if (sourceColIdx === -1 || targetColIdx === -1) return;

    let finalColumns = columns.map(col => [...col]);

    if (sourceColIdx === targetColIdx) {
      const col = finalColumns[sourceColIdx];
      const oldIndex = col.findIndex(item => item.id === activeIdStr);
      const newIndex = col.findIndex(item => item.id === overIdStr);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        finalColumns[sourceColIdx] = arrayMove(col, oldIndex, newIndex);
        setColumns(finalColumns);
      }
    }

    // Recalculate positions: position = colIdx * 1000 + rowIdx
    const flattened: Section[] = [];
    finalColumns.forEach((col, cIdx) => {
      col.forEach((sec, rIdx) => {
        flattened.push({
          ...sec,
          position: cIdx * 1000 + rIdx,
          column_index: cIdx
        });
      });
    });

    onReorderSections(flattened);
  };

  const renderSection = (section: Section, colIdx: number, columnCount: number) => {
    const maxAllowedSpan = Math.max(1, columnCount - colIdx);
    const effectiveSpan = Math.min(Math.max(1, section.col_span || 1), maxAllowedSpan);
    const isMultiSpan = effectiveSpan > 1;

    const spanWrapperStyle: React.CSSProperties = isMultiSpan
      ? {
          width: `calc(${effectiveSpan * 100}% + ${(effectiveSpan - 1)} * var(--dashboard-gap, 1rem))`,
          maxWidth: 'none',
          zIndex: 10,
          position: 'relative',
        }
      : {
          width: '100%',
        };

    const cardProps = {
      section,
      isEditMode,
      onEditSection,
      onDeleteSection,
      onUpdateSpan: onUpdateSectionSpan,
      maxAllowedSpan,
    };

    let cardContent: React.ReactNode = null;

    if (section.type === 'rss') {
      cardContent = <RssWidgetCard key={section.id} {...cardProps} />;
    } else if (section.type === 'weather') {
      cardContent = <WeatherWidgetCard key={section.id} {...cardProps} />;
    } else if (section.type === 'traffic') {
      cardContent = <TrafficWidgetCard key={section.id} {...cardProps} />;
    } else if (section.type === 'search') {
      cardContent = <SearchWidgetCard key={section.id} {...cardProps} />;
    } else {
      cardContent = (
        <SectionCard
          key={section.id}
          {...cardProps}
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onReorderItems={onReorderItems}
        />
      );
    }

    return (
      <div key={section.id} style={spanWrapperStyle} className="min-w-0 transition-all duration-150">
        {cardContent}
      </div>
    );
  };

  return (
    <div
      className="w-full max-w-[1920px] 2xl:max-w-[98%] mx-auto px-4 sm:px-6 pb-12"
      style={{ '--dashboard-gap': '1rem' } as React.CSSProperties}
    >
      {/* Column-based containers with vertical stacking & DnD between/within columns */}
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
              columnCount={columnCount}
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
