import React from "react";
import { formatRelativeTime } from "../../utils/formatDate";
import { formatRecoveryAction } from "../../utils/statusHelpers";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RecentActivity = ({ logs = [] }) => {
    const navigate = useNavigate();

    return (
        <div
            className="panel"
            style={{
                display: "flex",
                flexDirection: "column",
                height: "420px",
                minHeight: 0
            }}
        >
            <div
                style={{
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0
                }}
            >
                <div>
                    <span
                        className="eyebrow-primary"
                        style={{
                            display: "block",
                            marginBottom: "3px"
                        }}
                    >
                        AGENT DECISION LOG
                    </span>

                    <h3
                        style={{
                            fontSize: "0.9375rem",
                            fontWeight: 600,
                            color: "var(--ink)",
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: "-0.01em"
                        }}
                    >
                        Recent AI Decisions &amp; Logs
                    </h3>
                </div>

                <button
                    onClick={() => navigate("/payments")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontSize: "0.75rem",
                        color: "var(--primary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 500,
                        fontFamily: "'Inter', sans-serif",
                        transition: "opacity 150ms ease"
                    }}
                >
                    <span>View All Payments</span>
                    <ArrowRight size={13} />
                </button>
            </div>

            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    padding: "0.5rem"
                }}
            >
                {logs.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "2.5rem 1rem",
                            color: "var(--mute)",
                            fontSize: "0.75rem",
                            fontFamily: "'JetBrains Mono', monospace"
                        }}
                    >
                        No AI recovery logs recorded yet. Run a recovery action to see live decisions!
                    </div>
                ) : (
                    logs.map((log, index) => {
                        const aiAction =
                            log.aiAction ||
                            log.aiRecommendation?.action ||
                            log.actionExecuted;

                        const aiReason =
                            log.aiReason ||
                            log.aiRecommendation?.reason ||
                            log.message;

                        const aiConfidence =
                            log.aiConfidence ??
                            log.aiRecommendation?.confidence;

                        const isAllowed =
                            log.policyAllowed !== undefined
                                ? log.policyAllowed
                                : log.policyCheck?.allowed !== false;

                        return (
                            <div
                                key={
                                    log._id ||
                                    log.logId ||
                                    `${log.paymentId}-${log.createdAt}-${index}`
                                }
                                onClick={() =>
                                    log.paymentId &&
                                    navigate(`/payments/${log.paymentId}`)
                                }
                                className="row-hover"
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    gap: "0.75rem",
                                    padding: "0.625rem 0.75rem",
                                    borderRadius: "0.5rem",
                                    cursor: log.paymentId
                                        ? "pointer"
                                        : "default",
                                    transition:
                                        "background-color 150ms ease"
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.25rem",
                                        minWidth: 0
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.625rem",
                                            minWidth: 0
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "0.6875rem",
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                                color: "var(--mute)",
                                                flexShrink: 0
                                            }}
                                        >
                                            {formatRelativeTime(
                                                log.createdAt ||
                                                    log.timestamp
                                            )}
                                        </span>

                                        <span
                                            style={{
                                                fontSize: "0.6875rem",
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                                color: "var(--ink)",
                                                fontWeight: 500,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                maxWidth: "160px"
                                            }}
                                        >
                                            {log.paymentId ||
                                                "Unknown Payment"}
                                        </span>

                                        <span
                                            style={{
                                                fontSize: "0.5625rem",
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                                fontWeight: 600,
                                                letterSpacing: "0.08em",
                                                padding: "0.125rem 0.5rem",
                                                borderRadius: "9999px",
                                                flexShrink: 0,
                                                ...(isAllowed
                                                    ? {
                                                          background:
                                                              "var(--up-soft)",
                                                          color: "var(--up)",
                                                          border:
                                                              "1px solid var(--up-border)"
                                                      }
                                                    : {
                                                          background:
                                                              "var(--down-soft)",
                                                          color: "var(--down)",
                                                          border:
                                                              "1px solid var(--down-border)"
                                                      })
                                            }}
                                        >
                                            {isAllowed
                                                ? "APPROVED"
                                                : "BLOCKED"}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem"
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "0.6875rem",
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                                color: "var(--mute)"
                                            }}
                                        >
                                            →
                                        </span>

                                        <span
                                            style={{
                                                fontSize: "0.6875rem",
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                                color: "var(--primary)",
                                                fontWeight: 500
                                            }}
                                        >
                                            {aiAction
                                                ? formatRecoveryAction(
                                                      aiAction
                                                  )
                                                : "No action recorded"}
                                        </span>

                                        {aiConfidence != null && (
                                            <span
                                                style={{
                                                    fontSize: "0.625rem",
                                                    color: "var(--mute)",
                                                    fontFamily:
                                                        "'JetBrains Mono', monospace"
                                                }}
                                            >
                                                ·{" "}
                                                {(
                                                    Number(aiConfidence) <= 1
                                                        ? Number(
                                                              aiConfidence
                                                          ) * 100
                                                        : Number(
                                                              aiConfidence
                                                          )
                                                ).toFixed(0)}
                                                % conf
                                            </span>
                                        )}
                                    </div>

                                    <p
                                        style={{
                                            fontSize: "0.6875rem",
                                            color: "var(--mute)",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            maxWidth: "280px"
                                        }}
                                    >
                                        {aiReason ||
                                            "Processed by AI Recovery pipeline"}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div
                style={{
                    padding: "0.75rem 1.25rem",
                    borderTop: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.6875rem",
                    color: "var(--mute)",
                    flexShrink: 0
                }}
            >
                <ShieldCheck
                    size={13}
                    style={{ color: "var(--up)" }}
                />

                <span>Automatic Policy Enforcement Active</span>
            </div>
        </div>
    );
};

export default RecentActivity;