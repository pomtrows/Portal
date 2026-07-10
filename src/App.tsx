import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SectionModal, ItemModal } from './components/EditModals';
import type { DashboardConfig, Section, LinkItem } from './types';
import { supabase } from './utils/supabase';

function App() {
  const [config, setConfig] = useState<DashboardConfig>({ title: 'Mon Portail', sections: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Modals state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ sectionId: string, item: LinkItem | null } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch title
      const { data: configData } = await supabase.from('config').select('*').eq('id', 'main').single();
      const title = configData?.title || 'Mon Portail';

      // Fetch sections
      const { data: sectionsData } = await supabase.from('sections').select('*').order('created_at', { ascending: true });
      
      // Fetch links
      const { data: linksData } = await supabase.from('links').select('*').order('created_at', { ascending: true });

      const sections: Section[] = (sectionsData || []).map(sec => ({
        ...sec,
        items: (linksData || []).filter(link => link.section_id === sec.id)
      }));

      setConfig({ title, sections });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    setConfig(prev => ({ ...prev, title: newTitle }));
    await supabase.from('config').upsert({ id: 'main', title: newTitle });
  };

  // Section handlers
  const handleAddSection = () => {
    setEditingSection(null);
    setIsSectionModalOpen(true);
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setIsSectionModalOpen(true);
  };

  const handleDeleteSection = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette section et tous ses liens ?")) {
      // Optimistic UI update
      setConfig(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s.id !== id)
      }));
      await supabase.from('sections').delete().eq('id', id);
    }
  };

  const handleSaveSection = async (sectionData: Partial<Section>) => {
    if (editingSection) {
      // Update
      const updatedSection = { ...editingSection, ...sectionData };
      setConfig(prev => ({
        ...prev,
        sections: prev.sections.map(s => s.id === editingSection.id ? updatedSection : s)
      }));
      await supabase.from('sections').update({ title: sectionData.title }).eq('id', editingSection.id);
    } else {
      // Create
      const newId = `sec-${Date.now()}`;
      const newSection: Section = {
        id: newId,
        title: sectionData.title || 'Nouvelle section',
        items: []
      };
      setConfig(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
      await supabase.from('sections').insert({ id: newId, title: newSection.title });
    }
  };

  // Item handlers
  const handleAddItem = (sectionId: string) => {
    setEditingItem({ sectionId, item: null });
    setIsItemModalOpen(true);
  };

  const handleEditItem = (sectionId: string, item: LinkItem) => {
    setEditingItem({ sectionId, item });
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce lien ?")) {
      setConfig(prev => ({
        ...prev,
        sections: prev.sections.map(s => 
          s.id === sectionId 
            ? { ...s, items: s.items.filter(i => i.id !== itemId) }
            : s
        )
      }));
      await supabase.from('links').delete().eq('id', itemId);
    }
  };

  const handleSaveItem = async (itemData: Partial<LinkItem>) => {
    if (!editingItem) return;
    const { sectionId, item } = editingItem;

    if (item) {
      // Update
      const updatedItem = { ...item, ...itemData };
      setConfig(prev => ({
        ...prev,
        sections: prev.sections.map(s => 
          s.id === sectionId
            ? {
                ...s,
                items: s.items.map(i => i.id === item.id ? updatedItem : i)
              }
            : s
        )
      }));
      await supabase.from('links').update({
        title: itemData.title,
        url: itemData.url,
        description: itemData.description,
        icon: itemData.icon
      }).eq('id', item.id);
    } else {
      // Create
      const newId = `link-${Date.now()}`;
      const newItem: LinkItem = {
        id: newId,
        section_id: sectionId,
        title: itemData.title || 'Nouveau lien',
        url: itemData.url || '#',
        description: itemData.description,
        icon: itemData.icon
      };
      
      setConfig(prev => ({
        ...prev,
        sections: prev.sections.map(s => 
          s.id === sectionId
            ? { ...s, items: [...s.items, newItem] }
            : s
        )
      }));
      await supabase.from('links').insert({
        id: newId,
        section_id: sectionId,
        title: newItem.title,
        url: newItem.url,
        description: newItem.description,
        icon: newItem.icon
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-[var(--color-primary)] text-xl animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header
        title={config.title}
        onTitleChange={handleTitleChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
      />

      <main>
        <Dashboard
          sections={config.sections}
          searchQuery={searchQuery}
          isEditMode={isEditMode}
          onAddSection={handleAddSection}
          onEditSection={handleEditSection}
          onDeleteSection={handleDeleteSection}
          onAddItem={handleAddItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
        />
      </main>

      {/* Modals */}
      <SectionModal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        onSave={handleSaveSection}
        initialData={editingSection}
      />

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem?.item}
      />
    </div>
  );
}

export default App;
