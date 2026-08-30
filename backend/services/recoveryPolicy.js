const evaluateRecoveryPolicy = (payment, aiDecision = null) => {

    // Rule 1: Retry limit
    if (payment.attemptCount >= 3) {
        return {
            allowed: false,
            finalAction: "STOP_RECOVERY",
            reason: "Maximum retry attempts reached"
        };
    }

    // Rule 2: Payment must still be failed
    if (payment.status !== "failed") {
        return {
            allowed: false,
            finalAction: "STOP_RECOVERY",
            reason: "Payment is no longer in failed state"
        };
    }

    // Rule 3: High-value payments must be escalated
    if (payment.amount >= 20000) {
        return {
            allowed: true,
            finalAction: "ESCALATE_TO_HUMAN",
            reason: "High-value payment requires human approval"
        };
    }

    // Rule 4: Unknown failures must be escalated
    if (payment.scenario === "UNKNOWN_FAILURE") {
        return {
            allowed: true,
            finalAction: "ESCALATE_TO_HUMAN",
            reason: "Unknown failure requires human investigation"
        };
    }

    // If there is no AI decision, use the deterministic policy
    if (!aiDecision) {

        if (payment.scenario === "TEMPORARY_FAILURE") {
            return {
                allowed: true,
                finalAction: "RETRY_PAYMENT",
                reason: "Temporary failure with retry available"
            };
        }

        if (payment.scenario === "CARD_DECLINED") {
            return {
                allowed: true,
                finalAction: "CREATE_PAYMENT_LINK",
                reason: "Card declined; offer alternative payment method"
            };
        }

        return {
            allowed: false,
            finalAction: "ESCALATE_TO_HUMAN",
            reason: "No safe recovery strategy available"
        };
    }

    // Rule 5: AI confidence must be reasonable
    if (aiDecision.confidence < 0.70) {
        return {
            allowed: false,
            finalAction: "ESCALATE_TO_HUMAN",
            reason: "AI confidence is below the required threshold"
        };
    }

    // Rule 6: Validate AI's proposed action
    const allowedActions = [
        "RETRY_PAYMENT",
        "CREATE_PAYMENT_LINK",
        "ESCALATE_TO_HUMAN",
        "STOP_RECOVERY"
    ];

    if (!allowedActions.includes(aiDecision.action)) {
        return {
            allowed: false,
            finalAction: "ESCALATE_TO_HUMAN",
            reason: "AI proposed an invalid recovery action"
        };
    }

    // Rule 7: Retry is only allowed for temporary failures
    if (
        aiDecision.action === "RETRY_PAYMENT" &&
        payment.scenario !== "TEMPORARY_FAILURE"
    ) {
        return {
            allowed: false,
            finalAction: "ESCALATE_TO_HUMAN",
            reason: "Retry is not permitted for this failure type"
        };
    }

    // Rule 8: Payment link is appropriate for card declines
    if (
        aiDecision.action === "CREATE_PAYMENT_LINK" &&
        payment.scenario !== "CARD_DECLINED"
    ) {
        return {
            allowed: false,
            finalAction: "ESCALATE_TO_HUMAN",
            reason: "Payment link is not permitted for this failure type"
        };
    }

    // AI recommendation passed all guardrails
    return {
        allowed: true,
        finalAction: aiDecision.action,
        reason: "AI recommendation passed all recovery guardrails"
    };
};

module.exports = {
    evaluateRecoveryPolicy
};