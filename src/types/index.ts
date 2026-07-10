export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string; // lucide icon name or URL
}

export interface Section {
  id: string;
  title: string;
  items: LinkItem[];
}

export interface DashboardConfig {
  title: string;
  sections: Section[];
}
