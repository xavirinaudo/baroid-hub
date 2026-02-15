import React from 'react';
import Icon from './Icon';

const FloatingNotes = ({ notes, setNotes, showNotes, setShowNotes }) => {
    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
            <div className={`notes-window glass-morphism w-80 h-96 rounded-[2.5rem] p-8 shadow-2xl flex flex-col ${showNotes ? 'visible' : 'hidden'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-halliburton-red rounded-lg flex items-center justify-center shadow-lg">
                            <Icon name="sticky-note" size={16} className="text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-white">Notas Rápidas</span>
                    </div>
                    <button onClick={() => setShowNotes(false)} className="text-zinc-400 hover:text-halliburton-red transition-colors">
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Escribe algo aquí..."
                    className="flex-1 w-full bg-transparent border-none resize-none focus:outline-none text-sm leading-relaxed custom-scrollbar notepad-area dark:text-zinc-200"
                ></textarea>
                <div className="mt-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-700/50 flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    <span>Autoguardado</span>
                    <Icon name="save" size={12} />
                </div>
            </div>

            <button
                onClick={() => setShowNotes(!showNotes)}
                className="notes-bubble w-16 h-16 bg-halliburton-red rounded-full flex items-center justify-center text-white shadow-2xl relative"
            >
                <Icon name={showNotes ? "chevron-down" : "pencil"} size={28} />
                {!showNotes && notes.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-800 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-black">
                        <Icon name="check" size={8} />
                    </div>
                )}
            </button>
        </div>
    );
};

export default FloatingNotes;
