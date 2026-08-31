import React from "react";
import { formatCurrency } from "../../utils/formatCurrency";

export const RecoveryRunSummary = ({ batchData = {} }) => {
    const {
        batchId = "Current",
        evaluated = 0,
        recoveredAmount = 0,
        blocked = 0,
        exceptions = 0,
        recoveryRate = 0
    } = batchData;

    const rows = [
        {
            label: "Run",
            value: batchId,
            isMono: true,
            color: "var(--ink)"
        },
        {
            label: "Evaluated",
            value: evaluated,
            color: "var(--ink)"
        },
        {
            label: "Recovered ₹",
            value: formatCurrency(recoveredAmount),
            color: "var(--up)"
        },
        {
            label: "Blocked",
            value: blocked,
            color: "var(--down)"
        },
        {
            label: "Exceptions",
            value: exceptions,
            color: "var(--warn)"
        },
        {
            label: "Recovery Rate",
            value: `${Number(recoveryRate).toFixed(1)}%`,
            color: "var(--primary)"
        }
    ];

    return (
        <div
            className="panel h-full flex flex-col"
        >
            <div
                style={{
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid var(--line)"
                }}
            >
                <span
                    className="eyebrow-primary"
                    style={{
                        display: "block",
                        marginBottom: "3px"
                    }}
                >
                    RECOVERY SUMMARY
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
                    Recovery Performance
                </h3>
            </div>

            <div
                style={{
                    padding: "0.375rem 0 1.75rem"
                }}
            >
                {rows.map((row) => (
                    <div
                        key={row.label}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.5625rem 1.25rem",
                            borderBottom: "1px solid var(--line)"
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--mute)",
                                fontFamily: "'JetBrains Mono', monospace"
                            }}
                        >
                            {row.label}
                        </span>

                        <span
                            style={{
                                fontSize: "0.8125rem",
                                fontWeight: row.isMono ? 500 : 600,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontVariantNumeric: "tabular-nums",
                                color: row.color
                            }}
                        >
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecoveryRunSummary;