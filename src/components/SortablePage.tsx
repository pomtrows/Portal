import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';

interface SortablePageProps {
  page: any;
  isActive: boolean;
  isEditing: boolean;
  tempTitle: string;
  onSelect: () => void;
  onDoubleClick: () => void;
  onChangeTempTitle: (val: string) => void;
  onSaveTitle: () => void;
  onDelete: () => void;
  isEditMode: boolean;
}

export const SortablePage: React.FC<SortablePageProps> = ({
  page, isActive, isEditing, tempTitle, onSelect, onDoubleClick, onChangeTempTitle, onSaveTitle, onDelete, isEditMode
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    disabled: !isEditMode || isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group flex items-center cursor-pointer"
    >
      <div {...attributes} {...listeners} className="flex h-full items-center">
        {isEditing ? (
          <input
            autoFocus
            value={tempTitle}
            onChange={e => onChangeTempTitle(e.target.value)}
            onBlur={onSaveTitle}
            onKeyDown={e => e.key === 'Enter' && onSaveTitle()}
            className="px-4 py-1.5 rounded-t-lg bg-[var(--color-surface)] border-2 border-b-0 border-[var(--color-primary)] text-[var(--color-text-strong)] text-sm focus:outline-none"
          />
        ) : (
          <button
            onClick={(e) => {
              // We must stop propagation to not trigger the drag
              e.stopPropagation();
              onSelect();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onDoubleClick();
            }}
            className={`px-4 py-1.5 rounded-t-lg text-sm font-bold border-2 border-b-0 mb-[1px] transition-all flex items-center gap-2 ${
              isActive
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-sm pb-[7px]'
                : 'bg-black/5 dark:bg-white/5 border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
            }`}
          >
            {page.title}
          </button>
        )}
      </div>

      {isEditMode && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full transition-opacity z-10"
          title="Supprimer la page"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};
