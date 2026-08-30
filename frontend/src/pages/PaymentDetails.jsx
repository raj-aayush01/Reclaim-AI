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

            <div className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
            ">

                <button
                    onClick={() => navigate("/payments")}
                    className="
                        inline-flex
                        items-center
                        gap-2
                        text-xs
                        font-semibold
                        text-slate-400
                        hover:text-slate-200
                        transition-colors
                        cursor-pointer
                    "
                >

                    <ArrowLeft className="w-4 h-4" />

                    <span>
                        Back to Payments List
                    </span>

                </button>


                <div className="flex items-center gap-3">

                    <PaymentStatusBadge
                        status={payment.status}
                    />

                    {payment.status !== "recovered" && (

                        <Button
                            variant="glow"
                            size="md"
                            icon={Zap}
                            loading={executing}
                            onClick={
                                handleTriggerAIRecovery
                            }
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

                <div className="
                    glass-panel
                    rounded-2xl
                    border
                    border-rose-500/30
                    bg-rose-950/10
                    p-5
                ">

                    <div className="
                        flex
                        items-start
                        gap-3
                    ">

                        <div className="
                            shrink-0
                            p-2
                            rounded-xl
                            bg-rose-500/10
                            border
                            border-rose-500/20
                        ">

                            <Zap className="
                                w-5
                                h-5
                                text-rose-400
                            " />

                        </div>


                        <div>

                            <h3 className="
                                text-sm
                                font-bold
                                text-rose-200
                            ">
                                AI Recovery Could Not Be Completed
                            </h3>


                            <p className="
                                text-sm
                                text-rose-300/80
                                mt-1
                                leading-relaxed
                            ">
                                The payment was not automatically
                                recovered because the AI decision
                                could not be completed. No recovery
                                action was executed.
                            </p>


                            <p className="
                                text-xs
                                text-slate-500
                                mt-3
                                break-words
                            ">
                                {executionError}
                            </p>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                PAYMENT OVERVIEW
            ================================================= */}

            <div className="
                glass-panel
                p-6
                rounded-2xl
                border
                border-indigo-500/20
                bg-gradient-to-r
                from-slate-900/90
                to-indigo-950/20
            ">

                <div className="
                    flex
                    flex-col
                    xl:flex-row
                    xl:items-center
                    xl:justify-between
                    gap-6
                ">


                    <div className="min-w-0">

                        <span className="
                            text-[11px]
                            uppercase
                            tracking-wider
                            font-bold
                            text-indigo-400
                            block
                            mb-1
                        ">
                            Transaction Overview
                        </span>


                        <h2 className="
                            text-xl
                            sm:text-2xl
                            font-extrabold
                            text-slate-100
                            font-mono
                            break-all
                        ">
                            {payment.paymentId}
                        </h2>


                        {payment.orderId && (

                            <p className="
                                text-xs
                                text-slate-400
                                mt-2
                            ">
                                Order ID:{" "}

                                <span className="
                                    text-slate-300
                                    font-mono
                                ">
                                    {payment.orderId}
                                </span>
                            </p>

                        )}

                    </div>


                    <div className="
                        grid
                        grid-cols-2
                        sm:grid-cols-3
                        gap-6
                        xl:min-w-[420px]
                    ">


                        <div>

                            <span className="
                                text-[10px]
                                uppercase
                                tracking-wider
                                text-slate-400
                                block
                            ">
                                Amount
                            </span>


                            <span className="
                                text-xl
                                font-bold
                                text-slate-100
                            ">
                                {formatCurrency(
                                    payment.amount
                                )}
                            </span>

                        </div>


                        <div>

                            <span className="
                                text-[10px]
                                uppercase
                                tracking-wider
                                text-slate-400
                                block
                            ">
                                Failure Type
                            </span>


                            <span className="
                                text-xs
                                font-semibold
                                text-indigo-300
                                block
                                mt-1
                            ">
                                {payment.scenario
                                    ? formatScenario(
                                        payment.scenario
                                    )
                                    : "Not available"}
                            </span>

                        </div>


                        <div>

                            <span className="
                                text-[10px]
                                uppercase
                                tracking-wider
                                text-slate-400
                                block
                            ">
                                Attempts
                            </span>


                            <span className="
                                text-sm
                                font-bold
                                text-slate-200
                            ">
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

                <div className="
                    glass-panel
                    p-5
                    rounded-2xl
                    flex
                    flex-col
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                    gap-5
                ">


                    <div className="
                        flex
                        items-center
                        gap-3
                    ">

                        <div className="
                            p-3
                            rounded-xl
                            bg-slate-800
                            text-indigo-400
                            border
                            border-slate-700
                        ">

                            <User className="w-5 h-5" />

                        </div>


                        <div>

                            <h4 className="
                                text-sm
                                font-bold
                                text-slate-200
                            ">
                                {customer.name}
                            </h4>


                            <p className="
                                text-xs
                                text-slate-400
                                font-mono
                            ">
                                {customer.email ||
                                    "No email"}

                                {" • "}

                                {customer.phone ||
                                    "No phone"}
                            </p>

                        </div>

                    </div>


                    <div className="
                        text-left
                        lg:text-right
                        text-xs
                        text-slate-400
                    ">

                        <span className="block">

                            Customer ID:{" "}

                            <strong className="
                                text-slate-200
                                font-mono
                            ">
                                {customer.customerId ||
                                    payment.customerId ||
                                    "Not available"}
                            </strong>

                        </span>


                        <span className="
                            block
                            mt-1
                        ">

                            Customer Segment:{" "}

                            <strong className="
                                text-indigo-400
                            ">
                                {customer.segment ||
                                    "STANDARD"}
                            </strong>

                        </span>

                    </div>

                </div>

            )}


            {/* =================================================
                NO RECOVERY YET
            ================================================= */}

            {!hasRunRecovery && (

                <div className="
                    glass-panel
                    rounded-2xl
                    border
                    border-indigo-500/20
                    bg-gradient-to-br
                    from-slate-900
                    to-indigo-950/20
                    p-8
                ">

                    <div className="
                        flex
                        flex-col
                        items-center
                        text-center
                        max-w-2xl
                        mx-auto
                    ">

                        <div className="
                            p-4
                            rounded-2xl
                            bg-indigo-500/10
                            border
                            border-indigo-500/20
                            text-indigo-400
                            mb-4
                        ">

                            <Brain className="w-8 h-8" />

                        </div>


                        <h3 className="
                            text-lg
                            font-bold
                            text-slate-100
                        ">
                            Ready for AI Recovery
                        </h3>


                        <p className="
                            text-sm
                            text-slate-400
                            mt-2
                            leading-relaxed
                        ">
                            This payment has been inspected,
                            but AI has not made a recovery decision
                            yet. Run AI Recovery to analyze the
                            failure, review customer history, choose
                            a recovery strategy, and execute the
                            permitted action.
                        </p>


                        <div className="
                            flex
                            items-center
                            gap-2
                            mt-5
                            text-xs
                            text-slate-500
                        ">

                            <Clock className="w-4 h-4" />

                            <span>
                                No automatic recovery action
                                has been executed.
                            </span>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                RECOVERY RESULTS
            ================================================= */}

            {hasRunRecovery && (

                <div className="
                    grid
                    grid-cols-1
                    lg:grid-cols-12
                    gap-6
                ">


                    {/* =================================================
                        LEFT SIDE — EXPLANATION
                    ================================================= */}

                    <div className="
                        lg:col-span-7
                        space-y-6
                    ">


                        {currentAIDecision && (

                            <AIDecisionCard
                                aiDecision={
                                    currentAIDecision
                                }
                                payment={payment}
                                customer={customer}
                            />

                        )}


                        {currentPolicyDecision && (

                            <PolicyDecision
                                policyDecision={
                                    currentPolicyDecision
                                }
                                payment={payment}
                            />

                        )}


                        {currentExecutionResult && (

                            <ExecutionResult
                                executionResult={
                                    currentExecutionResult
                                }
                                payment={payment}
                            />

                        )}

                    </div>


                    {/* =================================================
                        RIGHT SIDE — RECOVERY JOURNEY
                    ================================================= */}

                    <div className="lg:col-span-5">

                        <RecoveryTimeline
                            payment={payment}
                            aiDecision={
                                currentAIDecision
                            }
                            policyDecision={
                                currentPolicyDecision
                            }
                            executionResult={
                                currentExecutionResult
                            }
                        />

                    </div>

                </div>

            )}


            {/* =================================================
                HIGH LEVEL RECOVERY SUMMARY
            ================================================= */}

            {hasRunRecovery && (

                <div className="
                    glass-panel
                    rounded-2xl
                    border
                    border-slate-800
                    overflow-hidden
                ">


                    <div className="
                        px-6
                        py-5
                        border-b
                        border-slate-800
                    ">

                        <div className="
                            flex
                            flex-col
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                            gap-3
                        ">

                            <div className="
                                flex
                                items-center
                                gap-3
                            ">

                                <div className="
                                    p-2.5
                                    rounded-xl
                                    bg-indigo-500/10
                                    border
                                    border-indigo-500/20
                                ">

                                    <CheckCircle2 className="
                                        w-5
                                        h-5
                                        text-indigo-400
                                    " />

                                </div>


                                <div>

                                    <h3 className="
                                        text-base
                                        font-bold
                                        text-slate-100
                                    ">
                                        Recovery Summary
                                    </h3>


                                    <p className="
                                        text-xs
                                        text-slate-500
                                        mt-0.5
                                    ">
                                        What the system decided
                                        and what happened next
                                    </p>

                                </div>

                            </div>


                            {isRecovered && (

                                <span className="
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    px-3
                                    py-1.5
                                    rounded-full
                                    text-[11px]
                                    font-bold
                                    bg-emerald-950/60
                                    text-emerald-300
                                    border
                                    border-emerald-800/60
                                ">

                                    <CheckCircle2
                                        className="w-3.5 h-3.5"
                                    />

                                    Money Recovered

                                </span>

                            )}

                        </div>

                    </div>


                    <div className="
                        p-6
                        grid
                        grid-cols-1
                        md:grid-cols-3
                        gap-4
                    ">


                        {/* AI DECISION */}

                        <div className="
                            rounded-xl
                            border
                            border-slate-800
                            bg-slate-950/40
                            p-5
                        ">

                            <span className="
                                text-[10px]
                                uppercase
                                tracking-wider
                                font-bold
                                text-slate-500
                            ">
                                AI Decision
                            </span>


                            <div className="
                                mt-2
                                text-sm
                                font-bold
                                text-indigo-300
                            ">
                                {currentAIDecision?.action
                                    ? formatRecoveryAction(
                                        currentAIDecision.action
                                    )
                                    : "Not available"}
                            </div>


                            {currentAIDecision?.confidence !==
                                null &&
                                currentAIDecision?.confidence !==
                                undefined && (

                                    <div className="
                                        mt-2
                                        text-xs
                                        text-slate-500
                                    ">
                                        Confidence:{" "}

                                        <span className="
                                            text-slate-300
                                            font-semibold
                                        ">
                                            {
                                                Math.round(
                                                    currentAIDecision
                                                        .confidence <= 1
                                                        ? currentAIDecision
                                                            .confidence * 100
                                                        : currentAIDecision
                                                            .confidence
                                                )
                                            }%
                                        </span>
                                    </div>

                                )}

                        </div>


                        {/* SAFETY */}

                        <div className="
                            rounded-xl
                            border
                            border-slate-800
                            bg-slate-950/40
                            p-5
                        ">

                            <span className="
                                text-[10px]
                                uppercase
                                tracking-wider
                                font-bold
                                text-slate-500
                            ">
                                Safety Check
                            </span>


                            <div className="
                                mt-2
                                flex
                                items-center
                                gap-2
                            ">

                                {currentPolicyDecision?.allowed ? (

                                    <>
                                        <ShieldCheck className="
                                            w-4
                                            h-4
                                            text-emerald-400
                                        " />

                                        <span className="
                                            text-sm
                                            font-bold
                                            text-emerald-300
                                        ">
                                            Approved
                                        </span>
                                    </>

                                ) : (

                                    <>
                                        <XCircle className="
                                            w-4
                                            h-4
                                            text-rose-400
                                        " />

                                        <span className="
                                            text-sm
                                            font-bold
                                            text-rose-300
                                        ">
                                            Blocked
                                        </span>
                                    </>

                                )}

                            </div>


                            <p className="
                                mt-2
                                text-xs
                                text-slate-500
                                leading-relaxed
                            ">
                                {currentPolicyDecision?.reason ||
                                    "No policy explanation available."}
                            </p>

                        </div>


                        {/* OUTCOME */}

                        <div className="
                            rounded-xl
                            border
                            border-slate-800
                            bg-slate-950/40
                            p-5
                        ">

                            <span className="
                                text-[10px]
                                uppercase
                                tracking-wider
                                font-bold
                                text-slate-500
                            ">
                                Outcome
                            </span>


                            <div className="
                                mt-2
                                text-sm
                                font-bold
                                text-slate-100
                            ">
                                {currentExecutionResult?.result ||
                                    "Processed"}
                            </div>


                            {recoveredAmount > 0 && (

                                <div className="
                                    mt-2
                                    text-xs
                                    text-emerald-400
                                    font-semibold
                                ">
                                    {formatCurrency(
                                        recoveredAmount
                                    )} recovered
                                </div>

                            )}

                        </div>

                    </div>


                    {/* Simple human-readable explanation */}

                    <div className="
                        mx-6
                        mb-6
                        rounded-xl
                        border
                        border-indigo-500/10
                        bg-indigo-950/10
                        p-5
                    ">

                        <div className="
                            flex
                            items-start
                            gap-3
                        ">

                            <Brain className="
                                w-5
                                h-5
                                shrink-0
                                text-indigo-400
                                mt-0.5
                            " />


                            <div>

                                <h4 className="
                                    text-sm
                                    font-bold
                                    text-slate-200
                                ">
                                    In simple terms
                                </h4>


                                <p className="
                                    text-sm
                                    text-slate-400
                                    mt-1
                                    leading-relaxed
                                ">

                                    {currentAIDecision?.whyThisDecision ||
                                        currentAIDecision?.reason ||
                                        latestLog?.aiReason ||
                                        "The system evaluated the payment and selected a recovery strategy."}

                                    {" "}

                                    {currentExecutionResult?.result ===
                                        "RECOVERED"
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

                <div className="
                    glass-panel
                    rounded-2xl
                    overflow-hidden
                    border
                    border-slate-800
                ">


                    <div className="
                        px-6
                        py-4
                        border-b
                        border-slate-800
                        flex
                        items-center
                        justify-between
                        gap-4
                    ">

                        <div className="
                            flex
                            items-center
                            gap-2.5
                        ">

                            <FileText className="
                                w-4
                                h-4
                                text-indigo-400
                            " />


                            <div>

                                <h3 className="
                                    text-sm
                                    font-bold
                                    text-slate-100
                                ">
                                    Recovery Execution Audit
                                </h3>


                                <p className="
                                    text-[11px]
                                    text-slate-500
                                    mt-0.5
                                ">
                                    Recorded recovery events
                                </p>

                            </div>

                        </div>


                        <span className="
                            text-[11px]
                            font-semibold
                            text-slate-400
                            whitespace-nowrap
                        ">
                            {uniqueLogs.length}{" "}
                            {uniqueLogs.length === 1
                                ? "event"
                                : "events"}
                        </span>

                    </div>


                    <div className="overflow-x-auto">

                        <table className="
                            w-full
                            text-left
                            border-collapse
                            text-xs
                        ">

                            <thead>

                                <tr className="
                                    bg-slate-900/80
                                    border-b
                                    border-slate-800
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-400
                                ">

                                    <th className="px-4 py-3">
                                        Time
                                    </th>

                                    <th className="px-4 py-3">
                                        AI Decision
                                    </th>

                                    <th className="px-4 py-3">
                                        Confidence
                                    </th>

                                    <th className="px-4 py-3">
                                        Safety
                                    </th>

                                    <th className="px-4 py-3">
                                        Action Taken
                                    </th>

                                    <th className="px-4 py-3">
                                        Result
                                    </th>

                                    <th className="px-4 py-3">
                                        Amount
                                    </th>

                                </tr>

                            </thead>


                            <tbody className="
                                divide-y
                                divide-slate-800/60
                            ">

                                {uniqueLogs.map(
                                    (log, index) => (

                                        <tr
                                            key={
                                                log._id ||
                                                `${log.createdAt}-${index}`
                                            }
                                            className="
                                                hover:bg-slate-800/40
                                                transition-colors
                                            "
                                        >

                                            <td className="
                                                px-4
                                                py-3
                                                text-slate-400
                                                whitespace-nowrap
                                                text-[11px]
                                            ">
                                                {formatDate(
                                                    log.createdAt
                                                )}
                                            </td>


                                            <td className="
                                                px-4
                                                py-3
                                                font-semibold
                                                text-indigo-300
                                                whitespace-nowrap
                                            ">
                                                {formatRecoveryAction(
                                                    log.aiAction
                                                )}
                                            </td>


                                            <td className="
                                                px-4
                                                py-3
                                                text-slate-300
                                            ">

                                                {log.aiConfidence !==
                                                    null &&
                                                    log.aiConfidence !==
                                                    undefined
                                                    ? `${Math.round(
                                                        log.aiConfidence <= 1
                                                            ? log.aiConfidence * 100
                                                            : log.aiConfidence
                                                    )}%`
                                                    : "—"}

                                            </td>


                                            <td className="px-4 py-3">

                                                {log.policyAllowed ? (

                                                    <span className="
                                                        inline-flex
                                                        items-center
                                                        gap-1
                                                        px-2
                                                        py-0.5
                                                        rounded
                                                        text-[10px]
                                                        font-bold
                                                        bg-emerald-950/60
                                                        text-emerald-300
                                                        border
                                                        border-emerald-800/60
                                                    ">

                                                        <ShieldCheck className="
                                                            w-3
                                                            h-3
                                                        " />

                                                        Approved

                                                    </span>

                                                ) : (

                                                    <span className="
                                                        inline-flex
                                                        items-center
                                                        gap-1
                                                        px-2
                                                        py-0.5
                                                        rounded
                                                        text-[10px]
                                                        font-bold
                                                        bg-rose-950/60
                                                        text-rose-300
                                                        border
                                                        border-rose-800/60
                                                    ">

                                                        <XCircle className="
                                                            w-3
                                                            h-3
                                                        " />

                                                        Blocked

                                                    </span>

                                                )}

                                            </td>


                                            <td className="
                                                px-4
                                                py-3
                                                font-bold
                                                text-slate-200
                                                whitespace-nowrap
                                            ">
                                                {formatRecoveryAction(
                                                    log.finalAction
                                                )}
                                            </td>


                                            <td className="px-4 py-3">

                                                <span className={`
                                                    inline-flex
                                                    items-center
                                                    px-2
                                                    py-0.5
                                                    rounded
                                                    text-[10px]
                                                    font-bold
                                                    border

                                                    ${
                                                        log.executionResult ===
                                                        "RECOVERED"

                                                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"

                                                            : log.executionResult ===
                                                                "PENDING"

                                                                ? "bg-amber-950/80 text-amber-400 border-amber-800/60"

                                                                : log.executionResult ===
                                                                    "ESCALATED"

                                                                    ? "bg-purple-950/80 text-purple-400 border-purple-800/60"

                                                                    : "bg-rose-950/80 text-rose-400 border-rose-800/60"
                                                    }
                                                `}>

                                                    {log.executionResult ||
                                                        "—"}

                                                </span>

                                            </td>


                                            <td className="
                                                px-4
                                                py-3
                                                font-semibold
                                                text-slate-200
                                            ">

                                                {log.recoveredAmount > 0
                                                    ? formatCurrency(
                                                        log.recoveredAmount
                                                    )
                                                    : "—"}

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}

        </div>
    );
};


export default PaymentDetails;