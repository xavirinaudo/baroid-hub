import React, { useState, useEffect, useMemo } from 'react';
import Icon from './Icon';
import html2pdf from 'html2pdf.js';

const InventoryConciliation = ({ isEditing }) => {
    // Master Products State
    const [products, setProducts] = useState(() => {
        const saved = localStorage.getItem('baroid_products_inventory_v2');
        return saved ? JSON.parse(saved) : [
            { id: '1', name: 'LIME FG – Cal', factor: 20, order: 1 },
            { id: '2', name: 'BARABLOK™ 400 NA', factor: 25, order: 2 },
            { id: '3', name: 'BARACARB®-DF FINE', factor: 25, order: 3 },
            { id: '4', name: 'BARACARB®-DF MEDIUM', factor: 25, order: 4 },
            { id: '5', name: 'BARACARB®-DF COARSE', factor: 25, order: 5 },
            { id: '6', name: 'GELTONE® II', factor: 22.7, order: 6 },
            { id: '7', name: 'BDF™-965 FINE', factor: 25, order: 7 },
            { id: '8', name: 'BDF™-965 MEDIUM', factor: 25, order: 8 },
            { id: '9', name: 'BaraShield®-982', factor: 22.7, order: 9 },
            { id: '10', name: 'BaraShield®-981', factor: 22.7, order: 10 },
            { id: '11', name: 'BaraFLC®-903', factor: 22.7, order: 11 },
            { id: '12', name: 'BaraSeal™-957', factor: 22.7, order: 12 },
            { id: '13', name: 'STOPPIT™', factor: 22.7, order: 13 },
            { id: '14', name: 'OBTURANTE MEZCLA', factor: 25, order: 14 },
            { id: '15', name: 'EZ MUL® LA', factor: 1, order: 15 },
            { id: '16', name: 'CLAY GRABBER®', factor: 18.9, order: 16 },
            { id: '17', name: 'CLAY SYNC™ II', factor: 22.7, order: 17 },
            { id: '18', name: 'BARA-DEFOAM® HP', factor: 18.9, order: 18 },
            { id: '19', name: 'OMC® 3', factor: 25, order: 19 },
            { id: '20', name: 'THERMA-THIN YPF', factor: 18.9, order: 20 },
            { id: '21', name: 'XLR-RATE™', factor: 1, order: 21 },
            { id: '22', name: 'DRILTREAT®', factor: 1, order: 22 },
            { id: '23', name: 'INVERMUL® LA', factor: 1, order: 23 },
            { id: '24', name: 'RM-63™', factor: 208, order: 24 },
            { id: '25', name: 'BAROFIBRE®', factor: 11.34, order: 25 },
            { id: '26', name: 'BARAZAN® D PLUS', factor: 25, order: 26 },
            { id: '27', name: 'CARBONOX®', factor: 22.7, order: 27 },
            { id: '28', name: 'PAC™-L', factor: 22.7, order: 28 },
            { id: '29', name: 'BENTONITA BOLSÓN', factor: 700, order: 29 },
            { id: '30', name: 'BENTONITA PALLET', factor: 20, order: 30 },
            { id: '31', name: 'SODA ASH', factor: 25, order: 31 },
            { id: '32', name: 'SODA CÁUSTICA', factor: 25, order: 32 },
            { id: '33', name: 'Potassium chloride (KCl)', factor: 25, order: 33 },
            { id: '34', name: 'BARAVIS W-637', factor: 10, order: 34 },
            { id: '35', name: 'TS PLUS YPF', factor: 11.34, order: 35 },
            { id: '36', name: 'CALCIUM CHLORIDE BRINE (YPF)', factor: 1, order: 36 },
            { id: '37', name: 'BARITA EN BOLSONES', factor: 1.5, order: 37 },
            { id: '38', name: 'Cloruro de Calcio', factor: 25, order: 38 },
            { id: '39', name: 'BARITA EN SILO', factor: 1, order: 39 },
            { id: '40', name: 'INVERMUL®', factor: 208, order: 40 },
            { id: '41', name: 'LE SUPERMUL™', factor: 1, order: 41 },
            { id: '42', name: 'TAU-MOD®', factor: 22.7, order: 42 }
        ];
    });

    // Inventory Entries State
    const getInitialEntries = () => Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        productId: '',
        physical: '',
        software: '',
        searchTerm: ''
    }));

    const [entries, setEntries] = useState(() => {
        const saved = localStorage.getItem('baroid_inventory_entries_v1');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.length > 0 ? parsed : getInitialEntries();
        }
        return getInitialEntries();
    });

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', factor: '1', order: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'custom', direction: 'asc' });

    // Persistence
    useEffect(() => {
        localStorage.setItem('baroid_products_inventory_v2', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        localStorage.setItem('baroid_inventory_entries_v1', JSON.stringify(entries));
    }, [entries]);


    // Handlers
    const sortedProducts = useMemo(() => [...products].sort((a, b) => (parseFloat(a.order) || 0) - (parseFloat(b.order) || 0)), [products]);

    const displayEntries = useMemo(() => {
        const sorted = [...entries].sort((a, b) => {
            const prodA = products.find(p => p.id === a.productId);
            const prodB = products.find(p => p.id === b.productId);

            if (sortConfig.key === 'custom') {
                const orderA = prodA ? (parseFloat(prodA.order) || 0) : Infinity;
                const orderB = prodB ? (parseFloat(prodB.order) || 0) : Infinity;
                return sortConfig.direction === 'asc' ? orderA - orderB : orderB - orderA;
            } else if (sortConfig.key === 'name') {
                const nameA = prodA ? prodA.name.toLowerCase() : (a.searchTerm || '').toLowerCase() || 'zzz';
                const nameB = prodB ? prodB.name.toLowerCase() : (b.searchTerm || '').toLowerCase() || 'zzz';
                return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            }
            return 0;
        });
        return sorted;
    }, [entries, products, sortConfig]);

    const addEntry = () => setEntries([...entries, { id: Date.now(), productId: '', physical: '', software: '', searchTerm: '' }]);

    const updateEntry = (id, field, val) => {
        setEntries(prev => prev.map(e => e.id === id ?
            (typeof field === 'string' ? { ...e, [field]: val } : { ...e, ...field })
            : e));
    };

    const removeEntry = (id) => {
        if (entries.length > 1) setEntries(entries.filter(e => e.id !== id));
        else setEntries(getInitialEntries().slice(0, 1));
    };

    const clearForm = () => {
        if (confirm('¿Desea limpiar todos los datos del formulario?')) {
            setEntries(getInitialEntries());
        }
    };

    // PDF Export
    const exportPDF = () => {
        const element = document.getElementById('inventory-report-container');
        const date = new Date().toLocaleDateString();
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) document.documentElement.classList.remove('dark');

        const opt = {
            margin: 10,
            filename: `Conciliacion_Inventario_${date.replace(/[/:\s]/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().from(element).set(opt).save().then(() => {
            if (isDark) document.documentElement.classList.add('dark');
        });
    };

    // Product Management
    const addProduct = () => {
        setNewProduct({ name: '', factor: '1', order: products.length + 1 });
        setShowAddModal(true);
    };

    const handleSaveProduct = () => {
        if (!newProduct.name || !newProduct.factor) {
            alert('Por favor complete el nombre y el factor.');
            return;
        }
        setProducts([...products, {
            id: Date.now().toString(),
            name: newProduct.name,
            factor: parseFloat(newProduct.factor) || 1,
            order: parseInt(newProduct.order) || products.length + 1
        }]);
        setShowAddModal(false);
    };

    const updateProduct = (id, field, val) => setProducts(products.map(p => p.id === id ? { ...p, [field]: val } : p));
    const removeProduct = (id) => setProducts(products.filter(p => p.id !== id));

    // CSV Import
    const importCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const newProducts = lines.slice(1).map((line, idx) => {
                const parts = line.split(',');
                if (parts.length < 2) return null;
                return {
                    id: Date.now() + idx,
                    name: parts[0].trim(),
                    factor: parseFloat(parts[1]) || 1,
                    order: idx + 1
                };
            }).filter(p => p !== null);
            if (newProducts.length > 0) {
                setProducts(newProducts);
                alert(`Se cargaron ${newProducts.length} productos.`);
            }
        };
        reader.readAsText(file);
    };

    const downloadCSVTemplate = () => {
        const csvContent = "Producto,Factor (kg/L)\nBAROID,1.0\nGELTONE II,22.7\nRM-63,208.0\nLIME FG,20.0";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_inventario_baroid.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="animate-fade-in space-y-4 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 md:p-4 bg-halliburton-red rounded-3xl shadow-lg shadow-red-900/20">
                        <Icon name="clipboard-check" size={24} className="text-white md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-zinc-800 dark:text-white title-font leading-tight">Panel de Inventario</h3>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Conciliación de Inventario</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${isSettingsOpen ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl' : 'bg-white dark:bg-slate-800 text-zinc-500 border-zinc-100 dark:border-zinc-700 hover:border-halliburton-red'}`}
                    >
                        <Icon name={isSettingsOpen ? "check" : "settings"} size={14} />
                        <span className="hidden sm:inline">{isSettingsOpen ? 'Finalizar Configuración' : 'Configurar Productos'}</span>
                        <span className="sm:hidden">{isSettingsOpen ? 'Listo' : 'Config'}</span>
                    </button>
                    <button
                        onClick={exportPDF}
                        className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-halliburton-red text-white shadow-xl hover:bg-red-700"
                    >
                        <Icon name="file-text" size={14} /> <span>PDF</span>
                    </button>
                </div>
            </div>

            {/* Settings (Master List) */}
            {isSettingsOpen && (
                <div className="bg-zinc-50 dark:bg-slate-900/50 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 animate-fade-in space-y-6 md:space-y-8">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <h4 className="text-xl font-black uppercase italic text-zinc-700 dark:text-zinc-300">Maestro de Productos</h4>
                        <div className="flex gap-2 md:gap-4">
                            <button onClick={() => setShowImportModal(true)} className="bg-zinc-200 dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 px-4 py-2 md:px-6 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Importar CSV</button>
                            <button onClick={addProduct} className="btn-primary px-4 py-2 md:px-6 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">+ Nuevo</button>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar pr-2 md:pr-4">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-zinc-50 dark:bg-slate-950 z-10">
                                <tr className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                                    <th className="pb-4 px-2 w-16 md:w-20 text-center">Orden</th>
                                    <th className="pb-4 px-2">Producto</th>
                                    <th className="pb-4 px-2 w-32 md:w-48">Factor (kg/L) por UM</th>
                                    <th className="pb-4 px-2 w-10 md:w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {products.map(p => (
                                    <tr key={p.id} className="group hover:bg-zinc-100 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-2 md:py-4 px-2 text-center">
                                            <input type="number" value={p.order} onChange={e => updateProduct(p.id, 'order', e.target.value)} className="w-full input-style !py-1 !px-1 md:!py-2 md:!px-2 text-center font-bold text-xs" />
                                        </td>
                                        <td className="py-2 md:py-4 px-2">
                                            <input type="text" value={p.name} onChange={e => updateProduct(p.id, 'name', e.target.value)} className="w-full input-style !py-1 !px-2 md:!py-2 md:!px-4 text-xs" placeholder="Nombre" />
                                        </td>
                                        <td className="py-2 md:py-4 px-2">
                                            <div className="relative">
                                                <input type="number" value={p.factor} onChange={e => updateProduct(p.id, 'factor', e.target.value)} className="w-full input-style !py-1 !px-2 md:!py-2 md:!px-4 font-black text-xs" placeholder="Factor" />
                                                <span className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400 uppercase hidden sm:inline">Kg/L</span>
                                            </div>
                                        </td>
                                        <td className="py-2 md:py-4 px-2 text-right">
                                            <button onClick={() => removeProduct(p.id)} className="p-1 md:p-2 text-zinc-300 hover:text-halliburton-red transition-all transform hover:scale-110">
                                                <Icon name="trash-2" size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Report Table */}
            <div id="inventory-report-container" className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="mb-4 text-center md:text-left md:hidden block space-y-2">
                    <h2 className="text-xl font-black uppercase">Inventario Físico</h2>
                    <p className="text-xs text-zinc-500">{new Date().toLocaleDateString()}</p>
                </div>

                <div className="overflow-x-auto pb-4">
                    <table className="w-full text-left border-separate border-spacing-y-1 min-w-[900px]">
                        <thead>
                            <tr className="text-[9px] font-black uppercase text-zinc-400 tracking-widest px-4">
                                <th
                                    className="pb-2 px-4 w-1/4 cursor-pointer hover:text-halliburton-red transition-colors group"
                                    onClick={() => {
                                        if (sortConfig.key === 'name') {
                                            setSortConfig({ key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                                        } else {
                                            setSortConfig({ key: 'name', direction: 'asc' });
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        Producto
                                        <div className={`transition-all ${sortConfig.key === 'name' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={10} />
                                        </div>
                                    </div>
                                </th>
                                <th className="pb-2 px-4 text-center w-24">Cant (UM)</th>
                                <th className="pb-2 px-4 text-center">Físico (kg/L)</th>
                                <th className="pb-2 px-4 text-center w-40">Stock (kg/L)</th>
                                <th className="pb-2 px-4 text-center">Dif. (kg/L)</th>
                                <th className="pb-2 px-4 text-center">Dif. (UM)</th>
                                <th className="pb-2 px-4 text-center w-32">Estado</th>
                                <th
                                    className="pb-2 px-4 w-10 text-center cursor-pointer hover:text-halliburton-red transition-colors group"
                                    onClick={() => {
                                        if (sortConfig.key === 'custom') {
                                            setSortConfig({ key: 'custom', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                                        } else {
                                            setSortConfig({ key: 'custom', direction: 'asc' });
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-center" title="Ordenar por Orden Maestro">
                                        <Icon name={sortConfig.key === 'custom' ? (sortConfig.direction === 'asc' ? 'arrow-down-01' : 'arrow-up-10') : 'sort-asc'} size={12} className={sortConfig.key === 'custom' ? 'text-halliburton-red' : ''} />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayEntries.map(e => {
                                const prod = products.find(p => p.id === e.productId);
                                const factor = prod ? parseFloat(prod.factor) || 0 : 0;
                                const physUM = parseFloat(e.physical) || 0;
                                const softWS = parseFloat(e.software) || 0;

                                const physKgL = physUM * factor;
                                const diffKgL = physKgL - softWS;
                                const diffUM = factor !== 0 ? diffKgL / factor : 0;

                                let statusKey = "OK";
                                let bgClass = "bg-green-500/10 text-green-600 ring-green-500/30";
                                if (diffKgL < -0.01) {
                                    statusKey = "FALTA";
                                    bgClass = "bg-red-500/10 text-red-600 ring-red-500/30";
                                } else if (diffKgL > 0.01) {
                                    statusKey = "SOBRA";
                                    bgClass = "bg-yellow-500/10 text-yellow-600 ring-yellow-500/30";
                                }

                                return (
                                    <tr key={e.id} className="group/row transition-all bg-zinc-50/50 dark:bg-slate-800/10 hover:bg-zinc-100 dark:hover:bg-slate-800/30">
                                        <td className="py-0.5 px-3 rounded-l-xl relative">
                                            <div className="relative group/select">
                                                <input
                                                    type="text"
                                                    value={prod ? prod.name : (e.searchTerm || '')}
                                                    onChange={(val) => {
                                                        const term = val.target.value;
                                                        updateEntry(e.id, 'searchTerm', term);
                                                        if (prod && term !== prod.name) {
                                                            updateEntry(e.id, 'productId', '');
                                                        }
                                                    }}
                                                    onKeyDown={(evt) => {
                                                        if (evt.key === 'Tab' && !e.productId && (e.searchTerm || '').length > 0) {
                                                            const filtered = sortedProducts.filter(p => p.name.toLowerCase().includes((e.searchTerm || '').toLowerCase()));
                                                            if (filtered.length > 0) {
                                                                const bestMatch = filtered[0];
                                                                updateEntry(e.id, { productId: bestMatch.id, searchTerm: bestMatch.name, isDropdownOpen: false });
                                                            }
                                                        }
                                                    }}
                                                    onFocus={() => updateEntry(e.id, 'isDropdownOpen', true)}
                                                    onBlur={() => setTimeout(() => updateEntry(e.id, 'isDropdownOpen', false), 250)}
                                                    placeholder="Buscar..."
                                                    className="w-full input-style !py-1.5 !px-3 font-bold pr-8 text-[11px]"
                                                />
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                                                    <Icon name="chevron-down" size={12} />
                                                </div>

                                                {e.isDropdownOpen && (
                                                    <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1">
                                                        {sortedProducts
                                                            .filter(p => !e.searchTerm || p.name.toLowerCase().includes((e.searchTerm || '').toLowerCase()))
                                                            .map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => {
                                                                        updateEntry(e.id, { productId: p.id, searchTerm: p.name, isDropdownOpen: false });
                                                                    }}
                                                                    className="w-full text-left px-5 py-3 hover:bg-halliburton-red hover:text-white transition-colors text-sm font-bold flex items-center justify-between group/item"
                                                                >
                                                                    <span className="truncate">{p.name}</span>
                                                                    <span className="text-[9px] opacity-40 group-hover/item:opacity-100 uppercase tracking-widest">{p.factor} Kg/L</span>
                                                                </button>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-0.5 px-3">
                                            <input
                                                type="number"
                                                value={e.physical}
                                                onChange={val => updateEntry(e.id, 'physical', val.target.value)}
                                                className="w-full input-style text-center !py-1.5 !px-1 font-black text-[11px]"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="py-0.5 px-3 text-center font-black text-zinc-500 dark:text-zinc-400 text-sm tabular-nums">
                                            {physKgL.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                        </td>
                                        <td className="py-0.5 px-3">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={e.software}
                                                    onChange={val => updateEntry(e.id, 'software', val.target.value)}
                                                    className="w-full input-style text-center !py-1.5 !px-1 font-black text-[11px]"
                                                    placeholder="Stock"
                                                />
                                            </div>
                                        </td>
                                        <td className={`py-0.5 px-3 text-center font-black text-lg tabular-nums ${diffKgL < -0.01 ? 'text-red-600' : (diffKgL > 0.01 ? 'text-yellow-600' : 'text-green-600')}`}>
                                            {diffKgL === 0 ? '0' : (diffKgL > 0 ? '+' : '') + diffKgL.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                        </td>
                                        <td className="py-0.5 px-3 text-center font-bold text-xs opacity-60 tabular-nums">
                                            {diffUM === 0 ? '-' : (diffUM > 0 ? '+' : '') + diffUM.toFixed(2)}
                                        </td>
                                        <td className="py-1 px-3">
                                            <div className={`px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-wider text-center ring-1 ring-inset ${bgClass}`}>
                                                {statusKey}
                                            </div>
                                        </td>
                                        <td className="py-0.5 px-3 rounded-r-xl text-center">
                                            <button onClick={() => removeEntry(e.id)} className="p-2 text-zinc-300 dark:text-zinc-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                                <Icon name="trash-2" size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 md:mt-12 pt-6 md:pt-10 border-t border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
                    <button
                        onClick={addEntry}
                        className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        <Icon name="plus" size={16} />
                        Agregar Producto
                    </button>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button onClick={clearForm} className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 bg-zinc-100 dark:bg-slate-800 text-zinc-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 dark:hover:bg-slate-700 transition-all">
                            <Icon name="refresh-ccw" size={14} className="inline mr-2" />
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .input-style {
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    transition: all 0.2s;
                    color: inherit;
                }
                .input-style:hover, .input-style:focus {
                    background: rgba(0,0,0,0.05);
                    border-color: rgba(0,0,0,0.1);
                    outline: none;
                }
                .dark .input-style:hover, .dark .input-style:focus {
                     background: rgba(255,255,255,0.05);
                     border-color: rgba(255,255,255,0.1);
                }
            `}</style>

            {/* ... Modal implementations same as before but ensured styling consistency ... */}
            {showImportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/20 p-10 space-y-8 animate-modal-in overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => setShowImportModal(false)} className="text-zinc-400 hover:text-halliburton-red transition-colors">
                                <Icon name="x" size={24} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-zinc-800 dark:text-white title-font">Importar</h3>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">CSV</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button onClick={downloadCSVTemplate} className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-halliburton-red group transition-all">
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                                    <Icon name="download" size={24} className="text-halliburton-red" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">Plantilla</span>
                            </button>
                            <label className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-halliburton-red group cursor-pointer transition-all">
                                <input type="file" accept=".csv" className="hidden" onChange={(e) => { importCSV(e); setShowImportModal(false); }} />
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                                    <Icon name="upload" size={24} className="text-halliburton-red" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">Subir CSV</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/20 p-8 md:p-10 space-y-6 md:space-y-8 animate-modal-in">
                        <div className="space-y-2 text-center">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-zinc-800 dark:text-white title-font">Nuevo Producto</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">Nombre</label>
                                <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full input-style !py-4 !px-6 text-lg font-bold bg-zinc-50 dark:bg-slate-800 border-zinc-200 dark:border-zinc-700" placeholder="Ej: GELTONE II" autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">Factor</label>
                                    <input type="number" value={newProduct.factor} onChange={e => setNewProduct({ ...newProduct, factor: e.target.value })} className="w-full input-style !py-4 !px-6 text-lg font-black bg-zinc-50 dark:bg-slate-800 border-zinc-200 dark:border-zinc-700" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">Orden</label>
                                    <input type="number" value={newProduct.order} onChange={e => setNewProduct({ ...newProduct, order: e.target.value })} className="w-full input-style !py-4 !px-6 text-lg font-bold text-center bg-zinc-50 dark:bg-slate-800 border-zinc-200 dark:border-zinc-700" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 px-8 py-5 bg-zinc-100 dark:bg-slate-800 text-zinc-500 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all">Cancelar</button>
                            <button onClick={handleSaveProduct} className="flex-1 px-8 py-5 btn-primary rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryConciliation;
