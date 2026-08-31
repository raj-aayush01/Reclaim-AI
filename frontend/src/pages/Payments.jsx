import React, { useState } from "react";
import { usePayments } from "../hooks/usePayments";
import { useRecovery } from "../hooks/useRecovery";
import PaymentFilters from "../components/payments/PaymentFilters";
import PaymentTable from "../components/payments/PaymentTable";
import ErrorMessage from "../components/common/ErrorMessage";
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
    const [recoveryModalData, setRecoveryModalData] = useState(null);
    const [executionError, setExecutionError] = useState(null);

    const handleRunRecovery = async (paymentId) => {
        setExecutingId(paymentId);
        setExecutionError(null);
        try {
            const res = await executeRecovery(paymentId);
            setRecoveryModalData(res);
            refetch();
        } catch (err) {
            setExecutionError(err.message || "AI Recovery execution failed");
        } finally {
            setExecutingId(null);
        }
    };

    return (
        <div className="page-stack animate-rise">
            <div className="panel page-header-panel panel-accent-primary">
                <div>
                    <span className="eyebrow-primary" style={{ display: "block", marginBottom: "4px" }}>
                        Payment Ledger
                    </span>
                    <h1 className="page-title">
                        <CreditCard size={20} style={{ color: "var(--primary)" }} />
                        Payments &amp; AI Recovery Desk
                    </h1>
                    <p className="page-desc">
                        Search, filter, inspect failure scenarios, and trigger autonomous AI recovery routines.
                    </p>
                </div>

                <button
                    onClick={refetch}
                    disabled={loading}
                    className="icon-btn"
                    title="Refresh payment table"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
                </button>
            </div>

            {executionError && (
                <ErrorMessage message={executionError} onRetry={() => setExecutionError(null)} />
            )}

            <PaymentFilters
                filters={filters}
                onFilterChange={updateFilters}
                onReset={resetFilters}
            />

            {error ? (
                <ErrorMessage message={error} onRetry={refetch} />
            ) : (
                <PaymentTable
                    payments={payments}
                    pagination={pagination}
                    loading={loading}
                    onRunRecovery={handleRunRecovery}
                    executingId={executingId}
                    onPageChange={(newPage) => updateFilters({ page: newPage })}
                />
            )}

            <Modal
                isOpen={!!recoveryModalData}
                onClose={() => setRecoveryModalData(null)}
                title="AI Recovery Workflow Execution Output"
                maxWidth="max-w-2xl"
            >
                {recoveryModalData && (
                    <div className="page-stack">
                        <div className="banner-up">
                            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                            <span>
                                AI Recovery Engine executed for payment{" "}
                                <strong style={{ color: "var(--ink)" }}>
                                    {recoveryModalData.paymentId || recoveryModalData.executionResult?.paymentId}
                                </strong>.
                            </span>
                        </div>

                        <AIDecisionCard
                            aiDecision={recoveryModalData.aiDecision || recoveryModalData.aiRecommendation}
                        />

                        <PolicyDecision
                            policyDecision={recoveryModalData.policyDecision || recoveryModalData.policyCheck}
                        />

                        {recoveryModalData.executionResult && (
                            <ExecutionResult executionResult={recoveryModalData.executionResult} />
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
                            <Button variant="primary" onClick={() => setRecoveryModalData(null)}>
                                Close &amp; Refresh Table
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Payments;
