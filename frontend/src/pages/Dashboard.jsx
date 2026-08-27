import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useDashboard } from "../hooks/useDashboard";
import AnimatedNumber from "../components/common/AnimatedNumber";
import DonutChart from "../components/dashboard/DonutChart";
import RecoveryFlowChart from "../components/dashboard/RecoveryFlowChart";
import RecoveryRunSummary from "../components/dashboard/RecoveryRunSummary";
import RecentActivity from "../components/dashboard/RecentActivity";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import {
    AlertTriangle,
    TrendingUp,
    Zap,
    AlertOctagon,
    ArrowRight
} from "lucide-react";

export const Dashboard = () => {
    const { timeRange = "7D" } = useOutletContext() || {};
    const { data, loading, error, refetch } = useDashboard(timeRange);
    const navigate = useNavigate();

    if (loading && !data) {
        return (
            <Loader
                fullPage
                text="Loading ReclaimAI Overview metrics..."
            />
        );
    }

    if (error && !data) {
        return (
            <ErrorMessage
                message={error}
                onRetry={refetch}
            />
        );
    }

    const {
        totalPayments = 0,
        failedPayments = 0,
        atRiskCount = 0,
        totalAtRisk = 0,
        recoveredCount = 0,
        recoveredAmount = 0,
        recoveryRate = 0,
        actions = {
            retryCount: 0,
            paymentLinkCount: 0,
            escalatedCount: 0,
            stoppedCount: 0
        },
        recentLogs = [],
        recoveryFlow = []
    } = data || {};

    const openExceptionsCount = actions.escalatedCount || 0;

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div
                    onClick={() => navigate("/ledger?status=at_risk")}
                    className="glass-panel p-5 rounded-2xl border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            REVENUE AT RISK
                        </span>

                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="text-3xl font-extrabold text-amber-400 tracking-tight mb-1 font-mono">
                        <AnimatedNumber
                            value={totalAtRisk / 100000}
                            decimals={2}
                            prefix="₹"
                            suffix="L"
                        />
                    </div>

                    <div className="text-xs text-rose-400 font-medium">
                        {atRiskCount} payments
                    </div>
                </div>

                <div
                    onClick={() => navigate("/ledger?status=recovered")}
                    className="glass-panel p-5 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            AMOUNT RECOVERED
                        </span>

                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mb-1 font-mono">
                        <AnimatedNumber
                            value={recoveredAmount / 100000}
                            decimals={2}
                            prefix="₹"
                            suffix="L"
                        />
                    </div>

                    <div className="text-xs text-emerald-400/90 font-medium">
                        {recoveredCount} payments
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            RECOVERY RATE
                        </span>

                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mb-1 font-mono">
                        <AnimatedNumber
                            value={recoveryRate}
                            decimals={1}
                            suffix="%"
                        />
                    </div>

                    <div className="text-xs text-slate-400 font-medium">
                        current recovery performance ({timeRange})
                    </div>
                </div>

                <div
                    onClick={() => navigate("/exceptions")}
                    className="glass-panel p-5 rounded-2xl border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            OPEN EXCEPTIONS
                        </span>

                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertOctagon className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="text-3xl font-extrabold text-rose-400 tracking-tight mb-1 font-mono">
                        <AnimatedNumber
                            value={openExceptionsCount}
                            decimals={0}
                        />
                    </div>

                    <div className="text-xs text-rose-400/90 font-medium">
                        need review
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <RecoveryFlowChart
                        data={recoveryFlow}
                        timeRange={timeRange}
                    />
                </div>

                <div className="lg:col-span-4">
                    <DonutChart actions={actions} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6">
                    <RecentActivity logs={recentLogs} />
                </div>

                <div className="lg:col-span-6">
                    <RecoveryRunSummary
                        batchData={{
                            evaluated: totalPayments,
                            recoveredAmount,
                            blocked: actions.stoppedCount || 0,
                            exceptions: openExceptionsCount,
                            recoveryRate
                        }}
                    />
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-rose-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />

                    <span>
                        <strong>{openExceptionsCount} exceptions</strong>{" "}
                        need review
                    </span>
                </div>

                <button
                    onClick={() => navigate("/exceptions")}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                    <span>View Exceptions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default Dashboard;