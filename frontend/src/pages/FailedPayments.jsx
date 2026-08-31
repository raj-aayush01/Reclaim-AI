import React, { useState } from "react";
import { usePayments } from "../hooks/usePayments";
import { runAIRecovery } from "../services/recoveryService";
import AgentRunTimeline from "../components/recovery/AgentRunTimeline";
import PaymentStatusBadge from "../components/payments/PaymentStatusBadge";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import {
    Zap,
    AlertOctagon,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export const FailedPayments = () => {
    const {
        payments,
        pagination,
        loading,
        error,
        refetch,
        updateFilters
    } = usePayments({
        status: "failed"
    });

    const [selectedPayment, setSelectedPayment] = useState(null);
    const [executing, setExecuting] = useState(false);
    const [agentRun, setAgentRun] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [execError, setExecError] = useState(null);

    /*
     * Pagination values are normalized so the component
     * remains safe even if the backend response is incomplete.
     */
    const currentPage = Number(pagination?.page) || 1;
    const totalPages = Number(pagination?.pages) || 1;
    const totalPayments = Number(pagination?.total) || 0;

    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    /*
     * Move to the previous page while preserving the
     * existing failed-payment filter.
     */
    const handlePreviousPage = () => {
        if (isFirstPage) {
            return;
        }

        updateFilters({
            page: currentPage - 1
        });
    };

    /*
     * Move to the next page while preserving the
     * existing failed-payment filter.
     */
    const handleNextPage = () => {
        if (isLastPage) {
            return;
        }

        updateFilters({
            page: currentPage + 1
        });
    };

    // ---------------------------------------------------------
    // Run AI recovery for a selected payment
    // ---------------------------------------------------------

    const handleTriggerAgent = async (payment) => {
        if (!payment?.paymentId || executing) {
            return;
        }

        setSelectedPayment(payment);
        setExecuting(true);
        setExecError(null);
        setAgentRun(null);
        setModalOpen(true);

        try {
            const recoveryRes = await runAIRecovery(
                payment.paymentId
            );

            const result =
                recoveryRes?.result ||
                recoveryRes?.run ||
                recoveryRes;

            const updatedPayment =
                recoveryRes?.payment ||
                result?.payment ||
                result?.result?.payment;

            if (result) {
                setAgentRun(result);
            }

            if (updatedPayment) {
                setSelectedPayment(updatedPayment);
            }

            setExecuting(false);

            /*
             * Refresh the current page after recovery so that
             * the payment table reflects the latest payment state.
             */
            try {
                const refreshedData = await refetch();
                if (refreshedData?.payments) {
                    const freshPayment = refreshedData.payments.find(
                        (p) => p.paymentId === payment.paymentId
                    );
                    if (freshPayment) {
                        setSelectedPayment(freshPayment);
                    }
                }
            } catch (refreshError) {
                console.warn(
                    "Payment table refresh failed:",
                    refreshError
                );
            }
        } catch (err) {
            console.error(
                "AI Recovery Agent execution error:",
                err
            );

            setExecError(
                err.message ||
                "Failed to execute AI recovery agent"
            );

            setExecuting(false);
        }
    };

    // ---------------------------------------------------------
    // Close recovery modal
    // ---------------------------------------------------------

    const handleCloseModal = () => {
        if (executing) {
            return;
        }

        setModalOpen(false);
        setSelectedPayment(null);
        setAgentRun(null);
        setExecError(null);
    };

    return (
        <div className="page-stack">

            {/* =================================================
                PAGE HEADER
            ================================================== */}

            <div className="panel page-header-panel panel-accent-warn">
                <div>
                    <span
                        className="eyebrow"
                        style={{
                            color: "var(--warn)",
                            display: "block",
                            marginBottom: "4px"
                        }}
                    >
                        Dedicated Agent Workflow
                    </span>

                    <h1 className="page-title">
                        <AlertOctagon
                            size={20}
                            style={{ color: "var(--warn)" }}
                        />

                        Failed Payments Workflow Desk
                    </h1>

                    <p className="page-desc">
                        Choose one failed payment, trigger the agent,
                        and inspect the recovery decision.
                    </p>
                </div>

                <span className="count-pill count-pill-warn">
                    {pagination?.total ?? payments.length} FAILED PAYMENTS
                </span>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && !loading && (
                <ErrorMessage
                    message={error}
                    onRetry={refetch}
                />
            )}

            {/* =================================================
                PAYMENT TABLE
            ================================================== */}

            {loading && payments.length === 0 ? (
                <Loader
                    text="Fetching failed payment transactions..."
                />
            ) : !error ? (
                <div
                    className="panel"
                    style={{ overflow: "hidden" }}
                >
                    <div style={{ overflowX: "auto" }}>
                        <table className="tf-table">
                            <thead>
                                <tr>
                                    <th>Payment ID</th>
                                    <th>Customer ID</th>
                                    <th>Amount</th>
                                    <th>Scenario</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th style={{ textAlign: "right" }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {payments.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            style={{
                                                padding: "3rem",
                                                textAlign: "center",
                                                color: "var(--mute)"
                                            }}
                                        >
                                            No failed payments found
                                            in the system.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((payment) => {
                                        const isCurrentPaymentExecuting =
                                            executing &&
                                            selectedPayment?.paymentId ===
                                                payment.paymentId;

                                        return (
                                            <tr
                                                key={payment.paymentId}
                                                className="row-hover"
                                            >
                                                <td
                                                    style={{
                                                        fontWeight: 600,
                                                        color: "var(--ink)"
                                                    }}
                                                >
                                                    {payment.paymentId}
                                                </td>

                                                <td
                                                    style={{
                                                        color: "var(--mute)"
                                                    }}
                                                >
                                                    {payment.customerId}
                                                </td>

                                                <td
                                                    style={{
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {formatCurrency(
                                                        payment.amount
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="chip">
                                                        {payment.scenario}
                                                    </span>
                                                </td>

                                                <td>
                                                    <PaymentStatusBadge
                                                        status={
                                                            payment.status
                                                        }
                                                    />
                                                </td>

                                                <td
                                                    style={{
                                                        color: "var(--mute)",
                                                        fontSize: "0.6875rem"
                                                    }}
                                                >
                                                    {formatDate(
                                                        payment.createdAt
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        textAlign: "right"
                                                    }}
                                                >
                                                    <Button
                                                        variant="glow"
                                                        size="sm"
                                                        loading={
                                                            isCurrentPaymentExecuting
                                                        }
                                                        disabled={
                                                            executing
                                                        }
                                                        onClick={() =>
                                                            handleTriggerAgent(
                                                                payment
                                                            )
                                                        }
                                                        icon={Zap}
                                                    >
                                                        {isCurrentPaymentExecuting
                                                            ? "Checking..."
                                                            : "AI Recovery"}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
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
                                ({totalPayments} failed payments)
                            </div>

                            {/* Page navigation */}

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem"
                                }}
                            >
                                {/* Previous */}

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

                                {/* Next */}

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
            ) : null}

            {/* =================================================
                AI RECOVERY MODAL
            ================================================== */}

            <Modal
                isOpen={modalOpen}
                maxWidth="max-w-4xl"
                onClose={handleCloseModal}
                title={`AI Recovery — ${
                    selectedPayment?.paymentId || ""
                }`}
            >
                {executing ? (
                    <div
                        style={{
                            padding: "3rem 0",
                            textAlign: "center"
                        }}
                    >
                        <Loader text="Running AI recovery..." />

                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--mute)",
                                marginTop: "1rem",
                                lineHeight: 1.6
                            }}
                        >
                            The system is reviewing the payment,
                            evaluating the recovery decision,
                            and processing the appropriate action.
                        </p>
                    </div>
                ) : execError ? (
                    <ErrorMessage
                        message={execError}
                        onRetry={() =>
                            selectedPayment &&
                            handleTriggerAgent(selectedPayment)
                        }
                    />
                ) : agentRun ? (
                    <AgentRunTimeline
                        runData={agentRun}
                        fallbackPayment={selectedPayment}
                    />
                ) : (
                    <div
                        style={{
                            padding: "3rem 0",
                            textAlign: "center",
                            fontSize: "0.875rem",
                            color: "var(--mute)"
                        }}
                    >
                        Recovery completed, but no recovery details
                        were returned.
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FailedPayments;