import React from "react";
import {
    Clock,
    XCircle,
    Bot,
    ShieldCheck,
    Zap,
    UserCheck,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";

import { formatRecoveryAction, formatScenario } from "../../utils/statusHelpers";
import { formatCurrency } from "../../utils/formatCurrency";

const getOutcome = ({
    executionResult,
    payment
}) => {
    const result =
        executionResult?.result ||
        executionResult?.status ||
        payment?.recoveryResult ||
        payment?.status;

    const action =
        executionResult?.actionExecuted ||
        executionResult?.finalAction ||
        payment?.recoveryAction;

    if (
        result === "recovered" ||
        result === "RECOVERED"
    ) {
        return {
            title: "Payment recovered",
            desc: `${
                payment.amount !== undefined
                    ? formatCurrency(payment.amount)
                    : "The payment"
            } has been successfully recovered.`,
            icon: CheckCircle2,
            dotClass: "timeline-dot-up"
        };
    }

    if (action === "CREATE_PAYMENT_LINK") {
        return {
            title: "Waiting for customer payment",
            desc:
                "A recovery payment link was created. The money will be recovered when the customer completes the payment.",
            icon: Clock,
            dotClass: "timeline-dot-warn"
        };
    }

    if (action === "ESCALATE_TO_HUMAN") {
        return {
            title: "Human review required",
            desc:
                "Automatic recovery was not continued. The payment has been moved for human review.",
            icon: UserCheck,
            dotClass: "timeline-dot-primary"
        };
    }

    if (action === "STOP_RECOVERY") {
        return {
            title: "Automatic recovery stopped",
            desc:
                "No further automatic payment attempt will be made. The payment remains unrecovered.",
            icon: AlertTriangle,
            dotClass: "timeline-dot-warn"
        };
    }

    if (
        action === "RETRY_PAYMENT" &&
        (result === "failed" || result === "FAILED")
    ) {
        return {
            title: "Retry did not recover payment",
            desc:
                "The additional payment attempt failed, so the money remains unrecovered.",
            icon: XCircle,
            dotClass: "timeline-dot-down"
        };
    }

    return {
        title: "Recovery not completed",
        desc:
            "The payment remains unrecovered.",
        icon: XCircle,
        dotClass: "timeline-dot-down"
    };
};

export const RecoveryTimeline = ({
    payment = {},
    aiDecision,
    policyDecision,
    executionResult
}) => {
    const hasAI = Boolean(aiDecision);
    const hasPolicy = Boolean(policyDecision);
    const hasExecution = Boolean(executionResult);

    const action =
        executionResult?.actionExecuted ||
        executionResult?.finalAction ||
        policyDecision?.finalAction ||
        aiDecision?.action ||
        payment?.recoveryAction;

    const outcome = getOutcome({
        executionResult,
        payment
    });

    const failureType = payment.scenario
        ? formatScenario(payment.scenario)
        : "Payment failure";

    const steps = [
        {
            title: "Payment failed",
            desc:
                `The ${failureType.toLowerCase()} prevented the payment from being completed.`,
            status: "completed",
            icon: XCircle,
            dotClass: "timeline-dot-down"
        },
        {
            title: "AI reviewed the payment",
            desc: hasAI
                ? "AI considered the payment details and customer history before choosing a recovery strategy."
                : "Waiting for AI to review the payment.",
            status: hasAI ? "completed" : "pending",
            icon: Bot,
            dotClass: "timeline-dot-primary"
        },
        {
            title: "Recovery strategy selected",
            desc: hasAI
                ? `AI chose ${formatRecoveryAction(action)}.`
                : "No recovery strategy has been selected yet.",
            status: hasAI ? "completed" : "pending",
            icon: ShieldCheck,
            dotClass: "timeline-dot-primary"
        },
        {
            title: "Safety check completed",
            desc: hasPolicy
                ? policyDecision.allowed !== false
                    ? "The selected strategy passed the system's safety checks."
                    : "The selected strategy was blocked by the system's safety checks."
                : "Waiting for the recovery safety check.",
            status: hasPolicy ? "completed" : "pending",
            icon: ShieldCheck,
            dotClass:
                hasPolicy && policyDecision.allowed === false
                    ? "timeline-dot-down"
                    : "timeline-dot-up"
        },
        {
            title: hasExecution
                ? "Recovery action processed"
                : "Recovery action",
            desc: hasExecution
                ? "The approved recovery strategy was processed by the recovery system."
                : "Waiting for the recovery action to be processed.",
            status: hasExecution ? "completed" : "pending",
            icon: Zap,
            dotClass: "timeline-dot-primary"
        },
        {
            title: outcome.title,
            desc: outcome.desc,
            status: hasExecution ? "completed" : "pending",
            icon: outcome.icon,
            dotClass: outcome.dotClass
        }
    ];

    return (
        <div className="panel recovery-card">
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1.5rem"
                }}
            >
                <Clock
                    className="status-primary"
                    style={{ width: "1.25rem", height: "1.25rem" }}
                />

                <div>
                    <h4 className="recovery-card-title">
                        Recovery Journey
                    </h4>

                    <p className="recovery-card-subtitle">
                        What happened to this payment
                    </p>
                </div>
            </div>

            <div className="timeline-track">
                {steps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                        <div
                            key={`${step.title}-${index}`}
                            className="timeline-step"
                        >
                            <div
                                className={`timeline-dot ${step.dotClass}`}
                                style={{ opacity: step.status === "pending" ? 0.5 : 1 }}
                            >
                                <Icon style={{ width: "0.875rem", height: "0.875rem" }} />
                            </div>

                            <div style={{ minWidth: 0 }}>
                                <h5
                                    style={{
                                        fontSize: "0.8125rem",
                                        fontWeight: 700,
                                        color: "var(--ink)"
                                    }}
                                >
                                    {step.title}
                                </h5>

                                <p
                                    style={{
                                        fontSize: "0.75rem",
                                        color: "var(--mute)",
                                        marginTop: "0.25rem",
                                        lineHeight: 1.6
                                    }}
                                >
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecoveryTimeline;
