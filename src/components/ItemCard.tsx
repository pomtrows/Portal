import React, { Suspense } from 'react';
import type { LinkItem } from '../types';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const LazyDynamicIcon = React.lazy(() => import('./DynamicIcon').then(m => ({ default: m.DynamicIcon })));

interface ItemCardProps {
  item: LinkItem;
  isEditMode: boolean;
  onEdit: (item: LinkItem) => void;
  onDelete: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isEditMode, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={"group relative " + (isDragging ? 'z-50' : '')}>
      <a
        href={isEditMode ? undefined : item.url}
        target={isEditMode ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={"block h-full p-2.5 sm:p-3 glass-panel interactive-element bg-black/10 hover:bg-[var(--color-surface-hover)] border-[var(--color-border)]/50 " + (isEditMode ? 'cursor-default ' : 'cursor-pointer ')}
        onClick={(e) => {
          if (isEditMode) e.preventDefault();
        }}
      >
        <div className="flex items-center gap-3">
          {isEditMode && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-black/10 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors -ml-1.5 self-center"
              title="Déplacer le lien"
            >
              <GripVertical size={16} />
            </div>
          )}
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-primary)] overflow-hidden">
            <Suspense fallback={<div className="w-5 h-5 animate-pulse bg-white/20 rounded-full" />}>
              <LazyDynamicIcon name={item.icon} className="w-7 h-7 rounded-md" />
            </Suspense>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[var(--color-text-strong)] font-semibold text-sm sm:text-[15px] truncate">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-[var(--color-text-muted)] text-xs mt-0.5 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </a>

      {isEditMode && (
        <div className="absolute top-2 right-2 flex items-center gap-1 transition-opacity bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)] shadow-md">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
            title="Modifier le lien"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
            title="Supprimer le lien"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
