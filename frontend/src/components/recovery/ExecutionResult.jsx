import React, { useState } from "react";
import {
    Copy,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    UserCheck,
    AlertTriangle
} from "lucide-react";

import { formatRecoveryAction } from "../../utils/statusHelpers";
import PaymentStatusBadge from "../payments/PaymentStatusBadge";
import { formatCurrency } from "../../utils/formatCurrency";

const getOutcomeExplanation = ({
    action,
    result,
    payment,
    executionResult
}) => {
    if (result === "recovered") {
        return {
            title: "Payment recovered successfully",
            description: `${
                payment.amount !== undefined
                    ? formatCurrency(payment.amount)
                    : "The payment"
            } has been successfully recovered. The money is no longer at risk.`,
            icon: CheckCircle2,
            color: "text-emerald-400"
        };
    }

    if (action === "CREATE_PAYMENT_LINK") {
        if (
            executionResult?.paymentLinkId ||
            executionResult?.paymentLinkUrl
        ) {
            return {
                title: "Payment link created",
                description:
                    "The customer now has another way to complete the payment. The money has not been recovered yet because the customer still needs to pay.",
                icon: Clock,
                color: "text-amber-400"
            };
        }

        return {
            title: "Payment link recovery selected",
            description:
                "The system selected a payment link as the recovery method. The payment remains unrecovered until the customer completes it.",
            icon: Clock,
            color: "text-amber-400"
        };
    }

    if (action === "RETRY_PAYMENT") {
        if (
            result === "failed" ||
            result === "FAILED"
        ) {
            return {
                title: "Retry did not recover the payment",
                description:
                    "The additional payment attempt was unsuccessful. The payment remains unrecovered and can only continue through another permitted recovery path.",
                icon: XCircle,
                color: "text-rose-400"
            };
        }

        return {
            title: "Payment retry processed",
            description:
                "The system made another payment attempt. The current payment status determines whether the money was recovered.",
            icon: Zap,
            color: "text-cyan-400"
        };
    }

    if (action === "ESCALATE_TO_HUMAN") {
        return {
            title: "Payment sent for human review",
            description:
                "No automatic payment attempt was made. The payment has been moved to a human-review workflow.",
            icon: UserCheck,
            color: "text-purple-400"
        };
    }

    if (action === "STOP_RECOVERY") {
        return {
            title: "Automatic recovery stopped",
            description:
                "The system will not make another automatic payment attempt. The payment remains unrecovered.",
            icon: AlertTriangle,
            color: "text-slate-400"
        };
    }

    return {
        title: "Recovery action processed",
        description:
            "The recovery system processed the selected action. The current payment status shows the resulting state.",
        icon: Zap,
        color: "text-cyan-400"
    };
};

