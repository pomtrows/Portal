
import type { LinkItem } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { Edit2, Trash2 } from 'lucide-react';

interface ItemCardProps {
  item: LinkItem;
  isEditMode: boolean;
  onEdit: (item: LinkItem) => void;
  onDelete: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isEditMode, onEdit, onDelete }) => {
  return (
    <div className="group relative">
      <a
        href={isEditMode ? undefined : item.url}
        target={isEditMode ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={`block h-full p-4 glass-panel interactive-element bg-black/10 hover:bg-[var(--color-surface-hover)] border-[var(--color-border)]/50 ${
          isEditMode ? 'cursor-default' : 'cursor-pointer'
        }`}
        onClick={(e) => {
          if (isEditMode) e.preventDefault();
        }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-primary)]">
            <DynamicIcon name={item.icon} className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[var(--color-text-strong)] font-semibold text-base truncate">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-[var(--color-text-muted)] text-sm mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </a>

      {isEditMode && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)] shadow-md">
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
