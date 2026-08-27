import React, { useState, useMemo } from 'react';
import type { Section, LinkItem } from '../types';
import { SectionCard } from './SectionCard';
import { RssWidgetCard } from './RssWidgetCard';
import { WeatherWidgetCard } from './WeatherWidgetCard';
import { TrafficWidgetCard } from './TrafficWidgetCard';
import { SearchWidgetCard } from './SearchWidgetCard';
import { Plus, Rss, CloudSun, Car, Search } from 'lucide-react';
import { useLayout } from '../hooks/useLayout';
import { usePreferences, type GridItemGeometry } from '../hooks/usePreferences';
import {
  DndContext,
  pointerWithin,
  rectIntersection,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

const pointerFirstCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }
  return closestCorners(args);
};

const DroppableGridCell: React.FC<{
  id: string;
  cellX: number;
  cellY: number;
}> = ({ id, cellX, cellY }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { cellX, cellY },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumnStart: cellX + 1,
        gridColumnEnd: 'span 1',
        gridRowStart: cellY + 1,
        gridRowEnd: 'span 1',
      }}
      className={`border border-dashed rounded-xl min-h-[40px] flex items-center justify-center text-[8px] text-[var(--color-text-muted)] transition-all duration-150 ${
        isOver
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/20 scale-[0.98] ring-2 ring-[var(--color-primary)]/40 opacity-90'
          : 'border-[var(--color-border)]/25 opacity-20'
      }`}
    >
      {cellX + 1},{cellY + 1}
    </div>
  );
};

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
  onUpdateSectionGeometry?: (sectionId: string, geo: { grid_x?: number; grid_y?: number; col_span?: number; row_span?: number }) => void;
  onUpdateAllGeometries?: (updates: Record<string, { grid_x: number; grid_y: number; col_span: number; row_span: number }>) => void;
}

function getSectionRowSpan(section: Section, colSpan: number = 1): number {
  if (section.type === 'weather') return Math.max(7, section.row_span || 7); // ~310px
  if (section.type === 'traffic') return Math.max(4, section.row_span || 4); // ~180px
  if (section.type === 'search') return Math.max(6, section.row_span || 6); // ~265px
  if (section.type === 'rss') return Math.max(8, section.row_span || 8); // ~360px

  // For links sections, compute strictly according to items count and column width
  const count = section.items?.length || 0;
  if (count === 0) return 2;
  const innerCols = Math.max(1, colSpan);
  const itemRows = Math.ceil(count / innerCols);
  // Header (~32px) + padding (~24px) + itemRows * (item button ~52px + gap 10px = 62px)
  const totalPx = 60 + itemRows * 62;
  return Math.max(2, Math.ceil(totalPx / 50.4));
}

/**
 * Packs 2D grid items into free matrix coordinates without collisions.
 */
