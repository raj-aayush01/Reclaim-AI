import React from "react";
import { useLocation } from "react-router-dom";

export const Navbar = ({ timeRange = "7D", onTimeRangeChange }) => {
    const location = useLocation();

    const getBreadcrumb = () => {
        const path = location.pathname.toLowerCase();
        if (path === "/" || path === "/overview") return "Overview";
        if (path === "/ledger" || path === "/payments") return "Payment Ledger";
        if (path === "/failed-payments") return "Failed Payments";
        if (path === "/exceptions") return "Exceptions";
        if (path === "/guardrails") return "Guardrails";
        if (path.startsWith("/payments/")) return "Payment Details";
        return "Overview";
    };

    return (
        <header className="h-16 bg-[#090d16]/80 border-b border-slate-800/80 fixed top-0 right-0 left-64 z-20 backdrop-blur-xl px-8 flex items-center justify-between">
            {/* Left Breadcrumb */}
            <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    RECLAIM-AI
                </span>
                <h2 className="text-sm font-bold text-slate-100">{getBreadcrumb()}</h2>
            </div>

            {/* Right Time-Range Filters & Live Status */}
            <div className="flex items-center gap-3">
                {/* Time Range Selector Toggles */}
                <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    {["Today", "7D", "30D"].map((t) => (
                        <button
                            key={t}
                            onClick={() => onTimeRangeChange && onTimeRangeChange(t)}
                            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                timeRange === t
                                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Live Pulse Badge (Single Larger Pulsing Dot) */}
                <div className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs font-extrabold text-rose-400 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <span className="tracking-wider">LIVE</span>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
