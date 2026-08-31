import React from "react";
import { useNavigate } from "react-router-dom";
import { usePayments } from "../hooks/usePayments";
import { formatCurrency } from "../utils/formatCurrency";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export const Exceptions = () => {
    const navigate = useNavigate();
    const {
        payments,
        pagination,
        loading,
        error,
        refetch
    } = usePayments({
        status: "escalated"
    });

    return (
        <div className="page-stack animate-rise">
            {/* Header */}
            <div className="panel page-header-panel panel-accent-down">
                <div>
                    <span
                        className="eyebrow"
                        style={{
                            color: "var(--down)",
                            display: "block",
                            marginBottom: "4px"
                        }}
                    >
                        Current Batch
                    </span>

                    <h1 className="page-title">
                        <ShieldAlert
                            size={20}
                            style={{ color: "var(--down)" }}
                        />
                        Blocked &amp; Escalated Cases
                    </h1>
                </div>

                <span className="count-pill count-pill-down">
                    {pagination?.total ?? payments.length} SURFACED
                </span>
            </div>

            {/* Error */}
            {error && (
                <ErrorMessage
                    message={error}
                    onRetry={refetch}
                />
            )}

            {/* Loading */}
            {loading && payments.length === 0 ? (
                <Loader text="Fetching escalated payments..." />
            ) : !error ? (
                payments.length === 0 ? (
                    /* Empty State */
                    <div
                        className="panel"
                        style={{
                            padding: "3rem",
                            textAlign: "center"
                        }}
                    >
                        <CheckCircle2
                            size={40}
                            style={{
                                color: "var(--up)",
                                margin: "0 auto 0.75rem"
                            }}
                        />

                        <h3
                            style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                color: "var(--ink)",
                                marginBottom: "0.5rem"
                            }}
                        >
                            All Exceptions Resolved
                        </h3>

                        <p
                            style={{
                                fontSize: "0.8125rem",
                                color: "var(--mute)"
                            }}
                        >
                            There are currently no escalated payments
                            requiring human sign-off.
                        </p>
                    </div>
                ) : (
                    /* Exception List */
                    <div className="page-stack">
                        {payments.map((item) => (
                            <div
                                key={item.paymentId}
                                className="panel panel-accent-down"
                                style={{
                                    padding: "1.25rem",
                                    transition:
                                        "box-shadow 150ms ease"
                                }}
                            >
                                {/* Top Row */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent:
                                            "space-between",
                                        flexWrap: "wrap",
                                        gap: "0.75rem",
                                        marginBottom: "0.75rem"
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.75rem",
                                            flexWrap: "wrap"
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                color: "var(--ink)"
                                            }}
                                        >
                                            {item.paymentId}
                                        </span>

                                        <span className="chip">
                                            {item.scenario}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.75rem"
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                                fontSize: "1rem",
                                                fontWeight: 700,
                                                color: "var(--ink)"
                                            }}
                                        >
                                            {formatCurrency(item.amount)}
                                        </span>

                                        <span
                                            className="badge-down"
                                            style={{
                                                padding:
                                                    "0.1875rem 0.625rem",
                                                borderRadius:
                                                    "9999px",
                                                fontSize:
                                                    "0.625rem",
                                                fontWeight: 700,
                                                letterSpacing:
                                                    "0.06em"
                                            }}
                                        >
                                            {item.status?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Reason */}
                                <p
                                    className="sub-card-soft"
                                    style={{
                                        fontSize: "0.75rem",
                                        fontFamily:
                                            "'JetBrains Mono', monospace",
                                        color: "var(--mute)",
                                        marginBottom: "0.75rem",
                                        lineHeight: 1.5
                                    }}
                                >
                                    Corrective action:{" "}
                                    {item.failureReason ||
                                        "Payment requires human review before further recovery."}
                                </p>

                                {/* Action */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-end"
                                    }}
                                >
                                    <Button
                                        variant="glow"
                                        size="sm"
                                        onClick={() => {
                                            navigate(`/payments/${item.paymentId}`);
                                        }}
                                    >
                                        REVIEW PAYMENT
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : null}

            {/* Pagination */}
            {pagination?.pages > 1 && (
                <div className="table-footer">
                    <span>
                        Page{" "}
                        <strong style={{ color: "var(--ink)" }}>
                            {pagination.page}
                        </strong>{" "}
                        of{" "}
                        <strong style={{ color: "var(--ink)" }}>
                            {pagination.pages}
                        </strong>
                    </span>

                    <span>
                        {pagination.total} escalated payments
                    </span>
                </div>
            )}
        </div>
    );
};

export default Exceptions;