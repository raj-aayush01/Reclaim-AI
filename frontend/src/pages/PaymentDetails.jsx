import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPaymentById } from "../services/paymentService";
import { useRecovery } from "../hooks/useRecovery";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import PaymentStatusBadge from "../components/payments/PaymentStatusBadge";
import AIDecisionCard from "../components/recovery/AIDecisionCard";
import PolicyDecision from "../components/recovery/PolicyDecision";
import ExecutionResult from "../components/recovery/ExecutionResult";
import RecoveryTimeline from "../components/recovery/RecoveryTimeline";
import Button from "../components/common/Button";
import { formatCurrency } from "../utils/formatCurrency";
import { formatScenario } from "../utils/statusHelpers";
import { ArrowLeft, Zap, User } from "lucide-react";

export const PaymentDetails = () => {
    const { paymentId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [executionError, setExecutionError] = useState(null);

    const { executeRecovery, executing } = useRecovery();
    const [latestExecution, setLatestExecution] = useState(null);

    const fetchDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getPaymentById(paymentId);
            setData(res);
        } catch (err) {
            console.error("Fetch details error:", err);
            setError(err.message || "Failed to load payment detail");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (paymentId) {
            fetchDetail();
        }
    }, [paymentId]);

    const handleTriggerAIRecovery = async () => {
        setExecutionError(null);
        try {
            const res = await executeRecovery(paymentId);
            setLatestExecution(res);
            fetchDetail();
        } catch (err) {
            setExecutionError(err.message || "Failed to run AI recovery");
        }
    };

    if (loading && !data) {
        return <Loader fullPage text={`Loading details for ${paymentId}...`} />;
    }

    if (error && !data) {
        return <ErrorMessage message={error} onRetry={fetchDetail} />;
    }

    const { payment = {}, customer = {}, logs = [] } = data || {};

    // Derive active decisions from live execution output or saved payment state
    const currentAIDecision = latestExecution?.aiDecision || latestExecution?.aiRecommendation || {
        action: payment.recoveryAction || "CREATE_PAYMENT_LINK",
        confidence: 0.95,
        reason: payment.failureReason || "Card declined on initial charge attempt. Automated recovery workflow available."
    };

    const currentPolicyDecision = latestExecution?.policyDecision || latestExecution?.policyCheck || {
        allowed: payment.status !== "escalated",
        finalAction: payment.recoveryAction,
        reason: payment.status === "escalated"
            ? "High-value payment requires human approval."
            : "AI recommendation passed all deterministic recovery guardrails."
    };

    const currentExecutionResult = latestExecution?.executionResult || (payment.recoveryAction ? {
        actionExecuted: payment.recoveryAction,
        paymentLinkId: payment.paymentLinkId,
        paymentLinkUrl: payment.paymentLinkUrl,
        result: payment.recoveryResult || payment.status
    } : null);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate("/payments")}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Payments List</span>
                </button>

                <div className="flex items-center gap-3">
                    <PaymentStatusBadge status={payment.status} />
                    {payment.status !== "recovered" && (
                        <Button
                            variant="glow"
                            size="md"
                            icon={Zap}
                            loading={executing}
                            onClick={handleTriggerAIRecovery}
                        >
                            Run AI Recovery
                        </Button>
                    )}
                </div>
            </div>

            {/* Execution Error Banner */}
            {executionError && (
                <ErrorMessage message={executionError} onRetry={() => setExecutionError(null)} />
            )}

            {/* Payment Summary Header Card */}
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900/90 to-indigo-950/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 block mb-1">
                            Transaction Overview
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-100 font-mono">
                            {payment.paymentId}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Order ID: <span className="text-slate-300 font-mono">{payment.orderId}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-right">
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Amount</span>
                            <span className="text-xl font-bold text-slate-100">{formatCurrency(payment.amount)}</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Scenario</span>
                            <span className="text-xs font-semibold text-indigo-300 block mt-1">
                                {formatScenario(payment.scenario)}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Attempts</span>
                            <span className="text-sm font-bold text-slate-200">{payment.attemptCount || 1}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Profile Card */}
            {customer && customer.name && (
                <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-200">{customer.name}</h4>
                            <p className="text-xs text-slate-400 font-mono">{customer.email} • {customer.phone || "No phone"}</p>
                        </div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                        <span className="block">Customer ID: <strong className="text-slate-200 font-mono">{customer.customerId}</strong></span>
                        <span className="block">Segment: <strong className="text-indigo-400">{customer.segment || "STANDARD"}</strong></span>
                    </div>
                </div>
            )}

            {/* Main Details Grid: AI Cards + Lifecycle Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                    {/* Gemini AI Decision Card */}
                    <AIDecisionCard aiDecision={currentAIDecision} />

                    {/* Policy Guardrail Decision Card */}
                    <PolicyDecision policyDecision={currentPolicyDecision} />

                    {/* Executor Output Card */}
                    {currentExecutionResult && (
                        <ExecutionResult
                            executionResult={currentExecutionResult}
                            payment={payment}
                        />
                    )}
                </div>

                {/* Right Column: Visual Recovery Lifecycle Timeline */}
                <div className="lg:col-span-5">
                    <RecoveryTimeline
                        payment={payment}
                        aiDecision={currentAIDecision}
                        policyDecision={currentPolicyDecision}
                        executionResult={currentExecutionResult}
                        logs={logs}
                    />
                </div>
            </div>
        </div>
    );
};

export default PaymentDetails;