function computeAutoLayout(
  sections: Section[],
  columnCount: number,
  savedLayouts: Record<string, GridItemGeometry>
): Record<string, GridItemGeometry> {
  const result: Record<string, GridItemGeometry> = {};
  const gridMap: boolean[][] = [];

  const isOccupied = (x: number, y: number, w: number, h: number) => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (x + dx >= columnCount) return true;
        if (gridMap[y + dy] && gridMap[y + dy][x + dx]) return true;
      }
    }
    return false;
  };

  const markOccupied = (x: number, y: number, w: number, h: number) => {
    for (let dy = 0; dy < h; dy++) {
      if (!gridMap[y + dy]) gridMap[y + dy] = [];
      for (let dx = 0; dx < w; dx++) {
        gridMap[y + dy][x + dx] = true;
      }
    }
  };

  const unplaced: Section[] = [];

  // 1. Place items with explicit coordinates first
  sections.forEach((s) => {
    const isLinks = !s.type || s.type === 'links';
    const saved = savedLayouts[s.id];
    let gx = saved?.grid_x ?? s.grid_x;
    let gy = saved?.grid_y ?? s.grid_y;
    let w = Math.min(saved?.col_span ?? s.col_span ?? 1, columnCount);
    const minH = getSectionRowSpan(s, w);
    let h = isLinks ? minH : Math.max(minH, saved?.row_span ?? s.row_span ?? minH);

    if (gx === undefined && s.position !== undefined && s.position >= 1000) {
      gy = Math.floor(s.position / 1000);
      gx = s.position % 1000;
    }

    if (gx !== undefined && gy !== undefined && gx < columnCount) {
      w = Math.min(w, columnCount - gx);
      result[s.id] = { grid_x: gx, grid_y: gy, col_span: w, row_span: h };
      markOccupied(gx, gy, w, h);
    } else {
      unplaced.push(s);
    }
  });

  // 2. Auto-place remaining items
  unplaced.forEach((s) => {
    const isLinks = !s.type || s.type === 'links';
    const w = Math.min(s.col_span || 1, columnCount);
    const minH = getSectionRowSpan(s, w);
    const h = isLinks ? minH : Math.max(minH, s.row_span || minH);
    let placed = false;
    let y = 0;

    while (!placed) {
      for (let x = 0; x <= columnCount - w; x++) {
        if (!isOccupied(x, y, w, h)) {
          result[s.id] = { grid_x: x, grid_y: y, col_span: w, row_span: h };
          markOccupied(x, y, w, h);
          placed = true;
          break;
        }
      }
      if (!placed) y++;
    }
  });

  return result;
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
  onReorderSections: _onReorderSections,
  onReorderItems,
  onUpdateSectionGeometry,
  onUpdateAllGeometries: _onUpdateAllGeometries,
}) => {
  const { columnCount } = useLayout(activePageId);
  const { gridLayouts } = usePreferences();
  const [, setActiveId] = useState<string | null>(null);

  const filteredSections = useMemo(() => {
    const sorted = [...sections].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return sorted
      .map((section) => {
        if (
          section.type === 'rss' ||
          section.type === 'weather' ||
          section.type === 'traffic' ||
          section.type === 'search'
        ) {
          const matches =
            section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (section.widget_url &&
              section.widget_url.toLowerCase().includes(searchQuery.toLowerCase()));
          return matches || isEditMode ? section : null;
        }
        return {
          ...section,
          items: section.items.filter(
            (item) =>
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.description &&
                item.description.toLowerCase().includes(searchQuery.toLowerCase()))
          ),
        };
      })
      .filter(
        (section): section is Section =>
          section !== null &&
          (section.type === 'rss' ||
            section.type === 'weather' ||
            section.type === 'traffic' ||
            section.type === 'search' ||
            section.items.length > 0 ||
            isEditMode)
      );
  }, [sections, searchQuery, isEditMode]);

  // Compute 2D grid matrix layout
  const layoutMap = useMemo(() => {
    return computeAutoLayout(filteredSections, columnCount, gridLayouts);
  }, [filteredSections, columnCount, gridLayouts]);

  // Determine total rows on the grid
  const maxRow = useMemo(() => {
    let max = 0;
    Object.values(layoutMap).forEach((geo) => {
      const bottom = (geo.grid_y ?? 0) + (geo.row_span ?? 1);
      if (bottom > max) max = bottom;
    });
    return Math.max(isEditMode ? max + 2 : max, 2);
  }, [layoutMap, isEditMode]);

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

/**
 * Resolves 2D collision so that a moved section never overlaps with existing sections.
 * If (targetX, targetY) overlaps with any existing section, it pushes targetY down to the bottom of the colliding section.
 */
