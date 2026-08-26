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
        <div className="space-y-6 animate-fade-in">
            {/* Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
                <div>
                    <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-400" />
                        Payments & AI Recovery Desk
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Search, filter, inspect failure scenarios, and trigger autonomous AI recovery routines.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                        title="Refresh payment table"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Execution Error Banner */}
            {executionError && (
                <ErrorMessage
                    message={executionError}
                    onRetry={() => setExecutionError(null)}
                />
            )}

            {/* Filter Bar */}
            <PaymentFilters
                filters={filters}
                onFilterChange={updateFilters}
                onReset={resetFilters}
            />

            {/* Payments Data Table */}
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

            {/* AI Recovery Execution Modal Result */}
            <Modal
                isOpen={!!recoveryModalData}
                onClose={() => setRecoveryModalData(null)}
                title="AI Recovery Workflow Execution Output"
                maxWidth="max-w-2xl"
            >
                {recoveryModalData && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                                AI Recovery Engine executed for payment{" "}
                                <strong>
                                    {recoveryModalData.paymentId || recoveryModalData.executionResult?.paymentId}
                                </strong>.
                            </span>
                        </div>

                        {/* Standardized Props (Change 1, 3, 5) */}
                        <AIDecisionCard
                            aiDecision={recoveryModalData.aiDecision || recoveryModalData.aiRecommendation}
                        />

                        <PolicyDecision
                            policyDecision={recoveryModalData.policyDecision || recoveryModalData.policyCheck}
                        />

                        {recoveryModalData.executionResult && (
                            <ExecutionResult
                                executionResult={recoveryModalData.executionResult}
                            />
                        )}

                        <div className="flex justify-end pt-2">
                            <Button variant="primary" onClick={() => setRecoveryModalData(null)}>
                                Close & Refresh Table
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Payments;
