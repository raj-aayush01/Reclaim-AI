import React from "react";
import { NavLink } from "react-router-dom";
import { 
    LayoutDashboard, 
    CreditCard, 
    AlertCircle, 
    ShieldCheck, 
    Sparkles,
    AlertOctagon
} from "lucide-react";

export const Sidebar = () => {
    const navItems = [
        {
            path: "/overview",
            altPath: "/",
            label: "Overview",
            icon: LayoutDashboard
        },
        {
            path: "/ledger",
            altPath: "/payments",
            label: "Ledger",
            icon: CreditCard
        },
        {
            path: "/failed-payments",
            label: "Failed Payments",
            icon: AlertOctagon
        },
        {
            path: "/exceptions",
            label: "Exceptions",
            icon: AlertCircle
        },
        {
            path: "/guardrails",
            label: "Guardrails",
            icon: ShieldCheck
        }
    ];

    return (
        <aside className="w-64 bg-[#090d16] border-r border-slate-800/80 flex flex-col justify-between fixed top-0 bottom-0 left-0 z-30">
            <div>
                {/* Brand Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-base font-extrabold tracking-tight text-slate-100 font-mono">
                            Reclaim<span className="text-emerald-400">·AI</span>
                        </h1>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500">
                            REVENUE RECOVERY
                        </p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="p-4 space-y-1.5">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        NAVIGATION
                    </div>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => {
                                    const active = isActive || (item.altPath && window.location.pathname === item.altPath);
                                    return `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                                        active
                                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shadow-lg shadow-emerald-950/40"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                                    }`;
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Status Widget */}
            <div className="p-4 border-t border-slate-800/80">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-400 font-bold text-xs">Agent · Online</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block font-mono pl-4">
                        Gemini Flash 3.6
                    </span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