export const ExecutionResult = ({
    executionResult = {},
    payment = {}
}) => {
    const [copied, setCopied] = useState(false);

    const actionExecuted =
        executionResult.actionExecuted ||
        executionResult.finalAction ||
        payment.recoveryAction;

    const resultStatus =
        executionResult.result ||
        executionResult.status ||
        payment.recoveryResult ||
        payment.status ||
        "pending";

    const linkUrl =
        actionExecuted === "CREATE_PAYMENT_LINK"
            ? executionResult.paymentLinkUrl ||
              payment.paymentLinkUrl ||
              null
            : null;

    const outcome = getOutcomeExplanation({
        action: actionExecuted,
        result: resultStatus,
        payment,
        executionResult
    });

    const handleCopy = async () => {
        if (!linkUrl) {
            return;
        }

        try {
            await navigator.clipboard.writeText(linkUrl);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error(
                "Unable to copy payment link:",
                error
            );
        }
    };

    const isRecovered =
        resultStatus === "recovered" ||
        resultStatus === "RECOVERED";

    const OutcomeIcon = outcome.icon;

    return (
        <div className={`
            glass-panel
            p-6
            rounded-2xl
            border
            ${
                isRecovered
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : "border-cyan-500/30 bg-gradient-to-br from-slate-900/95 to-cyan-950/20"
            }
        `}>

            {/* Header */}
            <div className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
                mb-5
            ">

                <div className="flex items-center gap-3">

                    <div className={`
                        p-2.5
                        rounded-xl
                        border
                        ${
                            isRecovered
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                        }
                    `}>
                        <Zap className="w-5 h-5" />
                    </div>

                    <div>
                        <h4 className="
                            text-base
                            font-bold
                            text-slate-100
                        ">
                            Recovery Outcome
                        </h4>

                        <p className="
                            text-[11px]
                            text-slate-400
                            mt-0.5
                        ">
                            What the system actually did
                        </p>
                    </div>
                </div>

                <PaymentStatusBadge
                    status={resultStatus}
                />
            </div>

            {/* Action */}
            <div className="
                p-4
                rounded-xl
                bg-slate-950/60
                border border-slate-800/80
                mb-5
            ">
                <span className="
                    text-[10px]
                    uppercase
                    tracking-wider
                    font-bold
                    text-slate-500
                    block
                    mb-1
                ">
                    Action Taken
                </span>

                <span className="
                    text-base
                    font-bold
                    text-slate-100
                ">
                    {actionExecuted
                        ? formatRecoveryAction(actionExecuted)
                        : "No recovery action recorded"}
                </span>
            </div>

            {/* Outcome */}
            <div className="
                flex
                items-start
                gap-3
                mb-5
            ">

                <div className="shrink-0 mt-0.5">
                    <OutcomeIcon
                        className={`
                            w-5
                            h-5
                            ${outcome.color}
                        `}
                    />
                </div>

                <div>
                    <h5 className="
                        text-sm
                        font-bold
                        text-slate-200
                    ">
                        {outcome.title}
                    </h5>

                    <p className="
                        text-sm
                        text-slate-400
                        leading-relaxed
                        mt-1
                    ">
                        {outcome.description}
                    </p>
                </div>
            </div>

            {/* Payment link */}
            {linkUrl && (
                <div className="
                    p-4
                    bg-slate-950/80
                    rounded-xl
                    border border-cyan-800/50
                    mb-5
                ">

                    <div className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        mb-2
                    ">
                        <span className="
                            text-[11px]
                            font-semibold
                            text-cyan-400
                            uppercase
                            tracking-wider
                        ">
                            Customer Payment Link
                        </span>

                        <button
                            onClick={handleCopy}
                            className="
                                text-xs
                                text-slate-400
                                hover:text-slate-200
                                flex
                                items-center
                                gap-1
                                cursor-pointer
                            "
                        >
                            {copied ? (
                                <CheckCircle2 className="
                                    w-3.5
                                    h-3.5
                                    text-emerald-400
                                " />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}

                            <span>
                                {copied
                                    ? "Copied!"
                                    : "Copy Link"}
                            </span>
                        </button>
                    </div>

                    <div className="
                        flex
                        items-center
                        gap-2
                        font-mono
                        text-xs
                        text-slate-300
                        bg-slate-900
                        p-2.5
                        rounded-lg
                        border border-slate-800
                    ">
                        <span className="
                            truncate
                            flex-1
                        ">
                            {linkUrl}
                        </span>

                        <a
                            href={linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="
                                p-1
                                hover:text-cyan-400
                                shrink-0
                            "
                            aria-label="Open payment link"
                        >
                            <ExternalLink className="
                                w-3.5
                                h-3.5
                            " />
                        </a>
                    </div>
                </div>
            )}

            {/* Money state */}
            <div className="
                pt-4
                border-t
                border-slate-800/80
            ">
                <div className="
                    flex
                    items-center
                    justify-between
                    gap-4
                ">
                    <span className="
                        text-xs
                        text-slate-400
                    ">
                        Money recovery status
                    </span>

                    <span className={`
                        text-xs
                        font-bold
                        ${
                            isRecovered
                                ? "text-emerald-400"
                                : resultStatus === "pending" ||
                                  resultStatus === "PENDING"
                                    ? "text-amber-400"
                                    : "text-rose-400"
                        }
                    `}>
                        {isRecovered
                            ? "Money recovered"
                            : resultStatus === "pending" ||
                              resultStatus === "PENDING"
                                ? "Waiting for payment"
                                : "Not recovered"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ExecutionResult;