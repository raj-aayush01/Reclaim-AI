import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { checkHealth } from "../../services/dashboardService";
import { RefreshCw, Server, AlertCircle } from "lucide-react";

export const Navbar = ({ onOpenSimulator }) => {
    const location = useLocation();
    const [backendStatus, setBackendStatus] = useState("checking"); // 'connected', 'error', 'checking'

    const getPageTitle = () => {
        if (location.pathname === "/") return "Dashboard";
        if (location.pathname.startsWith("/payments/")) return "Payment Details";
        if (location.pathname === "/payments") return "Payments Management";
        return "ReclaimAI";
    };

    const verifyBackend = async () => {
        setBackendStatus("checking");
        try {
            await checkHealth();
            setBackendStatus("connected");
        } catch {
            setBackendStatus("error");
        }
    };

    useEffect(() => {
        verifyBackend();
    }, []);

    return (
        <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 fixed top-0 right-0 left-64 z-20 backdrop-blur-xl px-8 flex items-center justify-between">
            {/* Left Page Title */}
            <div>
                <h2 className="text-base font-semibold text-slate-100">{getPageTitle()}</h2>
            </div>

            {/* Right Health Indicator & Quick Actions */}
            <div className="flex items-center gap-4">
                {/* Backend Health Badge */}
                <div
                    onClick={verifyBackend}
                    title="Click to re-check backend health"
                    className={`cursor-pointer px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all ${
                        backendStatus === "connected"
                            ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/60"
                            : backendStatus === "error"
                            ? "bg-rose-950/50 text-rose-400 border-rose-800/60 hover:bg-rose-900/60"
                            : "bg-amber-950/50 text-amber-400 border-amber-800/60"
                    }`}
                >
                    {backendStatus === "connected" && (
                        <>
                            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                            <span>Backend Connected</span>
                        </>
                    )}
                    {backendStatus === "error" && (
                        <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Backend Disconnected</span>
                        </>
                    )}
                    {backendStatus === "checking" && (
                        <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Checking Backend...</span>
                        </>
                    )}
                </div>

                {/* Quick Simulator Button */}
                <button
                    onClick={onOpenSimulator}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                    <Server className="w-3.5 h-3.5" />
                    <span>Simulator</span>
                </button>
            </div>
        </header>
    );
};

export default Navbar;
