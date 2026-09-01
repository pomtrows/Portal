import React, { Suspense } from 'react';
import type { LinkItem } from '../types';
import { Edit2, Trash2, GripVertical, ArrowRight } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePreferences } from '../hooks/usePreferences';

const LazyDynamicIcon = React.lazy(() => import('./DynamicIcon').then(m => ({ default: m.DynamicIcon })));

interface ItemCardProps {
  item: LinkItem;
  isEditMode: boolean;
  onEdit: (item: LinkItem) => void;
  onDelete: (id: string) => void;
  onTransferItem?: (item: LinkItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isEditMode, onEdit, onDelete, onTransferItem }) => {
  const { fontSizeLinks, linkPadding, iconSize } = usePreferences();
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

  const getTitleClass = () => {
    switch (fontSizeLinks) {
      case 'compact': return 'text-[11px] sm:text-xs';
      case 'large': return 'text-sm sm:text-base';
      default: return 'text-xs sm:text-sm';
    }
  };

  const getDescClass = () => {
    switch (fontSizeLinks) {
      case 'compact': return 'text-[10px]';
      case 'large': return 'text-xs';
      default: return 'text-[11px]';
    }
  };

  const getItemPaddingClass = () => {
    switch (linkPadding) {
      case 'xs': return 'p-1 sm:p-1.5';
      case 'sm': return 'p-1.5 sm:p-2';
      case 'lg': return 'p-2.5 sm:p-3.5';
      case 'xl': return 'p-3.5 sm:p-4.5';
      default: return 'p-2 sm:p-2.5';
    }
  };

  const getIconContainerClass = () => {
    switch (iconSize) {
      case 'xs': return 'w-6 h-6 sm:w-7 sm:h-7 rounded-md';
      case 'sm': return 'w-7 h-7 sm:w-8 sm:h-8 rounded-md';
      case 'lg': return 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl';
      case 'xl': return 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl';
      default: return 'w-8 h-8 sm:w-9 sm:h-9 rounded-lg';
    }
  };

  const getIconInnerClass = () => {
    switch (iconSize) {
      case 'xs': return 'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm';
      case 'sm': return 'w-4 h-4 sm:w-5 sm:h-5 rounded';
      case 'lg': return 'w-6 h-6 sm:w-7 sm:h-7 rounded-md';
      case 'xl': return 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg';
      default: return 'w-5 h-5 sm:w-6 sm:h-6 rounded-md';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={"group relative w-full min-w-0 " + (isDragging ? 'z-50' : '')}>
      <a
        href={isEditMode ? undefined : item.url}
        target={isEditMode ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={`block w-full min-w-0 h-full ${getItemPaddingClass()} glass-panel interactive-element bg-black/10 hover:bg-[var(--color-surface-hover)] border-[var(--color-border)]/50 ${isEditMode ? 'cursor-default pr-12 ' : 'cursor-pointer '}`}
        onClick={(e) => {
          if (isEditMode) e.preventDefault();
        }}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {isEditMode && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-black/10 p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors -ml-1 flex-shrink-0 self-center"
              title="Déplacer le lien"
            >
              <GripVertical size={15} />
            </div>
          )}
          <div className={`${getIconContainerClass()} flex-shrink-0 flex items-center justify-center bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-primary)] overflow-hidden`}>
            <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-white/20 rounded-full" />}>
              <LazyDynamicIcon name={item.icon} className={getIconInnerClass()} />
            </Suspense>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-[var(--color-text-strong)] font-semibold ${getTitleClass()} truncate`}>
              {item.title}
            </h3>
            {item.description && (
              <p className={`text-[var(--color-text-muted)] ${getDescClass()} mt-0.5 line-clamp-1`}>
                {item.description}
              </p>
            )}
          </div>
        </div>
      </a>

      {isEditMode && (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 transition-opacity bg-[var(--color-surface)] p-0.5 rounded-md border border-[var(--color-border)] shadow-md z-10">
          {onTransferItem && (
            <button
              onClick={() => onTransferItem(item)}
              className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
              title="Transférer ou Dupliquer le lien"
            >
              <ArrowRight size={12} />
            </button>
          )}
          <button
            onClick={() => onEdit(item)}
            className="p-1 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
            title="Modifier le lien"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
            title="Supprimer le lien"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
