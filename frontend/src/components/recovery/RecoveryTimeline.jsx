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
            color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40"
        };
    }

    if (action === "CREATE_PAYMENT_LINK") {
        return {
            title: "Waiting for customer payment",
            desc:
                "A recovery payment link was created. The money will be recovered when the customer completes the payment.",
            icon: Clock,
            color: "text-amber-400 border-amber-500/30 bg-amber-950/40"
        };
    }

    if (action === "ESCALATE_TO_HUMAN") {
        return {
            title: "Human review required",
            desc:
                "Automatic recovery was not continued. The payment has been moved for human review.",
            icon: UserCheck,
            color: "text-purple-400 border-purple-500/30 bg-purple-950/40"
        };
    }

    if (action === "STOP_RECOVERY") {
        return {
            title: "Automatic recovery stopped",
            desc:
                "No further automatic payment attempt will be made. The payment remains unrecovered.",
            icon: AlertTriangle,
            color: "text-slate-400 border-slate-500/30 bg-slate-950/40"
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
            color: "text-rose-400 border-rose-500/30 bg-rose-950/40"
        };
    }

    return {
        title: "Recovery not completed",
        desc:
            "The payment remains unrecovered.",
        icon: XCircle,
        color: "text-rose-400 border-rose-500/30 bg-rose-950/40"
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
            color:
                "text-rose-400 border-rose-500/30 bg-rose-950/40"
        },
        {
            title: "AI reviewed the payment",
            desc: hasAI
                ? "AI considered the payment details and customer history before choosing a recovery strategy."
                : "Waiting for AI to review the payment.",
            status: hasAI ? "completed" : "pending",
            icon: Bot,
            color:
                "text-indigo-400 border-indigo-500/30 bg-indigo-950/40"
        },
        {
            title: "Recovery strategy selected",
            desc: hasAI
                ? `AI chose ${formatRecoveryAction(action)}.`
                : "No recovery strategy has been selected yet.",
            status: hasAI ? "completed" : "pending",
            icon: ShieldCheck,
            color:
                "text-purple-400 border-purple-500/30 bg-purple-950/40"
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
            color:
                hasPolicy && policyDecision.allowed === false
                    ? "text-rose-400 border-rose-500/30 bg-rose-950/40"
                    : "text-emerald-400 border-emerald-500/30 bg-emerald-950/40"
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
            color:
                "text-cyan-400 border-cyan-500/30 bg-cyan-950/40"
        },
        {
            title: outcome.title,
            desc: outcome.desc,
            status: hasExecution ? "completed" : "pending",
            icon: outcome.icon,
            color: outcome.color
        }
    ];

    return (
        <div className="
            glass-panel
            p-6
            rounded-2xl
        ">

            <div className="
                flex
                items-center
                gap-2
                mb-6
            ">
                <Clock className="
                    w-5
                    h-5
                    text-indigo-400
                " />

                <div>
                    <h4 className="
                        text-base
                        font-bold
                        text-slate-100
                    ">
                        Recovery Journey
                    </h4>

                    <p className="
                        text-[11px]
                        text-slate-400
                        mt-0.5
                    ">
                        What happened to this payment
                    </p>
                </div>
            </div>

            <div className="
                relative
                pl-7
                space-y-7
                before:absolute
                before:left-3.5
                before:top-3
                before:bottom-3
                before:w-px
                before:bg-slate-800
            ">

                {steps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                        <div
                            key={`${step.title}-${index}`}
                            className="
                                relative
                                flex
                                items-start
                                gap-4
                            "
                        >
                            <div className={`
                                absolute
                                -left-7
                                p-1.5
                                rounded-full
                                border
                                shadow-md
                                ${step.color}
                            `}>
                                <Icon className="
                                    w-3.5
                                    h-3.5
                                " />
                            </div>

                            <div className="min-w-0">
                                <h5 className="
                                    text-sm
                                    font-bold
                                    text-slate-200
                                ">
                                    {step.title}
                                </h5>

                                <p className="
                                    text-xs
                                    text-slate-400
                                    mt-1
                                    leading-relaxed
                                ">
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