function findNonCollidingY(
  movingSectionId: string,
  targetX: number,
  targetY: number,
  w: number,
  h: number,
  currentLayouts: Record<string, GridItemGeometry>
): number {
  let adjustedY = Math.max(0, targetY);
  let hasCollision = true;
  let iterations = 0;

  while (hasCollision && iterations < 50) {
    hasCollision = false;
    iterations++;

    for (const [id, geo] of Object.entries(currentLayouts)) {
      if (id === movingSectionId) continue;
      const otherX = geo.grid_x ?? 0;
      const otherY = geo.grid_y ?? 0;
      const otherW = geo.col_span ?? 1;
      const otherH = geo.row_span ?? 1;

      // Check horizontal overlap
      const horizontalOverlap = targetX < otherX + otherW && targetX + w > otherX;
      if (!horizontalOverlap) continue;

      // Check vertical overlap
      const verticalOverlap = adjustedY < otherY + otherH && adjustedY + h > otherY;
      if (verticalOverlap) {
        // Push adjustedY below the colliding item
        adjustedY = otherY + otherH;
        hasCollision = true;
        break; // re-check with all items from the new adjustedY
      }
    }
  }

  return adjustedY;
}

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    const sourceId = String(active.id);
    const sourceGeo = layoutMap[sourceId];
    if (!sourceGeo || !onUpdateSectionGeometry) return;

    const w = sourceGeo.col_span ?? 1;
    const h = sourceGeo.row_span ?? 1;

    let targetX = sourceGeo.grid_x ?? 0;
    let targetY = sourceGeo.grid_y ?? 0;

    if (over) {
      const overId = String(over.id);
      if (overId.startsWith('cell-')) {
        const parts = overId.split('-');
        const cx = parseInt(parts[1], 10);
        const cy = parseInt(parts[2], 10);
        if (!isNaN(cx) && !isNaN(cy)) {
          targetX = Math.min(Math.max(0, cx), columnCount - w);
          targetY = Math.max(0, cy);
        }
      } else if (overId !== sourceId && layoutMap[overId]) {
        const targetGeo = layoutMap[overId];
        targetX = targetGeo.grid_x ?? 0;
        targetY = (targetGeo.grid_y ?? 0) + (targetGeo.row_span ?? 1);
      }
    } else if (event.delta && (Math.abs(event.delta.x) > 15 || Math.abs(event.delta.y) > 15)) {
      const containerEl = document.getElementById('dashboard-grid-container');
      const containerWidth = containerEl?.clientWidth || window.innerWidth;
      const colWidth = containerWidth / columnCount;
      const rowHeight = 50.4;
      const dxCols = Math.round(event.delta.x / colWidth);
      const dyRows = Math.round(event.delta.y / rowHeight);
      targetX = Math.min(Math.max(0, (sourceGeo.grid_x ?? 0) + dxCols), columnCount - w);
      targetY = Math.max(0, (sourceGeo.grid_y ?? 0) + dyRows);
    }

    const nonCollidingY = findNonCollidingY(sourceId, targetX, targetY, w, h, layoutMap);
    onUpdateSectionGeometry(sourceId, { grid_x: targetX, grid_y: nonCollidingY });
  };

  const handleResize = (sectionId: string, dw: number, dh: number) => {
    if (!onUpdateSectionGeometry) return;
    const geo = layoutMap[sectionId] || { grid_x: 0, grid_y: 0, col_span: 1, row_span: 1 };
    const curX = geo.grid_x ?? 0;
    const maxW = Math.max(1, columnCount - curX);
    const newW = Math.min(Math.max(1, (geo.col_span ?? 1) + dw), maxW);
    const newH = Math.min(Math.max(1, (geo.row_span ?? 1) + dh), 25);
    const nonCollidingY = findNonCollidingY(sectionId, curX, geo.grid_y ?? 0, newW, newH, layoutMap);
    onUpdateSectionGeometry(sectionId, { grid_x: curX, grid_y: nonCollidingY, col_span: newW, row_span: newH });
  };

  const renderSection = (section: Section, geo: GridItemGeometry) => {
    const cardProps = {
      section: {
        ...section,
        col_span: geo.col_span,
        row_span: geo.row_span,
        grid_x: geo.grid_x,
        grid_y: geo.grid_y,
      },
      isEditMode,
      onEditSection,
      onDeleteSection,
      onUpdateSpan: (id: string, col_span: number) => {
        if (onUpdateSectionGeometry) {
          onUpdateSectionGeometry(id, { col_span });
        }
      },
      maxAllowedSpan: columnCount - (geo.grid_x ?? 0),
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
      <div className="relative group w-full h-full flex flex-col min-h-0">
        {/* Card Component */}
        <div className="flex-1 w-full h-full min-h-0">{cardContent}</div>

        {/* 2D Grid Positioning & Resizing overlay in Edit Mode */}
        {isEditMode && (
          <div className="flex items-center justify-between gap-1 py-1 px-2.5 text-[10px] bg-black/10 dark:bg-white/10 rounded-b-xl border border-t-0 border-[var(--color-border)]/40 backdrop-blur-sm">
            {/* Position indicator */}
            <div className="flex items-center gap-1 text-[9px] text-[var(--color-text-muted)] font-mono">
              <span>Case: ({ (geo.grid_x ?? 0) + 1 }, { (geo.grid_y ?? 0) + 1 })</span>
            </div>

            {/* Geometry stats & W / H size controls */}
            <div className="flex items-center gap-1.5 font-mono">
              {(!section.type || section.type === 'links') ? (
                <span className="text-[9px] bg-black/15 dark:bg-white/15 rounded px-1.5 py-0.5 font-sans opacity-75" title="Hauteur ajustée automatiquement au nombre de liens">
                  H: auto ({geo.row_span ?? 1})
                </span>
              ) : (
                <div className="flex items-center gap-0.5 bg-black/15 dark:bg-white/15 rounded px-1.5 py-0.5" title="Hauteur du widget">
                  <span className="text-[9px] font-bold mr-0.5">H:</span>
                  <button
                    type="button"
                    onClick={() => handleResize(section.id, 0, -1)}
                    disabled={(geo.row_span ?? 1) <= 1}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-20 font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-[9px]">{geo.row_span ?? 1}</span>
                  <button
                    type="button"
                    onClick={() => handleResize(section.id, 0, 1)}
                    disabled={(geo.row_span ?? 1) >= 20}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-20 font-bold"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1920px] 2xl:max-w-[98%] mx-auto px-4 sm:px-6 pb-12">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerFirstCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredSections.map((s) => s.id)}
          strategy={rectSortingStrategy}
        >
          <div
            id="dashboard-grid-container"
            className="w-full relative transition-all duration-200"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              gridAutoRows: '40px',
              gap: '0.65rem',
            }}
          >
            {/* Background Droppable Grid Cells in Edit Mode for easy visual placement */}
            {isEditMode &&
              Array.from({ length: maxRow * columnCount }).map((_, idx) => {
                const cellX = idx % columnCount;
                const cellY = Math.floor(idx / columnCount);
                return (
                  <DroppableGridCell
                    key={`bg-cell-${cellX}-${cellY}`}
                    id={`cell-${cellX}-${cellY}`}
                    cellX={cellX}
                    cellY={cellY}
                  />
                );
              })}

            {/* Placed 2D Grid Sections */}
            {filteredSections.map((section) => {
              const geo = layoutMap[section.id] || {
                grid_x: 0,
                grid_y: 0,
                col_span: 1,
                row_span: 1,
              };
              const clampedColSpan = Math.min(
                geo.col_span || 1,
                columnCount - (geo.grid_x ?? 0)
              );
              const clampedRowSpan = Math.max(
                getSectionRowSpan(section, clampedColSpan),
                geo.row_span || 1
              );

              return (
                <div
                  key={section.id}
                  className="w-full min-h-full h-auto min-w-0 transition-all duration-150 relative z-10"
                  style={{
                    gridColumnStart: (geo.grid_x ?? 0) + 1,
                    gridColumnEnd: `span ${clampedColSpan}`,
                    gridRowStart: (geo.grid_y ?? 0) + 1,
                    gridRowEnd: `span ${clampedRowSpan}`,
                  }}
                >
                  {renderSection(section, geo)}
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
