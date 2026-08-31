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
        <div
            className={`panel recovery-card ${
                isAllowed ? "panel-accent-up" : "panel-accent-down"
            }`}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    marginBottom: "1.25rem"
                }}
                className="sm:flex-row sm:items-center sm:justify-between"
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                        className={`icon-box icon-box-md ${
                            isAllowed ? "icon-box-up" : "icon-box-down"
                        }`}
                    >
                        {isAllowed ? (
                            <ShieldCheck style={{ width: "1.25rem", height: "1.25rem" }} />
                        ) : (
                            <ShieldAlert style={{ width: "1.25rem", height: "1.25rem" }} />
                        )}
                    </div>

                    <div>
                        <h4 className="recovery-card-title">
                            Recovery Safety Check
                        </h4>

                        <p className="recovery-card-subtitle">
                            The system checked whether the AI decision was safe to execute
                        </p>
                    </div>
                </div>

                <div
                    className={`count-pill self-start sm:self-auto ${
                        isAllowed ? "count-pill-up" : "count-pill-down"
                    }`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
                >
                    {isAllowed ? (
                        <>
                            <CheckCircle2 style={{ width: "0.875rem", height: "0.875rem" }} />
                            <span>APPROVED</span>
                        </>
                    ) : (
                        <>
                            <XCircle style={{ width: "0.875rem", height: "0.875rem" }} />
                            <span>BLOCKED</span>
                        </>
                    )}
                </div>
            </div>

            {finalAction && (
                <div
                    className="sub-card"
                    style={{
                        marginBottom: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem"
                    }}
                >
                    <span style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
                        Action allowed by the system
                    </span>

                    <span
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "var(--ink)"
                        }}
                    >
                        {formatRecoveryAction(finalAction)}
                    </span>
                </div>
            )}

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
                    What this means
                </span>

                <p className="recovery-card-body-text">
                    {explanation}
                </p>
            </div>
        </div>
    );
};

export default PolicyDecision;
