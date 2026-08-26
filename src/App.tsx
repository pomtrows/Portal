import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SectionModal, ItemModal } from './components/EditModals';
import { MobileMenu } from './components/MobileMenu';
import { Auth } from './components/Auth';
import { AccountModal } from './components/AccountModal';
import type { DashboardConfig, Section, LinkItem, Page } from './types';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from './utils/supabase';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentProfile, setCurrentProfile] = useState<'perso' | 'pro'>(() => {
    return (localStorage.getItem('portal-profile') as 'perso' | 'pro') || 'perso';
  });
  const [config, setConfig] = useState<DashboardConfig>({ title: 'Mon Portail', pages: [], sections: [] });
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ sectionId: string, item: LinkItem | null } | null>(null);

  // Page Editing
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [tempPageTitle, setTempPageTitle] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, currentProfile]);

  const handleChangeProfile = (p: 'perso' | 'pro') => {
    setCurrentProfile(p);
    localStorage.setItem('portal-profile', p);
    setActivePageId(null);
  };

  const fetchData = async () => {
    if (!session?.user) return;
    
    if (!isInitialized) setLoading(true);
    try {
      // Fetch title
      const { data: configData } = await supabase
        .from('config')
        .select('*')
        .eq('id', `${currentProfile}_${session.user.id}`)
        .single();
        
      const title = configData?.title || (currentProfile === 'pro' ? 'Mon Portail Pro' : 'Mon Portail');

      // Fetch pages
      const { data: pagesData } = await supabase.from('pages').select('*').eq('profile', currentProfile).order('created_at', { ascending: true });
      const pages: Page[] = pagesData || [];

      // Fetch sections (RLS handles user_id filtering)
      const { data: sectionsData } = await supabase.from('sections').select('*').order('created_at', { ascending: true });
      
      // Fetch links (RLS handles user_id filtering)
      const { data: linksData } = await supabase.from('links').select('*').order('created_at', { ascending: true });

      const sections: Section[] = (sectionsData || []).map((sec: any) => ({
        ...sec,
        items: (linksData || []).filter((link: any) => link.section_id === sec.id)
      }));

      setConfig({ title, pages, sections });
      
      if (pages.length > 0 && (!activePageId || !pages.find(p => p.id === activePageId))) {
        setActivePageId(pages[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!session?.user) return;
    setConfig(prev => ({ ...prev, title: newTitle }));
    await supabase.from('config').upsert({ 
      id: `${currentProfile}_${session.user.id}`, 
      title: newTitle,
      user_id: session.user.id
    });
  };

  // Page Handlers
  const handleAddPage = async () => {
    if (!session?.user) return;
    const newId = crypto.randomUUID();
    const newPage: Page = { id: newId, title: 'Nouvelle page', profile: currentProfile };
    
    setConfig(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
    setActivePageId(newId);
    setEditingPageId(newId);
    setTempPageTitle('Nouvelle page');

    const { error } = await supabase.from('pages').insert({
      id: newId,
      title: newPage.title,
      profile: currentProfile,
      user_id: session.user.id
    });
    if (error) console.error("Error inserting page:", error);
  };

  const handleSavePageTitle = async (pageId: string) => {
    if (!session?.user || !tempPageTitle.trim()) {
      setEditingPageId(null);
      return;
    }

    setConfig(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === pageId ? { ...p, title: tempPageTitle } : p)
    }));
    setEditingPageId(null);

    await supabase.from('pages').update({ title: tempPageTitle }).eq('id', pageId);
  };

  const handleDeletePage = async (pageId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette page et tout son contenu ?")) {
      setConfig(prev => {
        const newPages = prev.pages.filter(p => p.id !== pageId);
        return {
          ...prev,
          pages: newPages,
          sections: prev.sections.filter(s => s.page_id !== pageId)
        };
      });
      if (activePageId === pageId) {
        const remaining = config.pages.filter(p => p.id !== pageId);
        setActivePageId(remaining.length > 0 ? remaining[0].id : null);
      }
      await supabase.from('pages').delete().eq('id', pageId);
    }
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
      setConfig(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s.id !== id)
      }));
      await supabase.from('sections').delete().eq('id', id);
    }
  };

  const handleSaveSection = async (sectionData: Partial<Section>) => {
    if (!session?.user || !activePageId) return;
    
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
        page_id: activePageId,
        title: sectionData.title || 'Nouvelle section',
        items: []
      };
      setConfig(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
      await supabase.from('sections').insert({ 
        id: newId, 
        page_id: activePageId,
        title: newSection.title,
        user_id: session.user.id
      });
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
    if (!session?.user || !editingItem) return;
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
        icon: newItem.icon,
        user_id: session.user.id
      });
    }
  };

  if (!session) {
    return <Auth />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-[var(--color-primary)] text-xl animate-pulse">Chargement...</div>
      </div>
    );
  }

  const currentSections = config.sections.filter(s => s.page_id === activePageId);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header
        title={config.title}
        onTitleChange={handleTitleChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        profile={currentProfile}
        onChangeProfile={handleChangeProfile}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title={config.title}
        pages={config.pages}
        activePageId={activePageId}
        onSelectPage={setActivePageId}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        profile={currentProfile}
        onChangeProfile={handleChangeProfile}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Tabs */}
      <div className="hidden md:flex max-w-[1400px] mx-auto px-6 py-4 flex-wrap gap-2 items-center mb-2">
        {config.pages.map(page => (
          <div key={page.id} className="relative group flex items-center">
            {editingPageId === page.id ? (
              <input
                autoFocus
                value={tempPageTitle}
                onChange={e => setTempPageTitle(e.target.value)}
                onBlur={() => handleSavePageTitle(page.id)}
                onKeyDown={e => e.key === 'Enter' && handleSavePageTitle(page.id)}
                className="px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-primary)] text-[var(--color-text-strong)] focus:outline-none"
              />
            ) : (
              <button
                onClick={() => setActivePageId(page.id)}
                onDoubleClick={() => {
                  if (isEditMode) {
                    setEditingPageId(page.id);
                    setTempPageTitle(page.title);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activePageId === page.id 
                    ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
                }`}
              >
                {page.title}
              </button>
            )}
            
            {isEditMode && editingPageId !== page.id && (
              <button
                onClick={() => handleDeletePage(page.id)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full transition-opacity z-10"
                title="Supprimer la page"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}

        {isEditMode && (
          <button
            onClick={handleAddPage}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors ml-2"
            title="Ajouter une page"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      <main>
        {activePageId ? (
          <Dashboard
            sections={currentSections}
            searchQuery={searchQuery}
            isEditMode={isEditMode}
            onAddSection={handleAddSection}
            onEditSection={handleEditSection}
            onDeleteSection={handleDeleteSection}
            onAddItem={handleAddItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
        ) : (
          <div className="text-center py-20 text-[var(--color-text-muted)]">
            {isEditMode ? "Créez une page pour commencer." : "Aucune page disponible."}
          </div>
        )}
      </main>

      {/* Modals */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

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
