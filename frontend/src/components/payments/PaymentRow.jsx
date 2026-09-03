import React from "react";
import { formatCurrency } from "../../utils/formatCurrency";
import {
    formatScenario,
    formatRecoveryAction
} from "../../utils/statusHelpers";
import { formatDate } from "../../utils/formatDate";
import PaymentStatusBadge from "./PaymentStatusBadge";
import Button from "../common/Button";
import { Zap, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PaymentRow = ({
    payment,
    onRunRecovery,
    isExecuting = false
}) => {
    const navigate = useNavigate();

    return (
        <tr
            className="row-hover"
            style={{
                borderBottom: "1px solid var(--line)",
                transition: "background-color 150ms ease"
            }}
        >
            {/* Payment ID */}
            <td
                style={{
                    padding: "0.75rem 1rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "var(--ink)"
                }}
            >
                <button
                    onClick={() =>
                        navigate(`/payments/${payment.paymentId}`)
                    }
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--primary)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        textAlign: "left",
                        transition: "opacity 150ms ease"
                    }}
                >
                    {payment.paymentId}
                </button>
            </td>

            {/* Customer ID */}
            <td
                style={{
                    padding: "0.75rem 1rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.75rem",
                    color: "var(--mute)"
                }}
            >
                {payment.customerId}
            </td>

            {/* Amount */}
            <td
                style={{
                    padding: "0.75rem 1rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--ink)"
                }}
            >
                {formatCurrency(payment.amount)}
            </td>

            {/* Failure Scenario */}
            <td style={{ padding: "0.75rem 1rem" }}>
                <span
                    style={{
                        padding: "0.1875rem 0.5rem",
                        borderRadius: "0.3125rem",
                        background: "var(--line)",
                        border: "1px solid var(--line-strong)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.625rem",
                        fontWeight: 500,
                        color: "var(--mute)",
                        whiteSpace: "nowrap"
                    }}
                >
                    {formatScenario(payment.scenario)}
                </span>
            </td>

            {/* Status */}
            <td style={{ padding: "0.75rem 1rem" }}>
                <PaymentStatusBadge status={payment.status} />
            </td>

            {/* Attempts & Last Action */}
            <td style={{ padding: "0.75rem 1rem" }}>
                <div
                    style={{
                        fontSize: "0.75rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "var(--mute)"
                    }}
                >
                    Attempts:{" "}
                    <span
                        style={{
                            color: "var(--ink)",
                            fontWeight: 600
                        }}
                    >
                        {payment.attemptCount}
                    </span>
                </div>

                {payment.recoveryAction && (
                    <div
                        style={{
                            fontSize: "0.6875rem",
                            fontFamily: "'JetBrains Mono', monospace",
                            color: "var(--primary)",
                            fontWeight: 500,
                            marginTop: "2px"
                        }}
                    >
                        {formatRecoveryAction(
                            payment.recoveryAction
                        )}
                    </div>
                )}
            </td>

            {/* Date */}
            <td
                style={{
                    padding: "0.75rem 1rem",
                    fontSize: "0.75rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "var(--mute)",
                    whiteSpace: "nowrap"
                }}
            >
                {formatDate(payment.createdAt)}
            </td>

            {/* Actions */}
            <td
                style={{
                    padding: "0.75rem 1rem",
                    textAlign: "right",
                    whiteSpace: "nowrap"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "0.5rem"
                    }}
                >
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() =>
                            navigate(`/payments/${payment.paymentId}`)
                        }
                    >
                        Inspect
                    </Button>

                    {payment.status === "failed" && (
                        <Button
                            variant="primary"
                            size="sm"
                            icon={Zap}
                            loading={isExecuting}
                            onClick={() =>
                                onRunRecovery(payment.paymentId)
                            }
                        >
                            AI Recovery
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default PaymentRow;