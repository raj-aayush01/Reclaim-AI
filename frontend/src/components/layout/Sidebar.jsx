import React from "react";
import { NavLink } from "react-router-dom";
import { 
    LayoutDashboard, 
    CreditCard, 
    Zap, 
    Activity, 
    Sparkles, 
    Layers 
} from "lucide-react";

export const Sidebar = ({ onOpenSimulator }) => {
    const navItems = [
        {
            path: "/",
            label: "Dashboard",
            icon: LayoutDashboard
        },
        {
            path: "/payments",
            label: "Payments",
            icon: CreditCard
        }
    ];

    return (
        <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between fixed top-0 bottom-0 left-0 z-30 backdrop-blur-xl">
            <div>
                {/* Brand Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            Reclaim<span className="text-indigo-400">AI</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                            Recovery Engine
                        </p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="p-4 space-y-1.5">
                    <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Navigation
                    </div>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === "/"}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                                        isActive
                                            ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-950/50"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                    }`
                                }
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Actions & Simulator Widget */}
            <div className="p-4 border-t border-slate-800/80 space-y-3">
                <button
                    onClick={onOpenSimulator}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/50 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 border border-slate-700/60 transition-all text-xs font-semibold group cursor-pointer"
                >
                    <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>Generate Demo Data</span>
                </button>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-slate-400 font-medium">Gemini AI</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold">
                        ACTIVE
                    </span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
