import React from "react";
import PaymentRow from "./PaymentRow";
import EmptyState from "../common/EmptyState";
import Loader from "../common/Loader";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PaymentTable = ({
    payments = [],
    pagination = {},
    loading = false,
    onRunRecovery,
    executingId,
    onPageChange
}) => {
    if (loading && payments.length === 0) {
        return <Loader text="Fetching payments..." />;
    }

    if (!loading && payments.length === 0) {
        return (
            <EmptyState
                title="No Payments Match Filter"
                description="Try clearing or adjusting your search query and status filters."
            />
        );
    }

    return (
        <div
            className="panel"
            style={{
                overflow: "hidden"
            }}
        >
            <div
                style={{
                    overflowX: "auto"
                }}
            >
                <table className="tf-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Customer ID</th>
                            <th>Amount</th>
                            <th>Scenario</th>
                            <th>Status</th>
                            <th>Attempts &amp; Action</th>
                            <th>Created At</th>
                            <th style={{ textAlign: "right" }}>
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {payments.map((payment) => (
                            <PaymentRow
                                key={payment._id || payment.paymentId}
                                payment={payment}
                                onRunRecovery={onRunRecovery}
                                isExecuting={
                                    executingId === payment.paymentId
                                }
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.pages > 1 && (
                <div
                    style={{
                        padding: "0.875rem 1.25rem",
                        borderTop: "1px solid var(--line)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        color: "var(--mute)",
                        fontFamily: "'JetBrains Mono', monospace"
                    }}
                >
                    <div>
                        Showing page{" "}
                        <span
                            style={{
                                fontWeight: 600,
                                color: "var(--ink)"
                            }}
                        >
                            {pagination.page}
                        </span>{" "}
                        of{" "}
                        <span
                            style={{
                                fontWeight: 600,
                                color: "var(--ink)"
                            }}
                        >
                            {pagination.pages}
                        </span>{" "}
                        ({pagination.total} total payments)
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                    >
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() =>
                                onPageChange(pagination.page - 1)
                            }
                            style={{
                                padding: "0.3125rem",
                                borderRadius: "0.375rem",
                                border: "1px solid var(--line)",
                                background: "var(--surface-solid)",
                                color: "var(--mute)",
                                cursor:
                                    pagination.page <= 1
                                        ? "not-allowed"
                                        : "pointer",
                                opacity:
                                    pagination.page <= 1 ? 0.4 : 1,
                                display: "flex",
                                alignItems: "center",
                                transition: "all 150ms ease"
                            }}
                        >
                            <ChevronLeft size={14} />
                        </button>

                        <button
                            disabled={
                                pagination.page >= pagination.pages
                            }
                            onClick={() =>
                                onPageChange(pagination.page + 1)
                            }
                            style={{
                                padding: "0.3125rem",
                                borderRadius: "0.375rem",
                                border: "1px solid var(--line)",
                                background: "var(--surface-solid)",
                                color: "var(--mute)",
                                cursor:
                                    pagination.page >= pagination.pages
                                        ? "not-allowed"
                                        : "pointer",
                                opacity:
                                    pagination.page >= pagination.pages
                                        ? 0.4
                                        : 1,
                                display: "flex",
                                alignItems: "center",
                                transition: "all 150ms ease"
                            }}
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentTable;