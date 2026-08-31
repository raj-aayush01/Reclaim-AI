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
    /*
     * Display the loader only when the table does not
     * currently contain any payment records.
     */
    if (loading && payments.length === 0) {
        return <Loader text="Fetching payments..." />;
    }

    /*
     * Display an empty state when the current filters
     * return no payment records.
     */
    if (!loading && payments.length === 0) {
        return (
            <EmptyState
                title="No Payments Match Filter"
                description="Try clearing or adjusting your search query and status filters."
            />
        );
    }

    /*
     * Normalize pagination values so the UI remains safe
     * even if the backend omits a pagination field.
     */
    const currentPage = Number(pagination?.page) || 1;
    const totalPages = Number(pagination?.pages) || 1;
    const totalPayments = Number(pagination?.total) || 0;

    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    const handlePreviousPage = () => {
        if (isFirstPage || !onPageChange) {
            return;
        }

        onPageChange(currentPage - 1);
    };

    const handleNextPage = () => {
        if (isLastPage || !onPageChange) {
            return;
        }

        onPageChange(currentPage + 1);
    };

    return (
        <div
            className="panel"
            style={{
                overflow: "hidden"
            }}
        >
            {/* =================================================
                PAYMENT TABLE
            ================================================== */}

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
                                key={
                                    payment._id ||
                                    payment.paymentId
                                }
                                payment={payment}
                                onRunRecovery={onRunRecovery}
                                isExecuting={
                                    executingId ===
                                    payment.paymentId
                                }
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* =================================================
                PAGINATION
            ================================================== */}

            {totalPages > 1 && (
                <div
                    style={{
                        padding: "0.875rem 1.25rem",
                        borderTop: "1px solid var(--line)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        flexWrap: "wrap",
                        fontSize: "0.75rem",
                        color: "var(--mute)",
                        fontFamily:
                            "'JetBrains Mono', monospace"
                    }}
                >
                    {/* Page information */}

                    <div>
                        Showing page{" "}
                        <span
                            style={{
                                fontWeight: 600,
                                color: "var(--ink)"
                            }}
                        >
                            {currentPage}
                        </span>{" "}
                        of{" "}
                        <span
                            style={{
                                fontWeight: 600,
                                color: "var(--ink)"
                            }}
                        >
                            {totalPages}
                        </span>{" "}
                        ({totalPayments} total payments)
                    </div>

                    {/* Navigation controls */}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                    >
                        <button
                            type="button"
                            disabled={isFirstPage}
                            onClick={handlePreviousPage}
                            aria-label="Go to previous page"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.35rem",
                                padding:
                                    "0.45rem 0.7rem",
                                borderRadius: "0.375rem",
                                border:
                                    "1px solid var(--line)",
                                background:
                                    "var(--surface-solid)",
                                color: isFirstPage
                                    ? "var(--mute)"
                                    : "var(--ink)",
                                cursor: isFirstPage
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: isFirstPage
                                    ? 0.4
                                    : 1,
                                transition:
                                    "all 150ms ease"
                            }}
                        >
                            <ChevronLeft size={14} />

                            <span
                                style={{
                                    fontFamily:
                                        "inherit",
                                    fontSize:
                                        "0.6875rem",
                                    fontWeight: 600
                                }}
                            >
                                Previous
                            </span>
                        </button>

                        <button
                            type="button"
                            disabled={isLastPage}
                            onClick={handleNextPage}
                            aria-label="Go to next page"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.35rem",
                                padding:
                                    "0.45rem 0.7rem",
                                borderRadius: "0.375rem",
                                border:
                                    "1px solid var(--line)",
                                background:
                                    "var(--surface-solid)",
                                color: isLastPage
                                    ? "var(--mute)"
                                    : "var(--ink)",
                                cursor: isLastPage
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: isLastPage
                                    ? 0.4
                                    : 1,
                                transition:
                                    "all 150ms ease"
                            }}
                        >
                            <span
                                style={{
                                    fontFamily:
                                        "inherit",
                                    fontSize:
                                        "0.6875rem",
                                    fontWeight: 600
                                }}
                            >
                                Next
                            </span>

                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentTable;