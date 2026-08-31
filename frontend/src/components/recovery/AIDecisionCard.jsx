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
            return (
                payment?.failureReason ||
                "The payment could not be completed successfully."
            );
    }
};

export const AIDecisionCard = ({
    aiDecision,
    payment = {},
    customer = {}
}) => {
    if (!aiDecision) return null;

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
        customer?.name || payment?.customerName || "The customer";

    const amount =
        payment?.amount !== undefined
            ? formatCurrency(payment.amount)
            : null;

    const failureExplanation = getFailureExplanation(payment);

    return (
        <div className="panel panel-accent-primary recovery-card">
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginBottom: "1.5rem"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem"
                    }}
                >
                    <div className="icon-box icon-box-md icon-box-primary">
                        <Brain size={18} />
                    </div>

                    <div>
                        <h4
                            className="recovery-card-title"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem"
                            }}
                        >
                            AI Recovery Decision
                            <Sparkles
                                size={16}
                                style={{ color: "var(--warn)" }}
                            />
                        </h4>

                        <p className="recovery-card-subtitle">
                            Why the AI chose this recovery strategy
                        </p>
                    </div>
                </div>

                <div style={{ textAlign: "right" }}>
                    <span className="meta-label">AI Confidence</span>

                    <span
                        style={{
                            display: "block",
                            fontSize: "1.125rem",
                            fontWeight: 800,
                            color: "var(--primary)",
                            fontFamily: "'JetBrains Mono', monospace"
                        }}
                    >
                        {confidencePercent}%
                    </span>
                </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.5rem"
                    }}
                >
                    <User
                        size={14}
                        style={{ color: "var(--mute)" }}
                    />

                    <span
                        style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--ink)"
                        }}
                    >
                        What happened
                    </span>
                </div>

                <p
                    className="recovery-card-body-text"
                    style={{ color: "var(--ink)" }}
                >
                    {summary ||
                        `${customerName}${
                            amount
                                ? ` attempted a ${amount}`
                                : " attempted a"
                        } payment, but the payment could not be completed.`}
                </p>

                <p
                    className="recovery-card-body-text"
                    style={{ marginTop: "0.5rem" }}
                >
                    {failureExplanation}
                </p>
            </div>

            <div className="recovery-card-highlight">
                <span
                    className="eyebrow-primary"
                    style={{
                        display: "block",
                        marginBottom: "0.5rem"
                    }}
                >
                    AI Decision
                </span>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem"
                    }}
                >
                    <div>
                        <span
                            style={{
                                fontSize: "1.125rem",
                                fontWeight: 700,
                                color: "var(--ink)"
                            }}
                        >
                            {formatRecoveryAction(action)}
                        </span>

                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--primary)",
                                marginTop: "0.25rem"
                            }}
                        >
                            {actionInfo.title}
                        </p>
                    </div>

                    <ArrowRight
                        size={18}
                        style={{
                            color: "var(--primary)",
                            display: "none"
                        }}
                        className="sm-show"
                    />
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem"
                }}
            >
                <div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.5rem"
                        }}
                    >
                        <AlertTriangle
                            size={14}
                            style={{ color: "var(--warn)" }}
                        />

                        <span
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--ink)"
                            }}
                        >
                            Why this decision?
                        </span>
                    </div>

                    <p className="recovery-card-body-text">
                        {whyThisDecision ||
                            reason ||
                            actionInfo.explanation}
                    </p>
                </div>

                <div>
                    <span
                        style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--ink)",
                            display: "block",
                            marginBottom: "0.5rem"
                        }}
                    >
                        What happens next?
                    </span>

                    <p className="recovery-card-body-text">
                        {whatHappensNext || actionInfo.next}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIDecisionCard;