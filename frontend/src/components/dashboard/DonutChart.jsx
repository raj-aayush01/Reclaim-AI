import React from "react";
import { useNavigate } from "react-router-dom";

export const DonutChart = ({ actions = {} }) => {
    const navigate = useNavigate();

    const { retryCount = 0, paymentLinkCount = 0, escalatedCount = 0, stoppedCount = 0 } = actions;
    const total = retryCount + paymentLinkCount + escalatedCount + stoppedCount;

    const segments = [
        { label: "Retry", count: retryCount, color: "var(--up)", path: "/ledger?action=RETRY_PAYMENT" },
        { label: "Payment Link", count: paymentLinkCount, color: "var(--warn)", path: "/ledger?action=CREATE_PAYMENT_LINK" },
        { label: "Escalate", count: escalatedCount, color: "var(--primary)", path: "/ledger?action=ESCALATE_TO_HUMAN" },
        { label: "Stop", count: stoppedCount, color: "var(--down)", path: "/ledger?action=STOP_RECOVERY" }
    ];

    const radius = 70;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    return (
        <div className="panel animate-rise" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
            <div>
                <span className="eyebrow-primary" style={{ display: "block", marginBottom: "3px" }}>Agent Actions</span>
                <h3 className="panel-section-title" style={{ marginBottom: "0.25rem" }}>Action Breakdown</h3>
                <p className="panel-section-desc" style={{ marginBottom: "1.5rem" }}>How the agent intervenes</p>

                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", margin: "1rem 0" }}>
                    <svg style={{ width: "13rem", height: "13rem", transform: "rotate(-90deg)" }}>
                        {segments.map((seg, idx) => {
                            const segmentLength = (seg.count / (total || 1)) * circumference;
                            const strokeDasharray = `${segmentLength} ${circumference}`;
                            const strokeDashoffset = -accumulatedAngle;
                            accumulatedAngle += segmentLength;
                            return (
                                <circle
                                    key={idx}
                                    cx="104"
                                    cy="104"
                                    r={radius}
                                    fill="transparent"
                                    stroke={seg.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    style={{ cursor: "pointer", transition: "opacity 150ms ease" }}
                                    onClick={() => navigate(seg.path)}
                                />
                            );
                        })}
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        <span style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "var(--ink)", letterSpacing: "-0.03em" }}>
                            {total}
                        </span>
                        <span className="eyebrow">Actions</span>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "1.5rem" }}>
                    {segments.map((seg, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(seg.path)}
                            className="sub-card"
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "background-color 150ms ease, border-color 150ms ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-primary)"; e.currentTarget.style.borderColor = "var(--primary-border)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = ""; }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ width: "0.625rem", height: "0.625rem", borderRadius: "9999px", background: seg.color, flexShrink: 0 }} />
                                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ink)" }}>{seg.label}</span>
                            </div>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--ink)" }}>{seg.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DonutChart;
