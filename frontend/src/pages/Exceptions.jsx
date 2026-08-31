import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePayments } from "../hooks/usePayments";
import { formatCurrency } from "../utils/formatCurrency";
import {
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    ArrowUpRight,
    Clock,
    Eye
} from "lucide-react";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

const getScenarioLabel = (scenario) => {
    const labels = {
        HIGH_VALUE_FAILURE: "High-value payment",
        TEMPORARY_FAILURE: "Temporary payment issue",
        UNKNOWN_FAILURE: "Unknown payment issue",
        CARD_DECLINED: "Card declined",
        BANK_TIMEOUT: "Bank timeout",
        NETWORK_ERROR: "Network issue"
    };

    return labels[scenario] || scenario || "Payment issue";
};

const getReviewReason = (item) => {
    const scenario = item.scenario;

    if (scenario === "HIGH_VALUE_FAILURE") {
        return "The payment is high value, so automatic recovery requires additional human review.";
    }

    if (scenario === "UNKNOWN_FAILURE") {
        return "The cause of the payment failure is uncertain, so the system could not safely recover it automatically.";
    }

    if (scenario === "CARD_DECLINED") {
        return "The payment method was declined and may require the customer or payment team to take action.";
    }

    if (scenario === "TEMPORARY_FAILURE") {
        return "The payment failed because of a temporary issue, but the case still requires review before another recovery attempt.";
    }

    if (scenario === "BANK_TIMEOUT") {
        return "The bank did not respond in time, so the case requires review before further recovery.";
    }

    if (item.failureReason) {
        return `The payment requires human attention because of: ${item.failureReason}.`;
    }

    return "The payment requires human review before further recovery.";
};

const getPriority = (item) => {
    if (item.scenario === "HIGH_VALUE_FAILURE") {
        return {
            label: "High priority",
            className: "badge-down"
        };
    }

    if (item.scenario === "UNKNOWN_FAILURE") {
        return {
            label: "Needs review",
            className: "badge-down"
        };
    }

    return {
        label: "Review",
        className: "badge-primary"
    };
};

