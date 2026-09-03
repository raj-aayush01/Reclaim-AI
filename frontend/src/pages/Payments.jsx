import React, { useState } from "react";
import { usePayments } from "../hooks/usePayments";
import { useRecovery } from "../hooks/useRecovery";
import PaymentFilters from "../components/payments/PaymentFilters";
import PaymentTable from "../components/payments/PaymentTable";
import ErrorMessage from "../components/common/ErrorMessage";
import Loader from "../components/common/Loader";
import { CreditCard, RefreshCw, CheckCircle2 } from "lucide-react";
import Modal from "../components/common/Modal";
import AIDecisionCard from "../components/recovery/AIDecisionCard";
import PolicyDecision from "../components/recovery/PolicyDecision";
import ExecutionResult from "../components/recovery/ExecutionResult";
import Button from "../components/common/Button";

export const Payments = () => {
    const {
        payments,
        pagination,
        loading,
        error,
        filters,
        updateFilters,
        resetFilters,
        refetch
    } = usePayments();

    const { executeRecovery } = useRecovery();

    const [executingId, setExecutingId] = useState(null);
    const [recoveryModalOpen, setRecoveryModalOpen] =
        useState(false);
    const [selectedPaymentId, setSelectedPaymentId] =
        useState(null);
    const [recoveryModalData, setRecoveryModalData] =
        useState(null);
    const [executionError, setExecutionError] =
        useState(null);

    const handleRunRecovery = async (paymentId) => {
        if (!paymentId || executingId) {
            return;
        }

        setExecutingId(paymentId);
        setSelectedPaymentId(paymentId);
        setRecoveryModalData(null);
        setExecutionError(null);
        setRecoveryModalOpen(true);

        try {
            const result = await executeRecovery(paymentId);

            setRecoveryModalData(result);

            try {
                await refetch();
            } catch (refreshError) {
                console.warn(
                    "Payment table refresh failed:",
                    refreshError
                );
            }
        } catch (err) {
            setExecutionError(
                err.message ||
                "AI Recovery execution failed"
            );
        } finally {
            setExecutingId(null);
        }
    };

    const handleCloseRecoveryModal = () => {
        if (executingId) {
            return;
        }

        setRecoveryModalOpen(false);
        setSelectedPaymentId(null);
        setRecoveryModalData(null);
        setExecutionError(null);
    };

    const recoveryData = recoveryModalData || {};

    const payment =
        recoveryData.payment || null;

    const aiDecision =
        recoveryData.aiDecision ||
        recoveryData.aiRecommendation ||
        null;

    const policyDecision =
        recoveryData.policyDecision ||
        recoveryData.policyCheck ||
        null;

    const executionResult =
        recoveryData.executionResult ||
        null;

    return (
        <div className="page-stack animate-rise">

            <div className="panel page-header-panel panel-accent-primary">

                <div>

                    <span
                        className="eyebrow-primary"
                        style={{
                            display: "block",
                            marginBottom: "4px"
                        }}
                    >
                        Payment Ledger
                    </span>

                    <h1 className="page-title">
                        <CreditCard
                            size={20}
                            style={{
                                color: "var(--primary)"
                            }}
                        />

                        Payments &amp; AI Recovery Desk
                    </h1>

                    <p className="page-desc">
                        Search, filter, inspect failure scenarios,
                        and trigger autonomous AI recovery routines.
                    </p>

                </div>

                <button
                    onClick={refetch}
                    disabled={loading}
                    className="icon-btn"
                    title="Refresh payment table"
                >
                    <RefreshCw
                        size={16}
                        className={
                            loading
                                ? "animate-spin"
                                : ""
                        }
                        style={
                            loading
                                ? {
                                    animation:
                                        "spin 1s linear infinite"
                                }
                                : undefined
                        }
                    />
                </button>

            </div>

            {executionError && (
                <ErrorMessage
                    message={executionError}
                    onRetry={() =>
                        setExecutionError(null)
                    }
                />
            )}

            <PaymentFilters
                filters={filters}
                onFilterChange={updateFilters}
                onReset={resetFilters}
            />

            {error ? (
                <ErrorMessage
                    message={error}
                    onRetry={refetch}
                />
            ) : (
                <PaymentTable
                    payments={payments}
                    pagination={pagination}
                    loading={loading}
                    onRunRecovery={handleRunRecovery}
                    executingId={executingId}
                    onPageChange={(newPage) =>
                        updateFilters({
                            page: newPage
                        })
                    }
                />
            )}

            <Modal
                isOpen={recoveryModalOpen}
                onClose={handleCloseRecoveryModal}
                title={`AI Recovery — ${
                    selectedPaymentId || ""
                }`}
                maxWidth="max-w-2xl"
            >

                {executingId ? (
                    <div
                        style={{
                            padding: "3rem 0",
                            textAlign: "center"
                        }}
                    >
                        <Loader
                            text="AI Recovery Agent is executing..."
                        />

                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--mute)",
                                marginTop: "1rem",
                                lineHeight: 1.6
                            }}
                        >
                            Inspecting the payment, reviewing
                            customer history, selecting the safest
                            recovery action, and enforcing guardrails.
                        </p>
                    </div>
                ) : executionError ? (
                    <ErrorMessage
                        message={executionError}
                        onRetry={() =>
                            selectedPaymentId &&
                            handleRunRecovery(
                                selectedPaymentId
                            )
                        }
                    />
                ) : recoveryModalData ? (
                    <div className="page-stack">

                        <div className="banner-up">

                            <CheckCircle2
                                size={16}
                                style={{
                                    flexShrink: 0
                                }}
                            />

                            <span>
                                AI Recovery Engine completed
                                for payment{" "}

                                <strong
                                    style={{
                                        color: "var(--ink)"
                                    }}
                                >
                                    {payment?.paymentId ||
                                        selectedPaymentId ||
                                        "Unknown"}
                                </strong>.
                            </span>

                        </div>

                        <AIDecisionCard
                            aiDecision={aiDecision}
                            payment={payment}
                        />

                        <PolicyDecision
                            policyDecision={
                                policyDecision
                            }
                            aiDecision={aiDecision}
                            payment={payment}
                        />

                        {executionResult && (
                            <ExecutionResult
                                executionResult={{
                                    ...executionResult,

                                    actionExecuted:
                                        recoveryData.actionExecuted ||
                                        executionResult.actionExecuted,

                                    attemptsMade:
                                        recoveryData.attemptsMade ??
                                        executionResult.attemptsMade,

                                    maxAttempts:
                                        recoveryData.maxAttempts ??
                                        executionResult.maxAttempts
                                }}
                                payment={payment}
                            />
                        )}

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                paddingTop: "0.5rem"
                            }}
                        >
                            <Button
                                variant="primary"
                                onClick={
                                    handleCloseRecoveryModal
                                }
                            >
                                Close &amp; Refresh Table
                            </Button>
                        </div>

                    </div>
                ) : null}

            </Modal>

        </div>
    );
};

export default Payments;