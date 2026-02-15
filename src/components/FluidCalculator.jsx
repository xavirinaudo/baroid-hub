import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { glToPPG, ppgToGL, mToFt, ftToM, bblToM3, m3ToBbl, psiToKgCm2 } from '../utils/engineering';

const FluidCalculator = ({ isEditing }) => {
    // Component State
    const [activeTab, setActiveTab] = useState('dens');
    const [history, setHistory] = useState([]);

    // Density State
    const [dens, setDens] = useState({ v1: '', d1: '', v2: '', d2: '', dTarget: '' });

    // Pump Output State
    const [pump, setPump] = useState({ id: '', stroke: '', liners: [{ id: Date.now(), od: '', eff: '95' }] });
    const [cylConstant, setCylConstant] = useState(0.000243); // Default factor

    // Volume State
    const [vol, setVol] = useState({ wellDepth: '', holeDiam: '', pipeOd: '', pipeId: '' });

    // Annular Velocity & ECD State
    const [hyd, setHyd] = useState({ flow: '', hole: '', dp: '', mw: '', visc: '' });

    // Slug State
    const [slug, setSlug] = useState({
        dpId: '',
        dpOd: '',
        currentMudWeight: '',
        slugWeight: '',
        lenDry: '',
        useAdvanced: false,
        valveResistance: '',
        sbp: ''
    });

    // Integrity (FIT/LOT) State
    const [fit, setFit] = useState({
        depthShoe: '', // TVD Shoe
        mudWeight: '',
        testPressure: '', // Target EMW or Pressure Input
        isLot: false
    });

    // Unit Mode
    const [unitMode, setUnitMode] = useState('field');

    // Engineering State
    const [eng, setEng] = useState({ dens: '', depth: '', diam: '' });

    // Barite State
    const [barite, setBarite] = useState({ vol: '', d1: '', d2: '', sg: '4.2' });

    // Load saved tabs state
    useEffect(() => {
        const saved = localStorage.getItem('baroid_calc_tabs_v3');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.activeTab) setActiveTab(data.activeTab);
            if (data.history) setHistory(data.history);
        }
    }, []);

    // Save tabs state
    useEffect(() => {
        localStorage.setItem('baroid_calc_tabs_v3', JSON.stringify({ activeTab, history }));
    }, [activeTab, history]);

    const addToHistory = (title, result) => {
        const newItem = { id: Date.now(), title, result, time: new Date().toLocaleTimeString() };
        setHistory(prev => [newItem, ...prev].slice(0, 10));
    };

    // --- Calculation Logic ---

    // 1. Density Adjustment
    const calcDens = () => {
        const v1 = parseFloat(dens.v1) || 0;
        const d1 = parseFloat(dens.d1) || 0;
        const d2 = parseFloat(dens.d2) || 0;
        const dt = parseFloat(dens.dTarget) || 0;

        if (v1 > 0 && d1 > 0 && dt > 0) {
            if (d2 === dt) return "Error";
            const v2_req = v1 * (dt - d1) / (d2 - dt);
            if (v2_req < 0) return "Imposible";

            addToHistory("Ajuste Densidad", `Vol. a agregar: ${v2_req.toFixed(2)} bbl`);
            return v2_req.toFixed(2);
        }
        return "---";
    };

    // 2. Pump Output
    const calcPump = () => {
        const L = parseFloat(pump.stroke) || 0;
        const linerStr = pump.liners[0]?.od || '0';
        const Liner = parseFloat(linerStr) || 0;
        const eff = parseFloat(pump.liners[0]?.eff) / 100 || 0.95;

        if (L > 0 && Liner > 0) {
            const output = cylConstant * (Liner * Liner) * L * eff; // bbl/stk
            return output.toFixed(4);
        }
        return "---";
    };

    // 3. Capacities (Hole/Pipe)
    const calcVol = () => {
        const id = parseFloat(vol.holeDiam) || parseFloat(vol.pipeId) || 0;
        if (id > 0) {
            const cap = (id * id) / 1029.4;
            return cap.toFixed(5) + " bbl/ft";
        }
        return "---";
    };

    // 4. Slug Calculation
    const calcSlug = () => {
        const dpId = parseFloat(slug.dpId) || 0;
        const mw = parseFloat(slug.currentMudWeight) || 0;
        const sw = parseFloat(slug.slugWeight) || 0;
        const l_dry = parseFloat(slug.lenDry) || 0;

        const useAdv = slug.useAdvanced;
        const v_res = parseFloat(slug.valveResistance) || 0;
        const sbp = parseFloat(slug.sbp) || 0;

        if (mw > 0 && sw > 0 && l_dry > 0 && dpId > 0 && sw > mw) {
            const k = 0.052;
            let numerator = k * mw * l_dry;
            if (useAdv) {
                numerator += (sbp - v_res);
            }
            const denominator = k * (sw - mw);

            if (denominator <= 0) return "Error";

            const h_slug_ft = numerator / denominator;
            const cap_bbl_ft = (dpId * dpId) / 1029.4;
            const vol_slug_bbl = h_slug_ft * cap_bbl_ft;

            return {
                h_slug: h_slug_ft.toFixed(1),
                vol_slug: vol_slug_bbl.toFixed(2)
            };
        }
        return { h_slug: "0.0", vol_slug: "0.00" };
    };

    const slugResult = calcSlug();

    // 5. FIT / LOT Calculation
    const calcFIT = () => {
        const tvd = parseFloat(fit.depthShoe) || 0;
        const mw = parseFloat(fit.mudWeight) || 0;
        // Interpret input as Target EMW (ppg) -> Output Pressure (psi)
        const targetEMW = parseFloat(fit.testPressure) || 0;

        if (tvd > 0 && mw > 0 && targetEMW > 0) {
            const press = (targetEMW - mw) * 0.052 * tvd;
            return press.toFixed(0);
        }
        return "---";
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-fade-in relative overflow-hidden">
            {/* Tabs Header */}
            <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-10 border-b border-zinc-100 dark:border-zinc-800 pb-4 md:pb-6 overflow-x-auto">
                {[
                    { id: 'dens', icon: 'droplet', label: 'Densidad' },
                    { id: 'slug', icon: 'chevrons-down', label: 'Slug' },
                    { id: 'fit', icon: 'shield', label: 'FIT' },
                    { id: 'vol', icon: 'cylinder', label: 'Volumen' },
                    { id: 'pump', icon: 'activity', label: 'Bomba' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'bg-halliburton-red text-white shadow-lg' : 'bg-zinc-50 dark:bg-slate-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-700'}`}
                    >
                        <Icon name={tab.icon} size={16} />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px] md:min-h-[400px]">
                {/* DENSITY TAB */}
                {activeTab === 'dens' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-fade-in">
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-xl md:text-2xl font-black italic uppercase text-zinc-800 dark:text-white">Ajuste de Densidad</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-1.5">
                                    <label className="label-style">Volumen Inicial (bbl)</label>
                                    <input type="number" value={dens.v1} onChange={e => setDens({ ...dens, v1: e.target.value })} className="input-style" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">Densidad Inicial (ppg)</label>
                                    <input type="number" value={dens.d1} onChange={e => setDens({ ...dens, d1: e.target.value })} className="input-style" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">Densidad Objetivo (ppg)</label>
                                    <input type="number" value={dens.dTarget} onChange={e => setDens({ ...dens, dTarget: e.target.value })} className="input-style font-black text-halliburton-red" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">Densidad Fluido Agregado (ppg)</label>
                                    <input type="number" value={dens.d2} onChange={e => setDens({ ...dens, d2: e.target.value })} className="input-style" placeholder="Ej: 8.33 (Agua)" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 flex flex-col justify-center items-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 mt-4 md:mt-0">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Volumen a Agregar</span>
                            <div className="text-4xl md:text-6xl font-black italic text-halliburton-dark dark:text-white mb-2">{calcDens()} <span className="text-xl md:text-2xl not-italic text-zinc-400">bbl</span></div>
                            <span className="text-[10px] md:text-xs font-bold text-zinc-500 max-w-xs block mt-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm">
                                Utilizando fluido de densidad {dens.d2 || '---'} ppg
                            </span>
                        </div>
                    </div>
                )}

                {/* SLUG TAB */}
                {activeTab === 'slug' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-fade-in">
                        <div className="space-y-4 md:space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl md:text-2xl font-black italic uppercase text-zinc-800 dark:text-white">Cálculo de Píldora</h3>
                                <div className="flex items-center gap-2">
                                    <label className="text-[9px] font-black uppercase text-zinc-400">Avanzado</label>
                                    <button
                                        onClick={() => setSlug({ ...slug, useAdvanced: !slug.useAdvanced })}
                                        className={`w-10 h-6 rounded-full p-1 transition-colors ${slug.useAdvanced ? 'bg-halliburton-red' : 'bg-zinc-200'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${slug.useAdvanced ? 'translate-x-4' : ''}`}></div>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-1.5">
                                    <label className="label-style">Densidad Lodo (ppg)</label>
                                    <input type="number" value={slug.currentMudWeight} onChange={e => setSlug({ ...slug, currentMudWeight: e.target.value })} className="input-style" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">Densidad Píldora (ppg)</label>
                                    <input type="number" value={slug.slugWeight} onChange={e => setSlug({ ...slug, slugWeight: e.target.value })} className="input-style font-black text-halliburton-red" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">Longitud Seca Deseada (ft)</label>
                                    <input type="number" value={slug.lenDry} onChange={e => setSlug({ ...slug, lenDry: e.target.value })} className="input-style" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">ID Tubería (in)</label>
                                    <input type="number" value={slug.dpId} onChange={e => setSlug({ ...slug, dpId: e.target.value })} className="input-style" placeholder="0" />
                                </div>

                                {slug.useAdvanced && (
                                    <>
                                        <div className="space-y-1.5 animate-fade-in">
                                            <label className="label-style">Resistencia Válvula (psi)</label>
                                            <input type="number" value={slug.valveResistance} onChange={e => setSlug({ ...slug, valveResistance: e.target.value })} className="input-style bg-amber-50 dark:bg-amber-900/10" placeholder="0" />
                                        </div>
                                        <div className="space-y-1.5 animate-fade-in">
                                            <label className="label-style">SBP (psi)</label>
                                            <input type="number" value={slug.sbp} onChange={e => setSlug({ ...slug, sbp: e.target.value })} className="input-style bg-amber-50 dark:bg-amber-900/10" placeholder="0" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 flex flex-col justify-center items-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 mt-4 md:mt-0">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Vol. Píldora Requerido</span>
                            <div className="text-4xl md:text-6xl font-black italic text-halliburton-dark dark:text-white mb-2">{slugResult.vol_slug} <span className="text-xl md:text-2xl not-italic text-zinc-400">bbl</span></div>
                            <div className="mt-4 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-sm">
                                <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400">Altura en Tubería</div>
                                <div className="text-xl md:text-2xl font-black text-halliburton-red">{slugResult.h_slug} ft</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* FIT TAB */}
                {activeTab === 'fit' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-fade-in">
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-xl md:text-2xl font-black italic uppercase text-zinc-800 dark:text-white">Integridad (FIT/LOT)</h3>
                            <div className="grid grid-cols-1 gap-4 md:gap-6">
                                <div className="space-y-1.5">
                                    <label className="label-style">Profundidad Zapata - TVD (ft)</label>
                                    <input type="number" value={fit.depthShoe} onChange={e => setFit({ ...fit, depthShoe: e.target.value })} className="input-style" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">Densidad Lodo Actual (ppg)</label>
                                    <input type="number" value={fit.mudWeight} onChange={e => setFit({ ...fit, mudWeight: e.target.value })} className="input-style" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">Densidad Equivalente Objetivo (ppg)</label>
                                    <input type="number" value={fit.testPressure} onChange={e => setFit({ ...fit, testPressure: e.target.value })} className="input-style font-black text-blue-600" placeholder="0" />
                                    <p className="text-[9px] text-zinc-400 italic">Ingrese el EMW que desea probar.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 flex flex-col justify-center items-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 mt-4 md:mt-0">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Presión en Superficie</span>
                            <div className="text-4xl md:text-6xl font-black italic text-halliburton-dark dark:text-white mb-2">{calcFIT()} <span className="text-xl md:text-2xl not-italic text-zinc-400">psi</span></div>
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg">Solo PSI</span>
                        </div>
                    </div>
                )}

                {/* VOLUMETRIC TAB */}
                {activeTab === 'vol' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-fade-in">
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-xl md:text-2xl font-black italic uppercase text-zinc-800 dark:text-white">Capacidades</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-1.5">
                                    <label className="label-style">Diámetro Agujero (in)</label>
                                    <input type="number" value={vol.holeDiam} onChange={e => setVol({ ...vol, holeDiam: e.target.value })} className="input-style" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">ID Tubería (in)</label>
                                    <input type="number" value={vol.pipeId} onChange={e => setVol({ ...vol, pipeId: e.target.value })} className="input-style" placeholder="0" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 flex flex-col justify-center items-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 mt-4 md:mt-0">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Capacidad Calculada</span>
                            <div className="text-3xl md:text-4xl font-black italic text-halliburton-dark dark:text-white mb-2">{calcVol()}</div>
                        </div>
                    </div>
                )}

                {/* PUMP TAB */}
                {activeTab === 'pump' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-fade-in">
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-xl md:text-2xl font-black italic uppercase text-zinc-800 dark:text-white">Output Bomba</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-1.5">
                                    <label className="label-style">Longitud Embolada (in)</label>
                                    <input type="number" value={pump.stroke} onChange={e => setPump({ ...pump, stroke: e.target.value })} className="input-style" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">Diámetro Camisa (in)</label>
                                    <input type="number" value={pump.liners[0]?.od} onChange={e => {
                                        const newLiners = [...pump.liners];
                                        newLiners[0] = { ...newLiners[0], od: e.target.value };
                                        setPump({ ...pump, liners: newLiners });
                                    }} className="input-style" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">Eficiencia (%)</label>
                                    <input type="number" value={pump.liners[0]?.eff} onChange={e => {
                                        const newLiners = [...pump.liners];
                                        newLiners[0] = { ...newLiners[0], eff: e.target.value };
                                        setPump({ ...pump, liners: newLiners });
                                    }} className="input-style" placeholder="95" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-style">Factor Cte.</label>
                                    <input type="number" value={cylConstant} onChange={e => setCylConstant(parseFloat(e.target.value))} className="input-style text-xs" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 flex flex-col justify-center items-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 mt-4 md:mt-0">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Desplazamiento</span>
                            <div className="text-4xl md:text-6xl font-black italic text-halliburton-dark dark:text-white mb-2">{calcPump()} <span className="text-xl md:text-2xl not-italic text-zinc-400">bbl/stk</span></div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .label-style {
                    font-size: 9px;
                    font-weight: 900;
                    text-transform: uppercase;
                    color: #A1A1AA;
                    letter-spacing: 0.1em;
                    margin-left: 4px;
                }
                @media (min-width: 768px) {
                    .label-style { font-size: 10px; }
                }
                .input-style {
                    width: 100%;
                    background: #F4F4F5;
                    border: 2px solid #E4E4E7; /* zinc-200 */
                    border-radius: 12px;
                    padding: 10px 14px;
                    font-size: 14px;
                    font-weight: 700;
                    color: #18181B; /* zinc-900 */
                    outline: none;
                    transition: all 0.2s;
                }
                .dark .input-style {
                    background: #1E293B; /* slate-800 */
                    border-color: #334155; /* slate-700 */
                    color: white;
                }
                .input-style:focus {
                    border-color: #CC0000;
                    box-shadow: 0 0 0 4px rgba(204, 0, 0, 0.1);
                }
            `}</style>
        </div>
    );
};

export default FluidCalculator;
