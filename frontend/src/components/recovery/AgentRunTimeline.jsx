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
                        "border-emerald-500/30 bg-emerald-950/20",
                    iconClass: "text-emerald-400",
                    icon: CheckCircle2
                };

            case "PENDING":
                return {
                    label: "Payment Recovery Pending",
                    description:
                        "The original payment was not completed, but a recovery path is still open. The payment remains pending until the customer completes the next step.",
                    className:
                        "border-amber-500/30 bg-amber-950/20",
                    iconClass: "text-amber-400",
                    icon: Clock
                };

            case "ESCALATED":
                return {
                    label: "Sent for Human Review",
                    description:
                        "Automated recovery was not allowed to continue. The payment has been escalated so a human can review it.",
                    className:
                        "border-purple-500/30 bg-purple-950/20",
                    iconClass: "text-purple-400",
                    icon: ShieldAlert
                };

            case "STOPPED":
                return {
                    label: "Recovery Stopped",
                    description:
                        "No further automated recovery was performed. The payment remains unrecovered and will not receive another automatic attempt.",
                    className:
                        "border-rose-500/30 bg-rose-950/20",
                    iconClass: "text-rose-400",
                    icon: XOctagon
                };

            case "FAILED":
                return {
                    label: "Recovery Attempt Failed",
                    description:
                        "ReclaimAI attempted the selected recovery action, but the payment could not be recovered.",
                    className:
                        "border-rose-500/30 bg-rose-950/20",
                    iconClass: "text-rose-400",
                    icon: XCircle
                };

            default:
                return {
                    label: "Recovery Run Completed",
                    description:
                        "The recovery workflow completed. Review the details below for the AI decision and final payment status.",
                    className:
                        "border-slate-700 bg-slate-900/70",
                    iconClass: "text-slate-300",
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
        <div className="space-y-5 text-slate-200 pb-10">

            {/* =================================================
                1. FINAL OUTCOME
            ================================================== */}

            <div
                className={`rounded-2xl border p-5 ${outcome.className}`}
            >
                <div className="flex items-start gap-3">

                    <div className="w-11 h-11 shrink-0 rounded-xl bg-slate-950/40 flex items-center justify-center">
                        <OutcomeIcon
                            className={`w-6 h-6 ${outcome.iconClass}`}
                        />
                    </div>

                    <div className="min-w-0 flex-1">

                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">
                            Final Outcome
                        </span>

                        <h2 className="text-xl font-bold mt-1 text-slate-100">
                            {outcome.label}
                        </h2>

                        <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-2xl">
                            {outcome.description}
                        </p>

                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">

                    <div className="rounded-xl bg-slate-950/40 border border-white/5 p-3">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                            Amount
                        </span>

                        <span className="text-sm font-bold text-slate-100">
                            {amount !== undefined
                                ? formatCurrency(amount)
                                : "Not available"}
                        </span>
                    </div>

                    <div className="rounded-xl bg-slate-950/40 border border-white/5 p-3">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                            Customer
                        </span>

                        <span className="text-sm font-bold text-slate-100 truncate block">
                            {customer?.name ||
                                customer?.customerId ||
                                payment?.customerId ||
                                "Unknown"}
                        </span>
                    </div>

                    <div className="rounded-xl bg-slate-950/40 border border-white/5 p-3">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                            Attempts
                        </span>

                        <span className="text-sm font-bold text-slate-100">
                            {attemptCount !== null
                                ? `${attemptCount} / 3`
                                : "Not available"}
                        </span>
                    </div>

                    <div className="rounded-xl bg-slate-950/40 border border-white/5 p-3">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                            Payment Status
                        </span>

                        <span className="text-sm font-bold text-slate-100 capitalize">
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

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

                <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">

                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-100">
                            What Went Wrong
                        </h3>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                            The payment issue ReclaimAI investigated
                        </p>
                    </div>

                </div>

                <div className="p-5">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                Failure Type
                            </span>

                            <span className="text-sm font-semibold text-amber-300">
                                {formatScenario(scenario)}
                            </span>

                        </div>

                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                Reason
                            </span>

                            <span className="text-sm font-semibold text-slate-200">
                                {formatFailureReason(failureReason)}
                            </span>

                        </div>

                    </div>

                    {payment?.paymentId && (
                        <div className="mt-3 rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                Payment ID
                            </span>

                            <span className="text-xs font-mono text-slate-300 break-all">
                                {payment.paymentId}
                            </span>

                        </div>
                    )}

                </div>
            </div>

            {/* =================================================
                3. AI DECISION
            ================================================== */}

            <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 overflow-hidden">

                <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">

                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-100">
                            What AI Decided
                        </h3>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Gemini's recommended recovery strategy
                        </p>
                    </div>

                </div>

                <div className="p-5">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div>

                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                Recommended Action
                            </span>

                            <span className="text-lg font-bold text-indigo-300">
                                {formatActionName(
                                    recommendedAction
                                )}
                            </span>

                        </div>

                        {confidencePercent !== null && (
                            <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-2">

                                <span className="text-[10px] text-indigo-300 font-bold">
                                    {confidencePercent}% confidence
                                </span>

                            </div>
                        )}

                    </div>

                    {aiSummary && (
                        <div className="mt-4 rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1.5">
                                AI Summary
                            </span>

                            <p className="text-xs text-slate-300 leading-relaxed">
                                {aiSummary}
                            </p>

                        </div>
                    )}

                    <div className="mt-4 rounded-xl bg-indigo-950/20 border border-indigo-800/30 p-4">

                        <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 block mb-1.5">
                            Why AI Chose This
                        </span>

                        <p className="text-xs text-slate-300 leading-relaxed">
                            {getAIExplanation()}
                        </p>

                    </div>

                    {aiNextStep && (
                        <div className="mt-3 rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1.5">
                                What Happens Next
                            </span>

                            <p className="text-xs text-slate-300 leading-relaxed">
                                {aiNextStep}
                            </p>

                        </div>
                    )}

                </div>
            </div>

            {/* =================================================
                4. POLICY CHECK
            ================================================== */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

                <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">

                    <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                            policyAllowed === false
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        }`}
                    >
                        {policyAllowed === false ? (
                            <ShieldAlert className="w-4 h-4" />
                        ) : (
                            <ShieldCheck className="w-4 h-4" />
                        )}
                    </div>

                    <div>

                        <h3 className="text-sm font-semibold text-slate-100">
                            Safety Check
                        </h3>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Backend rules that protect the payment recovery process
                        </p>

                    </div>

                </div>

                <div className="p-5">

                    {policyInfo ? (
                        <>
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                                <div>

                                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                        Decision
                                    </span>

                                    <span
                                        className={`text-sm font-bold ${
                                            policyAllowed === false
                                                ? "text-rose-400"
                                                : "text-emerald-400"
                                        }`}
                                    >
                                        {policyAllowed === false
                                            ? "AI recommendation blocked"
                                            : "AI recommendation approved"}
                                    </span>

                                </div>

                                <div>

                                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                        Safe Action
                                    </span>

                                    <span className="text-sm font-semibold text-slate-200">
                                        {formatActionName(
                                            policyInfo.finalAction ||
                                            executedAction ||
                                            recommendedAction
                                        )}
                                    </span>

                                </div>

                            </div>

                            <div className="mt-4 rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1.5">
                                    Why
                                </span>

                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {getPolicyExplanation()}
                                </p>

                            </div>

                            {isPolicyOverridden && (
                                <div className="mt-3 rounded-xl bg-amber-950/20 border border-amber-800/30 p-4">

                                    <p className="text-xs text-amber-300 leading-relaxed">
                                        The AI recommendation was not safe to execute under the backend rules, so the system selected a safer action instead.
                                    </p>

                                </div>
                            )}
                        </>
                    ) : (
                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                            <span className="text-xs text-slate-400">
                                No policy decision was returned for this recovery run.
                            </span>

                        </div>
                    )}

                </div>
            </div>

            {/* =================================================
                5. WHAT THE SYSTEM ACTUALLY DID
            ================================================== */}

            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 overflow-hidden">

                <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">

                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                    </div>

                    <div>

                        <h3 className="text-sm font-semibold text-slate-100">
                            What the System Did
                        </h3>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                            The actual recovery action and its result
                        </p>

                    </div>

                </div>

                <div className="p-5">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                Action Taken
                            </span>

                            <span className="text-sm font-bold text-cyan-300">
                                {formatActionName(
                                    executedAction ||
                                    recommendedAction
                                )}
                            </span>

                        </div>

                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                Result
                            </span>

                            <span className="text-sm font-bold text-slate-100">
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

                    <div className="mt-4 rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1.5">
                            Outcome Explanation
                        </span>

                        <p className="text-xs text-slate-300 leading-relaxed">
                            {getExecutionExplanation()}
                        </p>

                    </div>

                    {executionResult?.recoveredAmount !== undefined &&
                        Number(executionResult.recoveredAmount) > 0 && (

                        <div className="mt-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">

                            <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-500 block mb-1">
                                Amount Recovered
                            </span>

                            <span className="text-base font-bold text-emerald-400">
                                {formatCurrency(
                                    executionResult.recoveredAmount
                                )}
                            </span>

                        </div>
                    )}

                    {executionResult?.transactionId && (
                        <div className="mt-3 rounded-xl bg-slate-950/50 border border-slate-800 p-4">

                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                Transaction Reference
                            </span>

                            <span className="text-xs font-mono text-slate-300 break-all">
                                {executionResult.transactionId}
                            </span>

                        </div>
                    )}

                    {executionResult?.paymentLinkUrl && (
                        <div className="mt-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 p-4">

                            <span className="text-[9px] uppercase tracking-wider font-bold text-cyan-400 block mb-1">
                                Recovery Payment Link
                            </span>

                            <a
                                href={executionResult.paymentLinkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-cyan-300 hover:text-cyan-200 underline break-all"
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
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

                    <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">

                        <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
                            <User className="w-4 h-4" />
                        </div>

                        <div>

                            <h3 className="text-sm font-semibold text-slate-100">
                                Customer Context
                            </h3>

                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Customer information considered during the decision
                            </p>

                        </div>

                    </div>

                    <div className="p-5">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">

                                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                    Customer
                                </span>

                                <span className="text-sm font-semibold text-slate-200">
                                    {customer.name ||
                                        customer.customerId ||
                                        "Customer"}
                                </span>

                            </div>

                            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">

                                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                    Successful Payments
                                </span>

                                <span className="text-sm font-bold text-emerald-400">
                                    {customer.successfulPayments ??
                                        "—"}
                                </span>

                            </div>

                            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">

                                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                                    Failed Payments
                                </span>

                                <span className="text-sm font-bold text-rose-400">
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

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">

                <div className="flex items-center gap-2 mb-4">

                    <ArrowDown className="w-4 h-4 text-indigo-400" />

                    <h3 className="text-sm font-semibold text-slate-100">
                        Recovery Flow
                    </h3>

                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2 text-xs">

                    <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                        Payment failed
                    </div>

                    <span className="hidden md:block text-slate-600">
                        →
                    </span>

                    <div className="px-3 py-2 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300">
                        AI analyzed
                    </div>

                    <span className="hidden md:block text-slate-600">
                        →
                    </span>

                    <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                        Safety rules checked
                    </div>

                    <span className="hidden md:block text-slate-600">
                        →
                    </span>

                    <div
                        className={`px-3 py-2 rounded-lg border ${
                            finalResult === "RECOVERED"
                                ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
                                : finalResult === "PENDING"
                                    ? "bg-amber-950/40 border-amber-800/40 text-amber-300"
                                    : finalResult === "ESCALATED"
                                        ? "bg-purple-950/40 border-purple-800/40 text-purple-300"
                                        : "bg-rose-950/40 border-rose-800/40 text-rose-300"
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