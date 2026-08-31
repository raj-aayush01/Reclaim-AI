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
import { Zap, AlertOctagon } from "lucide-react";

export const FailedPayments = () => {
    const {
        payments,
        pagination,
        loading,
        error,
        refetch
    } = usePayments({
        status: "failed"
    });

    const [selectedPayment, setSelectedPayment] = useState(null);
    const [executing, setExecuting] = useState(false);
    const [agentRun, setAgentRun] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [execError, setExecError] = useState(null);

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

            if (result) {
                setAgentRun(result);
            }

            setExecuting(false);

            try {
                await refetch();
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

            {error && !loading && (
                <ErrorMessage
                    message={error}
                    onRetry={refetch}
                />
            )}

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

                    {pagination?.pages > 1 && (
                        <div className="table-footer">
                            <span>
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

                            <span>
                                {pagination.total} failed payments
                            </span>
                        </div>
                    )}
                </div>
            ) : null}

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