import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Modal from './components/Modal';
import FloatingNotes from './components/FloatingNotes';
import { INITIAL_DATA_REFINED } from './data/initialData';
import Icon from './components/Icon';
import { useCloudSync } from './hooks/useCloudSync';

const App = () => {
    // State Initialization
    const [sectors, setSectors] = useState(() => {
        const saved = localStorage.getItem('baroid_hub_data_v5');
        return saved ? JSON.parse(saved) : INITIAL_DATA_REFINED;
    });

    // Sincronización con la nube (Firebase)
    useCloudSync(sectors, setSectors);

    const [activeSector, setActiveSector] = useState('sec_hr'); // Default first sector
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(null); // 'add-sector', 'add-subsector', 'add-link', 'edit-item'
    const [modalData, setModalData] = useState({});

    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

    // Preferences
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('baroid_theme') === 'dark');
    const [cardSize, setCardSize] = useState(() => localStorage.getItem('baroid_card_size') || 'medium');
    const [notes, setNotes] = useState(() => localStorage.getItem('baroid_notes') || '');
    const [showNotes, setShowNotes] = useState(false);
    const [stableLastUsed, setStableLastUsed] = useState({}); // To prevent rearranging on every click

    // Effects
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('baroid_theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem('baroid_card_size', cardSize);
    }, [cardSize]);

    useEffect(() => {
        localStorage.setItem('baroid_notes', notes);
    }, [notes]);

    useEffect(() => {
        localStorage.setItem('baroid_hub_data_v5', JSON.stringify(sectors));
    }, [sectors]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            // e.preventDefault();
            // e.returnValue = ''; // Standard for modern browsers to trigger the default prompt
            // Disabled this to avoid annoying prompts during development reloading
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Handlers
    const resetToDefaults = () => {
        if (confirm('¿Restaurar configuración de fábrica? Se perderán los enlaces personalizados.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const exportData = () => {
        const backup = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('baroid_')) {
                try {
                    backup[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    backup[key] = localStorage.getItem(key);
                }
            }
        }
        backup._meta = { date: new Date().toISOString(), app: 'BaroidHub', version: '2.0' };

        const dataStr = JSON.stringify(backup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `BaroidHub_Backup_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
    };

    const importData = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm("⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEsta acción SOBREESCRIBIRÁ todos sus datos actuales (Piletas, Inventario, Notas, Configuración) con los del archivo.\n\n¿Está seguro de continuar?")) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backup = JSON.parse(event.target.result);
                if (!backup._meta && !confirm("Este archivo no parece tener metadatos de Baroid Hub. ¿Intentar importar de todas formas?")) return;

                Object.keys(backup).forEach(key => {
                    if (key !== '_meta') {
                        const val = typeof backup[key] === 'object' ? JSON.stringify(backup[key]) : backup[key];
                        localStorage.setItem(key, val);
                    }
                });

                alert('✅ Restauración Completa. La aplicación se reiniciará.');
                window.location.reload();
            } catch (err) {
                console.error(err);
                alert('❌ Error: El archivo está corrupto o no es válido.');
            }
        };
        reader.readAsText(file);
    };

    // CRUD Handlers
    const addSector = (name, icon) => {
        setSectors(prev => [...prev, { id: 'sec_' + Date.now(), name, icon, color: '#CC0000', subsectors: [] }]);
        setShowModal(null);
    };

    const addSubsector = (sid, name) => {
        setSectors(prev => prev.map(s => s.id === sid ? { ...s, subsectors: [...s.subsectors, { id: 'sub_' + Date.now(), name, links: [] }] } : s));
        setShowModal(null);
    };

    const addLink = (sid, subsid, name, url) => {
        setSectors(prev => prev.map(s => s.id === sid ? {
            ...s, subsectors: s.subsectors.map(sub => sub.id === subsid ? { ...sub, links: [...sub.links, { id: 'l_' + Date.now(), name, url, isFavorite: false }] } : sub)
        } : s));
        setShowModal(null);
    };

    const updateItem = (target, id, newName, newUrl = null, newIcon = null) => {
        setSectors(prev => prev.map(s => {
            if (target === 'sector' && s.id === id) return { ...s, name: newName, icon: newIcon || s.icon };
            return {
                ...s,
                subsectors: s.subsectors.map(sub => {
                    if (target === 'subsector' && sub.id === id) return { ...sub, name: newName };
                    return {
                        ...sub,
                        links: sub.links.map(l => {
                            if (target === 'link' && l.id === id) return { ...l, name: newName, url: newUrl || l.url };
                            return l;
                        })
                    };
                })
            };
        }));
        setShowModal(null);
    };

    const deleteItem = (type, sid, subsid = null, lid = null) => {
        if (!confirm(`¿Eliminar ${type}?`)) return;
        if (type === 'sector') setSectors(prev => prev.filter(s => s.id !== sid));
        if (type === 'subsector') setSectors(prev => prev.map(s => s.id === sid ? { ...s, subsectors: s.subsectors.filter(sub => sub.id !== subsid) } : s));
        if (type === 'link') setSectors(prev => prev.map(s => s.id === sid ? { ...s, subsectors: s.subsectors.map(sub => sub.id === subsid ? { ...sub, links: sub.links.filter(l => l.id !== lid) } : sub) } : s));
    };

    const toggleFavorite = (lid) => {
        setSectors(prev => prev.map(s => ({
            ...s,
            subsectors: s.subsectors.map(sub => ({
                ...sub,
                links: sub.links.map(l => l.id === lid ? { ...l, isFavorite: !l.isFavorite } : l)
            }))
        })));
    };

    const trackLinkClick = (lid) => {
        setStableLastUsed(prev => ({ ...prev, [lid]: Date.now() }));
        setSectors(prev => prev.map(s => ({
            ...s,
            subsectors: s.subsectors.map(sub => ({
                ...sub,
                links: sub.links.map(l => l.id === lid ? { ...l, lastUsed: Date.now() } : l)
            }))
        })));
    };

    // Derived State
    const favoritesList = useMemo(() => {
        const favs = [];
        sectors.forEach(s => {
            (s.subsectors || []).forEach(sub => {
                (sub.links || []).forEach(l => {
                    if (l.isFavorite) {
                        favs.push({ ...l, sid: s.id, subsid: sub.id });
                    }
                });
            });
        });
        return favs;
    }, [sectors]);

    const displaySectors = useMemo(() => {
        let data = [];
        if (activeSector === 'favorites') {
            data = [{
                id: 'fav',
                name: 'Mis Favoritos',
                icon: 'heart',
                color: '#CC0000',
                subsectors: [{ id: 'fs1', name: 'Documentos Destacados', links: favoritesList }]
            }];
        } else if (activeSector === 'calculator' || activeSector === 'piletas' || activeSector === 'inventory') {
            return [];
        } else {
            data = sectors.filter(s => s.id === activeSector);
        }

        if (searchQuery && searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const source = activeSector === 'favorites' ? data : sectors;
            data = source.map(s => ({
                ...s,
                subsectors: (s.subsectors || []).map(sub => ({
                    ...sub,
                    links: (sub.links || []).filter(l =>
                        l.name.toLowerCase().includes(q) ||
                        sub.name.toLowerCase().includes(q)
                    )
                })).filter(sub => sub.links.length > 0)
            })).filter(s => s.subsectors.length > 0);
        }

        return data.map(s => ({
            ...s,
            subsectors: (s.subsectors || []).map(sub => ({
                ...sub,
                links: [...(sub.links || [])].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
            }))
        }));
    }, [sectors, activeSector, searchQuery, favoritesList]);


    return (
        <div className="bg-[var(--h-bg)] min-h-screen transition-colors duration-300 flex justify-center text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
            <div className="flex w-full max-w-[1600px] relative shadow-2xl h-screen overflow-hidden rounded-none md:rounded-[2.5rem] md:my-8 bg-white/50 dark:bg-black/20 backdrop-blur-xl border-none md:border border-white/40 dark:border-white/5">

                {/* Mobile Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden fixed top-4 left-4 z-[40] p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg text-halliburton-red hover:bg-zinc-100 transition-colors"
                >
                    <Icon name={isSidebarOpen ? "x" : "menu"} size={22} />
                </button>

                <Sidebar
                    sectors={sectors}
                    setActiveSector={(id) => { setActiveSector(id); setIsSidebarOpen(false); }}
                    activeSector={activeSector}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    resetToDefaults={resetToDefaults}
                    exportData={exportData}
                    importData={importData}
                    favorites={favoritesList}
                    setShowModal={setShowModal}
                    setModalData={setModalData}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                />

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <MainContent
                    displaySectors={displaySectors}
                    activeSector={activeSector}
                    searchQuery={searchQuery}
                    sectors={sectors}
                    isEditing={isEditing}
                    setShowModal={setShowModal}
                    setModalData={setModalData}
                    deleteItem={deleteItem}
                    trackLinkClick={trackLinkClick}
                    toggleFavorite={toggleFavorite}
                    cardSize={cardSize}
                    setCardSize={setCardSize}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                />

                <Modal
                    showModal={showModal}
                    setShowModal={setShowModal}
                    modalData={modalData}
                    addSector={addSector}
                    addSubsector={addSubsector}
                    addLink={addLink}
                    updateItem={updateItem}
                />

                <FloatingNotes
                    notes={notes}
                    setNotes={setNotes}
                    showNotes={showNotes}
                    setShowNotes={setShowNotes}
                />
            </div>
        </div>
    );
};

export default App;