const getAmountNumber = (amount) => {
    if (typeof amount === "number") {
        return amount;
    }

    if (typeof amount === "string") {
        const cleaned = amount.replace(/[₹,\s]/g, "");
        const parsed = Number(cleaned);

        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
};

export const Exceptions = () => {
    const navigate = useNavigate();

    const {
        payments,
        pagination,
        loading,
        error,
        refetch,
        updateFilters
    } = usePayments({
        status: "escalated"
    });

    const summary = useMemo(() => {
        const openCases =
            pagination?.total ??
            payments.length;

        const highValueCases = payments.filter(
            (item) =>
                item.scenario === "HIGH_VALUE_FAILURE"
        ).length;

        const unknownCases = payments.filter(
            (item) =>
                item.scenario === "UNKNOWN_FAILURE"
        ).length;

        return {
            openCases,
            highValueCases,
            unknownCases
        };
    }, [payments, pagination]);

    return (
        <div
            className="page-stack animate-rise"
            style={{
                gap: "1.25rem"
            }}
        >
            {/* Header */}
            <div
                className="panel"
                style={{
                    padding: "1.5rem",
                    border: "1px solid var(--primary-border)",
                    background: "var(--surface-solid)"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "1rem",
                        flexWrap: "wrap"
                    }}
                >
                    <div>
                        <span
                            className="eyebrow-primary"
                            style={{
                                display: "block",
                                marginBottom: "0.4rem"
                            }}
                        >
                            Human Review Queue
                        </span>

                        <h1
                            className="page-title"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.55rem"
                            }}
                        >
                            <ShieldAlert
                                size={21}
                                style={{
                                    color: "var(--down)"
                                }}
                            />

                            Cases Requiring Attention
                        </h1>

                        <p
                            style={{
                                marginTop: "0.5rem",
                                maxWidth: "700px",
                                fontSize: "0.75rem",
                                lineHeight: 1.6,
                                color: "var(--mute)"
                            }}
                        >
                            These payments could not be safely resolved
                            automatically. Review the cases below and
                            decide what should happen next.
                        </p>
                    </div>

                    <span
                        className="count-pill count-pill-down"
                        style={{
                            whiteSpace: "nowrap"
                        }}
                    >
                        {summary.openCases} OPEN CASES
                    </span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <ErrorMessage
                    message={error}
                    onRetry={refetch}
                />
            )}

            {/* Summary */}
            {!error && (
                <div
                    className="grid grid-cols-1 sm:grid-cols-3"
                    style={{
                        gap: "1rem"
                    }}
                >
                    <div className="panel p-5">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "0.9rem"
                            }}
                        >
                            <span className="eyebrow">
                                Open Cases
                            </span>

                            <div className="icon-box icon-box-sm icon-box-down">
                                <ShieldAlert size={14} />
                            </div>
                        </div>

                        <div
                            style={{
                                fontSize: "1.75rem",
                                fontWeight: 700,
                                fontFamily:
                                    "'JetBrains Mono', monospace",
                                color: "var(--down)"
                            }}
                        >
                            {summary.openCases}
                        </div>

                        <div
                            style={{
                                marginTop: "0.2rem",
                                fontSize: "0.75rem",
                                color: "var(--mute)"
                            }}
                        >
                            payments waiting for review
                        </div>
                    </div>

                    <div className="panel p-5">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "0.9rem"
                            }}
                        >
                            <span className="eyebrow">
                                High Value
                            </span>

                            <div className="icon-box icon-box-sm icon-box-warn">
                                <ArrowUpRight size={14} />
                            </div>
                        </div>

                        <div
                            style={{
                                fontSize: "1.75rem",
                                fontWeight: 700,
                                fontFamily:
                                    "'JetBrains Mono', monospace",
                                color: "var(--warn)"
                            }}
                        >
                            {summary.highValueCases}
                        </div>

                        <div
                            style={{
                                marginTop: "0.2rem",
                                fontSize: "0.75rem",
                                color: "var(--mute)"
                            }}
                        >
                            require additional attention
                        </div>
                    </div>

                    <div className="panel p-5">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "0.9rem"
                            }}
                        >
                            <span className="eyebrow">
                                Uncertain Cases
                            </span>

                            <div className="icon-box icon-box-sm icon-box-primary">
                                <AlertTriangle size={14} />
                            </div>
                        </div>

                        <div
                            style={{
                                fontSize: "1.75rem",
                                fontWeight: 700,
                                fontFamily:
                                    "'JetBrains Mono', monospace",
                                color: "var(--primary)"
                            }}
                        >
                            {summary.unknownCases}
                        </div>

                        <div
                            style={{
                                marginTop: "0.2rem",
                                fontSize: "0.75rem",
                                color: "var(--mute)"
                            }}
                        >
                            where the cause is unclear
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Cases */}
            {loading && payments.length === 0 ? (
                <Loader text="Fetching cases requiring review..." />
            ) : !error ? (
                payments.length === 0 ? (
                    <div
                        className="panel"
                        style={{
                            padding: "3.5rem 2rem",
                            textAlign: "center"
                        }}
                    >
                        <CheckCircle2
                            size={42}
                            style={{
                                color: "var(--up)",
                                margin: "0 auto 0.9rem"
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
                            No Cases Need Attention
                        </h3>

                        <p
                            style={{
                                maxWidth: "500px",
                                margin: "0 auto",
                                fontSize: "0.8125rem",
                                lineHeight: 1.6,
                                color: "var(--mute)"
                            }}
                        >
                            All currently surfaced exceptions have
                            been resolved or there are no payments
                            waiting for human review.
                        </p>
                    </div>
                ) : (
                    <div
                        className="panel"
                        style={{
                            padding: "1.25rem"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "1rem",
                                marginBottom: "1rem",
                                flexWrap: "wrap"
                            }}
                        >
                            <div>
                                <span className="eyebrow-primary">
                                    Needs Your Attention
                                </span>

                                <h2
                                    style={{
                                        marginTop: "0.25rem",
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        color: "var(--ink)"
                                    }}
                                >
                                    Escalated Payments
                                </h2>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    fontSize: "0.6875rem",
                                    color: "var(--mute)"
                                }}
                            >
                                <Clock size={13} />

                                Human review required
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column"
                            }}
                        >
                            {payments.map((item, index) => {
                                const priority =
                                    getPriority(item);

                                const amount =
                                    getAmountNumber(
                                        item.amount
                                    );

                                return (
                                    <div
                                        key={
                                            item.paymentId ||
                                            index
                                        }
                                        style={{
                                            padding:
                                                "1.1rem 0",
                                            borderTop:
                                                index === 0
                                                    ? "1px solid var(--line)"
                                                    : "none",
                                            borderBottom:
                                                "1px solid var(--line)"
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent:
                                                    "space-between",
                                                alignItems:
                                                    "flex-start",
                                                gap: "1rem",
                                                flexWrap:
                                                    "wrap"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    minWidth: 0,
                                                    flex: 1
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "0.5rem",
                                                        flexWrap:
                                                            "wrap"
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize:
                                                                "0.75rem",
                                                            fontFamily:
                                                                "'JetBrains Mono', monospace",
                                                            fontWeight:
                                                                600,
                                                            color:
                                                                "var(--primary)",
                                                            wordBreak:
                                                                "break-all"
                                                        }}
                                                    >
                                                        {
                                                            item.paymentId
                                                        }
                                                    </span>

                                                    <span
                                                        className={
                                                            priority.className
                                                        }
                                                        style={{
                                                            fontSize:
                                                                "0.6rem",
                                                            padding:
                                                                "0.18rem 0.55rem",
                                                            borderRadius:
                                                                "9999px",
                                                            fontWeight:
                                                                700
                                                        }}
                                                    >
                                                        {
                                                            priority.label
                                                        }
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "0.55rem",
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "0.5rem",
                                                        flexWrap:
                                                            "wrap"
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize:
                                                                "0.875rem",
                                                            fontWeight:
                                                                700,
                                                            color:
                                                                "var(--ink)"
                                                        }}
                                                    >
                                                        {
                                                            getScenarioLabel(
                                                                item.scenario
                                                            )
                                                        }
                                                    </span>

                                                    {item.status && (
                                                        <span
                                                            className="badge-down"
                                                            style={{
                                                                fontSize:
                                                                    "0.575rem",
                                                                padding:
                                                                    "0.15rem 0.5rem"
                                                            }}
                                                        >
                                                            {item.status.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                <p
                                                    style={{
                                                        marginTop:
                                                            "0.4rem",
                                                        fontSize:
                                                            "0.75rem",
                                                        lineHeight:
                                                            1.55,
                                                        color:
                                                            "var(--mute)"
                                                    }}
                                                >
                                                    {getReviewReason(
                                                        item
                                                    )}
                                                </p>
                                            </div>

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    gap: "1rem",
                                                    flexShrink: 0
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        textAlign:
                                                            "right"
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize:
                                                                "0.95rem",
                                                            fontWeight:
                                                                700,
                                                            fontFamily:
                                                                "'JetBrains Mono', monospace",
                                                            color:
                                                                "var(--ink)"
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            amount
                                                        )}
                                                    </div>

                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "0.15rem",
                                                            fontSize:
                                                                "0.625rem",
                                                            color:
                                                                "var(--mute)"
                                                        }}
                                                    >
                                                        payment amount
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="glow"
                                                    size="sm"
                                                    onClick={() => {
                                                        navigate(
                                                            `/payments/${item.paymentId}`
                                                        );
                                                    }}
                                                >
                                                    <Eye
                                                        size={13}
                                                    />

                                                    REVIEW PAYMENT
                                                </Button>
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                marginTop:
                                                    "0.75rem",
                                                padding:
                                                    "0.7rem 0.8rem",
                                                borderRadius:
                                                    "0.45rem",
                                                background:
                                                    "var(--primary-soft)",
                                                border:
                                                    "1px solid var(--primary-border)",
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "flex-start",
                                                gap: "0.5rem"
                                            }}
                                        >
                                            <ShieldAlert
                                                size={14}
                                                style={{
                                                    color:
                                                        "var(--primary)",
                                                    flexShrink: 0,
                                                    marginTop:
                                                        "1px"
                                                }}
                                            />

                                            <span
                                                style={{
                                                    fontSize:
                                                        "0.6875rem",
                                                    lineHeight:
                                                        1.5,
                                                    color:
                                                        "var(--mute)"
                                                }}
                                            >
                                                <strong
                                                    style={{
                                                        color:
                                                            "var(--ink)"
                                                    }}
                                                >
                                                    Why this is here:
                                                </strong>{" "}
                                                This case was moved
                                                to human review
                                                instead of allowing
                                                the recovery agent
                                                to continue
                                                automatically.
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            ) : null}

            {/* Pagination */}
            {pagination?.pages > 1 && (
                <div
                    className="table-footer"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        type="button"
                        onClick={() =>
                            updateFilters({
                                page:
                                    pagination.page - 1
                            })
                        }
                        disabled={pagination.page <= 1}
                        style={{
                            padding: "0.45rem 0.75rem",
                            borderRadius: "0.4rem",
                            border:
                                "1px solid var(--line)",
                            background:
                                "var(--surface-solid)",
                            color: "var(--primary)",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            cursor:
                                pagination.page <= 1
                                    ? "not-allowed"
                                    : "pointer",
                            opacity:
                                pagination.page <= 1
                                    ? 0.45
                                    : 1
                        }}
                    >
                        ← Previous
                    </button>

                    <span
                        style={{
                            fontSize: "0.6875rem",
                            color: "var(--mute)",
                            fontFamily:
                                "'JetBrains Mono', monospace"
                        }}
                    >
                        Page{" "}
                        <strong
                            style={{
                                color: "var(--ink)"
                            }}
                        >
                            {pagination.page}
                        </strong>{" "}
                        of{" "}
                        <strong
                            style={{
                                color: "var(--ink)"
                            }}
                        >
                            {pagination.pages}
                        </strong>
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            updateFilters({
                                page:
                                    pagination.page + 1
                            })
                        }
                        disabled={
                            pagination.page >=
                            pagination.pages
                        }
                        style={{
                            padding: "0.45rem 0.75rem",
                            borderRadius: "0.4rem",
                            border:
                                "1px solid var(--line)",
                            background:
                                "var(--surface-solid)",
                            color: "var(--primary)",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            cursor:
                                pagination.page >=
                                pagination.pages
                                    ? "not-allowed"
                                    : "pointer",
                            opacity:
                                pagination.page >=
                                pagination.pages
                                    ? 0.45
                                    : 1
                        }}
                    >
                        Next →
                    </button>

                    <span
                        style={{
                            fontSize: "0.6875rem",
                            color: "var(--mute)",
                            fontFamily:
                                "'JetBrains Mono', monospace"
                        }}
                    >
                        {pagination.total} cases requiring review
                    </span>
                </div>
            )}
        </div>
    );
};

export default Exceptions;