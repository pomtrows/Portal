export interface LinkItem {
  id: string;
  section_id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string; // lucide icon name or URL
  created_at?: string;
}

export interface Section {
  id: string;
  title: string;
  created_at?: string;
  items: LinkItem[];
}

export interface DashboardConfig {
  title: string;
  sections: Section[];
}
