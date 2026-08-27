export interface LinkItem {
  id: string;
  section_id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string; // lucide icon name or URL
  position?: number;
  created_at?: string;
}

export interface Page {
  id: string;
  title: string;
  profile?: 'perso' | 'pro';
  created_at?: string;
}

export interface Section {
  id: string;
  page_id: string;
  title: string;
  type?: 'links' | 'rss' | 'weather' | 'traffic';
  widget_url?: string;
  display_limit?: number;
  position?: number;
  created_at?: string;
  items: LinkItem[];
}

export interface DashboardConfig {
  title: string;
  pages: Page[];
  sections: Section[];
}
