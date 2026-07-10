import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SectionModal, ItemModal } from './components/EditModals';
import { loadConfig, saveConfig } from './utils/storage';
import type { DashboardConfig, Section, LinkItem } from './types';

function App() {
  const [config, setConfig] = useState<DashboardConfig>(loadConfig());
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Modals state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ sectionId: string, item: LinkItem | null } | null>(null);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const handleTitleChange = (newTitle: string) => {
    setConfig(prev => ({ ...prev, title: newTitle }));
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

  const handleDeleteSection = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette section et tous ses liens ?")) {
      setConfig(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s.id !== id)
      }));
    }
  };

  const handleSaveSection = (sectionData: Partial<Section>) => {
    if (editingSection) {
      setConfig(prev => ({
        ...prev,
        sections: prev.sections.map(s => s.id === editingSection.id ? { ...s, ...sectionData } : s)
      }));
    } else {
      const newSection: Section = {
        id: `sec-${Date.now()}`,
        title: sectionData.title || 'Nouvelle section',
        items: []
      };
      setConfig(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
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

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce lien ?")) {
      setConfig(prev => ({
        ...prev,
        sections: prev.sections.map(s => 
          s.id === sectionId 
            ? { ...s, items: s.items.filter(i => i.id !== itemId) }
            : s
        )
      }));
    }
  };

  const handleSaveItem = (itemData: Partial<LinkItem>) => {
    if (!editingItem) return;

    const { sectionId, item } = editingItem;

    if (item) {
      // Edit existing
      setConfig(prev => ({
        ...prev,
        sections: prev.sections.map(s => 
          s.id === sectionId
            ? {
                ...s,
                items: s.items.map(i => i.id === item.id ? { ...i, ...itemData } : i)
              }
            : s
        )
      }));
    } else {
      // Add new
      const newItem: LinkItem = {
        id: `link-${Date.now()}`,
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
    }
  };

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
