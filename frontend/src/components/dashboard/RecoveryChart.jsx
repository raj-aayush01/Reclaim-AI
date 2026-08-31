import React from "react";
import { BarChart3, RefreshCw, Link as LinkIcon, AlertTriangle, XOctagon } from "lucide-react";

export const RecoveryChart = ({ actions = {} }) => {
    const {
        retryCount = 0,
        paymentLinkCount = 0,
        escalatedCount = 0,
        stoppedCount = 0
    } = actions;

    const totalActions = retryCount + paymentLinkCount + escalatedCount + stoppedCount;

    const items = [
        {
            key: "RETRY_PAYMENT",
            label: "Retry Engine",
            count: retryCount,
            color: "var(--primary)",
            icon: RefreshCw
        },
        {
            key: "CREATE_PAYMENT_LINK",
            label: "Payment Links",
            count: paymentLinkCount,
            color: "var(--up)",
            icon: LinkIcon
        },
        {
            key: "ESCALATE_TO_HUMAN",
            label: "Human Escalations",
            count: escalatedCount,
            color: "var(--warn)",
            icon: AlertTriangle
        },
        {
            key: "STOP_RECOVERY",
            label: "Halted Recovery",
            count: stoppedCount,
            color: "var(--down)",
            icon: XOctagon
        }
    ];

    const maxCount = Math.max(...items.map((i) => i.count), 1);

    return (
        <div className="panel p-6 rounded-xl flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3
                        style={{
                            fontSize: "0.9375rem",
                            fontWeight: 600,
                            color: "var(--ink)",
                            fontFamily: "'Inter', sans-serif",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                    >
                        <BarChart3 className="w-4 h-4" style={{ color: "var(--primary)" }} />
                        AI Recovery Actions Breakdown
                    </h3>
                    <p
                        style={{
                            fontSize: "0.6875rem",
                            color: "var(--mute)",
                            marginTop: "2px"
                        }}
                    >
                        Distribution of actions executed across failed payments
                    </p>
                </div>
                <span className="count-pill count-pill-primary">
                    {totalActions} Total Actions
                </span>
            </div>

            {/* Custom Bar Visualization */}
            <div className="space-y-4 my-2">
                {items.map((item) => {
                    const percentage = totalActions > 0 ? ((item.count / totalActions) * 100).toFixed(1) : 0;
                    const barWidth = Math.max(Math.round((item.count / maxCount) * 100), 4);
                    const Icon = item.icon;

                    return (
                        <div key={item.key} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-medium">
                                <div className="flex items-center gap-2">
                                    <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{item.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span style={{ color: "var(--mute)", fontFamily: "'JetBrains Mono', monospace" }}>{percentage}%</span>
                                    <span style={{ fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.count}</span>
                                </div>
                            </div>

                            {/* Bar Track */}
                            <div
                                style={{
                                    height: "0.75rem",
                                    width: "100%",
                                    background: "var(--line)",
                                    borderRadius: "9999px",
                                    overflow: "hidden",
                                    border: "1px solid var(--line-strong)",
                                    padding: "2px"
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        borderRadius: "9999px",
                                        background: item.color,
                                        width: `${barWidth}%`,
                                        transition: "all 700ms ease-out"
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div
                style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.6875rem",
                    color: "var(--mute)"
                }}
            >
                <span>Determined by Gemini AI + Backend Recovery Policy</span>
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>Deterministic Rule Enforcement</span>
            </div>
        </div>
    );
};

export default RecoveryChart;
