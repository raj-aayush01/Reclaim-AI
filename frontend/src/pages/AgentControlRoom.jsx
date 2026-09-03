import React, { useEffect, useState } from "react";
import {
    Activity,
    CheckCircle2,
    ShieldAlert,
    AlertOctagon,
    Bot,
    ArrowUpRight,
    X,
    Eye,
    Clock,
    Zap,
    CreditCard,
    UserRound,
} from "lucide-react";

import AnimatedNumber from "../components/common/AnimatedNumber";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import { getControlRoom, getAgentRun } from "../services/agentService";
import "./AgentControlRoom.css";

const ACTION_LABELS = {
    RETRY_PAYMENT: "Retry payment",
    CREATE_PAYMENT_LINK: "Create payment link",
    ESCALATE_TO_HUMAN: "Escalate to human",
    STOP_RECOVERY: "Stop recovery",
};

const STATUS_LABELS = {
    RECOVERED: "Recovered",
    ESCALATED: "Human review",
    BLOCKED: "Blocked",
    STOPPED: "Stopped",
    FAILED: "Failed",
    RUNNING: "In progress",
    COMPLETED: "Completed",
    PENDING: "Pending",
    MAX_STEPS_REACHED: "Stopped safely",
};

const getActionLabel = (action) =>
    ACTION_LABELS[action] || action || "No action";

const getStatusLabel = (status) =>
    STATUS_LABELS[status] || status || "Unknown";

const getStatusClass = (status) => {
    if (status === "RECOVERED" || status === "APPROVED") {
        return "acr-status acr-status-success";
    }

    if (
        status === "ESCALATED" ||
        status === "PENDING" ||
        status === "RUNNING"
    ) {
        return "acr-status acr-status-warning";
    }

    if (
        status === "BLOCKED" ||
        status === "STOPPED" ||
        status === "FAILED"
    ) {
        return "acr-status acr-status-danger";
    }

    return "acr-status";
};

const getStep = (run, type) =>
    run?.steps?.find((step) => step.type === type) || null;

const getLastStep = (run, types) => {
    const steps =
        run?.steps?.filter((step) => types.includes(step.type)) || [];

    return steps.length ? steps[steps.length - 1] : null;
};

const getDecisionStep = (run) => getStep(run, "DECISION");
const getPolicyStep = (run) => getLastStep(run, ["POLICY"]);
const getActionStep = (run) => getLastStep(run, ["ACTION"]);

const getResultStep = (run) =>
    getLastStep(run, ["RESULT", "TERMINAL"]);

const getExecutedAction = (run) => {
    if (!run) {
        return null;
    }

    const resultStep =
        run.steps?.find(
            (step) =>
                step.type === "TERMINAL" ||
                step.type === "RESULT"
        ) || null;

    const actionStep =
        [...(run.steps || [])]
            .reverse()
            .find(
                (step) =>
                    step.type === "ACTION"
            ) || null;

    const executionResult =
        resultStep?.output?.executionResult ||
        resultStep?.output ||
        actionStep?.output?.executionResult ||
        actionStep?.output ||
        null;

    return (
        executionResult?.actionExecuted ||
        resultStep?.output?.executedAction ||
        actionStep?.output?.actionExecuted ||
        null
    );
};

const getRunAction = (run) => {
    const decision = getDecisionStep(run);
    const policy = getPolicyStep(run);

    return (
        decision?.output?.action ||
        decision?.action ||
        policy?.output?.finalAction ||
        policy?.output?.stopResult?.policyDecision?.finalAction ||
        policy?.finalAction ||
        null
    );
};

const getRunConfidence = (run) => {
    const decision = getDecisionStep(run);

    return (
        decision?.confidence ??
        decision?.output?.confidence ??
        null
    );
};

const getDecisionExplanation = (run) => {
    const decision = getDecisionStep(run);
    const action = getRunAction(run);

    if (decision?.output?.summary) {
        return decision.output.summary;
    }

    if (decision?.output?.whyThisDecision) {
        return decision.output.whyThisDecision;
    }

    if (action === "RETRY_PAYMENT") {
        return "The payment showed signs of a temporary problem, so the agent recommended trying the payment again.";
    }

    if (action === "CREATE_PAYMENT_LINK") {
        return "The original payment method was not successful, so the agent recommended offering the customer another way to pay.";
    }

    if (action === "ESCALATE_TO_HUMAN") {
        return "The case was considered too risky or uncertain for automatic recovery, so it was sent for human review.";
    }

    if (action === "STOP_RECOVERY") {
        return "The agent determined that continuing recovery was not safe or useful, so further attempts were stopped.";
    }

    if (decision?.reason) {
        return decision.reason;
    }

    return "The agent reviewed the failed payment and selected the safest available recovery option.";
};

const getDecisionDetails = (run) => {
    const decision = getDecisionStep(run);

    return {
        summary: decision?.output?.summary || null,
        whyThisDecision: decision?.output?.whyThisDecision || null,
        whatHappensNext: decision?.output?.whatHappensNext || null,
    };
};

