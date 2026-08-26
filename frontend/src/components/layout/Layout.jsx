import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { generateDemoData } from "../../services/paymentService";
import { Sparkles, CheckCircle2 } from "lucide-react";

export const Layout = () => {
    const [simulatorOpen, setSimulatorOpen] = useState(false);
    const [count, setCount] = useState(200);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const handleRunSimulator = async () => {
        setLoading(true);
        setSuccessMessage(null);
        try {
            const res = await generateDemoData(Number(count));
            setSuccessMessage(`Successfully generated ${res.paymentsCount || count} synthetic demo payments and customers!`);
            setTimeout(() => {
                setSimulatorOpen(false);
                setSuccessMessage(null);
                window.location.reload();
            }, 1500);
        } catch (err) {
            alert(err.message || "Failed to generate demo data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
            {/* Left Sidebar */}
            <Sidebar onOpenSimulator={() => setSimulatorOpen(true)} />

            {/* Main Workspace Area */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Top Navbar */}
                <Navbar onOpenSimulator={() => setSimulatorOpen(true)} />

                {/* Dynamic Page Content */}
                <main className="mt-16 p-8 flex-1">
                    <Outlet />
                </main>
            </div>

            {/* Demo Data Simulator Modal */}
            <Modal
                isOpen={simulatorOpen}
                onClose={() => setSimulatorOpen(false)}
                title="Payment Simulator & Demo Seed"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl">
                        <Sparkles className="w-6 h-6 text-indigo-400 shrink-0" />
                        <p className="text-xs text-indigo-200">
                            Generate realistic synthetic payment records (Card Declined, Temporary Network Failure, High-Value Failure, etc.) to evaluate Gemini AI recovery decision engine.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Number of Payments to Generate
                        </label>
                        <select
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                            <option value={50}>50 Payments</option>
                            <option value={100}>100 Payments</option>
                            <option value={200}>200 Payments (Recommended)</option>
                            <option value={500}>500 Payments</option>
                        </select>
                    </div>

                    {successMessage && (
                        <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => setSimulatorOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="glow"
                            loading={loading}
                            onClick={handleRunSimulator}
                        >
                            Generate Data
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Layout;
