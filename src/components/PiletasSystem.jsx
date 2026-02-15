import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import html2pdf from 'html2pdf.js';
import { glToPPG, ppgToGL, mToFt, ftToM, bblToM3, m3ToBbl } from '../utils/engineering';

const PiletasSystem = ({ isEditing }) => {
    // State
    const [pits, setPits] = useState(() => {
        const saved = localStorage.getItem('baroid_piletas_v8');
        if (saved) return JSON.parse(saved);
        // Default Pits
        const defaults = [];
        const rows = 3;
        const cols = 4;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                defaults.push({
                    id: `pit_${i}_${j}_${Date.now()}`,
                    name: `Piletas ${i * cols + j + 1}`,
                    vol: '0',
                    maxVol: '500',
                    density: '1.0', // SG
                    type: 'SYS_1', // Default system
                    x: 20 + (j * 150),
                    y: 20 + (i * 240),
                    w: 130, // Base Width
                    h: 220  // Base Height
                });
            }
        }
        return defaults;
    });

    const [fluidSystems, setFluidSystems] = useState(() => {
        const saved = localStorage.getItem('baroid_fluid_systems_v4');
        return saved ? JSON.parse(saved) : [
            { id: 'SYS_1', label: 'WBM', color: 'bg-zinc-500' },
            { id: 'SYS_2', label: 'OBM', color: 'bg-halliburton-red' },
            { id: 'SYS_3', label: 'Reservas', color: 'bg-blue-600' }
        ];
    });

    const [unitMode, setUnitMode] = useState('field'); // field (ppg/bbl) or metric (g/L / m3)
    const [selectedIds, setSelectedIds] = useState([]);
    const [draggingPitId, setDraggingPitId] = useState(null);
    const [resizingPitId, setResizingPitId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ w: 0, h: 0, x: 0, y: 0 });
    const [showFluidStats, setShowFluidStats] = useState(false);
    const [isConfiguringFluids, setIsConfiguringFluids] = useState(false);

    // Multi-selection Box
    const [selectionBox, setSelectionBox] = useState(null);

    // History for Undo
    const [historyPits, setHistoryPits] = useState(null);
    const [groupStartStates, setGroupStartStates] = useState(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem('baroid_piletas_v8', JSON.stringify(pits));
    }, [pits]);

    useEffect(() => {
        localStorage.setItem('baroid_fluid_systems_v4', JSON.stringify(fluidSystems));
    }, [fluidSystems]);


    // Handlers
    const addPit = () => {
        const newPit = {
            id: `pit_new_${Date.now()}`,
            name: 'NUEVA',
            vol: '0',
            maxVol: '500',
            density: '1.0',
            type: fluidSystems[0].id,
            x: 50,
            y: 50,
            w: 130,
            h: 220
        };
        setPits([...pits, newPit]);
    };

    const updatePit = (id, field, value) => {
        setPits(pits.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    // Auto-layout Grid
    const reorderPits = () => {
        if (!confirm('¿Reordenar automáticamente todas las piletas?')) return;
        setHistoryPits([...pits]); // Save for undo

        const sorted = [...pits].sort((a, b) => {
            const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        // Mobile-friendly packing? Just standard grid
        const cols = window.innerWidth < 768 ? 2 : 6;
        const xStep = 160;
        const yStep = 260;

        const newPits = sorted.map((p, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            return {
                ...p,
                x: 30 + (col * xStep),
                y: 30 + (row * yStep),
                w: 130,
                h: 220
            };
        });
        setPits(newPits);
    };

    const undoReorder = () => {
        if (historyPits) {
            setPits(historyPits);
            setHistoryPits(null);
        }
    };

    const deletePit = (id) => {
        const isSelected = selectedIds.includes(id);
        const idsToDelete = isSelected ? selectedIds : [id];
        const count = idsToDelete.length;
        const msg = count > 1 ? `¿Eliminar las ${count} piletas seleccionadas?` : '¿Eliminar esta pileta?';

        if (confirm(msg)) {
            const filterer = p => !idsToDelete.includes(p.id);
            setPits(pits.filter(filterer));
            if (historyPits) {
                setHistoryPits(historyPits.filter(filterer));
            }
            setSelectedIds(prev => prev.filter(sid => !idsToDelete.includes(sid)));
        }
    };

    // Mouse Interactions
    const handleMouseDown = (e, id = null) => {
        if (e.target.closest('input') || e.target.closest('button') || e.target.closest('select')) return;

        if (id) {
            e.stopPropagation();
            let nextSelection = selectedIds;
            const isNowSelected = selectedIds.includes(id);

            if (e.shiftKey) {
                nextSelection = isNowSelected ? selectedIds.filter(i => i !== id) : [...selectedIds, id];
                setSelectedIds(nextSelection);
            } else if (!isNowSelected) {
                nextSelection = [id];
                setSelectedIds(nextSelection);
            }

            const startData = {};
            pits.forEach(p => {
                if (nextSelection.includes(p.id)) {
                    startData[p.id] = { x: p.x, y: p.y, w: p.w, h: p.h };
                }
            });
            setGroupStartStates(startData);

            const pit = pits.find(p => p.id === id);
            if (e.target.closest('.resize-handle')) {
                setResizingPitId(id);
                setResizeStart({ w: pit.w, h: pit.h, x: e.clientX, y: e.clientY });
            } else {
                setDraggingPitId(id);
                setDragOffset({ x: e.clientX - pit.x, y: e.clientY - pit.y });
            }
        } else {
            if (!e.shiftKey) setSelectedIds([]);
            setSelectionBox({
                x: e.clientX,
                y: e.clientY,
                startX: e.clientX,
                startY: e.clientY,
                w: 0,
                h: 0
            });
        }
    };

    const handleMouseMove = (e) => {
        const canvasEl = document.getElementById('piletas-canvas');
        if (!canvasEl) return;
        const canvasRect = canvasEl.getBoundingClientRect();
        const margin = 10;

        if (selectionBox) {
            const currentX = e.clientX;
            const currentY = e.clientY;

            const x = Math.min(currentX, selectionBox.startX);
            const y = Math.min(currentY, selectionBox.startY);
            const w = Math.abs(currentX - selectionBox.startX);
            const h = Math.abs(currentY - selectionBox.startY);

            setSelectionBox({ ...selectionBox, x, y, w, h });

            const boxInCanvas = {
                left: x - canvasRect.left,
                top: y - canvasRect.top,
                right: (x + w) - canvasRect.left,
                bottom: (y + h) - canvasRect.top
            };

            const pitsInBox = pits.filter(p => {
                const pw = p.w + 24;
                const ph = p.h;
                return (p.x < boxInCanvas.right && p.x + pw > boxInCanvas.left &&
                    p.y < boxInCanvas.bottom && p.y + ph > boxInCanvas.top);
            }).map(p => p.id);
            setSelectedIds(pitsInBox);

        } else if (draggingPitId && groupStartStates) {
            const leadStart = groupStartStates[draggingPitId];
            const leadCurrentX = e.clientX - dragOffset.x;
            const leadCurrentY = e.clientY - dragOffset.y;

            const dx = leadCurrentX - leadStart.x;
            const dy = leadCurrentY - leadStart.y;

            setPits(prevPits => prevPits.map(p => {
                if (selectedIds.includes(p.id) && groupStartStates[p.id]) {
                    const s = groupStartStates[p.id];
                    return {
                        ...p,
                        x: Math.max(margin, Math.min(s.x + dx, canvasRect.width - margin - (p.w + 24))),
                        y: Math.max(margin, Math.min(s.y + dy, canvasRect.height - margin - 150))
                    };
                }
                return p;
            }));
        } else if (resizingPitId && groupStartStates) {
            const dx = e.clientX - resizeStart.x;
            const dy = e.clientY - resizeStart.y;

            setPits(prevPits => prevPits.map(p => {
                if (selectedIds.includes(p.id) && groupStartStates[p.id]) {
                    const s = groupStartStates[p.id];
                    return {
                        ...p,
                        w: Math.max(120, s.w + dx),
                        h: Math.max(105, s.h + dy)
                    };
                }
                return p;
            }));
        }
    };

    const handleMouseUp = () => {
        setDraggingPitId(null);
        setResizingPitId(null);
        setSelectionBox(null);
        setGroupStartStates(null);
    };

    const handleEnter = (e) => {
        if (e.key === 'Enter') e.target.blur();
    };

    // Fluid Systems Management
    const addFluidSystem = () => {
        const id = `SYS_${Date.now()}`;
        setFluidSystems([...fluidSystems, { id, label: 'Nuevo', color: 'bg-zinc-500' }]);
    };

    const updateFluidSystem = (id, field, val) => {
        setFluidSystems(fluidSystems.map(s => s.id === id ? { ...s, [field]: val } : s));
    };

    const deleteFluidSystem = (id) => {
        if (fluidSystems.length <= 1) return alert('Debe haber al menos un sistema.');
        if (confirm('¿Eliminar este sistema? Las piletas que lo usen volverán al primero.')) {
            setFluidSystems(fluidSystems.filter(s => s.id !== id));
            setPits(pits.map(p => p.type === id ? { ...p, type: fluidSystems.find(s => s.id !== id).id } : p));
        }
    };

    // PDF Export
    const generatePDF = () => {
        // ... (PDF logic same as before, preserving it)
        const date = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
        const reportContainer = document.createElement('div');
        reportContainer.style.cssText = "position: fixed; top: 0; left: 0; width: 1080px; z-index: -100; padding: 0; margin: 0; background: white; color: black; font-family: 'Inter', sans-serif;";
        const totalVolReport = pits.reduce((acc, p) => acc + (parseFloat(p.vol) || 0), 0);
        const totalMaxReport = pits.reduce((acc, p) => acc + (parseFloat(p.maxVol) || 0), 0);
        const occupancy = ((totalVolReport / (totalMaxReport || 1)) * 100).toFixed(1);
        const currentUnit = unitMode === 'metric' ? 'm³' : 'bbl';
        const fmt = (v) => unitMode === 'metric' ? v.toFixed(1) : (v).toFixed(0);

        const header = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #CC0000; padding-bottom: 15px; margin-bottom: 20px; padding: 30px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 45px; height: 45px; background: #CC0000; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 950; font-size: 28px; font-family: sans-serif;">H</div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 950; color: #1e293b; font-family: sans-serif;">INVENTARIO DE PILETAS | BAROID</h1>
                </div>
                <div style="font-family: sans-serif; font-size: 18px; font-weight: 950; color: #CC0000;">${date}</div>
            </div>
        `;

        const content = `
        <div style="padding: 30px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                 <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; border-left: 5px solid #CC0000;">
                    <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Volumen Total</div>
                    <div style="font-size: 26px; font-weight: 950; color: #CC0000;">${fmt(totalVolReport)} <small style="font-size: 12px;">${currentUnit}</small></div>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; border-left: 5px solid #1e293b;">
                    <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Capacidad</div>
                    <div style="font-size: 26px; font-weight: 950; color: #1e293b;">${fmt(totalMaxReport)} <small style="font-size: 12px;">${currentUnit}</small></div>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; border-left: 5px solid #1e293b;">
                    <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Ocupación</div>
                    <div style="font-size: 26px; font-weight: 950; color: #1e293b;">${occupancy} <small style="font-size: 12px;">%</small></div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px;">
                ${[...pits].sort((a, b) => (a.y - b.y) || (a.x - b.x)).slice(0, 36).map(p => {
            const level = Math.min(((parseFloat(p.vol) || 0) / (parseFloat(p.maxVol) || 1)) * 100, 100);
            const sys = fluidSystems.find(s => s.id === p.type) || fluidSystems[0];
            const colorMap = {
                'bg-blue-600': '#2563eb', 'bg-halliburton-red': '#CC0000', 'bg-zinc-900': '#18181b',
                'bg-yellow-500': '#eab308', 'bg-zinc-700': '#3f3f46', 'bg-sky-400': '#38bdf8',
                'bg-orange-600': '#ea580c', 'bg-emerald-600': '#059669', 'bg-amber-500': '#f59e0b',
                'bg-purple-600': '#9333ea', 'bg-zinc-500': '#71717a'
            };
            const c = colorMap[sys.color] || '#555';
            return `
                        <div style="border: 2px solid #e2e8f0; border-radius: 15px; padding: 10px; background: white;">
                             <div style="font-size: 12px; font-weight: 950; text-align: center; font-family: sans-serif; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 10px; text-transform: uppercase;">${p.name}</div>
                             <div style="height: 80px; background: #f1f5f9; border-radius: 10px; position: relative; overflow: hidden; border: 1.5px solid #e2e8f0;">
                                <div style="position: absolute; bottom: 0; left: 0; width: 100%; background: ${c}; height: ${level}%;"></div>
                                <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
                                    <div style="background: white; border: 2.5px solid black; padding: 4px 10px; border-radius: 10px; font-size: 22px; font-weight: 950; font-family: sans-serif;">${p.vol}</div>
                                </div>
                             </div>
                             <div style="margin-top: 10px; text-align:center; font-size:10px; font-weight:bold; color:#666;">
                                Dens: ${displayDens(p.density)} ${unitMode === 'metric' ? 'g/L' : 'ppg'}
                             </div>
                        </div>`;
        }).join('')}
            </div>
        </div>`;
        reportContainer.innerHTML = header + content;
        document.body.appendChild(reportContainer);
        const opt = { margin: 5, filename: `Reporte_Piletas_${date.replace(/[/:\s]/g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
        html2pdf().set(opt).from(reportContainer).save().then(() => { document.body.removeChild(reportContainer); });
    };

    // Helpers
    const totalVol = pits.reduce((acc, p) => acc + (parseFloat(p.vol) || 0), 0);
    const totalMax = pits.reduce((acc, p) => acc + (parseFloat(p.maxVol) || 0), 0);
    const avgSG = totalVol > 0 ? pits.reduce((acc, p) => acc + ((parseFloat(p.vol) || 0) * (parseFloat(p.density) || 1)), 0) / totalVol : 1.0;
    const displayDens = (sg) => unitMode === 'metric' ? (sg * 1000).toFixed(0) : (sg * 8.33).toFixed(2);
    const parseDens = (val) => { const num = parseFloat(val) || 0; return unitMode === 'metric' ? num / 1000 : num / 8.33; };
    const getDensLabel = () => unitMode === 'metric' ? 'g/L' : 'ppg';
    const availableColors = ['bg-blue-600', 'bg-halliburton-red', 'bg-zinc-900', 'bg-yellow-500', 'bg-zinc-700', 'bg-sky-400', 'bg-orange-600', 'bg-emerald-600', 'bg-amber-500', 'bg-purple-600', 'bg-zinc-500'];

    const statsBySystem = fluidSystems.map(sys => {
        const vol = pits.filter(p => p.type === sys.id).reduce((acc, p) => acc + (parseFloat(p.vol) || 0), 0);
        const cap = pits.filter(p => p.type === sys.id).reduce((acc, p) => acc + (parseFloat(p.maxVol) || 0), 0);
        return { ...sys, vol, cap };
    });

    return (
        <div className="animate-fade-in space-y-4 pb-32 select-none" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {/* Header Controls */}
            <div className="bg-white dark:bg-slate-900/80 p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-4 md:gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        <div className="flex bg-zinc-100 dark:bg-slate-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <button onClick={() => setUnitMode('field')} className={`px-3 py-1.5 md:px-5 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all ${unitMode === 'field' ? 'bg-halliburton-red text-white' : 'text-zinc-500'}`}>ppg</button>
                            <button onClick={() => setUnitMode('metric')} className={`px-3 py-1.5 md:px-5 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all ${unitMode === 'metric' ? 'bg-halliburton-red text-white' : 'text-zinc-500'}`}>g/L</button>
                        </div>
                        <button onClick={() => setIsConfiguringFluids(!isConfiguringFluids)} className="bg-white dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] font-black uppercase shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors">
                            <Icon name="sliders" size={14} /> <span className="hidden sm:inline">Config.</span>
                        </button>

                        <button
                            onClick={historyPits ? undoReorder : reorderPits}
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] font-black uppercase shadow-sm border transition-all flex items-center gap-2 ${historyPits ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200' : 'bg-white dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'}`}
                        >
                            <Icon name={historyPits ? "mouse-pointer" : "grid"} size={14} />
                            <span className="hidden sm:inline">{historyPits ? 'Manual' : 'Ordenar'}</span>
                        </button>

                        <button onClick={addPit} className="bg-white dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] font-black uppercase shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors">
                            <Icon name="plus" size={14} /> <span className="hidden sm:inline">Nuevo</span>
                        </button>

                        <button onClick={() => setShowFluidStats(!showFluidStats)} className={`px-4 py-2 md:px-6 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase shadow-md flex items-center gap-2 transition-all transform hover:scale-105 ${showFluidStats ? 'bg-halliburton-red text-white' : 'bg-zinc-900 text-white'}`}>
                            <Icon name="bar-chart-2" size={14} /> <span className="hidden sm:inline">Dashboard</span>
                        </button>

                        <button onClick={generatePDF} className="px-4 py-2 md:px-6 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase shadow-md flex items-center gap-2 transition-all bg-zinc-900 text-white hover:bg-zinc-700">
                            <Icon name="file-text" size={14} /> <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>

                    {/* Summary Integrated - Scrollable horizontally on small screens */}
                    <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <div className="flex gap-4 md:gap-8 items-center bg-zinc-50 dark:bg-slate-800/50 px-4 py-2 md:px-8 md:py-3 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 min-w-max">
                            {[
                                { label: 'Vol. Total', val: unitMode === 'metric' ? totalVol.toFixed(1) : (totalVol / 0.158987).toFixed(0), unit: unitMode === 'metric' ? 'm³' : 'bbl', color: 'text-halliburton-red' },
                                { label: 'Dens. Media', val: displayDens(avgSG), unit: getDensLabel() },
                                { label: 'Ocupación', val: ((totalVol / (totalMax || 1)) * 100).toFixed(1), unit: '%' }
                            ].map((stat, i) => (
                                <div key={i} className="flex items-baseline gap-2">
                                    <span className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}:</span>
                                    <span className={`text-lg md:text-xl font-black italic ${stat.color || 'dark:text-white'}`}>{stat.val}</span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase">{stat.unit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard */}
            {showFluidStats && (
                <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-2xl animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {statsBySystem.map(sys => (
                        <div key={sys.id} className="p-4 md:p-6 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${sys.color}`}></div>
                                <span className="text-sm font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">{sys.label}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black italic text-zinc-900 dark:text-white">
                                    {unitMode === 'metric' ? sys.vol.toFixed(1) : (sys.vol / 0.158987).toFixed(0)}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">{unitMode === 'metric' ? 'm³' : 'bbl'}</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${sys.color}`} style={{ width: `${Math.min((sys.vol / (sys.cap || 1)) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Config Panel */}
            {isConfiguringFluids && (
                <div className="bg-zinc-100 dark:bg-slate-950 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 animate-fade-in shadow-inner overflow-x-auto">
                    <div className="flex flex-wrap gap-4">
                        {fluidSystems.map(sys => (
                            <div key={sys.id} className="bg-white dark:bg-slate-900 p-3 pl-5 rounded-2xl flex items-center gap-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <div className="relative group/color">
                                    <div className={`w-8 h-8 rounded-xl ${sys.color} shadow-inner`}></div>
                                    <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover/color:opacity-100 flex flex-wrap gap-1 p-1 bg-white shadow-2xl rounded-xl z-50 transition-opacity">
                                        {availableColors.map(c => <button key={c} onClick={() => updateFluidSystem(sys.id, 'color', c)} className={`w-3 h-3 ${c} rounded-sm`}></button>)}
                                    </div>
                                </div>
                                <input value={sys.label} onChange={e => updateFluidSystem(sys.id, 'label', e.target.value)} className="bg-transparent border-none text-[12px] font-black uppercase w-24 focus:ring-0" />
                                <button onClick={() => deleteFluidSystem(sys.id)} className="text-zinc-300 hover:text-red-500 transition-colors"><Icon name="x" size={18} /></button>
                            </div>
                        ))}
                        <button onClick={addFluidSystem} className="text-xs font-black text-halliburton-red hover:text-red-700 flex items-center gap-2 p-4 transition-colors"><Icon name="plus-circle" size={20} /> Nuevo Sistema</button>
                    </div>
                </div>
            )}

            {/* CANVAS WRAPPER FOR SCROLL */}
            <div className="overflow-x-auto rounded-[2rem] md:rounded-[4rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-inner mb-20 bg-zinc-50 dark:bg-slate-950/40">
                <div
                    id="piletas-canvas"
                    onMouseDown={(e) => handleMouseDown(e)}
                    className="relative min-h-[1200px] min-w-[1000px] p-10 overflow-hidden"
                    style={{ cursor: (draggingPitId || resizingPitId) ? (resizingPitId ? 'se-resize' : 'grabbing') : 'default' }}
                >
                    <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#52525b 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>

                    {/* Selection Box Overlay */}
                    {selectionBox && (
                        <div
                            className="absolute bg-blue-500/10 border border-blue-500/50 z-[100] pointer-events-none rounded-sm"
                            style={{
                                left: selectionBox.x - (document.getElementById('piletas-canvas')?.getBoundingClientRect().left || 0),
                                top: selectionBox.y - (document.getElementById('piletas-canvas')?.getBoundingClientRect().top || 0),
                                width: selectionBox.w,
                                height: selectionBox.h
                            }}
                        />
                    )}

                    {pits.map(p => {
                        const isSelected = selectedIds.includes(p.id);
                        const curMax = parseFloat(p.maxVol) || 1;
                        const curVol = parseFloat(p.vol) || 0;
                        const fillPct = Math.min((curVol / curMax) * 100, 100);
                        const currentType = fluidSystems.find(t => t.id === p.type) || fluidSystems[0];

                        const baseW = 130;
                        const baseH = 220;
                        const wScale = p.w / baseW;
                        const hScale = p.h / baseH;
                        const globalScale = Math.min(wScale, hScale, 1.3);
                        const innerH = p.h;

                        return (
                            <div
                                key={p.id}
                                id={`pit-${p.id}`}
                                onMouseDown={(e) => handleMouseDown(e, p.id)}
                                className={`absolute ${isSelected ? 'ring-4 ring-blue-500/30 rounded-[22px]' : ''}`}
                                style={{
                                    left: `${p.x}px`,
                                    top: `${p.y}px`,
                                    zIndex: (draggingPitId === p.id || resizingPitId === p.id) ? 1000 : Math.floor(p.w * p.h),
                                    transition: (draggingPitId || resizingPitId || selectionBox) ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            >
                                <div
                                    className={`relative bg-white dark:bg-slate-900 border-[3px] shadow-2xl group/pit ${isSelected ? 'border-blue-500 shadow-blue-500/20' : 'border-zinc-300 dark:border-slate-700 shadow-black/10'} ${draggingPitId === p.id ? 'shadow-red-500/20' : ''}`}
                                    style={{
                                        width: `${p.w + (24 * globalScale)}px`,
                                        padding: `${12 * globalScale}px`,
                                        borderRadius: `${20 * globalScale}px`,
                                        transition: (resizingPitId === p.id) ? 'none' : 'transform 0.2s',
                                        marginTop: '8px'
                                    }}
                                >
                                    <div className="move-handle absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-4 bg-zinc-200 dark:bg-slate-700 rounded-t-md border-x border-t border-zinc-300 dark:border-slate-600 flex flex-col gap-0.5 items-center justify-center cursor-grab active:cursor-grabbing shadow-sm z-20 hover:bg-zinc-100 dark:hover:bg-slate-600 transition-colors opacity-80 hover:opacity-100">
                                        <div className="w-5 h-0.5 bg-zinc-400 dark:bg-slate-500 rounded-full"></div>
                                        <div className="w-5 h-0.5 bg-zinc-400 dark:bg-slate-500 rounded-full opacity-30"></div>
                                    </div>

                                    <div className="flex items-center gap-1 px-1" style={{ marginBottom: `${8 * globalScale}px` }}>
                                        <input
                                            value={p.name}
                                            onChange={e => updatePit(p.id, 'name', e.target.value)}
                                            onKeyDown={handleEnter}
                                            style={{ fontSize: `${Math.max(13, 11 * globalScale)}px`, width: '100%' }}
                                            className="bg-transparent border-none font-black uppercase text-zinc-500 focus:ring-0 truncate italic tracking-wider transition-colors mr-2 text-left"
                                        />
                                    </div>

                                    <button
                                        onClick={() => deletePit(p.id)}
                                        className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 text-zinc-400 hover:text-red-500 hover:scale-110 transition-all p-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm opacity-0 group-hover/pit:opacity-100 z-50"
                                    >
                                        <Icon name="trash-2" size={14} />
                                    </button>

                                    <div
                                        className="relative bg-zinc-100 dark:bg-slate-800 border-[1.5px] border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col justify-end shadow-inner"
                                        style={{
                                            width: `${p.w}px`,
                                            height: `${p.h}px`,
                                            borderRadius: `${14 * globalScale}px`,
                                            transition: (resizingPitId === p.id) ? 'none' : 'all 0.3s'
                                        }}
                                    >
                                        <div
                                            className={`w-full transition-all duration-1000 ease-in-out ${currentType.color} relative pt-1`}
                                            style={{ height: `${fillPct}%` }}
                                        >
                                            <div className="absolute top-0 left-0 right-0 bg-white/20 animate-pulse" style={{ height: `${Math.min(6, 6 * hScale)}px` }}></div>
                                        </div>

                                        {/* Value Overlay */}
                                        <div className={`absolute inset-0 flex flex-col items-center p-2 text-center pointer-events-none ${innerH < 120 ? 'justify-start pt-1' : 'justify-center'}`}>
                                            <div className="flex flex-col items-center pointer-events-auto w-full">
                                                <div className={`flex items-baseline justify-center gap-1 w-full backdrop-blur-[3px] rounded-xl py-1 px-2 border border-white/20 shadow-sm transition-all ${((currentType.color === 'bg-zinc-900' && fillPct > 80) || (currentType.color !== 'bg-zinc-900' && fillPct > 82)) ? 'bg-black/40' : 'bg-black/20 dark:bg-white/10'}`}>
                                                    <input
                                                        type="number"
                                                        value={p.vol}
                                                        onChange={e => updatePit(p.id, 'vol', e.target.value)}
                                                        onKeyDown={handleEnter}
                                                        style={{
                                                            fontSize: `${Math.max(18, Math.min(32 * globalScale, innerH > 60 ? 32 * globalScale : innerH * 0.5))}px`,
                                                            lineHeight: 1,
                                                            textShadow: ((currentType.color === 'bg-zinc-900' && fillPct > 80) || (currentType.color !== 'bg-zinc-900' && fillPct > 82)) ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                                                        }}
                                                        className={`bg-transparent border-none text-center font-black focus:ring-0 ${((currentType.color === 'bg-zinc-900' && fillPct > 80) || (currentType.color !== 'bg-zinc-900' && fillPct > 82)) ? 'text-white' : 'text-zinc-900 dark:text-white'} w-full transition-colors`}
                                                    />
                                                    {innerH > 75 && (
                                                        <span style={{ fontSize: `${Math.max(12, 11 * globalScale)}px` }}
                                                            className={`font-black uppercase tracking-widest ${((currentType.color === 'bg-zinc-900' && fillPct > 80) || (currentType.color !== 'bg-zinc-900' && fillPct > 82)) ? 'text-white/80' : 'text-zinc-600 dark:text-white/80'}`}>
                                                            {unitMode === 'metric' ? 'm³' : 'bbl'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Details */}
                                        <div className={`absolute bottom-1 inset-x-1 flex justify-between items-center bg-black/60 backdrop-blur-lg border border-white/10 transition-all ${innerH < 65 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}
                                            style={{ padding: `${3 * globalScale}px ${14 * globalScale}px`, borderRadius: `${10 * globalScale}px` }}>
                                            <div className="flex flex-col items-baseline leading-none">
                                                <span className="font-black text-white/50 uppercase tracking-tighter" style={{ fontSize: `${Math.max(9, 8 * globalScale)}px` }}>{getDensLabel()}</span>
                                                <input
                                                    value={displayDens(p.density)}
                                                    onChange={e => updatePit(p.id, 'density', parseDens(e.target.value))}
                                                    style={{ fontSize: `${Math.max(13, 11 * globalScale)}px`, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                                    className="w-12 bg-transparent border-none font-bold text-white p-0 focus:ring-0 leading-none"
                                                />
                                            </div>
                                            <div className="flex flex-col items-end leading-none">
                                                <span className="font-black text-white/50 uppercase tracking-tighter" style={{ fontSize: `${Math.max(9, 8 * globalScale)}px` }}>CAP</span>
                                                <input
                                                    value={p.maxVol}
                                                    onChange={e => updatePit(p.id, 'maxVol', e.target.value)}
                                                    style={{ fontSize: `${Math.max(13, 11 * globalScale)}px`, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                                    className="w-12 bg-transparent border-none font-bold text-right text-white p-0 focus:ring-0 leading-none"
                                                />
                                            </div>
                                        </div>

                                    </div>

                                    <div className="relative" style={{ marginTop: `${8 * globalScale}px` }}>
                                        <select
                                            value={p.type}
                                            onChange={e => updatePit(p.id, 'type', e.target.value)}
                                            style={{
                                                fontSize: `${Math.max(12, 9 * globalScale)}px`,
                                                padding: `${6 * globalScale}px ${24 * globalScale}px ${6 * globalScale}px ${10 * globalScale}px`,
                                                borderRadius: `${10 * globalScale}px`
                                            }}
                                            className="w-full bg-zinc-50 dark:bg-slate-800/80 border border-zinc-200 dark:border-zinc-700 font-black uppercase text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-halliburton-red/30 transition-all appearance-none cursor-pointer shadow-sm hover:bg-white dark:hover:bg-slate-700"
                                        >
                                            {fluidSystems.map(fs => (
                                                <option key={fs.id} value={fs.id} className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-white">{fs.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500">
                                            <Icon name="chevron-down" size={Math.max(12, 10 * globalScale)} />
                                        </div>
                                    </div>

                                    <div className="resize-handle absolute -bottom-2 -right-2 w-8 h-8 bg-zinc-600 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center cursor-se-resize shadow-lg opacity-0 group-hover/pit:opacity-100 transition-all z-50 hover:bg-halliburton-red hover:scale-110">
                                        <Icon name="maximize-2" size={14} className="text-white rotate-90" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PiletasSystem;
