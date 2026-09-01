import React from "react";
import {
    Sparkles,
    Brain,
    User,
    AlertTriangle,
    ArrowRight,
    Target
} from "lucide-react";

import { formatRecoveryAction } from "../../utils/statusHelpers";
import { formatCurrency } from "../../utils/formatCurrency";


const getActionExplanation = (action) => {

    switch (action) {

        case "RETRY_PAYMENT":
            return {
                title: "Try the payment again",
                explanation:
                    "The failure appears temporary, so the AI recommended another payment attempt rather than asking the customer to take action.",
                next:
                    "The system can make another payment attempt. If it succeeds, the payment is recovered. If it fails, the remaining recovery options are evaluated."
            };

        case "CREATE_PAYMENT_LINK":
            return {
                title: "Offer another way to pay",
                explanation:
                    "The original payment method appears unsuitable for another attempt, so the AI recommended giving the customer an alternative payment route.",
                next:
                    "A payment link can be created so the customer can complete the payment using the alternative route."
            };

        case "ESCALATE_TO_HUMAN":
            return {
                title: "Send the payment for human review",
                explanation:
                    "The AI determined that automatic recovery should not continue without human involvement.",
                next:
                    "No additional automatic payment attempt is made. The payment is moved to a human-review workflow."
            };

        case "STOP_RECOVERY":
            return {
                title: "Stop automatic recovery",
                explanation:
                    "The AI determined that no further automatic recovery should be attempted.",
                next:
                    "The system will stop automated recovery and leave the payment for separate handling."
            };

        default:
            return {
                title: "Recovery strategy selected",
                explanation:
                    "The AI reviewed the payment and selected a recovery strategy from the available options.",
                next:
                    "The system will validate the recommendation before taking action."
            };
    }
};


const getFailureExplanation = (payment) => {

    switch (payment?.scenario) {

        case "TEMPORARY_FAILURE":
            return "This type of failure is usually associated with a temporary bank, network, or processing issue and may succeed when attempted again.";

        case "CARD_DECLINED":
            return "The payment method was declined, so repeatedly using the same method may not resolve the problem.";

        case "REPEATED_FAILURE":
            return "The payment has already experienced repeated failures, so the system applies stricter controls before allowing another automatic attempt.";

        case "HIGH_VALUE_FAILURE":
            return "This is a high-value payment, so additional safety controls are applied before automatic recovery is allowed.";

        case "UNKNOWN_FAILURE":
            return "The failure could not be confidently classified, so the system avoids making an unsafe assumption about how to recover it.";

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


    const numericConfidence =
        Number(confidence) || 0;


    const confidencePercent =
        Math.min(
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


    const actionInfo =
        getActionExplanation(action);


    const customerName =
        customer?.name ||
        payment?.customerName ||
        "The customer";


    const amount =
        payment?.amount !== undefined
            ? formatCurrency(payment.amount)
            : null;


    const failureExplanation =
        getFailureExplanation(payment);


    return (
        <div className="panel panel-accent-primary recovery-card">

            {/* =====================================================
                HEADER
            ===================================================== */}

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
                            What AI Recommended

                            <Sparkles
                                size={16}
                                style={{
                                    color: "var(--warn)"
                                }}
                            />
                        </h4>

                        <p className="recovery-card-subtitle">
                            The recommendation made after reviewing the payment
                        </p>

                    </div>

                </div>


                <div
                    style={{
                        textAlign: "right"
                    }}
                >

                    <span className="meta-label">
                        AI Confidence
                    </span>

                    <span
                        style={{
                            display: "block",
                            fontSize: "1.125rem",
                            fontWeight: 800,
                            color: "var(--primary)",
                            fontFamily:
                                "'JetBrains Mono', monospace"
                        }}
                    >
                        {confidencePercent}%
                    </span>

                </div>

            </div>


            {/* =====================================================
                WHAT HAPPENED
            ===================================================== */}

            <div
                className="sub-card"
                style={{
                    marginBottom: "1rem"
                }}
            >

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.625rem"
                    }}
                >

                    <User
                        size={14}
                        style={{
                            color: "var(--mute)"
                        }}
                    />

                    <span className="meta-label">
                        What happened
                    </span>

                </div>


                <p
                    className="recovery-card-body-text"
                    style={{
                        color: "var(--ink)"
                    }}
                >
                    {summary ||
                        `${customerName}${
                            amount
                                ? ` attempted a ${amount}`
                                : " attempted a"
                        } payment, but it could not be completed.`}
                </p>


                <p
                    className="recovery-card-body-text"
                    style={{
                        marginTop: "0.5rem"
                    }}
                >
                    {failureExplanation}
                </p>

            </div>


            {/* =====================================================
                AI RECOMMENDATION
            ===================================================== */}

            <div
                className="recovery-card-highlight"
                style={{
                    marginBottom: "1.25rem"
                }}
            >

                <span
                    className="eyebrow-primary"
                    style={{
                        display: "block",
                        marginBottom: "0.5rem"
                    }}
                >
                    Recommended next step
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
                                display: "block",
                                fontSize: "1.125rem",
                                fontWeight: 700,
                                color: "var(--ink)"
                            }}
                        >
                            {formatRecoveryAction(action)}
                        </span>


                        <span
                            style={{
                                display: "block",
                                fontSize: "0.75rem",
                                color: "var(--primary)",
                                marginTop: "0.25rem"
                            }}
                        >
                            {actionInfo.title}
                        </span>

                    </div>


                    <ArrowRight
                        size={18}
                        style={{
                            color: "var(--primary)"
                        }}
                    />

                </div>

            </div>


            {/* =====================================================
                WHY
            ===================================================== */}

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem"
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

                        <Target
                            size={14}
                            style={{
                                color: "var(--primary)"
                            }}
                        />

                        <span className="meta-label">
                            Why AI chose this
                        </span>

                    </div>


                    <p className="recovery-card-body-text">
                        {whyThisDecision ||
                            reason ||
                            actionInfo.explanation}
                    </p>

                </div>


                <div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.5rem"
                        }}
                    >

                        <ArrowRight
                            size={14}
                            style={{
                                color: "var(--mute)"
                            }}
                        />

                        <span className="meta-label">
                            What would happen next
                        </span>

                    </div>


                    <p className="recovery-card-body-text">
                        {whatHappensNext ||
                            actionInfo.next}
                    </p>

                </div>

            </div>


            {/* =====================================================
                IMPORTANT DISTINCTION
            ===================================================== */}

            <div
                style={{
                    marginTop: "1.25rem",
                    paddingTop: "1rem",
                    borderTop:
                        "1px solid var(--line)",
                    fontSize: "0.75rem",
                    color: "var(--mute)"
                }}
            >
                <strong
                    style={{
                        color: "var(--ink)"
                    }}
                >
                    Important:
                </strong>{" "}
                This is the AI recommendation. The system's safety checks
                still determine whether this recommendation can actually be executed.
            </div>

        </div>
    );
};


export default AIDecisionCard;