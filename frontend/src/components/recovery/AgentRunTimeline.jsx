import React from "react";
import {
    Bot,
    CheckCircle2,
    Clock,
    ShieldAlert,
    ShieldCheck,
    XCircle,
    XOctagon,
    CreditCard,
    User,
    AlertTriangle,
    ArrowDown
} from "lucide-react";

import { formatCurrency } from "../../utils/formatCurrency";

const MAX_RECOVERY_ATTEMPTS = 3;

const RECOVERY_ACTIONS = [
    "RETRY_PAYMENT",
    "CREATE_PAYMENT_LINK",
    "ESCALATE_TO_HUMAN",
    "STOP_RECOVERY"
];

const normalizeAction = (action) => {
    if (!action) {
        return "";
    }

    return String(action)
        .trim()
        .toUpperCase();
};

const normalizeResult = (result) => {
    if (!result) {
        return "";
    }

    return String(result)
        .trim()
        .toUpperCase();
};

export const AgentRunTimeline = ({
    runData = {},
    fallbackSteps = [],
    fallbackPayment = null,
    fallbackCustomer = null
}) => {
    const steps =
        Array.isArray(runData?.steps) &&
        runData.steps.length > 0
            ? runData.steps
            : Array.isArray(fallbackSteps)
                ? fallbackSteps
                : [];

    const status = normalizeResult(
        runData?.status || "COMPLETED"
    );

    const paymentObservation = steps.find(
        (step) =>
            step?.tool === "get_payment" ||
            (
                String(step?.type || "").toUpperCase() ===
                    "OBSERVATION" &&
                step?.output?.payment
            )
    );

    const customerObservation = steps.find(
        (step) =>
            step?.tool === "get_customer_history" ||
            (
                String(step?.type || "").toUpperCase() ===
                    "OBSERVATION" &&
                step?.output?.customer
            )
    );

    const decisionStep = steps.find(
        (step) => {
            const type =
                String(step?.type || "").toUpperCase();

            if (
                type === "DECISION" ||
                step?.tool === "gemini_recovery_decision"
            ) {
                return true;
            }

            const possibleActions = [
                step?.output?.action,
                step?.action,
                step?.tool
            ]
                .filter(Boolean)
                .map(normalizeAction);

            return possibleActions.some((action) =>
                RECOVERY_ACTIONS.includes(action)
            );
        }
    );

    const actionSteps = steps.filter(
        (step) =>
            String(step?.type || "").toUpperCase() ===
            "ACTION"
    );

    const actionStep =
        actionSteps[actionSteps.length - 1] || null;

    const policyStep = steps.find(
        (step) =>
            String(step?.type || "").toUpperCase() ===
            "POLICY"
    );

    const resultStep = steps.find(
        (step) =>
            String(step?.type || "").toUpperCase() ===
            "RESULT"
    );

    const terminalStep = steps.find(
        (step) =>
            String(step?.type || "").toUpperCase() ===
            "TERMINAL"
    );

    const payment =
        runData?.payment ||
        runData?.result?.payment ||
        runData?.result?.executionResult?.payment ||
        terminalStep?.output?.payment ||
        actionStep?.output?.payment ||
        fallbackPayment ||
        paymentObservation?.output?.payment ||
        null;

    const customer =
        customerObservation?.output?.customer ||
        runData?.customer ||
        runData?.result?.customer ||
        fallbackCustomer ||
        null;

    const policyInfo =
        actionStep?.output?.policyDecision ||
        actionStep?.policyDecision ||
        policyStep?.output?.policyDecision ||
        policyStep?.policyDecision ||
        runData?.policyDecision ||
        runData?.result?.policyDecision ||
        runData?.result?.result?.policyDecision ||
        null;

    const executionResult =
        actionStep?.output?.executionResult ||
        actionStep?.executionResult ||
        resultStep?.output ||
        resultStep?.executionResult ||
        runData?.executionResult ||
        runData?.result?.executionResult ||
        runData?.result?.result?.executionResult ||
        null;

    const aiDecision =
        decisionStep?.output ||
        runData?.aiDecision ||
        runData?.result?.aiDecision ||
        null;

    const recommendedAction = normalizeAction(
        aiDecision?.action ||
        decisionStep?.action ||
        runData?.recoveryAction ||
        runData?.result?.recoveryAction ||
        ""
    );

    const confidenceValue =
        aiDecision?.confidence ??
        decisionStep?.confidence ??
        runData?.confidence ??
        null;

    const confidencePercent =
        confidenceValue !== null &&
        confidenceValue !== undefined &&
        !Number.isNaN(Number(confidenceValue))
            ? Math.min(
                100,
                Math.max(
                    0,
                    Math.round(
                        Number(confidenceValue) <= 1
                            ? Number(confidenceValue) * 100
                            : Number(confidenceValue)
                    )
                )
            )
            : null;

    const aiReasoning =
        aiDecision?.whyThisDecision ||
        aiDecision?.reason ||
        decisionStep?.reason ||
        runData?.aiDecision?.whyThisDecision ||
        runData?.aiDecision?.reason ||
        runData?.reason ||
        null;

    const aiSummary =
        aiDecision?.summary ||
        runData?.aiDecision?.summary ||
        null;

    const aiNextStep =
        aiDecision?.whatHappensNext ||
        runData?.aiDecision?.whatHappensNext ||
        null;

    const executedAction = normalizeAction(
        executionResult?.actionExecuted ||
        executionResult?.action ||
        policyInfo?.finalAction ||
        terminalStep?.tool ||
        runData?.finalAction ||
        recommendedAction ||
        ""
    );

    const finalResult = normalizeResult(
        terminalStep?.output?.status ||
        terminalStep?.output?.result ||
        executionResult?.result ||
        executionResult?.status ||
        runData?.finalResult ||
        runData?.result?.result ||
        runData?.result?.status ||
        status
    );

    const isPolicyOverridden =
        Boolean(
            policyInfo &&
            policyInfo.allowed === false &&
            executedAction &&
            recommendedAction &&
            executedAction !== recommendedAction
        );

    const formatActionName = (action) => {
        if (!action) {
            return "No action recorded";
        }

        const normalized =
            normalizeAction(action);

        const names = {
            RETRY_PAYMENT:
                "Retry the payment",

            CREATE_PAYMENT_LINK:
                "Create a payment link",

            ESCALATE_TO_HUMAN:
                "Send for human review",

            STOP_RECOVERY:
                "Stop further recovery"
        };

        return (
            names[normalized] ||
            String(action)
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                )
        );
    };

    const formatScenario = (scenario) => {
        if (!scenario) {
            return "Unknown payment issue";
        }

        const names = {
            TEMPORARY_FAILURE:
                "Temporary payment failure",

            CARD_DECLINED:
                "Card declined",

            REPEATED_FAILURE:
                "Repeated payment failure",

            HIGH_VALUE_FAILURE:
                "High-value payment failure",

            UNKNOWN_FAILURE:
                "Unknown payment failure"
        };

        const normalized =
            normalizeAction(scenario);

        return (
            names[normalized] ||
            String(scenario)
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                )
        );
    };

    const formatFailureReason = (reason) => {
        if (!reason) {
            return "The payment could not be completed.";
        }

        const names = {
            INSUFFICIENT_FUNDS:
                "The customer's account did not have enough funds.",

            CARD_DECLINED:
                "The customer's card was declined.",

            BANK_ERROR:
                "The bank temporarily rejected the payment.",

            NETWORK_ERROR:
                "A temporary network or banking issue prevented the payment.",

            REPEATED_FAILURE:
                "The payment has failed repeatedly.",

            RETRY_LIMIT:
                "The payment has reached the maximum number of recovery attempts.",

            UNKNOWN_FAILURE:
                "The reason for the payment failure could not be determined.",

            UNKNOWN:
                "The reason for the payment failure could not be determined."
        };

        const normalized =
            normalizeAction(reason);

        return (
            names[normalized] ||
            String(reason)
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                )
        );
    };

    const getOutcome = () => {
        switch (finalResult) {
            case "RECOVERED":
                return {
                    label: "Payment Recovered",
                    description:
                        "The payment was successfully recovered and the outstanding amount was collected.",
                    className:
                        "panel panel-accent-up",
                    iconBoxClass:
                        "icon-box-up",
                    icon: CheckCircle2
                };

            case "PENDING":
                return {
                    label: "Payment Recovery Pending",
                    description:
                        "The original payment was not completed, but a recovery option is still open. The payment remains pending until the customer completes the next step.",
                    className:
                        "panel panel-accent-warn",
                    iconBoxClass:
                        "icon-box-warn",
                    icon: Clock
                };

            case "ESCALATED":
                return {
                    label: "Sent for Human Review",
                    description:
                        "Automated recovery was not allowed to continue. The payment has been sent to a human for review.",
                    className:
                        "panel panel-accent-warn",
                    iconBoxClass:
                        "icon-box-warn",
                    icon: ShieldAlert
                };

            case "STOPPED":
                return {
                    label: "Recovery Stopped",
                    description:
                        "No further automated recovery was performed. The payment remains unrecovered and will not receive another automatic attempt.",
                    className:
                        "panel panel-accent-down",
                    iconBoxClass:
                        "icon-box-down",
                    icon: XOctagon
                };

            case "BLOCKED":
                return {
                    label: "Recovery Blocked",
                    description:
                        "The requested recovery action was prevented by the safety rules for this payment.",
                    className:
                        "panel panel-accent-down",
                    iconBoxClass:
                        "icon-box-down",
                    icon: ShieldAlert
                };

            case "FAILED":
                return {
                    label: "Recovery Attempt Failed",
                    description:
                        "The selected recovery action was attempted, but the payment could not be recovered.",
                    className:
                        "panel panel-accent-down",
                    iconBoxClass:
                        "icon-box-down",
                    icon: XCircle
                };

            default:
                return {
                    label: "Recovery Run Completed",
                    description:
                        "The recovery workflow completed. Review the details below for the recommended action and final payment status.",
                    className:
                        "panel panel-accent-primary",
                    iconBoxClass:
                        "icon-box-primary",
                    icon: CheckCircle2
                };
        }
    };

    const outcome = getOutcome();
    const OutcomeIcon = outcome.icon;

    const scenario = payment?.scenario;
    const failureReason = payment?.failureReason;
    const amount = payment?.amount;

    /*
     * Only RETRY_PAYMENT represents an actual payment retry.
     * CREATE_PAYMENT_LINK, ESCALATE_TO_HUMAN and STOP_RECOVERY
     * must never increase the recovery attempt count.
     */
    const retryActionSteps = steps.filter(
        (step) => {
            const type =
                String(step?.type || "")
                    .toUpperCase();

            if (type !== "ACTION") {
                return false;
            }

            const action =
                normalizeAction(
                    step?.tool ||
                    step?.action ||
                    step?.output?.action ||
                    step?.input?.requestedAction
                );

            return action === "RETRY_PAYMENT";
        }
    );

    const retryStepCount =
        retryActionSteps.length;

    const paymentAttemptCount =
        payment?.attemptCount !== undefined &&
        payment?.attemptCount !== null
            ? Number(payment.attemptCount)
            : null;

    const runAttemptsMade =
        runData?.attemptsMade ??
        runData?.result?.attemptsMade ??
        terminalStep?.output?.attemptsMade ??
        actionStep?.output?.attemptsMade ??
        null;

    const validPaymentAttemptCount =
        Number.isFinite(paymentAttemptCount) &&
        paymentAttemptCount >= 0
            ? paymentAttemptCount
            : null;

    const validRunAttempts =
        Number.isFinite(Number(runAttemptsMade)) &&
        Number(runAttemptsMade) >= 0
            ? Number(runAttemptsMade)
            : null;

    const candidateAttemptCount =
        validPaymentAttemptCount !== null
            ? validPaymentAttemptCount
            : validRunAttempts !== null
                ? validRunAttempts
                : retryStepCount;

    const recoveryAttemptCount = Math.min(
        MAX_RECOVERY_ATTEMPTS,
        Math.max(
            0,
            candidateAttemptCount
        )
    );

    const policyAllowed =
        policyInfo?.allowed !== undefined
            ? policyInfo.allowed
            : null;

    const getPolicyExplanation = () => {
        if (policyInfo?.userExplanation) {
            return policyInfo.userExplanation;
        }

        if (policyInfo?.reason) {
            return policyInfo.reason;
        }

        if (policyAllowed === false) {
            return "The requested action was not allowed for this payment, so the system used a safer recovery path.";
        }

        if (policyAllowed === true) {
            return "The recommended action passed the safety checks for this payment.";
        }

        return "The safety-check result was not available for this recovery run.";
    };

    const getAIExplanation = () => {
        if (aiReasoning) {
            return aiReasoning;
        }

        switch (recommendedAction) {
            case "RETRY_PAYMENT":
                return "The payment appeared suitable for another attempt because the failure looked temporary and the allowed retry count had not been reached.";

            case "CREATE_PAYMENT_LINK":
                return "The original payment could not be completed, so ReclaimAI recommended giving the customer another way to complete the payment.";

            case "ESCALATE_TO_HUMAN":
                return "The available information did not make automatic recovery sufficiently safe, so the payment was sent for human review.";

            case "STOP_RECOVERY":
                return "The payment had already reached the allowed recovery limit, so no further automatic payment attempt was recommended.";

            default:
                return "ReclaimAI analyzed the payment and selected the safest available recovery option.";
        }
    };

    const getExecutionExplanation = () => {
        switch (finalResult) {
            case "RECOVERED":
                return "The selected recovery action succeeded and the payment amount was recovered.";

            case "PENDING":
                return "A recovery payment link was created. The money has not been recovered yet because the customer still needs to complete the payment.";

            case "STOPPED":
                return "No further payment attempt was made because the recovery process reached its permitted limit.";

            case "BLOCKED":
                return "The requested recovery action was prevented by the safety rules, so it was not executed.";

            case "ESCALATED":
                return "No further automated payment attempt was made. The payment was moved to human review.";

            case "FAILED":
                return "The recovery action was attempted, but the payment gateway did not successfully recover the payment.";

            default:
                return (
                    executionResult?.message ||
                    "The recovery workflow completed without a successful payment recovery."
                );
        }
    };

    return (
        <div className="space-y-5 pb-10">
            <div
                className={`p-6 rounded-xl ${outcome.className}`}
                style={{
                    borderWidth: "1px",
                    boxShadow:
                        finalResult === "RECOVERED"
                            ? "0 8px 30px rgba(16, 185, 129, 0.10)"
                            : "none"
                }}
            >
                <div className="flex items-start gap-4">
                    <div
                        className={`icon-box icon-box-lg ${outcome.iconBoxClass}`}
                        style={{
                            width: "3.25rem",
                            height: "3.25rem",
                            flexShrink: 0
                        }}
                    >
                        <OutcomeIcon className="w-6 h-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <span
                            className="eyebrow"
                            style={{
                                display: "block",
                                marginBottom: "4px"
                            }}
                        >
                            Final Outcome
                        </span>

                        <h2
                            style={{
                                fontSize: "1.5rem",
                                lineHeight: 1.2,
                                fontWeight: 800,
                                color: "var(--ink)",
                                fontFamily:
                                    "'Inter', sans-serif",
                                letterSpacing:
                                    "-0.02em"
                            }}
                        >
                            {outcome.label}
                        </h2>

                        <p
                            style={{
                                fontSize: "0.8125rem",
                                color: "var(--mute)",
                                marginTop: "0.4rem",
                                lineHeight: 1.55,
                                maxWidth: "48rem"
                            }}
                        >
                            {outcome.description}
                        </p>

                        {finalResult === "RECOVERED" &&
                            executionResult?.recoveredAmount !==
                                undefined &&
                            Number(
                                executionResult.recoveredAmount
                            ) > 0 && (
                                <div
                                    style={{
                                        marginTop: "1rem",
                                        display: "inline-flex",
                                        flexDirection: "column",
                                        padding: "0.75rem 1rem",
                                        borderRadius: "0.625rem",
                                        background:
                                            "rgba(16, 185, 129, 0.08)",
                                        border:
                                            "1px solid rgba(16, 185, 129, 0.20)"
                                    }}
                                >
                                    <span
                                        className="meta-label"
                                        style={{
                                            color: "var(--up)",
                                            marginBottom: "2px"
                                        }}
                                    >
                                        Amount Recovered
                                    </span>

                                    <span
                                        style={{
                                            fontSize: "1.35rem",
                                            lineHeight: 1.2,
                                            fontWeight: 800,
                                            color: "var(--up)",
                                            fontFamily:
                                                "'JetBrains Mono', monospace"
                                        }}
                                    >
                                        {formatCurrency(
                                            executionResult.recoveredAmount
                                        )}
                                    </span>
                                </div>
                            )}
                    </div>
                </div>

                <div
                    className="grid grid-cols-2 md:grid-cols-4 gap-3"
                    style={{
                        marginTop: "1.25rem"
                    }}
                >
                    <div className="sub-card">
                        <span
                            className="meta-label"
                            style={{
                                marginBottom: "2px"
                            }}
                        >
                            Amount
                        </span>

                        <span className="meta-value">
                            {amount !== undefined
                                ? formatCurrency(amount)
                                : "Not available"}
                        </span>
                    </div>

                    <div className="sub-card">
                        <span
                            className="meta-label"
                            style={{
                                marginBottom: "2px"
                            }}
                        >
                            Customer
                        </span>

                        <span className="meta-value truncate block">
                            {customer?.name ||
                                customer?.customerId ||
                                payment?.customerId ||
                                "Unknown"}
                        </span>
                    </div>

                    <div
                        className="sub-card"
                        style={{
                            border:
                                finalResult === "RECOVERED"
                                    ? "1px solid rgba(16, 185, 129, 0.18)"
                                    : undefined
                        }}
                    >
                        <span
                            className="meta-label"
                            style={{
                                marginBottom: "2px"
                            }}
                        >
                            Recovery Attempts
                        </span>

                        <span
                            className="meta-value"
                            style={{
                                color:
                                    finalResult === "RECOVERED"
                                        ? "var(--up)"
                                        : "var(--ink)"
                            }}
                        >
                            {recoveryAttemptCount} /{" "}
                            {MAX_RECOVERY_ATTEMPTS}
                        </span>
                    </div>

                    <div className="sub-card">
                        <span
                            className="meta-label"
                            style={{
                                marginBottom: "2px"
                            }}
                        >
                            Original Payment
                        </span>

                        <span
                            className="meta-value capitalize"
                            style={{
                                color: "var(--down)"
                            }}
                        >
                            {payment?.status ||
                                "Failed"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="panel rounded-xl overflow-hidden">
                <div className="panel-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-sm icon-box-warn">
                            <AlertTriangle className="w-4 h-4" />
                        </div>

                        <div>
                            <h3 className="panel-section-title">
                                What Went Wrong
                            </h3>

                            <p className="panel-section-desc">
                                The payment issue ReclaimAI investigated
                            </p>
                        </div>
                    </div>
                </div>

                <div className="panel-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="sub-card">
                            <span
                                className="meta-label"
                                style={{
                                    marginBottom: "2px"
                                }}
                            >
                                Failure Type
                            </span>

                            <span
                                style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    color: "var(--warn)"
                                }}
                            >
                                {formatScenario(scenario)}
                            </span>
                        </div>

                        <div className="sub-card">
                            <span
                                className="meta-label"
                                style={{
                                    marginBottom: "2px"
                                }}
                            >
                                Reason
                            </span>

                            <span
                                style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    color: "var(--ink)"
                                }}
                            >
                                {formatFailureReason(
                                    failureReason
                                )}
                            </span>
                        </div>
                    </div>

                    {payment?.paymentId && (
                        <div className="mt-3 sub-card">
                            <span
                                className="meta-label"
                                style={{
                                    marginBottom: "2px"
                                }}
                            >
                                Payment ID
                            </span>

                            <span
                                className="font-mono text-xs break-all"
                                style={{
                                    color: "var(--ink)"
                                }}
                            >
                                {payment.paymentId}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="panel panel-accent-primary rounded-xl overflow-hidden">
                <div className="panel-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-sm icon-box-primary">
                            <Bot className="w-4 h-4" />
                        </div>

                        <div>
                            <h3 className="panel-section-title">
                                What AI Recommended
                            </h3>

                            <p className="panel-section-desc">
                                Recommended next step for this payment
                            </p>
                        </div>
                    </div>
                </div>

                <div className="panel-body">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <span
                                className="meta-label"
                                style={{
                                    marginBottom: "2px"
                                }}
                            >
                                Recommended Action
                            </span>

                            <span
                                style={{
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    color: "var(--primary)"
                                }}
                            >
                                {formatActionName(
                                    recommendedAction
                                )}
                            </span>
                        </div>

                        {confidencePercent !== null && (
                            <div className="count-pill count-pill-primary">
                                {confidencePercent}% confidence
                            </div>
                        )}
                    </div>

                    {aiSummary && (
                        <div className="mt-4 sub-card">
                            <span
                                className="meta-label"
                                style={{
                                    marginBottom: "4px"
                                }}
                            >
                                Summary
                            </span>

                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "var(--mute)",
                                    lineHeight: 1.6
                                }}
                            >
                                {aiSummary}
                            </p>
                        </div>
                    )}

                    <div className="mt-4 sub-card-primary">
                        <span
                            className="eyebrow-primary"
                            style={{
                                display: "block",
                                marginBottom: "4px"
                            }}
                        >
                            Why This Was Recommended
                        </span>

                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--ink)",
                                lineHeight: 1.6
                            }}
                        >
                            {getAIExplanation()}
                        </p>
                    </div>

                    {aiNextStep && (
                        <div className="mt-3 sub-card">
                            <span
                                className="meta-label"
                                style={{
                                    marginBottom: "4px"
                                }}
                            >
                                What Happens Next
                            </span>

                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "var(--mute)",
                                    lineHeight: 1.6
                                }}
                            >
                                {aiNextStep}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="panel rounded-xl overflow-hidden">
                <div className="panel-header">
                    <div className="flex items-center gap-3">
                        <div
                            className={`icon-box icon-box-sm ${
                                policyAllowed === false
                                    ? "icon-box-down"
                                    : policyAllowed === true
                                        ? "icon-box-up"
                                        : "icon-box-neutral"
                            }`}
                        >
                            {policyAllowed === false ? (
                                <ShieldAlert className="w-4 h-4" />
                            ) : policyAllowed === true ? (
                                <ShieldCheck className="w-4 h-4" />
                            ) : (
                                <ShieldAlert className="w-4 h-4" />
                            )}
                        </div>

                        <div>
                            <h3 className="panel-section-title">
                                Safety Check
                            </h3>

                            <p className="panel-section-desc">
                                Safety checks for this payment
                            </p>
                        </div>
                    </div>
                </div>

                <div className="panel-body">
                    {policyInfo ? (
                        <>
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <span
                                        className="meta-label"
                                        style={{
                                            marginBottom: "2px"
                                        }}
                                    >
                                        Decision
                                    </span>

                                    <span
                                        className={
                                            policyAllowed === false
                                                ? "status-down"
                                                : policyAllowed === true
                                                    ? "status-up"
                                                    : ""
                                        }
                                        style={{
                                            fontSize: "0.8125rem",
                                            fontWeight: 700
                                        }}
                                    >
                                        {policyAllowed === false
                                            ? "Action blocked"
                                            : policyAllowed === true
                                                ? "Action approved"
                                                : "Safety result unavailable"}
                                    </span>
                                </div>

                                <div>
                                    <span
                                        className="meta-label"
                                        style={{
                                            marginBottom: "2px"
                                        }}
                                    >
                                        Allowed Action
                                    </span>

                                    <span
                                        style={{
                                            fontSize: "0.8125rem",
                                            fontWeight: 600,
                                            color: "var(--ink)"
                                        }}
                                    >
                                        {formatActionName(
                                            policyInfo.finalAction ||
                                            executedAction ||
                                            recommendedAction
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 sub-card">
                                <span
                                    className="meta-label"
                                    style={{
                                        marginBottom: "4px"
                                    }}
                                >
                                    Why
                                </span>

                                <p
                                    style={{
                                        fontSize: "0.75rem",
                                        color: "var(--mute)",
                                        lineHeight: 1.6
                                    }}
                                >
                                    {getPolicyExplanation()}
                                </p>
                            </div>

                            {isPolicyOverridden && (
                                <div
                                    className="mt-3 sub-card"
                                    style={{
                                        borderLeft:
                                            "3px solid var(--warn)"
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: "0.75rem",
                                            color: "var(--warn)",
                                            lineHeight: 1.6
                                        }}
                                    >
                                        The recommended action was changed
                                        because the safety checks required
                                        a safer option.
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="sub-card">
                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    color: "var(--mute)"
                                }}
                            >
                                No safety-check result was returned
                                for this recovery run.
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="panel rounded-xl overflow-hidden">
                <div className="panel-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-sm icon-box-primary">
                            <CreditCard className="w-4 h-4" />
                        </div>

                        <div>
                            <h3 className="panel-section-title">
                                What the System Did
                            </h3>

                            <p className="panel-section-desc">
                                The actual recovery action and its result
                            </p>
                        </div>
                    </div>
                </div>

                <div className="panel-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="sub-card">
                            <span
                                className="meta-label"
                                style={{
                                    marginBottom: "2px"
                                }}
                            >
                                Action Taken
                            </span>

                            <span
                                style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 700,
                                    color: "var(--primary)"
                                }}
                            >
                                {formatActionName(
                                    executedAction ||
                                    recommendedAction
                                )}
                            </span>
                        </div>

                        <div className="sub-card">
                            <span
                                className="meta-label"
                                style={{
                                    marginBottom: "2px"
                                }}
                            >
                                Result
                            </span>

                            <span
                                style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 700,
                                    color: "var(--ink)"
                                }}
                            >
                                {finalResult === "RECOVERED"
                                    ? "Payment recovered"
                                    : finalResult === "PENDING"
                                        ? "Payment still pending"
                                        : finalResult === "STOPPED"
                                            ? "Recovery stopped"
                                            : finalResult === "BLOCKED"
                                                ? "Recovery blocked"
                                                : finalResult === "ESCALATED"
                                                    ? "Sent for human review"
                                                    : finalResult === "FAILED"
                                                        ? "Recovery unsuccessful"
                                                        : finalResult ||
                                                          "Not available"}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 sub-card">
                        <span
                            className="meta-label"
                            style={{
                                marginBottom: "4px"
                            }}
                        >
                            Outcome Explanation
                        </span>

                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--mute)",
                                lineHeight: 1.6
                            }}
                        >
                            {getExecutionExplanation()}
                        </p>
                    </div>

                    {executionResult?.recoveredAmount !==
                        undefined &&
                        Number(
                            executionResult.recoveredAmount
                        ) > 0 && (
                            <div
                                className="mt-3 sub-card-soft"
                                style={{
                                    borderLeft:
                                        "3px solid var(--up)"
                                }}
                            >
                                <span
                                    className="meta-label"
                                    style={{
                                        color: "var(--up)",
                                        marginBottom: "2px"
                                    }}
                                >
                                    Amount Recovered
                                </span>

                                <span
                                    style={{
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        color: "var(--up)",
                                        fontFamily:
                                            "'JetBrains Mono', monospace"
                                    }}
                                >
                                    {formatCurrency(
                                        executionResult.recoveredAmount
                                    )}
                                </span>
                            </div>
                        )}

                    {executionResult?.transactionId && (
                        <div className="mt-3 sub-card">
                            <span
                                className="meta-label"
                                style={{
                                    marginBottom: "2px"
                                }}
                            >
                                Transaction Reference
                            </span>

                            <span
                                className="font-mono text-xs break-all"
                                style={{
                                    color: "var(--ink)"
                                }}
                            >
                                {executionResult.transactionId}
                            </span>
                        </div>
                    )}

                    {executionResult?.paymentLinkUrl && (
                        <div className="mt-3 sub-card-primary">
                            <span
                                className="eyebrow-primary"
                                style={{
                                    display: "block",
                                    marginBottom: "2px"
                                }}
                            >
                                Recovery Payment Link
                            </span>

                            <a
                                href={
                                    executionResult.paymentLinkUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    fontSize: "0.75rem",
                                    color: "var(--primary)",
                                    textDecoration: "underline",
                                    wordBreak: "break-all"
                                }}
                            >
                                {executionResult.paymentLinkUrl}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {customer && (
                <div className="panel rounded-xl overflow-hidden">
                    <div className="panel-header">
                        <div className="flex items-center gap-3">
                            <div className="icon-box icon-box-sm icon-box-neutral">
                                <User className="w-4 h-4" />
                            </div>

                            <div>
                                <h3 className="panel-section-title">
                                    Customer Context
                                </h3>

                                <p className="panel-section-desc">
                                    Customer information considered during the decision
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="panel-body">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="sub-card">
                                <span
                                    className="meta-label"
                                    style={{
                                        marginBottom: "2px"
                                    }}
                                >
                                    Customer
                                </span>

                                <span
                                    style={{
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                        color: "var(--ink)"
                                    }}
                                >
                                    {customer.name ||
                                        customer.customerId ||
                                        "Customer"}
                                </span>
                            </div>

                            <div className="sub-card">
                                <span
                                    className="meta-label"
                                    style={{
                                        marginBottom: "2px"
                                    }}
                                >
                                    Successful Payments
                                </span>

                                <span
                                    style={{
                                        fontSize: "0.8125rem",
                                        fontWeight: 700,
                                        color: "var(--up)",
                                        fontFamily:
                                            "'JetBrains Mono', monospace"
                                    }}
                                >
                                    {customer.successfulPayments ??
                                        "—"}
                                </span>
                            </div>

                            <div className="sub-card">
                                <span
                                    className="meta-label"
                                    style={{
                                        marginBottom: "2px"
                                    }}
                                >
                                    Failed Payments
                                </span>

                                <span
                                    style={{
                                        fontSize: "0.8125rem",
                                        fontWeight: 700,
                                        color: "var(--down)",
                                        fontFamily:
                                            "'JetBrains Mono', monospace"
                                    }}
                                >
                                    {customer.failedPayments ??
                                        "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="panel p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                    <ArrowDown
                        className="w-4 h-4"
                        style={{
                            color: "var(--primary)"
                        }}
                    />

                    <h3 className="panel-section-title">
                        Recovery Flow
                    </h3>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2 text-xs">
                    <div className="chip">
                        Payment failed
                    </div>

                    <span
                        className="hidden md:block"
                        style={{
                            color: "var(--mute)"
                        }}
                    >
                        →
                    </span>

                    <div className="count-pill count-pill-primary">
                        AI analyzed
                    </div>

                    <span
                        className="hidden md:block"
                        style={{
                            color: "var(--mute)"
                        }}
                    >
                        →
                    </span>

                    <div className="chip">
                        Safety checks completed
                    </div>

                    <span
                        className="hidden md:block"
                        style={{
                            color: "var(--mute)"
                        }}
                    >
                        →
                    </span>

                    <div
                        className={`count-pill ${
                            finalResult === "RECOVERED"
                                ? "count-pill-up"
                                : finalResult === "PENDING"
                                    ? "count-pill-warn"
                                    : finalResult === "ESCALATED"
                                        ? "count-pill-warn"
                                        : "count-pill-down"
                        }`}
                    >
                        {outcome.label}
                    </div>
                </div>
            </div>

            <div className="h-12" />
        </div>
    );
};

export default AgentRunTimeline;