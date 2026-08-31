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
        return <Loader fullPage text="Loading recovery metrics..." />;
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
        openExceptionsCount = 0,
        actions = {
            retryCount: 0,
            paymentLinkCount: 0,
            escalatedCount: 0,
            stoppedCount: 0
        },
        recentLogs = [],
        recoveryFlow = []
    } = data || {};

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem"
            }}
            className="animate-rise"
        >
            {/* Page Header */}
            <div>
                <span
                    className="eyebrow-primary"
                    style={{
                        display: "block",
                        marginBottom: "4px"
                    }}
                >
                    Recovery Console
                </span>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}
                >
                    <h1
                        style={{
                            fontSize: "1.375rem",
                            fontWeight: 700,
                            color: "var(--ink)",
                            letterSpacing: "-0.025em",
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                        Recovery Overview ·{" "}
                        <span style={{ color: "var(--primary)" }}>
                            Live
                        </span>
                    </h1>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                    >
                        <span
                            className="animate-blip"
                            style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "9999px",
                                background: "var(--primary)",
                                display: "inline-block"
                            }}
                        />

                        <span
                            style={{
                                fontSize: "0.6875rem",
                                fontFamily: "'JetBrains Mono', monospace",
                                color: "var(--mute)"
                            }}
                        >
                            agent running · last sync 12s ago
                        </span>
                    </div>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue at Risk */}
                <div
                    onClick={() => navigate("/ledger?status=at_risk")}
                    className="panel panel-accent-warn p-5 cursor-pointer transition-shadow duration-150 animate-rise-1"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow">
                            Revenue at Risk
                        </span>

                        <div className="icon-box icon-box-sm icon-box-warn">
                            <AlertTriangle
                                size={14}
                                strokeWidth={1.75}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: "1.875rem",
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: "tabular-nums",
                            color: "var(--warn)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                            marginBottom: "0.25rem"
                        }}
                    >
                        <AnimatedNumber
                            value={totalAtRisk}
                            decimals={2}
                            prefix="₹"
                        />
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
                        {atRiskCount} payments
                    </div>
                </div>

                {/* Amount Recovered */}
                <div
                    onClick={() => navigate("/ledger?status=recovered")}
                    className="panel panel-accent-up p-5 cursor-pointer transition-shadow duration-150 animate-rise-2"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow">
                            Amount Recovered
                        </span>

                        <div className="icon-box icon-box-sm icon-box-up">
                            <TrendingUp
                                size={14}
                                strokeWidth={1.75}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: "1.875rem",
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: "tabular-nums",
                            color: "var(--up)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                            marginBottom: "0.25rem"
                        }}
                    >
                        <AnimatedNumber
                            value={recoveredAmount}
                            decimals={2}
                            prefix="₹"
                        />
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
                        {recoveredCount} payments
                    </div>
                </div>

                {/* Recovery Rate */}
                <div className="panel panel-accent-primary p-5 animate-rise-3">
                    <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow">
                            Recovery Rate
                        </span>

                        <div className="icon-box icon-box-sm icon-box-primary">
                            <Zap
                                size={14}
                                strokeWidth={1.75}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: "1.875rem",
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: "tabular-nums",
                            color: "var(--primary)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                            marginBottom: "0.25rem"
                        }}
                    >
                        <AnimatedNumber
                            value={recoveryRate}
                            decimals={1}
                            suffix="%"
                        />
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
                        current performance ({timeRange})
                    </div>
                </div>

                {/* Open Exceptions */}
                <div
                    onClick={() => navigate("/exceptions")}
                    className="panel panel-accent-down p-5 cursor-pointer transition-shadow duration-150 animate-rise-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow">
                            Open Exceptions
                        </span>

                        <div className="icon-box icon-box-sm icon-box-down">
                            <AlertOctagon
                                size={14}
                                strokeWidth={1.75}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: "1.875rem",
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: "tabular-nums",
                            color: "var(--down)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                            marginBottom: "0.25rem"
                        }}
                    >
                        <AnimatedNumber
                            value={openExceptionsCount}
                            decimals={0}
                        />
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
                        need review
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <RecoveryFlowChart
                        data={recoveryFlow}
                        timeRange={timeRange}
                    />
                </div>

                <div>
                    <DonutChart actions={actions} />
                </div>
            </div>

            {/* Activity + Summary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                <div>
                    <RecentActivity logs={recentLogs} />
                </div>

                <div>
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

            {/* Exception Alert Banner */}
            {openExceptionsCount > 0 && (
                <div className="panel panel-accent-down p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-rise">
                    <div className="flex items-center gap-2.5">
                        <span
                            className="animate-blip"
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "9999px",
                                background: "var(--down)",
                                display: "inline-block"
                            }}
                        />

                        <span
                            style={{
                                fontSize: "0.8125rem",
                                color: "var(--ink)",
                                fontWeight: 500
                            }}
                        >
                            <strong>{openExceptionsCount} exceptions</strong> need human review
                        </span>
                    </div>

                    <button
                        onClick={() => navigate("/exceptions")}
                        className="badge-down cursor-pointer"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            padding: "0.375rem 0.875rem",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace"
                        }}
                    >
                        <span>VIEW EXCEPTIONS</span>
                        <ArrowRight size={13} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;