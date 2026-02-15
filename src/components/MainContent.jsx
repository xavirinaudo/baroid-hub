import React, { useState } from 'react';
import Icon from './Icon';
import GreetingDashboard from './GreetingDashboard';
import FluidCalculator from './FluidCalculator';
import PiletasSystem from './PiletasSystem';
import InventoryConciliation from './InventoryConciliation';
import { getDisplayUrl } from '../utils/helpers';

const MainContent = ({
    displaySectors,
    activeSector,
    searchQuery,
    sectors,
    isEditing,
    setShowModal,
    setModalData,
    deleteItem,
    trackLinkClick,
    toggleFavorite,
    cardSize,
    setCardSize,
    darkMode,
    setDarkMode
}) => {

    const sizeClasses = {
        small: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
        medium: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4',
        large: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        list: 'grid-cols-1'
    };

    const commonMainClass = "flex-1 p-4 md:p-8 h-screen overflow-y-auto custom-scrollbar relative scroll-smooth";
    const commonContainerClass = "max-w-[1400px] mx-auto space-y-6 md:space-y-12 pb-32";

    if (activeSector === 'calculator') {
        return (
            <main className={commonMainClass}>
                <div className={commonContainerClass}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mt-12 md:mt-0">
                        <div className="flex items-center gap-4 animate-slide-in">
                            <div className="p-3 md:p-4 bg-halliburton-red rounded-2xl md:rounded-3xl shadow-lg shadow-red-900/20">
                                <Icon name="activity" size={24} className="text-white md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-zinc-800 dark:text-white title-font leading-tight">Calculadora</h2>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">Ingeniería de Fluidos</p>
                            </div>
                        </div>
                    </div>
                    <FluidCalculator isEditing={false} />
                </div>
            </main>
        );
    }

    if (activeSector === 'piletas') {
        return (
            <main className={commonMainClass}>
                <div className={commonContainerClass}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mt-12 md:mt-0">
                        <div className="flex items-center gap-4 animate-slide-in">
                            <div className="p-3 md:p-4 bg-halliburton-red rounded-2xl md:rounded-3xl shadow-lg shadow-red-900/20">
                                <Icon name="layers" size={24} className="text-white md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-zinc-800 dark:text-white title-font leading-tight">Sistema Piletas</h2>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">Gestión Volumétrica</p>
                            </div>
                        </div>
                    </div>
                    <PiletasSystem isEditing={isEditing} />
                </div>
            </main>
        );
    }

    if (activeSector === 'inventory') {
        return (
            <main className={commonMainClass}>
                <div className={commonContainerClass}>
                    <div className="mt-12 md:mt-0">
                        <InventoryConciliation isEditing={isEditing} />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={commonMainClass}>
            <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-32 mt-12 md:mt-0">
                {/* Header for Dashboard Mode */}
                {!searchQuery && activeSector !== 'favorites' && (
                    <GreetingDashboard />
                )}

                {/* Content Grid */}
                <div className="space-y-8 md:space-y-12 animate-fade-in">
                    {displaySectors.map(sec => (
                        <div key={sec.id} className="space-y-4 md:space-y-6">
                            {(searchQuery || activeSector === 'favorites') && (
                                <div className="flex items-center gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-zinc-100 dark:bg-slate-800 flex items-center justify-center text-halliburton-red">
                                        <Icon name={sec.icon} size={18} />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black uppercase italic text-zinc-800 dark:text-white tracking-tight">{sec.name}</h2>
                                </div>
                            )}

                            {sec.subsectors.map(sub => {
                                const isListMode = sub.layout === 'list' || cardSize === 'list';
                                const gridClass = sub.layout === 'list'
                                    ? 'grid-cols-1'
                                    : (activeSector === 'favorites' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : sizeClasses[cardSize]);

                                return (
                                    <div key={sub.id} className="group/section">
                                        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                                            <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-800"></div>
                                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-zinc-400 group-hover/section:text-halliburton-red transition-colors">{sub.name}</h3>
                                            <div className="h-px w-6 md:w-8 bg-zinc-200 dark:bg-zinc-800"></div>
                                            {isEditing && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setModalData({ type: 'subsector', id: sub.id, name: sub.name, sid: sec.id }); setShowModal('edit-item'); }} className="p-1.5 text-zinc-300 hover:text-blue-500 transition-colors"><Icon name="edit-3" size={12} /></button>
                                                    <button onClick={() => deleteItem('subsector', sec.id, sub.id)} className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors"><Icon name="trash-2" size={12} /></button>
                                                    <button onClick={() => { setModalData({ sid: sec.id, subsid: sub.id }); setShowModal('add-link'); }} className="p-1.5 bg-zinc-100 dark:bg-slate-800 text-zinc-400 hover:bg-halliburton-red hover:text-white rounded-lg transition-all"><Icon name="plus" size={12} /></button>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`grid gap-3 md:gap-4 ${gridClass}`}>
                                            {sub.links.map(link => (
                                                <a
                                                    key={link.id}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => trackLinkClick(link.id)}
                                                    className={`group relative bg-white dark:bg-slate-800/50 hover:bg-zinc-50 dark:hover:bg-slate-800 p-4 md:p-5 rounded-3xl border border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-white/10 transition-all hover:shadow-xl hover:-translate-y-1 flex ${isListMode || cardSize === 'small' ? 'flex-row items-center gap-3 md:gap-4' : 'flex-col gap-4'}`}
                                                >
                                                    {/* Card Icons / Image */}
                                                    <div className={`relative shrink-0 ${cardSize === 'small' ? 'w-10 h-10' : (isListMode ? 'w-10 h-10' : 'w-12 h-12 md:w-14 md:h-14')} rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-slate-700/50 dark:to-slate-800 flex items-center justify-center text-halliburton-red shadow-inner overflow-hidden`}>
                                                        {/* Favicon or Icon */}
                                                        {link.url.startsWith('http') ?
                                                            <img
                                                                src={`https://www.google.com/s2/favicons?sz=64&domain_url=${link.url}`}
                                                                alt=""
                                                                className="w-1/2 h-1/2 object-contain opacity-80 mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform"
                                                                onError={(e) => { e.target.style.display = 'none'; }} // Fallback to icon if error
                                                            />
                                                            : null
                                                        }
                                                        <div className="absolute inset-0 flex items-center justify-center" style={{ display: link.url.startsWith('http') ? 'none' : 'flex' }}>
                                                            <Icon name="link" size={cardSize === 'small' || isListMode ? 18 : 20} />
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-halliburton-red transition-colors ${cardSize === 'small' ? 'text-[11px] md:text-xs' : 'text-xs md:text-sm'}`}>{link.name}</h4>
                                                        {!isListMode && cardSize !== 'small' && (
                                                            <p className="text-[10px] font-medium text-zinc-400 truncate mt-1 group-hover:text-zinc-500">{getDisplayUrl(link.url)}</p>
                                                        )}
                                                        {isListMode && (
                                                            <p className="text-[10px] font-medium text-zinc-400 truncate mt-0 group-hover:text-zinc-500 hidden md:block">{getDisplayUrl(link.url)}</p>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(link.id); }}
                                                        className={`absolute top-4 right-4 text-zinc-200 hover:text-halliburton-red transition-colors ${link.isFavorite ? 'text-halliburton-red' : ''} ${cardSize === 'small' ? 'scale-75 -top-1 -right-1' : ''}`}
                                                    >
                                                        <Icon name="heart" size={16} fill={link.isFavorite ? "currentColor" : "none"} />
                                                    </button>

                                                    {isEditing && (
                                                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 rounded-xl p-1 shadow-sm backdrop-blur-sm z-10">
                                                            <button onClick={(e) => {
                                                                e.preventDefault();
                                                                setModalData({ type: 'link', id: link.id, name: link.name, url: link.url, sid: sec.id, subsid: sub.id });
                                                                setShowModal('edit-item');
                                                            }} className="p-1.5 text-zinc-400 hover:text-blue-500"><Icon name="edit-3" size={14} /></button>
                                                            <button onClick={(e) => {
                                                                e.preventDefault();
                                                                deleteItem('link', sec.id, sub.id, link.id);
                                                            }} className="p-1.5 text-zinc-400 hover:text-red-500"><Icon name="trash-2" size={14} /></button>
                                                        </div>
                                                    )}
                                                </a>
                                            ))}
                                            {sub.links.length === 0 && (
                                                <div className="col-span-full py-8 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sin enlaces aún</span>
                                                    {isEditing && (
                                                        <button onClick={() => { setModalData({ sid: sec.id, subsid: sub.id }); setShowModal('add-link'); }} className="mt-2 text-halliburton-red text-xs font-black uppercase hover:underline block w-full">Añadir Enlace</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {sec.subsectors.length === 0 && (
                                <div className="p-10 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Sector Vacío</p>
                                    {isEditing && <button onClick={() => { setModalData({ sid: sec.id }); setShowModal('add-subsector'); }} className="mt-4 text-halliburton-red text-xs font-black uppercase hover:underline">Crear Subsector</button>}
                                </div>
                            )}
                        </div>
                    ))}

                    {displaySectors.length === 0 && searchQuery && (
                        <div className="flex flex-col items-center justify-center p-20 text-center opacity-50">
                            <Icon name="search" size={48} className="text-zinc-300 mb-4" />
                            <h3 className="text-xl font-black text-zinc-400 uppercase italic">Sin Resultados</h3>
                            <p className="text-zinc-400 text-xs mt-2">No se encontraron elementos para "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Footer Controls (Mode Switcher) */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-zinc-900/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full text-zinc-400 shadow-2xl z-40 border border-white/10 transition-transform transform hover:-translate-y-1">
                {[
                    { id: 'list', icon: 'list' },
                    { id: 'small', icon: 'grid' },
                    { id: 'medium', icon: 'layout' },
                    { id: 'large', icon: 'maximize' }
                ].map(s => (
                    <button
                        key={s.id}
                        onClick={() => setCardSize(s.id)}
                        className={`p-2.5 rounded-full transition-all ${cardSize === s.id ? 'bg-halliburton-red text-white shadow-lg' : 'hover:bg-white/10 hover:text-white'}`}
                    >
                        <Icon name={s.icon} size={16} />
                    </button>
                ))}
                <div className="w-px h-6 bg-white/20 mx-1"></div>
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2.5 rounded-full hover:bg-white/10 hover:text-white transition-all"
                >
                    <Icon name={darkMode ? "sun" : "moon"} size={16} />
                </button>
            </div>
        </main>
    );
};

export default MainContent;
