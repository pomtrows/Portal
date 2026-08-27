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
  type?: 'links' | 'rss' | 'weather' | 'traffic' | 'search';
  widget_url?: string;
  display_limit?: number;
  position?: number;
  column_index?: number;
  grid_x?: number; // 0-indexed column position on the grid
  grid_y?: number; // 0-indexed row position on the grid
  col_span?: number; // width in grid cells (1 to N, default 1)
  row_span?: number; // height in grid cells (1 to M, default 1)
  created_at?: string;
  items: LinkItem[];
}

export interface DashboardConfig {
  title: string;
  pages: Page[];
  sections: Section[];
}