const getPolicyAllowed = (run) => {
    const policy = getPolicyStep(run);

    if (!policy) return null;

    return (
        policy.output?.allowed ??
        policy.output?.policyDecision?.allowed ??
        policy.output?.stopResult?.policyDecision?.allowed ??
        policy.allowed ??
        null
    );
};

const getPolicyExplanation = (run) => {
    const policy = getPolicyStep(run);
    const allowed = getPolicyAllowed(run);

    if (policy) {
        return (
            policy.reason ||
            policy.output?.reason ||
            policy.output?.policyDecision?.reason ||
            policy.output?.stopResult?.policyDecision?.reason ||
            (allowed === true
                ? "The recommended recovery action passed the configured safety rules."
                : allowed === false
                  ? "The recommended recovery action was blocked by the configured safety rules."
                  : "The recovery policy was evaluated before execution.")
        );
    }

    if (run.status === "STOPPED") {
        return "Recovery was stopped because the configured retry or safety limits did not allow another attempt.";
    }

    if (run.status === "BLOCKED") {
        return "The recovery action was blocked by the configured recovery policy.";
    }

    if (run.status === "ESCALATED") {
        return "The case was sent for human review because automatic recovery was not permitted.";
    }

    return "The recovery policy was checked before the system proceeded.";
};

const getActionExplanation = (run) => {
    const action = getActionStep(run);

    if (!action) {
        if (
            run.status === "STOPPED" ||
            run.status === "BLOCKED"
        ) {
            return "No further recovery action was executed.";
        }

        if (run.status === "ESCALATED") {
            return "No automatic recovery action was executed because the case requires human review.";
        }

        return "No recovery action was recorded.";
    }

    if (action.output?.message) {
        return action.output.message;
    }

    if (action.output?.success === true) {
        return "The recommended recovery action was executed successfully.";
    }

    return "The recovery action was processed by the agent.";
};

const getResultExplanation = (run) => {
    const result = getResultStep(run);

    if (result?.reason) {
        return result.reason;
    }

    if (result?.output?.message) {
        return result.output.message;
    }

    if (run.status === "RECOVERED") {
        return "The payment was successfully recovered.";
    }

    if (run.status === "ESCALATED") {
        return "The case was safely handed over for human review.";
    }

    if (run.status === "BLOCKED") {
        return "The recovery action was blocked by policy.";
    }

    if (run.status === "STOPPED") {
        return "Recovery was stopped according to the configured recovery policy.";
    }

    if (run.status === "FAILED") {
        return "The recovery process did not complete successfully.";
    }

    return "The agent completed its assessment.";
};

const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return String(date);
    }

    return parsed.toLocaleString();
};

const formatAmount = (amount, currency = "INR") => {
    if (amount == null || amount === "") return "—";

    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(Number(amount));
    } catch {
        return `${currency} ${amount}`;
    }
};

const extractInspectionContext = (run) => {
    const steps = Array.isArray(run?.steps)
        ? run.steps
        : [];

    let payment = {};
    let customer = {};

    for (
        let index = steps.length - 1;
        index >= 0;
        index -= 1
    ) {
        const output = steps[index]?.output;

        const candidates = [
            output?.payment,
            output?.stopResult?.payment,
            output?.executionResult?.payment,
        ];

        const foundPayment = candidates.find(Boolean);

        if (
            foundPayment &&
            !Object.keys(payment).length
        ) {
            payment = foundPayment;
        }

        const foundCustomer =
            output?.customer ||
            output?.customerHistory?.customer ||
            output?.history?.customer;

        if (
            foundCustomer &&
            !Object.keys(customer).length
        ) {
            customer = foundCustomer;
        }
    }

    for (const step of steps) {
        const output = step?.output;

        if (
            step?.tool === "get_customer_history" &&
            output?.customer
        ) {
            customer = output.customer;
            break;
        }
    }

    return {
        payment,
        customer,
    };
};

const getCustomerId = (
    payment,
    customer,
    run
) =>
    payment?.customerId ||
    customer?.customerId ||
    run?.customerId ||
    run?.customer?.id ||
    "—";

