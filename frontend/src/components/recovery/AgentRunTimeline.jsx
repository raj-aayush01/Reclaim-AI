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

    return String(action).trim().toUpperCase();
};

const normalizeResult = (result) => {
    if (!result) {
        return "";
    }

    return String(result).trim().toUpperCase();
};

export const AgentRunTimeline = ({
    runData = {},
    fallbackSteps = [],
    fallbackPayment = null,
    fallbackCustomer = null
}) => {
    /*
     * ---------------------------------------------------------
     * 1. GET THE AGENT STEPS
     *
     * Actual backend flow:
     *
     * Step 1 -> Payment inspection
     * Step 2 -> Customer history
     * Step 3 -> Gemini decision
     * Step 4 -> Policy + execution
     * Step 5 -> Final result
     * ---------------------------------------------------------
     */

    const steps =
        Array.isArray(runData?.steps) && runData.steps.length > 0
            ? runData.steps
            : Array.isArray(fallbackSteps)
                ? fallbackSteps
                : [];

    const status = normalizeResult(
        runData?.status || "COMPLETED"
    );

    /*
     * ---------------------------------------------------------
     * 2. FIND THE IMPORTANT STEPS
     * ---------------------------------------------------------
     */

    const paymentObservation = steps.find(
        (step) =>
            step?.tool === "get_payment" ||
            (
                String(step?.type || "").toUpperCase() === "OBSERVATION" &&
                step?.output?.payment
            )
    );

    const customerObservation = steps.find(
        (step) =>
            step?.tool === "get_customer_history" ||
            (
                String(step?.type || "").toUpperCase() === "OBSERVATION" &&
                step?.output?.customer
            )
    );

    /*
     * Step 3 is a DECISION step from Gemini
     */
    const decisionStep = steps.find(
        (step) => {
            if (
                String(step?.type || "").toUpperCase() === "DECISION" ||
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

    /*
     * Step 4 is an ACTION step containing both:
     *
     * output.policyDecision
     * output.executionResult
     *
     * We support the newer structure first and also keep
     * compatibility with a separate POLICY / RESULT structure.
     */

    const actionStep = steps.find(
        (step) =>
            String(step?.type || "").toUpperCase() ===
            "ACTION"
    );

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

    /*
     * ---------------------------------------------------------
     * 3. EXTRACT PAYMENT
     * ---------------------------------------------------------
     */

    const payment =
        paymentObservation?.output?.payment ||
        runData?.payment ||
        runData?.result?.payment ||
        runData?.result?.executionResult?.payment ||
        fallbackPayment ||
        null;

    /*
     * ---------------------------------------------------------
     * 4. EXTRACT CUSTOMER
     * ---------------------------------------------------------
     */

    const customer =
        customerObservation?.output?.customer ||
        runData?.customer ||
        runData?.result?.customer ||
        fallbackCustomer ||
        null;

    /*
     * ---------------------------------------------------------
     * 5. EXTRACT POLICY
     *
     * New backend structure:
     *
     * Step 4
     *   output:
     *     policyDecision: {...}
     *     executionResult: {...}
     * ---------------------------------------------------------
     */

    const policyInfo =
        actionStep?.output?.policyDecision ||
        actionStep?.policyDecision ||
        policyStep?.output?.policyDecision ||
        policyStep?.policyDecision ||
        runData?.policyDecision ||
        runData?.result?.policyDecision ||
        runData?.result?.result?.policyDecision ||
        null;

    /*
     * ---------------------------------------------------------
     * 6. EXTRACT EXECUTION RESULT
     * ---------------------------------------------------------
     */

    const executionResult =
        actionStep?.output?.executionResult ||
        actionStep?.executionResult ||
        resultStep?.output ||
        resultStep?.executionResult ||
        runData?.executionResult ||
        runData?.result?.executionResult ||
        runData?.result?.result?.executionResult ||
        null;

    /*
     * ---------------------------------------------------------
     * 7. EXTRACT AI DECISION
     *
     * This is the critical fix.
     *
     * The backend stores the Gemini response in:
     *
     * decisionStep.output
     *
     * rather than putting the recovery action in
     * decisionStep.tool.
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * 8. CONFIDENCE
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * 9. AI REASONING
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * 10. ACTUAL EXECUTED ACTION
     *
     * Prefer the executor's action.
     * If it isn't available, use the policy's final action.
     * Finally fall back to the AI recommendation.
     * ---------------------------------------------------------
     */

    const executedAction = normalizeAction(
        executionResult?.actionExecuted ||
        executionResult?.action ||
        policyInfo?.finalAction ||
        terminalStep?.tool ||
        runData?.finalAction ||
        recommendedAction ||
        ""
    );

    /*
     * ---------------------------------------------------------
     * 11. FINAL RESULT
     *
     * New backend Step 5 stores the final status in:
     *
     * terminalStep.output.status
     *
     * Step 4 execution result may also contain result.
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * 12. POLICY OVERRIDE
     * ---------------------------------------------------------
     */

    const isPolicyOverridden =
        Boolean(
            policyInfo &&
            policyInfo.allowed === false &&
            executedAction &&
            recommendedAction &&
            executedAction !== recommendedAction
        );

    /*
     * ---------------------------------------------------------
     * 13. DISPLAY HELPERS
     * ---------------------------------------------------------
     */

    const formatActionName = (action) => {
        if (!action) {
            return "No action recorded";
        }

        const normalized = normalizeAction(action);

        const names = {
            RETRY_PAYMENT: "Retry the payment",
            CREATE_PAYMENT_LINK: "Create a payment link",
            ESCALATE_TO_HUMAN: "Send for human review",
            STOP_RECOVERY: "Stop further recovery"
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
            TEMPORARY_FAILURE: "Temporary payment failure",
            CARD_DECLINED: "Card declined",
            REPEATED_FAILURE: "Repeated payment failure",
            HIGH_VALUE_FAILURE: "High-value payment failure",
            UNKNOWN_FAILURE: "Unknown payment failure"
        };

        const normalized = normalizeAction(scenario);

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
                "The payment has reached the maximum number of recovery attempts."
        };

        const normalized = normalizeAction(reason);

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

    /*
     * ---------------------------------------------------------
     * 14. FINAL OUTCOME DISPLAY
     * ---------------------------------------------------------
     */

    const getOutcome = () => {
        switch (finalResult) {
            case "RECOVERED":
                return {
                    label: "Payment Recovered",
                    description:
                        "The payment was successfully recovered and the outstanding amount was collected.",
                    className:
                        "panel panel-accent-up",
                    iconClass: "status-up",
                    iconBoxClass: "icon-box-up",
                    icon: CheckCircle2
                };

            case "PENDING":
                return {
                    label: "Payment Recovery Pending",
                    description:
                        "The original payment was not completed, but a recovery path is still open. The payment remains pending until the customer completes the next step.",
                    className:
                        "panel panel-accent-warn",
                    iconClass: "status-warn",
                    iconBoxClass: "icon-box-warn",
                    icon: Clock
                };

            case "ESCALATED":
                return {
                    label: "Sent for Human Review",
                    description:
                        "Automated recovery was not allowed to continue. The payment has been escalated so a human can review it.",
                    className:
                        "panel panel-accent-warn",
                    iconClass: "status-warn",
                    iconBoxClass: "icon-box-warn",
                    icon: ShieldAlert
                };

            case "STOPPED":
                return {
                    label: "Recovery Stopped",
                    description:
                        "No further automated recovery was performed. The payment remains unrecovered and will not receive another automatic attempt.",
                    className:
                        "panel panel-accent-down",
                    iconClass: "status-down",
                    iconBoxClass: "icon-box-down",
                    icon: XOctagon
                };

            case "FAILED":
                return {
                    label: "Recovery Attempt Failed",
                    description:
                        "ReclaimAI attempted the selected recovery action, but the payment could not be recovered.",
                    className:
                        "panel panel-accent-down",
                    iconClass: "status-down",
                    iconBoxClass: "icon-box-down",
                    icon: XCircle
                };

            default:
                return {
                    label: "Recovery Run Completed",
                    description:
                        "The recovery workflow completed. Review the details below for the AI decision and final payment status.",
                    className:
                        "panel panel-accent-primary",
                    iconClass: "status-primary",
                    iconBoxClass: "icon-box-primary",
                    icon: CheckCircle2
                };
        }
    };

    const outcome = getOutcome();
    const OutcomeIcon = outcome.icon;

    const scenario = payment?.scenario;
    const failureReason = payment?.failureReason;

    const attemptCount =
        payment?.attemptCount ??
        runData?.attemptCount ??
        null;

    const amount = payment?.amount;

    const policyAllowed =
        policyInfo?.allowed !== undefined
            ? policyInfo.allowed
            : null;

    /*
     * ---------------------------------------------------------
     * 15. HUMAN-READABLE AI EXPLANATION
     * ---------------------------------------------------------
     */

    const getAIExplanation = () => {
        if (aiReasoning) {
            return aiReasoning;
        }

        switch (recommendedAction) {
            case "RETRY_PAYMENT":
                return "The payment appeared suitable for another attempt because the failure looked temporary and the retry count was still within the allowed range.";

            case "CREATE_PAYMENT_LINK":
                return "The original payment could not be completed, so ReclaimAI recommended giving the customer another way to complete the payment.";

            case "ESCALATE_TO_HUMAN":
                return "The payment was considered better suited for human review because the available information did not make automatic recovery sufficiently safe.";

            case "STOP_RECOVERY":
                return "The payment had already failed enough times that continuing automated recovery was no longer considered appropriate.";

            default:
                return "ReclaimAI analyzed the payment and selected the safest available recovery strategy.";
        }
    };

    /*
     * ---------------------------------------------------------
     * 16. POLICY EXPLANATION
     * ---------------------------------------------------------
     */

    const getPolicyExplanation = () => {
        if (policyInfo?.reason) {
            return policyInfo.reason;
        }

        if (policyInfo?.userExplanation) {
            return policyInfo.userExplanation;
        }

        if (policyAllowed === false) {
            return "The backend recovery policy did not allow the AI recommendation to proceed. The safety rules prevented further automated recovery.";
        }

        if (policyAllowed === true) {
            return "The AI recommendation passed the backend recovery safety checks.";
        }

        return "The recovery policy result was not available for this run.";
    };

    /*
     * ---------------------------------------------------------
     * 17. EXECUTION EXPLANATION
     * ---------------------------------------------------------
     */

    const getExecutionExplanation = () => {
        switch (finalResult) {
            case "RECOVERED":
                return "The selected recovery action succeeded and the payment amount was recovered.";

            case "PENDING":
                return "A recovery payment link was created. The money has not been recovered yet because the customer still needs to complete the payment.";

            case "STOPPED":
                return "No further payment attempt was made because the recovery process was stopped after the permitted recovery limit was reached.";

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

    /*
     * ---------------------------------------------------------
     * 18. RENDER
     * ---------------------------------------------------------
     */

    return (
        <div className="space-y-5 pb-10">

            {/* =================================================
                1. FINAL OUTCOME
            ================================================== */}

            <div
                className={`p-5 rounded-xl ${outcome.className}`}
            >
                <div className="flex items-start gap-3">

                    <div className={`icon-box icon-box-lg ${outcome.iconBoxClass}`}>
                        <OutcomeIcon
                            className="w-5 h-5"
                        />
                    </div>

                    <div className="min-w-0 flex-1">

                        <span className="eyebrow" style={{ display: "block", marginBottom: "2px" }}>
                            Final Outcome
                        </span>

                        <h2
                            style={{
                                fontSize: "1.125rem",
                                fontWeight: 700,
                                color: "var(--ink)",
                                fontFamily: "'Inter', sans-serif"
                            }}
                        >
                            {outcome.label}
                        </h2>

                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--mute)",
                                marginTop: "0.25rem",
                                lineHeight: 1.5,
                                maxWidth: "42rem"
                            }}
                        >
                            {outcome.description}
                        </p>

                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">

                    <div className="sub-card">
                        <span className="meta-label" style={{ marginBottom: "2px" }}>
                            Amount
                        </span>

                        <span className="meta-value">
                            {amount !== undefined
                                ? formatCurrency(amount)
                                : "Not available"}
                        </span>
                    </div>

                    <div className="sub-card">
                        <span className="meta-label" style={{ marginBottom: "2px" }}>
                            Customer
                        </span>

                        <span className="meta-value truncate block">
                            {customer?.name ||
                                customer?.customerId ||
                                payment?.customerId ||
                                "Unknown"}
                        </span>
                    </div>

                    <div className="sub-card">
                        <span className="meta-label" style={{ marginBottom: "2px" }}>
                            Attempts
                        </span>

                        <span className="meta-value">
                            {attemptCount !== null
                                ? `${attemptCount} / 3`
                                : "Not available"}
                        </span>
                    </div>

                    <div className="sub-card">
                        <span className="meta-label" style={{ marginBottom: "2px" }}>
                            Payment Status
                        </span>

                        <span className="meta-value capitalize">
                            {payment?.status ||
                                finalResult.toLowerCase() ||
                                "Unknown"}
                        </span>
                    </div>

                </div>
            </div>

            {/* =================================================
                2. PAYMENT ISSUE
            ================================================== */}

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

                            <span className="meta-label" style={{ marginBottom: "2px" }}>
                                Failure Type
                            </span>

                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--warn)" }}>
                                {formatScenario(scenario)}
                            </span>

                        </div>

                        <div className="sub-card">

                            <span className="meta-label" style={{ marginBottom: "2px" }}>
                                Reason
                            </span>

                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)" }}>
                                {formatFailureReason(failureReason)}
                            </span>

                        </div>

                    </div>

                    {payment?.paymentId && (
                        <div className="mt-3 sub-card">

                            <span className="meta-label" style={{ marginBottom: "2px" }}>
                                Payment ID
                            </span>

                            <span className="font-mono text-xs break-all" style={{ color: "var(--ink)" }}>
                                {payment.paymentId}
                            </span>

                        </div>
                    )}

                </div>
            </div>

            {/* =================================================
                3. AI DECISION
            ================================================== */}

            <div className="panel panel-accent-primary rounded-xl overflow-hidden">

                <div className="panel-header">

                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-sm icon-box-primary">
                            <Bot className="w-4 h-4" />
                        </div>

                        <div>
                            <h3 className="panel-section-title">
                                What AI Decided
                            </h3>

                            <p className="panel-section-desc">
                                Gemini's recommended recovery strategy
                            </p>
                        </div>
                    </div>

                </div>

                <div className="panel-body">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div>

                            <span className="meta-label" style={{ marginBottom: "2px" }}>
                                Recommended Action
                            </span>

                            <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--primary)" }}>
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

                            <span className="meta-label" style={{ marginBottom: "4px" }}>
                                AI Summary
                            </span>

                            <p style={{ fontSize: "0.75rem", color: "var(--mute)", lineHeight: 1.6 }}>
                                {aiSummary}
                            </p>

                        </div>
                    )}

                    <div className="mt-4 sub-card-primary">

                        <span className="eyebrow-primary" style={{ display: "block", marginBottom: "4px" }}>
                            Why AI Chose This
                        </span>

                        <p style={{ fontSize: "0.75rem", color: "var(--ink)", lineHeight: 1.6 }}>
                            {getAIExplanation()}
                        </p>

                    </div>

                    {aiNextStep && (
                        <div className="mt-3 sub-card">

                            <span className="meta-label" style={{ marginBottom: "4px" }}>
                                What Happens Next
                            </span>

                            <p style={{ fontSize: "0.75rem", color: "var(--mute)", lineHeight: 1.6 }}>
                                {aiNextStep}
                            </p>

                        </div>
                    )}

                </div>
            </div>

            {/* =================================================
                4. POLICY CHECK
            ================================================== */}

            <div className="panel rounded-xl overflow-hidden">

                <div className="panel-header">

                    <div className="flex items-center gap-3">
                        <div
                            className={`icon-box icon-box-sm ${
                                policyAllowed === false
                                    ? "icon-box-down"
                                    : "icon-box-up"
                            }`}
                        >
                            {policyAllowed === false ? (
                                <ShieldAlert className="w-4 h-4" />
                            ) : (
                                <ShieldCheck className="w-4 h-4" />
                            )}
                        </div>

                        <div>

                            <h3 className="panel-section-title">
                                Safety Check
                            </h3>

                            <p className="panel-section-desc">
                                Backend rules that protect the payment recovery process
                            </p>

                        </div>
                    </div>

                </div>

                <div className="panel-body">

                    {policyInfo ? (
                        <>
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                                <div>

                                    <span className="meta-label" style={{ marginBottom: "2px" }}>
                                        Decision
                                    </span>

                                    <span
                                        className={
                                            policyAllowed === false
                                                ? "status-down"
                                                : "status-up"
                                        }
                                        style={{ fontSize: "0.8125rem", fontWeight: 700 }}
                                    >
                                        {policyAllowed === false
                                            ? "AI recommendation blocked"
                                            : "AI recommendation approved"}
                                    </span>

                                </div>

                                <div>

                                    <span className="meta-label" style={{ marginBottom: "2px" }}>
                                        Safe Action
                                    </span>

                                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)" }}>
                                        {formatActionName(
                                            policyInfo.finalAction ||
                                            executedAction ||
                                            recommendedAction
                                        )}
                                    </span>

                                </div>

                            </div>

                            <div className="mt-4 sub-card">

                                <span className="meta-label" style={{ marginBottom: "4px" }}>
                                    Why
                                </span>

                                <p style={{ fontSize: "0.75rem", color: "var(--mute)", lineHeight: 1.6 }}>
                                    {getPolicyExplanation()}
                                </p>

                            </div>

                            {isPolicyOverridden && (
                                <div className="mt-3 sub-card" style={{ borderLeft: "3px solid var(--warn)" }}>

                                    <p style={{ fontSize: "0.75rem", color: "var(--warn)", lineHeight: 1.6 }}>
                                        The AI recommendation was not safe to execute under the backend rules, so the system selected a safer action instead.
                                    </p>

                                </div>
                            )}
                        </>
                    ) : (
                        <div className="sub-card">

                            <span style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
                                No policy decision was returned for this recovery run.
                            </span>

                        </div>
                    )}

                </div>
            </div>

            {/* =================================================
                5. WHAT THE SYSTEM ACTUALLY DID
            ================================================== */}

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

                            <span className="meta-label" style={{ marginBottom: "2px" }}>
                                Action Taken
                            </span>

                            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary)" }}>
                                {formatActionName(
                                    executedAction ||
                                    recommendedAction
                                )}
                            </span>

                        </div>

                        <div className="sub-card">

                            <span className="meta-label" style={{ marginBottom: "2px" }}>
                                Result
                            </span>

                            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>
                                {finalResult === "RECOVERED"
                                    ? "Payment recovered"
                                    : finalResult === "PENDING"
                                        ? "Payment still pending"
                                        : finalResult === "STOPPED"
                                            ? "Recovery stopped"
                                            : finalResult === "ESCALATED"
                                                ? "Sent for human review"
                                                : finalResult === "FAILED"
                                                    ? "Recovery unsuccessful"
                                                    : finalResult || "Not available"}
                            </span>

                        </div>

                    </div>

                    <div className="mt-4 sub-card">

                        <span className="meta-label" style={{ marginBottom: "4px" }}>
                            Outcome Explanation
                        </span>

                        <p style={{ fontSize: "0.75rem", color: "var(--mute)", lineHeight: 1.6 }}>
                            {getExecutionExplanation()}
                        </p>

                    </div>

                    {executionResult?.recoveredAmount !== undefined &&
                        Number(executionResult.recoveredAmount) > 0 && (

                        <div className="mt-3 sub-card-soft" style={{ borderLeft: "3px solid var(--up)" }}>

                            <span className="meta-label" style={{ color: "var(--up)", marginBottom: "2px" }}>
                                Amount Recovered
                            </span>

                            <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--up)", fontFamily: "'JetBrains Mono', monospace" }}>
                                {formatCurrency(
                                    executionResult.recoveredAmount
                                )}
                            </span>

                        </div>
                    )}

                    {executionResult?.transactionId && (
                        <div className="mt-3 sub-card">

                            <span className="meta-label" style={{ marginBottom: "2px" }}>
                                Transaction Reference
                            </span>

                            <span className="font-mono text-xs break-all" style={{ color: "var(--ink)" }}>
                                {executionResult.transactionId}
                            </span>

                        </div>
                    )}

                    {executionResult?.paymentLinkUrl && (
                        <div className="mt-3 sub-card-primary">

                            <span className="eyebrow-primary" style={{ display: "block", marginBottom: "2px" }}>
                                Recovery Payment Link
                            </span>

                            <a
                                href={executionResult.paymentLinkUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "underline", wordBreak: "break-all" }}
                            >
                                {executionResult.paymentLinkUrl}
                            </a>

                        </div>
                    )}

                </div>
            </div>

            {/* =================================================
                6. CUSTOMER CONTEXT
            ================================================== */}

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

                                <span className="meta-label" style={{ marginBottom: "2px" }}>
                                    Customer
                                </span>

                                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)" }}>
                                    {customer.name ||
                                        customer.customerId ||
                                        "Customer"}
                                </span>

                            </div>

                            <div className="sub-card">

                                <span className="meta-label" style={{ marginBottom: "2px" }}>
                                    Successful Payments
                                </span>

                                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--up)", fontFamily: "'JetBrains Mono', monospace" }}>
                                    {customer.successfulPayments ??
                                        "—"}
                                </span>

                            </div>

                            <div className="sub-card">

                                <span className="meta-label" style={{ marginBottom: "2px" }}>
                                    Failed Payments
                                </span>

                                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--down)", fontFamily: "'JetBrains Mono', monospace" }}>
                                    {customer.failedPayments ??
                                        "—"}
                                </span>

                            </div>

                        </div>

                    </div>
                </div>
            )}

            {/* =================================================
                7. SIMPLE FLOW
            ================================================== */}

            <div className="panel p-5 rounded-xl">

                <div className="flex items-center gap-2 mb-4">

                    <ArrowDown className="w-4 h-4" style={{ color: "var(--primary)" }} />

                    <h3 className="panel-section-title">
                        Recovery Flow
                    </h3>

                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2 text-xs">

                    <div className="chip">
                        Payment failed
                    </div>

                    <span className="hidden md:block" style={{ color: "var(--mute)" }}>
                        →
                    </span>

                    <div className="count-pill count-pill-primary">
                        AI analyzed
                    </div>

                    <span className="hidden md:block" style={{ color: "var(--mute)" }}>
                        →
                    </span>

                    <div className="chip">
                        Safety rules checked
                    </div>

                    <span className="hidden md:block" style={{ color: "var(--mute)" }}>
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

            {/* Extra bottom space so the final content
                never touches the modal's bottom edge */}
            <div className="h-12" />

        </div>
    );
};

export default AgentRunTimeline;