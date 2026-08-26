import React from "react";
import { useDashboard } from "../hooks/useDashboard";
import StatCard from "../components/dashboard/StatCard";
import RecoveryChart from "../components/dashboard/RecoveryChart";
import RecoveryActions from "../components/dashboard/RecoveryActions";
import RecentActivity from "../components/dashboard/RecentActivity";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import { formatCurrency, formatCompactCurrency } from "../utils/formatCurrency";
import {
    AlertTriangle,
    TrendingUp,
    ShieldCheck,
    CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
    const { data, loading, error, refetch } = useDashboard();
    const navigate = useNavigate();

    if (loading && !data) {
        return <Loader fullPage text="Loading ReclaimAI Dashboard metrics..." />;
    }

    if (error && !data) {
        return <ErrorMessage message={error} onRetry={refetch} />;
    }

    const {
        totalPayments = 0,
        failedPayments = 0,
        atRiskCount = 0,
        totalAtRisk = 0,
        recoveredCount = 0,
        recoveredAmount = 0,
        recoveryRate = 0,
        actions = {},
        recentLogs = []
    } = data || {};

    const stoppedCount = actions.stoppedCount || 0;

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Header Title Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/30">
                <div>
                    <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        Payment Recovery Situation Room

                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60 text-xs font-semibold">
                            Live Monitoring
                        </span>
                    </h1>

                    <p className="text-xs text-slate-400 mt-1">
                        Autonomous AI detection, risk monitoring, and deterministic recovery execution.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/payments")}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                        <CreditCard className="w-4 h-4" />
                        <span>Go to Payments</span>
                    </button>
                </div>
            </div>

            {/* Top Metric Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                {/* Card 1: Money at Risk */}
                <StatCard
                    title="Money at Risk"
                    value={formatCurrency(totalAtRisk)}
                    subtext={
                        <div className="space-y-0.5">
                            <div>
                                {atRiskCount} payments currently at risk
                            </div>

                            <div className="text-rose-400/90 font-medium">
                                {failedPayments} payment attempts failed
                            </div>
                        </div>
                    }
                    icon={AlertTriangle}
                    colorVariant="rose"
                    onClick={() => navigate("/payments?status=at_risk")}
                />

                {/* Card 2: Total Recovered */}
                <StatCard
                    title="Total Recovered"
                    value={formatCurrency(recoveredAmount)}
                    subtext={`${recoveredCount} payments successfully reclaimed`}
                    icon={ShieldCheck}
                    colorVariant="emerald"
                    onClick={() => navigate("/payments?status=recovered")}
                />

                {/* Card 3: Recovery Rate */}
                <StatCard
                    title="Recovery Rate"
                    value={`${recoveryRate}%`}
                    subtext={`${formatCompactCurrency(recoveredAmount)} recovered from ${formatCompactCurrency(totalAtRisk)} at risk`}
                    icon={TrendingUp}
                    colorVariant="amber"
                />

                {/* Card 4: Total Processed */}
                <StatCard
                    title="Total Processed"
                    value={totalPayments}
                    subtext={`${atRiskCount} at risk · ${recoveredCount} recovered · ${stoppedCount} halted`}
                    icon={CreditCard}
                    colorVariant="indigo"
                    onClick={() => navigate("/payments")}
                />
            </div>

            {/* Action Cards Quick Bar */}
            <RecoveryActions actions={actions} />

            {/* Main Visual Section: Recovery Chart + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-6">
                    <RecoveryChart actions={actions} />
                </div>

                <div className="lg:col-span-6">
                    <RecentActivity logs={recentLogs} />
                </div>

            </div>
        </div>
    );
};

export default Dashboard;