const getFailureReason = (payment, run) => {
    const raw =
        payment?.failureReason ||
        payment?.failure?.reason ||
        payment?.errorCode ||
        payment?.failureCode ||
        run?.failureReason ||
        null;

    if (!raw) {
        return "The payment failed, but no specific failure reason was recorded.";
    }

    const labels = {
        CARD_DECLINED:
            "The customer's card was declined by the payment provider.",
        INSUFFICIENT_FUNDS:
            "The payment could not be completed because there were not enough available funds.",
        EXPIRED_CARD:
            "The payment method had expired.",
        NETWORK_ERROR:
            "A temporary network problem prevented the payment from completing.",
        TIMEOUT:
            "The payment provider did not respond in time.",
        UNKNOWN:
            "The exact cause of the payment failure could not be determined.",
    };

    if (labels[raw]) return labels[raw];

    return String(raw)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getAttemptCount = (payment, run) =>
    payment?.attemptCount ??
    payment?.retryCount ??
    getResultStep(run)?.output?.attemptsMade ??
    getActionStep(run)?.input?.attemptNumber ??
    getPolicyStep(run)?.output?.attemptsMade ??
    run?.attemptCount ??
    0;

const getMaxAttempts = (payment, run) =>
    payment?.maxAttempts ??
    run?.policy?.maxAttempts ??
    getResultStep(run)?.output?.maxAttempts ??
    getPolicyStep(run)?.output?.maxAttempts ??
    getPolicyStep(run)?.input?.maxAttempts ??
    null;

const getAttemptText = (payment, run) => {
    const current = getAttemptCount(payment, run);
    const max = getMaxAttempts(payment, run);

    return max != null
        ? `${current} / ${max}`
        : `${current}`;
};

const getOutcomeTitle = (status) => {
    const labels = {
        RECOVERED: "Payment recovered",
        ESCALATED: "Sent for human review",
        BLOCKED: "Recovery blocked",
        STOPPED: "Recovery stopped safely",
        FAILED: "Recovery failed",
        RUNNING: "Recovery in progress",
        PENDING: "Recovery pending",
        COMPLETED: "Recovery completed",
    };

    return (
        labels[status] ||
        getStatusLabel(status)
    );
};

const getOutcomeDescription = (run) => {
    if (run.status === "RECOVERED") {
        return "The recovery action succeeded and the payment was recovered.";
    }

    if (run.status === "ESCALATED") {
        return "Automated recovery was not allowed to continue, so the payment was sent for human review.";
    }

    if (run.status === "BLOCKED") {
        return "The recovery action was blocked by policy and no further automated action was taken.";
    }

    if (run.status === "STOPPED") {
        return "Further automated attempts were stopped to stay within the configured recovery policy.";
    }

    if (run.status === "FAILED") {
        return "The recovery process could not complete successfully.";
    }

    if (run.status === "RUNNING") {
        return "The recovery agent is still working on this payment.";
    }

    return "The recovery agent completed its assessment of this payment.";
};

const getOutcomeTone = (status) => {
    if (status === "RECOVERED") {
        return "success";
    }

    if (
        status === "ESCALATED" ||
        status === "PENDING" ||
        status === "RUNNING"
    ) {
        return "warning";
    }

    if (
        status === "BLOCKED" ||
        status === "STOPPED" ||
        status === "FAILED"
    ) {
        return "danger";
    }

    return "neutral";
};

const DetailRow = ({ label, children }) => (
    <div className="acr-detail-row">
        <span>{label}</span>
        <strong>{children}</strong>
    </div>
);

const FlowPill = ({
    children,
    tone = "neutral",
    active = false,
}) => (
    <div
        className={`acr-flow-node-card acr-flow-${tone} ${
            active ? "acr-flow-current" : ""
        }`}
    >
        {children}
    </div>
);

const InspectorSection = ({
    eyebrow,
    title,
    icon: Icon,
    children,
    className = "",
}) => (
    <section
        className={`acr-inspector-section ${className}`}
    >
        <div className="acr-section-heading">
            <div className="acr-section-icon">
                <Icon size={15} />
            </div>

            <div>
                <span className="acr-eyebrow acr-eyebrow-primary">
                    {eyebrow}
                </span>

                <h3>{title}</h3>
            </div>
        </div>

        {children}
    </section>
);

const RecoveryFlow = ({
    run,
    payment,
    tone,
}) => {
    const action = getRunAction(run);
    const policyAllowed =
        getPolicyAllowed(run);
    const result = getResultStep(run);
    const actionStep =
        getActionStep(run);

    const executedAction = getExecutedAction(run);

    const actionTone =
        executedAction === "ESCALATE_TO_HUMAN"
            ? "warning"
            : executedAction === "STOP_RECOVERY"
              ? "danger"
              : "success";

    const finalTone =
        tone === "success"
            ? "success"
            : tone === "warning"
              ? "warning"
              : "danger";

    const paymentStatus =
        payment?.status ||
        result?.output?.status ||
        run.status;

    return (
        <section className="acr-top-flow">
            <div className="acr-flow-header">
                <div>
                    <span className="acr-eyebrow acr-eyebrow-primary">
                        Recovery flow
                    </span>

                    <h3>
                        How this payment was handled
                    </h3>

                    <p>
                        Follow the agent from the failed
                        payment through analysis, policy,
                        action, and final outcome.
                    </p>
                </div>

                <span
                    className={getStatusClass(
                        paymentStatus
                    )}
                >
                    {getStatusLabel(
                        paymentStatus
                    )}
                </span>
            </div>

            <div className="acr-flow-track">
                <FlowPill tone="danger">
                    <span className="acr-flow-index">
                        01
                    </span>

                    <CreditCard size={16} />

                    <div>
                        <strong>
                            Payment failed
                        </strong>

                        <span>
                            {getFailureReason(
                                payment,
                                run
                            )}
                        </span>
                    </div>
                </FlowPill>

                <div className="acr-flow-connector">
                    <span>›</span>
                </div>

                <FlowPill
                    tone="primary"
                    active
                >
                    <span className="acr-flow-index">
                        02
                    </span>

                    <Bot size={16} />

                    <div>
                        <strong>
                            AI analyzed
                        </strong>

                        <span>
                            {getActionLabel(
                                action
                            )}
                        </span>
                    </div>
                </FlowPill>

                <div className="acr-flow-connector">
                    <span>›</span>
                </div>

                <FlowPill
                    tone={
                        policyAllowed === false
                            ? "danger"
                            : policyAllowed === true
                              ? "success"
                              : "neutral"
                    }
                >
                    <span className="acr-flow-index">
                        03
                    </span>

                    <ShieldAlert size={16} />

                    <div>
                        <strong>
                            Safety checked
                        </strong>

                        <span>
                            {policyAllowed ===
                            false
                                ? "Policy blocked"
                                : policyAllowed ===
                                    true
                                  ? "Action allowed"
                                  : "Policy evaluated"}
                        </span>
                    </div>
                </FlowPill>

                <div className="acr-flow-connector">
                    <span>›</span>
                </div>

                <FlowPill
                    tone={actionTone}
                >
                    <span className="acr-flow-index">
                        04
                    </span>

                    <Zap size={16} />

                    <div>
                        <strong>
                            System action
                        </strong>

                        <span>
                            {getActionLabel(
                                executedAction
                            )}
                        </span>
                    </div>
                </FlowPill>

                <div className="acr-flow-connector">
                    <span>›</span>
                </div>

                <FlowPill
                    tone={finalTone}
                    active
                >
                    <span className="acr-flow-index">
                        05
                    </span>

                    <CheckCircle2 size={16} />

                    <div>
                        <strong>
                            Final result
                        </strong>

                        <span>
                            {getOutcomeTitle(
                                run.status
                            )}
                        </span>
                    </div>
                </FlowPill>
            </div>
        </section>
    );
};

const RecoveryInspector = ({
    run,
    payment,
    customer,
    loading,
    error,
    onRetry,
    onClose,
}) => {
    const action = run
        ? getRunAction(run)
        : null;

    const confidence = run
        ? getRunConfidence(run)
        : null;

    const decisionDetails = run
        ? getDecisionDetails(run)
        : {
              summary: null,
              whyThisDecision: null,
              whatHappensNext: null,
          };

    const policyAllowed = run
        ? getPolicyAllowed(run)
        : null;

    const actionStep = run
        ? getActionStep(run)
        : null;

    const resultStep = run
        ? getResultStep(run)
        : null;

    const customerId = getCustomerId(
        payment,
        customer,
        run || {}
    );

    const amount = payment?.amount;
    const currency =
        payment?.currency || "INR";

    const paymentStatus =
        payment?.status ||
        resultStep?.output?.status ||
        run?.status;

    const tone = getOutcomeTone(
        run?.status
    );

    const attempts = run
        ? getAttemptText(payment, run)
        : "—";

    const actualAction =
        getExecutedAction(run);

    const actionSucceeded =
        actionStep?.output?.success === true ||
        run?.status === "RECOVERED";

    const OutcomeIcon =
        run?.status === "RECOVERED"
            ? CheckCircle2
            : run?.status ===
                    "ESCALATED" ||
                run?.status === "PENDING"
              ? ShieldAlert
              : run?.status ===
                      "STOPPED" ||
                  run?.status ===
                      "BLOCKED" ||
                  run?.status === "FAILED"
                ? AlertOctagon
                : Activity;

    return (
        <div
            className="acr-modal-backdrop"
            onClick={onClose}
        >
            <div
                className="acr-inspector"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <header className="acr-inspector-header">
                    <div>
                        <span className="acr-eyebrow acr-eyebrow-primary">
                            Recovery inspection
                        </span>

                        <h2>
                            {run?.source === "VOICE_RECOVERY"
                                ? "Voice Recovery Decision"
                                : "AI Recovery Decision"}
                        </h2>

                        <div className="acr-inspector-payment-id">
                            {run?.paymentId ||
                                "Loading payment..."}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="acr-close-button"
                        onClick={onClose}
                        aria-label="Close inspection"
                    >
                        <X size={17} />
                    </button>
                </header>

                {loading ? (
                    <div className="acr-inspector-loading">
                        <Loader text="Loading recovery details..." />
                    </div>
                ) : error ? (
                    <div className="acr-inspector-error">
                        <ErrorMessage
                            message={error}
                            onRetry={onRetry}
                        />
                    </div>
                ) : run ? (
                    <div className="acr-inspector-body">
                        <section
                            className={`acr-outcome acr-tone-${tone}`}
                        >
                            <div className="acr-outcome-top">
                                <div className="acr-outcome-icon">
                                    <OutcomeIcon size={19} />
                                </div>

                                <div className="acr-outcome-copy">
                                    <span className="acr-eyebrow">
                                        Final outcome
                                    </span>

                                    <h3>
                                        {getOutcomeTitle(
                                            run.status
                                        )}
                                    </h3>

                                    <p>
                                        {getOutcomeDescription(
                                            run
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="acr-summary-grid">
                                <div className="acr-summary-card">
                                    <span>
                                        AI recommendation
                                    </span>

                                    <strong>
                                        {getActionLabel(
                                            action
                                        )}
                                    </strong>
                                </div>

                                <div className="acr-summary-card">
                                    <span>
                                        Confidence
                                    </span>

                                    <strong className="acr-mono">
                                        {confidence !=
                                        null
                                            ? `${Math.round(
                                                  Number(
                                                      confidence
                                                  ) * 100
                                              )}%`
                                            : "—"}
                                    </strong>
                                </div>

                                <div className="acr-summary-card">
                                    <span>
                                        Attempts
                                    </span>

                                    <strong className="acr-mono">
                                        {attempts}
                                    </strong>
                                </div>
                            </div>
                        </section>

                        <InspectorSection
                            eyebrow="Payment context"
                            title="Payment details"
                            icon={CreditCard}
                            className="acr-section-payment"
                        >
                            <div className="acr-facts-grid">
                                <div className="acr-info-card">
                                    <span>
                                        Amount
                                    </span>

                                    <strong>
                                        {formatAmount(
                                            amount,
                                            currency
                                        )}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Customer
                                    </span>

                                    <strong
                                        className="acr-break"
                                        title={
                                            customerId
                                        }
                                    >
                                        {customerId}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Payment method
                                    </span>

                                    <strong>
                                        {payment?.paymentMethod ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Currency
                                    </span>

                                    <strong>
                                        {currency}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Failure type /
                                        scenario
                                    </span>

                                    <strong>
                                        {payment?.scenario ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Payment status
                                    </span>

                                    <strong>
                                        <span
                                            className={getStatusClass(
                                                paymentStatus
                                            )}
                                        >
                                            {getStatusLabel(
                                                paymentStatus
                                            )}
                                        </span>
                                    </strong>
                                </div>
                            </div>

                            <div className="acr-payment-id-box">
                                <span className="acr-eyebrow">
                                    Payment ID
                                </span>

                                <strong className="acr-mono acr-break">
                                    {run.paymentId}
                                </strong>
                            </div>

                            <div className="acr-failure-box">
                                <span className="acr-eyebrow">
                                    Failure reason
                                </span>

                                <p>
                                    {getFailureReason(
                                        payment,
                                        run
                                    )}
                                </p>
                            </div>
                        </InspectorSection>

                        <RecoveryFlow
                            run={run}
                            payment={payment}
                            tone={tone}
                        />

                        <InspectorSection
                            eyebrow="Agent reasoning"
                            title="What AI recommended"
                            icon={Bot}
                            className="acr-section-highlight"
                        >
                            <div className="acr-recommendation-head">
                                <div>
                                    <span className="acr-eyebrow">
                                        Recommended action
                                    </span>

                                    <div className="acr-recommendation">
                                        {getActionLabel(
                                            action
                                        )}
                                    </div>
                                </div>

                                {confidence != null && (
                                    <div className="acr-confidence">
                                        {Math.round(
                                            Number(
                                                confidence
                                            ) * 100
                                        )}
                                        % confidence
                                    </div>
                                )}
                            </div>

                            {decisionDetails.summary && (
                                <div className="acr-explanation-box">
                                    <span className="acr-eyebrow">
                                        Decision summary
                                    </span>

                                    <p>
                                        {decisionDetails.summary}
                                    </p>
                                </div>
                            )}

                            {decisionDetails.whyThisDecision && (
                                <div className="acr-explanation-box">
                                    <span className="acr-eyebrow">
                                        Why this decision
                                    </span>

                                    <p>
                                        {decisionDetails.whyThisDecision}
                                    </p>
                                </div>
                            )}

                            {!decisionDetails.summary &&
                                !decisionDetails.whyThisDecision && (
                                    <p className="acr-explanation">
                                        {getDecisionExplanation(run)}
                                    </p>
                                )}

                            {decisionDetails.whatHappensNext && (
                                <div className="acr-next-box">
                                    <span className="acr-eyebrow">
                                        What happens next
                                    </span>

                                    <p>
                                        {decisionDetails.whatHappensNext}
                                    </p>
                                </div>
                            )}
                        </InspectorSection>

                        <InspectorSection
                            eyebrow="Policy enforcement"
                            title="Safety check"
                            icon={ShieldAlert}
                            className="acr-section-safety"
                        >
                            <div className="acr-facts-grid">
                                <div className="acr-info-card">
                                    <span>
                                        Decision
                                    </span>

                                    <strong
                                        className={
                                            policyAllowed ===
                                            false
                                                ? "acr-text-danger"
                                                : policyAllowed ===
                                                    true
                                                  ? "acr-text-success"
                                                  : ""
                                        }
                                    >
                                        {policyAllowed ===
                                        false
                                            ? "Action blocked"
                                            : policyAllowed ===
                                                true
                                              ? "Action approved"
                                              : "Policy evaluated"}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Allowed action
                                    </span>

                                    <strong>
                                        {getActionLabel(
                                            getPolicyStep(
                                                run
                                            )?.output
                                                ?.finalAction ||
                                                action
                                        )}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Attempts
                                    </span>

                                    <strong className="acr-mono">
                                        {attempts}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Max attempts
                                    </span>

                                    <strong className="acr-mono">
                                        {getMaxAttempts(
                                            payment,
                                            run
                                        ) ?? "—"}
                                    </strong>
                                </div>
                            </div>

                            <div className="acr-explanation-box">
                                {getPolicyExplanation(
                                    run
                                )}
                            </div>
                        </InspectorSection>

                        <InspectorSection
                            eyebrow="Execution"
                            title="What the system did"
                            icon={Zap}
                            className="acr-section-execution"
                        >
                            <div className="acr-facts-grid">
                                <div className="acr-info-card">
                                    <span>
                                        Action taken
                                    </span>

                                    <strong>
                                        {actualAction
                                            ? getActionLabel(
                                                  actualAction
                                              )
                                            : "No automatic action"}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Result
                                    </span>

                                    <strong
                                        className={
                                            actionSucceeded
                                                ? "acr-text-success"
                                                : run.status ===
                                                        "STOPPED" ||
                                                    run.status ===
                                                        "BLOCKED"
                                                  ? "acr-text-danger"
                                                  : ""
                                        }
                                    >
                                        {getStatusLabel(
                                            resultStep
                                                ?.output
                                                ?.status ||
                                                run.status
                                        )}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Executed action
                                    </span>

                                    <strong>
                                        {getActionLabel(actualAction)}
                                    </strong>
                                </div>
                            </div>

                            <div className="acr-explanation-box">
                                {getActionExplanation(
                                    run
                                )}
                            </div>

                            <div
                                className={`acr-result-box acr-tone-${tone}`}
                            >
                                <span className="acr-eyebrow">
                                    Outcome explanation
                                </span>

                                <p>
                                    {getResultExplanation(
                                        run
                                    )}
                                </p>
                            </div>
                        </InspectorSection>

                        <InspectorSection
                            eyebrow="Customer context"
                            title="Customer history used by the agent"
                            icon={UserRound}
                            className="acr-section-secondary"
                        >
                            <div className="acr-facts-grid">
                                <div className="acr-info-card">
                                    <span>
                                        Customer
                                    </span>

                                    <strong className="acr-break">
                                        {customerId}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Name
                                    </span>

                                    <strong>
                                        {customer?.name ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Total payments
                                    </span>

                                    <strong className="acr-mono">
                                        {customer?.totalPayments ??
                                            "—"}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Successful payments
                                    </span>

                                    <strong className="acr-mono">
                                        {customer?.successfulPayments ??
                                            "—"}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Failed payments
                                    </span>

                                    <strong className="acr-mono">
                                        {customer?.failedPayments ??
                                            "—"}
                                    </strong>
                                </div>

                                <div className="acr-info-card">
                                    <span>
                                        Total spent
                                    </span>

                                    <strong>
                                        {customer?.totalSpent !=
                                        null
                                            ? formatAmount(
                                                  customer.totalSpent,
                                                  currency
                                              )
                                            : "—"}
                                    </strong>
                                </div>
                            </div>
                        </InspectorSection>

                        <footer className="acr-inspector-footer">
                            <Clock size={13} />

                            <span>
                                Started{" "}
                                {formatDate(
                                    run.startedAt
                                )}

                                {run.completedAt
                                    ? ` · Completed ${formatDate(
                                          run.completedAt
                                      )}`
                                    : ""}
                            </span>
                        </footer>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export const AgentControlRoom = () => {
    const [data, setData] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);

    const [selectedRun, setSelectedRun] =
        useState(null);

    const [selectedPayment, setSelectedPayment] =
        useState({});

    const [selectedCustomer, setSelectedCustomer] =
        useState({});

    const [selectedPaymentId, setSelectedPaymentId] =
        useState(null);

    const [runLoading, setRunLoading] =
        useState(false);

    const [runError, setRunError] =
        useState(null);

    const fetchControlRoom = async () => {
        try {
            setLoading(true);
            setError(null);

            const result =
                await getControlRoom();

            setData(result);
        } catch (err) {
            setError(
                err.message ||
                    "Unable to load control room."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchControlRoom();
    }, []);

    const inspectRun = async (paymentId) => {
        setSelectedPaymentId(paymentId);
        setSelectedRun(null);
        setSelectedPayment({});
        setSelectedCustomer({});
        setRunLoading(true);
        setRunError(null);

        try {
            const result = await getAgentRun(paymentId);
            const run = result?.run || null;

            if (!run) {
                throw new Error(
                    "No recovery run was returned for this payment."
                );
            }

            const {
                payment: extractedPayment,
                customer,
            } = extractInspectionContext(run);

            setSelectedPayment(
                result?.payment ||
                    extractedPayment ||
                    {}
            );

            setSelectedCustomer(customer);
            setSelectedRun(run);
        } catch (err) {
            setRunError(
                err.message ||
                    "Unable to load recovery details."
            );
        } finally {
            setRunLoading(false);
        }
    };

    const closeInspector = () => {
        setSelectedRun(null);
        setSelectedPayment({});
        setSelectedCustomer({});
        setSelectedPaymentId(null);
        setRunError(null);
    };

    useEffect(() => {
        if (!selectedPaymentId) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        const handleKeyDown = (
            event
        ) => {
            if (event.key === "Escape") {
                closeInspector();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.body.style.overflow =
                previousOverflow;

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [selectedPaymentId]);

    if (loading && !data) {
        return (
            <Loader
                fullPage
                text="Loading AI control room..."
            />
        );
    }

    if (error && !data) {
        return (
            <ErrorMessage
                message={error}
                onRetry={fetchControlRoom}
            />
        );
    }

    const agent =
        data?.agent || {};

    const summary =
        data?.summary || {};

    const decisions =
        data?.recentRuns || [];

    const evaluated =
        summary.evaluated || 0;

    const recovered =
        summary.recovered || 0;

    const escalated =
        summary.escalated || 0;

    const blocked =
        summary.blocked || 0;

    const stopped =
        summary.stopped || 0;

    const failed =
        summary.failed || 0;

    const recoveryRate =
        evaluated > 0
            ? (recovered / evaluated) *
              100
            : 0;

    return (
        <>
            <div className="acr-page animate-rise">
                <header className="acr-page-header">
                    <div>
                        <span className="acr-eyebrow acr-eyebrow-primary">
                            Agent Control Room
                        </span>

                        <h1>
                            AI Recovery Operations
                        </h1>

                        <p>
                            Monitor how the recovery
                            agent makes decisions,
                            follows policy, and handles
                            failed payments.
                        </p>
                    </div>

                    <div className="acr-agent-status">
                        <span className="acr-live-dot" />
                        AGENT{" "}
                        {agent.status ||
                            "ONLINE"}
                    </div>
                </header>

                <div className="acr-metrics-grid">
                    <div className="acr-metric-card acr-metric-primary">
                        <div className="acr-metric-top">
                            <span className="acr-eyebrow">
                                Payments evaluated
                            </span>

                            <Activity size={16} />
                        </div>

                        <strong>
                            <AnimatedNumber
                                value={
                                    evaluated
                                }
                                decimals={0}
                            />
                        </strong>

                        <span>
                            reviewed by the agent
                        </span>
                    </div>

                    <div className="acr-metric-card acr-metric-success">
                        <div className="acr-metric-top">
                            <span className="acr-eyebrow">
                                Payments recovered
                            </span>

                            <CheckCircle2 size={16} />
                        </div>

                        <strong>
                            <AnimatedNumber
                                value={
                                    recovered
                                }
                                decimals={0}
                            />
                        </strong>

                        <span>
                            successfully recovered
                        </span>
                    </div>

                    <div className="acr-metric-card acr-metric-warning">
                        <div className="acr-metric-top">
                            <span className="acr-eyebrow">
                                Human review
                            </span>

                            <ShieldAlert size={16} />
                        </div>

                        <strong>
                            <AnimatedNumber
                                value={
                                    escalated
                                }
                                decimals={0}
                            />
                        </strong>

                        <span>
                            cases escalated safely
                        </span>
                    </div>

                    <div className="acr-metric-card acr-metric-danger">
                        <div className="acr-metric-top">
                            <span className="acr-eyebrow">
                                Recovery rate
                            </span>

                            <ArrowUpRight size={16} />
                        </div>

                        <strong>
                            <AnimatedNumber
                                value={
                                    recoveryRate
                                }
                                decimals={1}
                                suffix="%"
                            />
                        </strong>

                        <span>
                            successful recoveries
                        </span>
                    </div>
                </div>

                <div className="acr-main-grid">
                    {/* =================================================
                        RECENT AI DECISIONS
                        The list itself is scrollable.
                        The panel DOES NOT grow indefinitely.
                       ================================================= */}
                    <section className="acr-panel acr-decisions-panel">
                        <div className="acr-panel-header">
                            <div>
                                <span className="acr-eyebrow acr-eyebrow-primary">
                                    Agent activity
                                </span>

                                <h2>
                                    Recent AI Decisions
                                </h2>
                            </div>

                            <Bot
                                size={18}
                                className="acr-primary-icon"
                            />
                        </div>

                        {decisions.length ===
                        0 ? (
                            <div className="acr-empty">
                                No recent agent
                                decisions.
                            </div>
                        ) : (
                            <div className="acr-decisions">
                                {decisions.map(
                                    (
                                        run,
                                        index
                                    ) => {
                                        const action =
                                            run
                                                .decision
                                                ?.action ||
                                            run
                                                .policy
                                                ?.action ||
                                            getRunAction(
                                                run
                                            );

                                        const reason =
                                            run
                                                .decision
                                                ?.reason ||
                                            run
                                                .policy
                                                ?.reason ||
                                            run
                                                .result
                                                ?.reason ||
                                            "Agent completed its assessment.";

                                        const confidence =
                                            run
                                                .decision
                                                ?.confidence ??
                                            getRunConfidence(
                                                run
                                            );

                                        return (
                                            <div
                                                className="acr-decision-row"
                                                key={
                                                    run.runId ||
                                                    run.paymentId ||
                                                    index
                                                }
                                            >
                                                <div className="acr-decision-copy">
                                                        <div className="acr-decision-id">
                                                            {run.paymentId || "Payment"}

                                                            {run.status && (
                                                                <span
                                                                    className={getStatusClass(
                                                                        run.status
                                                                    )}
                                                                >
                                                                    {getStatusLabel(
                                                                        run.status
                                                                    )}
                                                                </span>
                                                            )}

                                                            {run.source === "VOICE_RECOVERY" && (
                                                                <span className="acr-status">
                                                                    Voice Recovery
                                                                </span>
                                                            )}
                                                        </div>

                                                        {run.startedAt && (
                                                            <div className="acr-decision-time">
                                                                <Clock size={12} />
                                                                {formatDate(run.startedAt)}
                                                            </div>
                                                        )}

                                                        <h3>
                                                            {getActionLabel(action)}
                                                        </h3>

                                                        <p>
                                                            {reason}
                                                        </p>

                                                    {run
                                                        .policy
                                                        ?.allowed !=
                                                        null && (
                                                        <span
                                                            className={
                                                                run
                                                                    .policy
                                                                    .allowed
                                                                    ? "acr-policy-approved"
                                                                    : "acr-policy-blocked"
                                                            }
                                                        >
                                                            {run
                                                                .policy
                                                                .allowed
                                                                ? "Policy approved"
                                                                : "Policy blocked"}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="acr-decision-actions">
                                                    {confidence !=
                                                        null && (
                                                        <div className="acr-list-confidence">
                                                            <strong>
                                                                {Math.round(
                                                                    Number(
                                                                        confidence
                                                                    ) *
                                                                        100
                                                                )}
                                                                %
                                                            </strong>

                                                            <span>
                                                                confidence
                                                            </span>
                                                        </div>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="acr-inspect-button"
                                                        onClick={() =>
                                                            inspectRun(
                                                                run.paymentId
                                                            )
                                                        }
                                                    >
                                                        <Eye size={12} />
                                                        Inspect
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </section>

                    {/* =================================================
                        AGENT OUTCOMES
                        This panel now keeps its natural height.
                        It will NOT stretch with Recent AI Decisions.
                       ================================================= */}
                    <aside className="acr-panel acr-outcomes-panel">
                        <div className="acr-panel-header">
                            <div>
                                <span className="acr-eyebrow acr-eyebrow-primary">
                                    Policy control
                                </span>

                                <h2>
                                    Agent Outcomes
                                </h2>
                            </div>
                        </div>

                        <div className="acr-outcome-list">
                            <DetailRow label="Recovered">
                                <span className="acr-text-success">
                                    {
                                        recovered
                                    }
                                </span>
                            </DetailRow>

                            <DetailRow label="Escalated">
                                <span className="acr-text-warning">
                                    {
                                        escalated
                                    }
                                </span>
                            </DetailRow>

                            <DetailRow label="Blocked">
                                <span className="acr-text-danger">
                                    {
                                        blocked
                                    }
                                </span>
                            </DetailRow>

                            <DetailRow label="Stopped">
                                <span className="acr-text-danger">
                                    {
                                        stopped
                                    }
                                </span>
                            </DetailRow>

                            <DetailRow label="Failed runs">
                                <span className="acr-text-danger">
                                    {
                                        failed
                                    }
                                </span>
                            </DetailRow>
                        </div>

                        <div className="acr-policy-note">
                            <ShieldAlert size={15} />

                            <span>
                                The agent operates within
                                predefined recovery
                                policies. High-risk or
                                uncertain cases are sent
                                for human review.
                            </span>
                        </div>
                    </aside>
                </div>

                <div className="acr-attention">
                    <AlertOctagon size={16} />

                    <span>
                        <strong>
                            {escalated +
                                blocked}
                        </strong>{" "}
                        cases currently require
                        attention or were stopped by
                        recovery policy.
                    </span>
                </div>
            </div>

            {selectedPaymentId && (
                <RecoveryInspector
                    run={selectedRun}
                    payment={
                        selectedPayment
                    }
                    customer={
                        selectedCustomer
                    }
                    loading={runLoading}
                    error={runError}
                    onRetry={() =>
                        inspectRun(
                            selectedPaymentId
                        )
                    }
                    onClose={
                        closeInspector
                    }
                />
            )}
        </>
    );
};

export default AgentControlRoom;