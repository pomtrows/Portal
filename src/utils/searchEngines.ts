export interface SearchEngine {
  id: string;
  name: string;
  category: 'web' | 'ai';
  searchUrl: string; // contains %s or append query
  homeUrl: string;
  icon: string; // Lucide icon name or identifier
  badgeColor: string; // Tailwind color classes
  description: string;
  supportsDirectQuery: boolean;
}

export interface SearchWidgetConfig {
  title?: string;
  defaultEngineId: string;
  enabledEngineIds: string[];
  recentSearchesCount?: number;
}

export const ALL_SEARCH_ENGINES: SearchEngine[] = [
  // AI Assistants
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    category: 'ai',
    searchUrl: 'https://chatgpt.com/?q=%s',
    homeUrl: 'https://chatgpt.com',
    icon: 'MessageSquare',
    badgeColor: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20',
    description: 'OpenAI ChatGPT',
    supportsDirectQuery: true,
  },
  {
    id: 'claude',
    name: 'Claude',
    category: 'ai',
    searchUrl: 'https://claude.ai/new?q=%s',
    homeUrl: 'https://claude.ai',
    icon: 'Brain',
    badgeColor: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20',
    description: 'Anthropic Claude',
    supportsDirectQuery: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    category: 'ai',
    searchUrl: 'https://chat.deepseek.com/?q=%s',
    homeUrl: 'https://chat.deepseek.com',
    icon: 'Zap',
    badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20',
    description: 'DeepSeek Chat',
    supportsDirectQuery: true,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'ai',
    searchUrl: 'https://www.perplexity.ai/search?q=%s',
    homeUrl: 'https://www.perplexity.ai',
    icon: 'SearchCheck',
    badgeColor: 'bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20',
    description: 'Moteur de recherche IA',
    supportsDirectQuery: true,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    category: 'ai',
    searchUrl: 'https://gemini.google.com/app',
    homeUrl: 'https://gemini.google.com/app',
    icon: 'Sparkles',
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/20',
    description: 'IA Google Gemini (Ctrl+V)',
    supportsDirectQuery: false,
  },
  {
    id: 'kimi',
    name: 'Kimi.ai',
    category: 'ai',
    searchUrl: 'https://kimi.ai/?q=%s',
    homeUrl: 'https://kimi.ai',
    icon: 'Moon',
    badgeColor: 'bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/30 hover:bg-teal-500/20',
    description: 'Kimi AI Assistant (Ctrl+V)',
    supportsDirectQuery: false,
  },
  {
    id: 'qwen',
    name: 'Qwen.ai',
    category: 'ai',
    searchUrl: 'https://chat.qwen.ai/?q=%s',
    homeUrl: 'https://chat.qwen.ai',
    icon: 'Bot',
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/20',
    description: 'Alibaba Qwen AI (Ctrl+V)',
    supportsDirectQuery: false,
  },

  // Web Engines
  {
    id: 'google',
    name: 'Google',
    category: 'web',
    searchUrl: 'https://www.google.com/search?q=%s',
    homeUrl: 'https://www.google.com',
    icon: 'Globe',
    badgeColor: 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/20',
    description: 'Recherche Web Google',
    supportsDirectQuery: true,
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    category: 'web',
    searchUrl: 'https://duckduckgo.com/?q=%s',
    homeUrl: 'https://duckduckgo.com',
    icon: 'Shield',
    badgeColor: 'bg-orange-500/10 text-orange-800 dark:text-orange-300 border-orange-500/30 hover:bg-orange-500/20',
    description: 'Moteur axé vie privée',
    supportsDirectQuery: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'web',
    searchUrl: 'https://www.youtube.com/results?search_query=%s',
    homeUrl: 'https://www.youtube.com',
    icon: 'Video',
    badgeColor: 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/30 hover:bg-red-500/20',
    description: 'Vidéos & Musique',
    supportsDirectQuery: true,
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    category: 'web',
    searchUrl: 'https://fr.wikipedia.org/wiki/Special:Search?search=%s',
    homeUrl: 'https://fr.wikipedia.org',
    icon: 'BookOpen',
    badgeColor: 'bg-slate-500/10 text-slate-800 dark:text-slate-200 border-slate-500/30 hover:bg-slate-500/20',
    description: 'Encyclopédie collaborative',
    supportsDirectQuery: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'web',
    searchUrl: 'https://github.com/search?q=%s',
    homeUrl: 'https://github.com',
    icon: 'Code',
    badgeColor: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20',
    description: 'Code & Dépôts open source',
    supportsDirectQuery: true,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    category: 'web',
    searchUrl: 'https://www.amazon.fr/s?k=%s',
    homeUrl: 'https://www.amazon.fr',
    icon: 'ShoppingBag',
    badgeColor: 'bg-amber-600/10 text-amber-900 dark:text-amber-300 border-amber-600/30 hover:bg-amber-600/20',
    description: 'Amazon France',
    supportsDirectQuery: true,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    category: 'web',
    searchUrl: 'https://www.reddit.com/search/?q=%s',
    homeUrl: 'https://www.reddit.com',
    icon: 'MessageSquare',
    badgeColor: 'bg-orange-600/10 text-orange-900 dark:text-orange-300 border-orange-600/30 hover:bg-orange-600/20',
    description: 'Communautés & Discussions',
    supportsDirectQuery: true,
  },
];

export const DEFAULT_SEARCH_CONFIG: SearchWidgetConfig = {
  title: 'Hub de recherche & IA',
  defaultEngineId: 'google',
  enabledEngineIds: [
    'google',
    'chatgpt',
    'claude',
    'deepseek',
    'perplexity',
    'gemini',
    'kimi',
    'qwen',
    'youtube',
    'wikipedia',
    'github',
    'amazon',
    'reddit',
    'duckduckgo',
  ],
  recentSearchesCount: 5,
};

export function parseSearchConfig(widgetUrl?: string): SearchWidgetConfig {
  if (!widgetUrl) return DEFAULT_SEARCH_CONFIG;
  try {
    const parsed = JSON.parse(widgetUrl);
    return {
      title: parsed.title || DEFAULT_SEARCH_CONFIG.title,
      defaultEngineId: parsed.defaultEngineId || DEFAULT_SEARCH_CONFIG.defaultEngineId,
      enabledEngineIds: Array.isArray(parsed.enabledEngineIds) && parsed.enabledEngineIds.length > 0
        ? parsed.enabledEngineIds
        : DEFAULT_SEARCH_CONFIG.enabledEngineIds,
      recentSearchesCount: parsed.recentSearchesCount || 5,
    };
  } catch {
    return DEFAULT_SEARCH_CONFIG;
  }
}

export function executeSearch(engine: SearchEngine, query: string): { copiedToClipboard: boolean } {
  const trimmed = query.trim();
  
  if (!trimmed) {
    window.open(engine.homeUrl, '_blank', 'noopener,noreferrer');
    return { copiedToClipboard: false };
  }

  let copied = false;
  // Always copy query to clipboard for all AI assistants (vital for ones without native URL query pre-fill)
  if (navigator.clipboard && engine.category === 'ai') {
    navigator.clipboard.writeText(trimmed).catch(() => {});
    copied = true;
  }

  let finalUrl = engine.searchUrl;
  if (finalUrl.includes('%s')) {
    finalUrl = finalUrl.replace('%s', encodeURIComponent(trimmed));
  } else {
    finalUrl = `${finalUrl}?q=${encodeURIComponent(trimmed)}`;
  }

  window.open(finalUrl, '_blank', 'noopener,noreferrer');
  return { copiedToClipboard: copied };
}
