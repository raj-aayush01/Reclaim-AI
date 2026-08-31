import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getPaymentById } from "../services/paymentService";
import { useRecovery } from "../hooks/useRecovery";
import { getAgentRun } from "../services/recoveryService";

import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import PaymentStatusBadge from "../components/payments/PaymentStatusBadge";
import AIDecisionCard from "../components/recovery/AIDecisionCard";
import PolicyDecision from "../components/recovery/PolicyDecision";
import ExecutionResult from "../components/recovery/ExecutionResult";
import RecoveryTimeline from "../components/recovery/RecoveryTimeline";
import Button from "../components/common/Button";

import { formatCurrency } from "../utils/formatCurrency";
import {
    formatScenario,
    formatRecoveryAction
} from "../utils/statusHelpers";
import { formatDate } from "../utils/formatDate";

import {
    ArrowLeft,
    Zap,
    User,
    Brain,
    Clock,
    FileText,
    ShieldCheck,
    XCircle,
    CheckCircle2
} from "lucide-react";


export const PaymentDetails = () => {

    const { paymentId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [agentRun, setAgentRun] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [executionError, setExecutionError] = useState(null);
    const [latestExecution, setLatestExecution] = useState(null);

    const {
        executeRecovery,
        executing
    } = useRecovery();


    // ---------------------------------------------------------
    // Fetch payment + previously saved agent run
    // ---------------------------------------------------------

    const fetchDetail = async () => {

        setLoading(true);
        setError(null);

        try {

            const [paymentResponse, runResponse] =
                await Promise.allSettled([
                    getPaymentById(paymentId),
                    getAgentRun(paymentId)
                ]);

            if (paymentResponse.status === "fulfilled") {

                setData(paymentResponse.value);

            } else {

                throw paymentResponse.reason;
            }

            if (
                runResponse.status === "fulfilled" &&
                runResponse.value?.run
            ) {

                setAgentRun(runResponse.value.run);
            }

        } catch (err) {

            console.error(
                "Fetch details error:",
                err
            );

            setError(
                err.message ||
                "Failed to load payment details"
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        if (paymentId) {
            fetchDetail();
        }

    }, [paymentId]);


    // ---------------------------------------------------------
    // Run AI recovery
    // ---------------------------------------------------------

    const handleTriggerAIRecovery = async () => {

        setExecutionError(null);

        try {

            const response =
                await executeRecovery(paymentId);

            /*
             * Recovery endpoint:
             *
             * {
             *   message,
             *   result: { ...agent result }
             * }
             *
             * We only keep the actual result here.
             */

            if (response?.result) {

                setLatestExecution(
                    response.result
                );

            } else {

                setLatestExecution(
                    response
                );
            }

            /*
             * Refresh the payment and AgentRun.
             *
             * This means the Inspect page immediately
             * reflects the persisted recovery result.
             */

            await fetchDetail();

        } catch (err) {

            console.error(
                "AI recovery error:",
                err
            );

            /*
             * Never create fake AI information
             * when Gemini/API execution fails.
             */

            setLatestExecution(null);

            setExecutionError(
                err.message ||
                "AI recovery could not be completed. No recovery action was executed."
            );
        }
    };


    // ---------------------------------------------------------
    // Loading state
    // ---------------------------------------------------------

    if (loading && !data) {

        return (
            <Loader
                fullPage
                text={`Loading details for ${paymentId}...`}
            />
        );
    }


    // ---------------------------------------------------------
    // Error state
    // ---------------------------------------------------------

    if (error && !data) {

        return (
            <ErrorMessage
                message={error}
                onRetry={fetchDetail}
            />
        );
    }


    // ---------------------------------------------------------
    // Payment data
    // ---------------------------------------------------------

    const {
        payment = {},
        customer = {},
        logs = []
    } = data || {};


    // ---------------------------------------------------------
    // Sort logs newest first
    // ---------------------------------------------------------

    const sortedLogs = Array.isArray(logs)
        ? [...logs].sort((a, b) => {
              const dateA = new Date(
                  a?.createdAt || 0
              ).getTime();

              const dateB = new Date(
                  b?.createdAt || 0
              ).getTime();

              return dateB - dateA;
          })
        : [];


    // ---------------------------------------------------------
    // Remove exact duplicate audit entries
    //
    // This prevents the same recovery event from being
    // displayed twice when duplicate RecoveryLog records
    // exist in the database.
    // ---------------------------------------------------------

    const seen = new Set();

    const uniqueLogs = sortedLogs.filter((log) => {

        const signature = [
            log?.createdAt || "",
            log?.aiAction || "",
            log?.aiConfidence ?? "",
            log?.policyAllowed ?? "",
            log?.finalAction || "",
            log?.executionResult || "",
            log?.recoveredAmount ?? "",
            log?.message || "",
            log?.aiReason || ""
        ].join("|");

        if (seen.has(signature)) {
            return false;
        }

        seen.add(signature);

        return true;
    });


    /*
     * The latest persisted log is the most recent recovery
     * record, not necessarily the first record returned by
     * the backend.
     */

    const latestLog =
        uniqueLogs.length > 0
            ? uniqueLogs[0]
            : null;


    // ---------------------------------------------------------
    // AgentRun steps
    // ---------------------------------------------------------

    const runSteps =
        Array.isArray(agentRun?.steps)
            ? agentRun.steps
            : [];


    const decisionStep =
        runSteps.find(
            (step) =>
                step.type === "DECISION" ||
                step.tool === "gemini_recovery_decision"
        );


    const actionStep =
        runSteps.find(
            (step) =>
                step.type === "ACTION"
        );


    // ---------------------------------------------------------
    // AI decision
    // ---------------------------------------------------------

    const currentAIDecision =
        latestExecution?.aiDecision ||
        latestExecution?.aiRecommendation ||
        decisionStep?.output ||
        agentRun?.aiDecision ||
        (
            latestLog
                ? {
                    action: latestLog.aiAction,
                    confidence: latestLog.aiConfidence,
                    reason: latestLog.aiReason,
                    whyThisDecision:
                        latestLog.aiReason,

                    whatHappensNext:
                        latestLog.finalAction
                            ? `System executed ${latestLog.finalAction.replace(
                                /_/g,
                                " "
                            )}.`
                            : "The selected recovery strategy was processed.",

                    summary:
                        `Payment of ${formatCurrency(
                            payment.amount
                        )} for ${
                            customer?.name ||
                            payment.customerId ||
                            "the customer"
                        } had a ${formatScenario(
                            payment.scenario
                        )}.`
                }
                : null
        );


    // ---------------------------------------------------------
    // Policy decision
    // ---------------------------------------------------------

    const currentPolicyDecision =
        latestExecution?.policyDecision ||
        latestExecution?.policyCheck ||
        actionStep?.output?.policyDecision ||
        agentRun?.policyDecision ||
        (
            latestLog
                ? {
                    allowed:
                        latestLog.policyAllowed,

                    finalAction:
                        latestLog.finalAction,

                    reason:
                        latestLog.message ||
                        (
                            latestLog.policyAllowed
                                ? "The recovery strategy passed the system safety checks."
                                : "The system blocked the recommended action to protect the payment."
                        )
                }
                : null
        );


    // ---------------------------------------------------------
    // Execution result
    // ---------------------------------------------------------

    const currentExecutionResult =
        latestExecution?.executionResult ||
        actionStep?.output?.executionResult ||
        agentRun?.executionResult ||
        (
            latestLog
                ? {
                    result:
                        latestLog.executionResult,

                    recoveredAmount:
                        latestLog.recoveredAmount,

                    actionExecuted:
                        latestLog.finalAction,

                    message:
                        latestLog.message,

                    paymentLinkId:
                        payment.paymentLinkId,

                    paymentLinkUrl:
                        payment.paymentLinkUrl
                }
                : null
        );


    // ---------------------------------------------------------
    // Determine whether recovery information exists
    // ---------------------------------------------------------

    const hasExistingRecovery =
        Boolean(
            payment.recoveryAction ||
            payment.recoveryResult ||
            latestLog ||
            agentRun
        );


    const hasRunRecovery =
        Boolean(
            latestExecution ||
            hasExistingRecovery
        );


    // ---------------------------------------------------------
    // High-level outcome information
    // ---------------------------------------------------------

    const recoveryStatus =
        payment.status
            ? payment.status.toLowerCase()
            : null;


    const isRecovered =
        recoveryStatus === "recovered" ||
        currentExecutionResult?.result === "RECOVERED";


    const recoveredAmount =
        currentExecutionResult?.recoveredAmount ??
        latestLog?.recoveredAmount ??
        payment.recoveredAmount ??
        0;


    const displayedAction =
        currentExecutionResult?.actionExecuted ||
        currentPolicyDecision?.finalAction ||
        currentAIDecision?.action ||
        latestLog?.finalAction ||
        null;


    const readableAction =
        displayedAction
            ? formatRecoveryAction(displayedAction)
            : "No recovery action";


    // ---------------------------------------------------------
    // Page
    // ---------------------------------------------------------

    return (

        <div className="space-y-8 animate-fade-in pb-12">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <button
                    onClick={() => navigate("/payments")}
                    className="back-link"
                >
                    <ArrowLeft size={15} />
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

            {/* =================================================
                EXECUTION ERROR
            ================================================= */}

            {executionError && (
                <div className="banner-down">
                    <div className="icon-box icon-box-sm icon-box-down">
                        <Zap className="w-4 h-4" />
                    </div>

                    <div>
                        <h3 className="banner-down-title">
                            AI Recovery Could Not Be Completed
                        </h3>

                        <p className="banner-down-text">
                            The payment was not automatically recovered because the AI decision could not be completed. No recovery action was executed.
                        </p>

                        <p className="font-mono text-xs mt-2" style={{ color: "var(--down)" }}>
                            {executionError}
                        </p>
                    </div>
                </div>
            )}

            {/* =================================================
                PAYMENT OVERVIEW
            ================================================= */}

            <div className="panel panel-accent-primary p-6 rounded-xl">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                    <div className="min-w-0">
                        <span className="eyebrow-primary" style={{ display: "block", marginBottom: "4px" }}>
                            Transaction Overview
                        </span>

                        <h2
                            style={{
                                fontSize: "1.25rem",
                                fontWeight: 800,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: "var(--ink)",
                                wordBreak: "break-all"
                            }}
                        >
                            {payment.paymentId}
                        </h2>

                        {payment.orderId && (
                            <p style={{ fontSize: "0.75rem", color: "var(--mute)", marginTop: "0.5rem" }}>
                                Order ID:{" "}
                                <span className="font-mono" style={{ color: "var(--ink)", fontWeight: 500 }}>
                                    {payment.orderId}
                                </span>
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 xl:min-w-[420px]">
                        <div>
                            <span className="meta-label">Amount</span>
                            <span
                                style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: "var(--ink)"
                                }}
                            >
                                {formatCurrency(payment.amount)}
                            </span>
                        </div>

                        <div>
                            <span className="meta-label">Failure Type</span>
                            <span
                                style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    color: "var(--primary)",
                                    display: "block",
                                    marginTop: "2px"
                                }}
                            >
                                {payment.scenario ? formatScenario(payment.scenario) : "Not available"}
                            </span>
                        </div>

                        <div>
                            <span className="meta-label">Attempts</span>
                            <span
                                style={{
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: "var(--ink)",
                                    display: "block",
                                    marginTop: "2px"
                                }}
                            >
                                {payment.attemptCount ?? 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================
                CUSTOMER INFORMATION
            ================================================= */}

            {customer && customer.name && (
                <div className="panel p-5 rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-md icon-box-neutral">
                            <User className="w-5 h-5" />
                        </div>

                        <div>
                            <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>
                                {customer.name}
                            </h4>

                            <p style={{ fontSize: "0.75rem", color: "var(--mute)", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
                                {customer.email || "No email"}
                                {" • "}
                                {customer.phone || "No phone"}
                            </p>
                        </div>
                    </div>

                    <div className="text-left lg:text-right" style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
                        <span className="block">
                            Customer ID:{" "}
                            <strong className="font-mono" style={{ color: "var(--ink)" }}>
                                {customer.customerId || payment.customerId || "Not available"}
                            </strong>
                        </span>

                        <span className="block mt-1">
                            Customer Segment:{" "}
                            <strong style={{ color: "var(--primary)" }}>
                                {customer.segment || "STANDARD"}
                            </strong>
                        </span>
                    </div>
                </div>
            )}

            {/* =================================================
                NO RECOVERY YET
            ================================================= */}

            {!hasRunRecovery && (
                <div className="panel p-8 rounded-xl">
                    <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                        <div className="icon-box icon-box-lg icon-box-primary mb-4">
                            <Brain className="w-6 h-6" />
                        </div>

                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ink)" }}>
                            Ready for AI Recovery
                        </h3>

                        <p style={{ fontSize: "0.8125rem", color: "var(--mute)", marginTop: "0.5rem", lineHeight: 1.6 }}>
                            This payment has been inspected, but AI has not made a recovery decision yet. Run AI Recovery to analyze the failure, review customer history, choose a recovery strategy, and execute the permitted action.
                        </p>

                        <div className="flex items-center gap-2 mt-5" style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
                            <Clock className="w-4 h-4" />
                            <span>No automatic recovery action has been executed.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                RECOVERY RESULTS
            ================================================= */}

            {hasRunRecovery && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT SIDE — EXPLANATION */}
                    <div className="lg:col-span-7 space-y-6">
                        {currentAIDecision && (
                            <AIDecisionCard
                                aiDecision={currentAIDecision}
                                payment={payment}
                                customer={customer}
                            />
                        )}

                        {currentPolicyDecision && (
                            <PolicyDecision
                                policyDecision={currentPolicyDecision}
                                payment={payment}
                            />
                        )}

                        {currentExecutionResult && (
                            <ExecutionResult
                                executionResult={currentExecutionResult}
                                payment={payment}
                            />
                        )}
                    </div>

                    {/* RIGHT SIDE — RECOVERY JOURNEY */}
                    <div className="lg:col-span-5">
                        <RecoveryTimeline
                            payment={payment}
                            aiDecision={currentAIDecision}
                            policyDecision={currentPolicyDecision}
                            executionResult={currentExecutionResult}
                        />
                    </div>
                </div>
            )}

            {/* =================================================
                HIGH LEVEL RECOVERY SUMMARY
            ================================================= */}

            {hasRunRecovery && (
                <div className="panel rounded-xl overflow-hidden">
                    <div className="panel-header">
                        <div className="flex items-center gap-3">
                            <div className="icon-box icon-box-sm icon-box-primary">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>

                            <div>
                                <h3 className="panel-section-title">
                                    Recovery Summary
                                </h3>

                                <p className="panel-section-desc">
                                    What the system decided and what happened next
                                </p>
                            </div>
                        </div>

                        {isRecovered && (
                            <span className="count-pill count-pill-up">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Money Recovered
                            </span>
                        )}
                    </div>

                    <div className="panel-body grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* AI DECISION */}
                        <div className="sub-card">
                            <span className="meta-label">AI Decision</span>

                            <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--primary)" }}>
                                {currentAIDecision?.action
                                    ? formatRecoveryAction(currentAIDecision.action)
                                    : "Not available"}
                            </div>

                            {currentAIDecision?.confidence !== null && currentAIDecision?.confidence !== undefined && (
                                <div style={{ marginTop: "0.375rem", fontSize: "0.75rem", color: "var(--mute)" }}>
                                    Confidence:{" "}
                                    <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                                        {Math.round(
                                            currentAIDecision.confidence <= 1
                                                ? currentAIDecision.confidence * 100
                                                : currentAIDecision.confidence
                                        )}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* SAFETY */}
                        <div className="sub-card">
                            <span className="meta-label">Safety Check</span>

                            <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {currentPolicyDecision?.allowed ? (
                                    <>
                                        <ShieldCheck className="w-4 h-4 status-up" />
                                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--up)" }}>
                                            Approved
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4 status-down" />
                                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--down)" }}>
                                            Blocked
                                        </span>
                                    </>
                                )}
                            </div>

                            <p style={{ marginTop: "0.375rem", fontSize: "0.75rem", color: "var(--mute)", lineHeight: 1.5 }}>
                                {currentPolicyDecision?.reason || "No policy explanation available."}
                            </p>
                        </div>

                        {/* OUTCOME */}
                        <div className="sub-card">
                            <span className="meta-label">Outcome</span>

                            <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>
                                {currentExecutionResult?.result || "Processed"}
                            </div>

                            {recoveredAmount > 0 && (
                                <div style={{ marginTop: "0.375rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--up)" }}>
                                    {formatCurrency(recoveredAmount)} recovered
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Simple human-readable explanation */}
                    <div className="sub-card-primary" style={{ margin: "0 1.25rem 1.25rem" }}>
                        <div className="flex items-start gap-3">
                            <Brain className="w-5 h-5 shrink-0 status-primary mt-0.5" />

                            <div>
                                <h4 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>
                                    In simple terms
                                </h4>

                                <p style={{ fontSize: "0.75rem", color: "var(--mute)", marginTop: "0.25rem", lineHeight: 1.6 }}>
                                    {currentAIDecision?.whyThisDecision ||
                                        currentAIDecision?.reason ||
                                        latestLog?.aiReason ||
                                        "The system evaluated the payment and selected a recovery strategy."}
                                    {" "}
                                    {currentExecutionResult?.result === "RECOVERED"
                                        ? "The selected recovery action was executed successfully and the payment was recovered."
                                        : currentPolicyDecision?.allowed === false
                                            ? "The recommended action was not allowed by the system safety policy."
                                            : "The selected recovery strategy was processed by the recovery system."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                AUDIT LOGS
            ================================================= */}

            {uniqueLogs.length > 0 && (
                <div className="panel rounded-xl overflow-hidden">
                    <div className="panel-header">
                        <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 status-primary" />
                            <div>
                                <h3 className="panel-section-title">
                                    Recovery Execution Audit
                                </h3>
                                <p className="panel-section-desc">
                                    Recorded recovery events
                                </p>
                            </div>
                        </div>

                        <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--mute)", whiteSpace: "nowrap" }}>
                            {uniqueLogs.length} {uniqueLogs.length === 1 ? "event" : "events"}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="tf-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>AI Decision</th>
                                    <th>Confidence</th>
                                    <th>Safety</th>
                                    <th>Action Taken</th>
                                    <th>Result</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>

                            <tbody>
                                {uniqueLogs.map((log, index) => (
                                    <tr
                                        key={log._id || `${log.createdAt}-${index}`}
                                        className="row-hover"
                                    >
                                        <td className="font-mono text-xs" style={{ color: "var(--mute)", whiteSpace: "nowrap" }}>
                                            {formatDate(log.createdAt)}
                                        </td>

                                        <td className="font-semibold status-primary" style={{ whiteSpace: "nowrap" }}>
                                            {formatRecoveryAction(log.aiAction)}
                                        </td>

                                        <td className="font-mono text-xs">
                                            {log.aiConfidence !== null && log.aiConfidence !== undefined
                                                ? `${Math.round(
                                                    log.aiConfidence <= 1
                                                        ? log.aiConfidence * 100
                                                        : log.aiConfidence
                                                )}%`
                                                : "—"}
                                        </td>

                                        <td>
                                            {log.policyAllowed ? (
                                                <span className="badge-up" style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 6px", borderRadius: "4px", fontSize: "0.625rem", fontWeight: 700 }}>
                                                    <ShieldCheck className="w-3 h-3" />
                                                    Approved
                                                </span>
                                            ) : (
                                                <span className="badge-down" style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 6px", borderRadius: "4px", fontSize: "0.625rem", fontWeight: 700 }}>
                                                    <XCircle className="w-3 h-3" />
                                                    Blocked
                                                </span>
                                            )}
                                        </td>

                                        <td style={{ fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>
                                            {formatRecoveryAction(log.finalAction)}
                                        </td>

                                        <td>
                                            <span className={
                                                log.executionResult === "RECOVERED"
                                                    ? "badge-up"
                                                    : log.executionResult === "PENDING"
                                                        ? "badge-warn"
                                                        : log.executionResult === "ESCALATED"
                                                            ? "badge-warn"
                                                            : "badge-down"
                                            } style={{ display: "inline-flex", padding: "2px 6px", borderRadius: "4px", fontSize: "0.625rem", fontWeight: 700 }}>
                                                {log.executionResult || "—"}
                                            </span>
                                        </td>

                                        <td className="font-mono" style={{ fontWeight: 600, color: "var(--ink)" }}>
                                            {log.recoveredAmount > 0
                                                ? formatCurrency(log.recoveredAmount)
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PaymentDetails;