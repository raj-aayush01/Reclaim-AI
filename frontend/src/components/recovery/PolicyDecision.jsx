import React from "react";
import {
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    XCircle
} from "lucide-react";

import { formatRecoveryAction } from "../../utils/statusHelpers";

const getPolicyExplanation = ({
    allowed,
    action,
    payment
}) => {
    if (!allowed) {
        if (payment?.attemptCount >= 3) {
            return "Automatic recovery was stopped because this payment has already reached the maximum number of permitted attempts.";
        }

        if (payment?.scenario === "REPEATED_FAILURE") {
            return "Automatic recovery was stopped because this payment has already failed repeatedly and another automatic attempt is not considered safe.";
        }

        return "The AI recommendation did not meet the system's safety rules, so the requested automatic action was not allowed.";
    }

    switch (action) {
        case "RETRY_PAYMENT":
            return "The retry is allowed because this payment is still eligible for another automatic attempt.";

        case "CREATE_PAYMENT_LINK":
            return "The payment link is allowed because it gives the customer another way to complete the payment without repeatedly charging the declined payment method.";

        case "ESCALATE_TO_HUMAN":
            return "The payment is being sent for human review instead of continuing automatic recovery.";

        case "STOP_RECOVERY":
            return "The system confirmed that no further automatic recovery should be attempted.";

        default:
            return "The selected recovery action passed the system's safety controls.";
    }
};

export const PolicyDecision = ({
    policyDecision,
    payment = {}
}) => {
    if (!policyDecision) {
        return null;
    }

    const isAllowed =
        policyDecision.allowed !== false &&
        policyDecision.status !== "BLOCKED";

    const finalAction =
        policyDecision.finalAction ||
        policyDecision.actionExecuted;

    const explanation =
        policyDecision.userExplanation ||
        policyDecision.reason ||
        getPolicyExplanation({
            allowed: isAllowed,
            action: finalAction,
            payment
        });

    return (
        <div className={`
            glass-panel
            p-6
            rounded-2xl
            border
            ${
                isAllowed
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : "border-rose-500/30 bg-rose-950/10"
            }
        `}>

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
                            isAllowed
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        }
                    `}>
                        {isAllowed ? (
                            <ShieldCheck className="w-5 h-5" />
                        ) : (
                            <ShieldAlert className="w-5 h-5" />
                        )}
                    </div>

                    <div>
                        <h4 className="
                            text-base
                            font-bold
                            text-slate-100
                        ">
                            Recovery Safety Check
                        </h4>

                        <p className="
                            text-[11px]
                            text-slate-400
                            mt-0.5
                        ">
                            The system checked whether the AI decision was safe to execute
                        </p>
                    </div>
                </div>

                <div className={`
                    self-start
                    sm:self-auto
                    px-3
                    py-1.5
                    rounded-full
                    text-xs
                    font-extrabold
                    tracking-wider
                    border
                    flex
                    items-center
                    gap-1.5
                    ${
                        isAllowed
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/80"
                            : "bg-rose-950/60 text-rose-400 border-rose-800/80"
                    }
                `}>
                    {isAllowed ? (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>APPROVED</span>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>BLOCKED</span>
                        </>
                    )}
                </div>
            </div>

            {finalAction && (
                <div className="
                    mb-4
                    p-3
                    rounded-xl
                    bg-slate-900/70
                    border border-slate-800
                    flex
                    flex-col
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    gap-2
                ">
                    <span className="text-xs text-slate-400">
                        Action allowed by the system
                    </span>

                    <span className="
                        text-sm
                        font-semibold
                        text-slate-200
                    ">
                        {formatRecoveryAction(finalAction)}
                    </span>
                </div>
            )}

            <div>
                <span className="
                    text-xs
                    font-semibold
                    text-slate-300
                    block
                    mb-2
                ">
                    What this means
                </span>

                <p className="
                    text-sm
                    text-slate-400
                    leading-relaxed
                ">
                    {explanation}
                </p>
            </div>
        </div>
    );
};

export default PolicyDecision;