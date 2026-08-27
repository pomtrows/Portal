import React, { useState, useEffect, useCallback } from 'react';
import type { Section } from '../types';
import { Rss, Edit2, Trash2, GripVertical, RotateCw, ExternalLink, AlertCircle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { usePreferences } from '../hooks/usePreferences';

interface RssItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
}

interface RssWidgetCardProps {
  section: Section;
  isEditMode: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
}

function parseJinaMarkdown(text: string, limit: number = 10): RssItem[] {
  const items: RssItem[] = [];
  const blocks = text.split(/(?=###\s+)/g);
  
  for (const block of blocks) {
    if (!block.trim().startsWith('###')) continue;
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const linkMatch = block.match(/https?:\/\/[^\s)>]+/);
    const link = linkMatch ? linkMatch[0] : '#';

    let title = '';
    const titleMatch = block.match(/###\s+\[([^\]]+)\]/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1];
    } else {
      const textLine = lines.find(l => !l.startsWith('###') && !l.startsWith('http') && !l.startsWith('[http') && !l.match(/GMT$/i));
      if (textLine && textLine.length > 5) {
        title = textLine;
      } else {
        const slug = link.split('/').pop()?.replace(/-\d+$/, '')?.replace(/-/g, ' ');
        if (slug && slug.length > 5) {
          title = slug.charAt(0).toUpperCase() + slug.slice(1);
        }
      }
    }

    const dateMatch = block.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s+[\d:]+\s+GMT/i) || block.match(/\d{4}-\d{2}-\d{2}T[\d:]+/);
    const pubDate = dateMatch ? dateMatch[0] : undefined;

    const descLines = lines.filter(l => !l.startsWith('###') && !l.startsWith('http') && !l.startsWith('[http') && l !== pubDate && l !== title);
    const description = descLines.join(' ');

    if (title || link !== '#') {
      items.push({ title: title || 'Article', link, pubDate, description });
    }
  }

  return items.slice(0, limit);
}

export const RssWidgetCard: React.FC<RssWidgetCardProps> = ({
  section,
  isEditMode,
  onEditSection,
  onDeleteSection,
}) => {
  const { fontSizeRss } = usePreferences();
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

  const getRssTitleClass = () => {
    switch (fontSizeRss) {
      case 'compact': return 'text-xs font-semibold';
      case 'large': return 'text-base font-semibold';
      default: return 'text-sm font-semibold';
    }
  };

  const getRssDescClass = () => {
    switch (fontSizeRss) {
      case 'compact': return 'text-[11px]';
      case 'large': return 'text-sm';
      default: return 'text-xs';
    }
  };

  const getRssDateClass = () => {
    switch (fontSizeRss) {
      case 'compact': return 'text-[10px]';
      case 'large': return 'text-xs';
      default: return 'text-[11px]';
    }
  };

  const [items, setItems] = useState<RssItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = section.display_limit || 10;

  const fetchRssFeed = useCallback(async () => {
    if (!section.widget_url) {
      setError('Aucune URL de flux configurée.');
      return;
    }

    setLoading(true);
    setError(null);

    const targetUrl = section.widget_url.trim();

    // Requêtes parallèles : le premier qui répond avec des articles gagne !
    const fetchers = [
      // 1. rss2json (rapide pour les flux ouverts)
      (async (): Promise<RssItem[]> => {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`, {
          signal: AbortSignal.timeout(4000)
        });
        if (!res.ok) throw new Error('rss2json error');
        const data = await res.json();
        if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) {
          throw new Error('rss2json empty');
        }
        return data.items.slice(0, limit).map((item: any) => ({
          title: item.title?.replace(/<[^>]*>?/gm, '') || 'Sans titre',
          link: item.link || '#',
          pubDate: item.pubDate,
          description: item.description?.replace(/<[^>]*>?/gm, '') || ''
        }));
      })(),

      // 2. Jina Reader (contourne Akamai/Cloudflare pour Les Echos, Le Figaro, etc.)
      (async (): Promise<RssItem[]> => {
        const res = await fetch(`https://r.jina.ai/${targetUrl}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(7000)
        });
        if (!res.ok) throw new Error('jina error');
        const data = await res.json();
        const content = data.data?.content || '';
        const parsed = parseJinaMarkdown(content, limit);
        if (parsed.length === 0) throw new Error('jina empty');
        return parsed;
      })()
    ];

    try {
      const parsedItems = await Promise.any(fetchers);
      setItems(parsedItems);
    } catch (err: any) {
      console.error('All RSS fetchers failed:', err);
      setError('Impossible de récupérer le flux RSS.');
    } finally {
      setLoading(false);
    }
  }, [section.widget_url, limit]);

  useEffect(() => {
    fetchRssFeed();
  }, [fetchRssFeed]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return '';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={"glass-panel p-3 sm:p-4 w-full flex flex-col min-w-0 " + (isDragging ? 'z-50 shadow-2xl ring-2 ring-[var(--color-primary)]' : '')}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)] gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isEditMode && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-black/10 p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors -ml-1 flex-shrink-0"
              title="Déplacer le widget"
            >
              <GripVertical size={16} />
            </div>
          )}
          <div className="p-1 rounded-lg bg-orange-500/10 text-orange-400 flex-shrink-0">
            <Rss size={16} />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-strong)] truncate min-w-0" title={section.title}>
            {section.title}
          </h2>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={fetchRssFeed}
            disabled={loading}
            className={"p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-black/10 rounded-md transition-all " + (loading ? 'animate-spin' : '')}
            title="Rafraîchir le flux"
          >
            <RotateCw size={14} />
          </button>

          {isEditMode && (
            <>
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

      <div className="flex-1 space-y-2 max-h-[580px] overflow-y-auto pr-1">
        {loading && items.length === 0 && (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-1.5 p-2.5 rounded-lg bg-black/10">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/5 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {error && items.length === 0 && (
          <div className="py-6 px-4 text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              onClick={fetchRssFeed}
              className="mt-2 text-xs font-semibold px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-md transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="py-6 text-center text-sm text-[var(--color-text-muted)] border-2 border-dashed border-[var(--color-border)] rounded-xl">
            Aucun article disponible.
          </div>
        )}

        {items.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group/item block p-2.5 rounded-xl bg-black/10 hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)]/40 hover:border-[var(--color-primary)]/50 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-semibold ${getRssTitleClass()} text-[var(--color-text-strong)] group-hover/item:text-[var(--color-primary)] transition-colors line-clamp-2`}>
                {item.title}
              </h3>
              <ExternalLink size={14} className="text-[var(--color-text-muted)] opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
            </div>

            {item.description && (
              <p className={`${getRssDescClass()} text-[var(--color-text-muted)] mt-1 line-clamp-2`}>
                {item.description}
              </p>
            )}

            {item.pubDate && (
              <div className={`${getRssDateClass()} text-[var(--color-text-muted)]/70 mt-2 font-mono`}>
                {formatDate(item.pubDate)}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
};
