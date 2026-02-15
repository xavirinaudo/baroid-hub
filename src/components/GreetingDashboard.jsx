import React, { useState, useEffect } from 'react';
import Icon from './Icon';

const GreetingDashboard = () => {
    const [time, setTime] = useState(new Date());
    const [activeIndex, setActiveIndex] = useState(0);

    const messages = [
        {
            title: "Mainstays de BAROID",
            content: "Business Acquisition Process • Technical Process • Black Book • System Rationalization • People",
            icon: "target"
        },
        {
            title: "Propuesta de Valor",
            content: "Soluciones de fluidos personalizadas para maximizar el valor del pozo y activos del cliente.",
            icon: "trending-up"
        },
        {
            title: "Control Points (BSD)",
            content: "DoS Aprobado • Plan de Demanda Verificado • Ejecución Confirmada • Reporte Completado",
            icon: "shield-check"
        }
    ];

    const reminders = [
        { text: "Recorda hacer tus Observaciones en One View", icon: "eye" },
        { text: "Pedido de Laboratorio antes del Domingo", icon: "beaker" },
        { text: "Verificar stock de químicos críticos", icon: "clipboard-list" }
    ];

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        const syncTimer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % messages.length);
        }, 12000);
        return () => {
            clearInterval(timer);
            clearInterval(syncTimer);
        };
    }, []);

    const hours = time.getHours();
    const greeting = hours < 12 ? 'Buenos Días' : hours < 20 ? 'Buenas Tardes' : 'Buenas Noches';

    return (
        <div className="mb-14 p-10 pb-16 bg-gradient-to-br from-halliburton-red to-[#a30000] rounded-[3rem] text-white shadow-2xl relative overflow-hidden group animate-fade-in transition-all">
            {/* Background Icon Decoration */}
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Icon name="clock" size={120} />
            </div>

            {/* Bottom Ticker/Reminder Section */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/10 flex items-center px-10 border-t border-white/5">
                <div className="flex items-center gap-2 animate-fade-in" key={activeIndex}>
                    <Icon name={reminders[activeIndex].icon} size={12} className="text-white/40" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Recordatorio:</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">{reminders[activeIndex].text}</span>
                </div>
            </div>

            <div className="relative z-10">
                <p className="text-[12px] font-black uppercase tracking-[0.3em] mb-4 opacity-80">Dashboard Operativo</p>
                <h2 className="text-5xl font-black uppercase italic leading-none mb-10">{greeting}</h2>

                <div className="flex flex-col md:flex-row md:items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-3xl font-black tabular-nums leading-none mb-1">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                    </div>

                    <div className="hidden md:block h-12 w-[1px] bg-white/20"></div>

                    <div className="flex items-center gap-4 animate-fade-in" key={activeIndex}>
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <Icon name={messages[activeIndex].icon} size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-1">{messages[activeIndex].title}</span>
                            <p className="text-[13px] font-bold leading-tight max-w-[450px] uppercase italic text-white/90">
                                {messages[activeIndex].content}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GreetingDashboard;
