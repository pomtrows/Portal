import React, { useState, useEffect, useRef } from 'react';
import type { Section } from '../types';
import { Globe, Edit2, Trash2, GripVertical, RotateCw } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { usePreferences } from '../hooks/usePreferences';

interface WebWidgetCardProps {
  section: Section;
  isEditMode: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onUpdateSpan?: (sectionId: string, col_span: number) => void;
  onUpdateHeight?: (sectionId: string, row_span: number) => void;
  maxAllowedSpan?: number;
}

export const WebWidgetCard: React.FC<WebWidgetCardProps> = ({
  section,
  isEditMode,
  onEditSection,
  onDeleteSection,
  onUpdateSpan,
  onUpdateHeight,
  maxAllowedSpan = 8,
}) => {
  const { fontSizeSection, sectionPadding } = usePreferences();
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

  const getPaddingClass = () => {
    switch (sectionPadding) {
      case 'xs': return 'p-1.5 sm:p-2';
      case 'sm': return 'p-2 sm:p-2.5';
      case 'lg': return 'p-3.5 sm:p-4';
      case 'xl': return 'p-4 sm:p-5';
      default: return 'p-2.5 sm:p-3';
    }
  };

  const getSectionTitleClass = () => {
    switch (fontSizeSection) {
      case 'compact': return 'text-xs sm:text-sm font-bold';
      case 'large': return 'text-base sm:text-lg font-bold';
      default: return 'text-sm sm:text-base font-bold';
    }
  };

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const refreshIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  useEffect(() => {
    const intervalSeconds = section.refresh_interval || 60;
    if (intervalSeconds > 0) {
      const interval = setInterval(refreshIframe, intervalSeconds * 1000);
      return () => clearInterval(interval);
    }
  }, [section.refresh_interval]);

  return (
    <div ref={setNodeRef} style={style} className={`glass-panel ${getPaddingClass()} w-full h-auto md:h-full flex flex-col min-w-0 ${isDragging ? 'z-50 shadow-2xl ring-2 ring-[var(--color-primary)]' : ''}`}>
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--color-border)] gap-1.5 min-w-0">
        <div
          className={`flex items-center gap-1.5 min-w-0 flex-1 ${isEditMode ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
          {...(isEditMode ? { ...attributes, ...listeners } : {})}
        >
          {isEditMode && (
            <div
              className="hover:bg-black/10 p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors -ml-1 flex-shrink-0"
              title="Cliquer et glisser pour déplacer le widget"
            >
              <GripVertical size={16} />
            </div>
          )}
          {!isEditMode && (
            <div className="p-1 rounded-lg bg-pink-500/10 text-pink-400 flex-shrink-0">
              <Globe size={16} />
            </div>
          )}
          <h2 className={`${getSectionTitleClass()} text-[var(--color-text-strong)] truncate min-w-0`} title={section.title}>
            {section.title}
          </h2>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={refreshIframe}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-black/10 rounded-md transition-all"
            title="Rafraîchir"
          >
            <RotateCw size={14} />
          </button>

          {isEditMode && (
            <>
              {onUpdateSpan && (
                <div
                  className="flex items-center bg-black/10 dark:bg-white/10 rounded-md px-1 py-0.5 text-xs font-bold gap-1 text-[var(--color-text-strong)] mr-0.5"
                  title="Largeur du widget (nombre de colonnes)"
                >
                  <button
                    type="button"
                    onClick={() => onUpdateSpan(section.id, Math.max(1, (section.col_span || 1) - 1))}
                    disabled={(section.col_span || 1) <= 1}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-[11px] select-none font-semibold px-0.5">
                    {section.col_span || 1} col{(section.col_span || 1) > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateSpan(section.id, Math.min(maxAllowedSpan, (section.col_span || 1) + 1))}
                    disabled={(section.col_span || 1) >= maxAllowedSpan}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
              {onUpdateHeight && (
                <div
                  className="flex items-center bg-black/10 dark:bg-white/10 rounded-md px-1 py-0.5 text-xs font-bold gap-1 text-[var(--color-text-strong)] mr-0.5"
                  title="Hauteur du widget (nombre de lignes de grille)"
                >
                  <button
                    type="button"
                    onClick={() => onUpdateHeight(section.id, Math.max(3, (section.row_span || 8) - 1))}
                    disabled={(section.row_span || 8) <= 3}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-[11px] select-none font-semibold px-0.5">
                    H: {section.row_span || 8}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateHeight(section.id, Math.min(25, (section.row_span || 8) + 1))}
                    disabled={(section.row_span || 8) >= 25}
                    className="px-1 hover:text-[var(--color-primary)] disabled:opacity-25 transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
              <button
                onClick={() => onEditSection(section)}
                className="p-1 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                title="Modifier le widget"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onDeleteSection(section.id)}
                className="p-1 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                title="Supprimer le widget"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 w-full relative rounded-lg overflow-hidden border border-[var(--color-border)]/50 bg-white dark:bg-black/20 min-h-[200px]">
        {section.widget_url ? (
          <div className="w-full h-full relative overflow-hidden">
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={section.widget_url}
              className="absolute top-0 left-0 border-0"
              style={{
                width: `${100 / (section.zoom ? section.zoom / 100 : 1)}%`,
                height: `${100 / (section.zoom ? section.zoom / 100 : 1)}%`,
                transform: `scale(${section.zoom ? section.zoom / 100 : 1})`,
                transformOrigin: 'top left'
              }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={section.title}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-muted)] text-sm p-4 text-center">
            Aucune URL configurée pour ce widget
          </div>
        )}
      </div>
    </div>
  );
};
