import React from "react";
import {
    Sparkles,
    Brain,
    User,
    AlertTriangle,
    ArrowRight
} from "lucide-react";

import { formatRecoveryAction } from "../../utils/statusHelpers";
import { formatCurrency } from "../../utils/formatCurrency";

const getActionExplanation = (action) => {
    switch (action) {
        case "RETRY_PAYMENT":
            return {
                title: "Try the payment again",
                explanation:
                    "The failure looks temporary, so the system chose another payment attempt instead of asking the customer to do anything.",
                next:
                    "If the new attempt succeeds, the payment is recovered. If it fails, the payment remains unrecovered and can move to the next permitted recovery path."
            };

        case "CREATE_PAYMENT_LINK":
            return {
                title: "Give the customer another way to pay",
                explanation:
                    "The original payment method was declined, so retrying the same method may not help. The system chose an alternative payment route.",
                next:
                    "A payment link is created and the payment waits for the customer to complete it."
            };

        case "ESCALATE_TO_HUMAN":
            return {
                title: "Send the payment for human review",
                explanation:
                    "The payment requires additional review before another automatic recovery attempt is appropriate.",
                next:
                    "No automatic charge is made. The payment is moved into a human-review state."
            };

        case "STOP_RECOVERY":
            return {
                title: "Stop further automatic recovery",
                explanation:
                    "The payment has reached a point where continuing automatic recovery is no longer considered safe or useful.",
                next:
                    "No further automatic attempt will be made. The payment remains unrecovered unless handled separately."
            };

        default:
            return {
                title: "Recovery strategy selected",
                explanation:
                    "The payment was reviewed and a recovery strategy was selected from the available recovery options.",
                next:
                    "The final result depends on the action performed by the recovery system."
            };
    }
};

const getFailureExplanation = (payment) => {
    switch (payment?.scenario) {
        case "TEMPORARY_FAILURE":
            return "The payment failed because of a temporary issue. These failures can sometimes succeed when attempted again.";

        case "CARD_DECLINED":
            return "The customer's payment method was declined. Trying the same method again may therefore not solve the problem.";

        case "REPEATED_FAILURE":
            return "This payment has already failed multiple times. The system therefore has to be more cautious about attempting another automatic recovery.";

        case "HIGH_VALUE_FAILURE":
            return "This is a high-value payment, so the system applies stricter controls before allowing automatic recovery.";

        case "UNKNOWN_FAILURE":
            return "The reason for the failure could not be confidently classified, so the system avoids making an unsafe assumption.";

        default:
            return payment?.failureReason ||
                "The payment could not be completed successfully.";
    }
};

export const AIDecisionCard = ({
    aiDecision,
    payment = {},
    customer = {}
}) => {
    if (!aiDecision) {
        return null;
    }

    const {
        action,
        confidence = 0,
        reason,
        summary,
        whyThisDecision,
        whatHappensNext
    } = aiDecision;

    const numericConfidence = Number(confidence) || 0;

    const confidencePercent = Math.min(
        Math.max(
            Math.round(
                numericConfidence <= 1
                    ? numericConfidence * 100
                    : numericConfidence
            ),
            0
        ),
        100
    );

    const actionInfo = getActionExplanation(action);

    const customerName =
        customer?.name ||
        payment?.customerName ||
        "The customer";

    const amount =
        payment?.amount !== undefined
            ? formatCurrency(payment.amount)
            : null;

    const failureExplanation = getFailureExplanation(payment);

    return (
        <div className="
            glass-panel
            rounded-2xl
            border border-indigo-500/30
            bg-gradient-to-br
            from-slate-900/95
            via-slate-900/80
            to-indigo-950/20
            p-6
        ">

            {/* Header */}
            <div className="
                flex
                flex-col
                sm:flex-row
                sm:items-start
                sm:justify-between
                gap-4
                mb-6
            ">

                <div className="flex items-start gap-3">
                    <div className="
                        p-2.5
                        rounded-xl
                        bg-indigo-500/20
                        text-indigo-400
                        border border-indigo-500/30
                    ">
                        <Brain className="w-5 h-5" />
                    </div>

                    <div>
                        <h4 className="
                            text-base
                            font-bold
                            text-slate-100
                            flex
                            items-center
                            gap-1.5
                        ">
                            AI Recovery Decision
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </h4>

                        <p className="
                            text-[11px]
                            text-slate-400
                            mt-0.5
                        ">
                            Why the AI chose this recovery strategy
                        </p>
                    </div>
                </div>

                <div className="sm:text-right">
                    <span className="
                        text-[10px]
                        uppercase
                        tracking-wider
                        text-slate-500
                        block
                    ">
                        AI Confidence
                    </span>

                    <span className="
                        text-lg
                        font-extrabold
                        text-indigo-300
                    ">
                        {confidencePercent}%
                    </span>
                </div>
            </div>

            {/* What happened */}
            <div className="mb-6">

                <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-slate-500" />

                    <span className="
                        text-xs
                        font-semibold
                        text-slate-300
                    ">
                        What happened
                    </span>
                </div>

                <p className="
                    text-sm
                    text-slate-300
                    leading-relaxed
                ">
                    {summary ||
                        `${customerName}${
                            amount
                                ? ` attempted a ${amount}`
                                : " attempted a"
                        } payment, but the payment could not be completed.`}
                </p>

                <p className="
                    text-sm
                    text-slate-400
                    leading-relaxed
                    mt-2
                ">
                    {failureExplanation}
                </p>
            </div>

            {/* Decision */}
            <div className="
                p-4
                rounded-xl
                bg-indigo-950/40
                border border-indigo-800/60
                mb-6
            ">
                <span className="
                    text-[10px]
                    uppercase
                    font-bold
                    tracking-wider
                    text-indigo-400
                    block
                    mb-2
                ">
                    AI Decision
                </span>

                <div className="
                    flex
                    flex-col
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    gap-3
                ">

                    <div>
                        <span className="
                            text-lg
                            font-bold
                            text-slate-100
                        ">
                            {formatRecoveryAction(action)}
                        </span>

                        <p className="
                            text-xs
                            text-indigo-200/70
                            mt-1
                        ">
                            {actionInfo.title}
                        </p>
                    </div>

                    <ArrowRight className="
                        hidden
                        sm:block
                        w-5
                        h-5
                        text-indigo-400
                    " />
                </div>
            </div>

            {/* Why */}
            <div className="space-y-5">

                <div>
                    <div className="
                        flex
                        items-center
                        gap-2
                        mb-2
                    ">
                        <AlertTriangle className="
                            w-4
                            h-4
                            text-amber-400
                        " />

                        <span className="
                            text-xs
                            font-semibold
                            text-slate-300
                        ">
                            Why this decision?
                        </span>
                    </div>

                    <p className="
                        text-sm
                        text-slate-400
                        leading-relaxed
                    ">
                        {whyThisDecision ||
                            reason ||
                            actionInfo.explanation}
                    </p>
                </div>

                <div>
                    <span className="
                        text-xs
                        font-semibold
                        text-slate-300
                        block
                        mb-2
                    ">
                        What happens next?
                    </span>

                    <p className="
                        text-sm
                        text-slate-400
                        leading-relaxed
                    ">
                        {whatHappensNext ||
                            actionInfo.next}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIDecisionCard;