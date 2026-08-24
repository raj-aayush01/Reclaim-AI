const crypto = require("crypto");

const executeRecoveryAction = async (payment, action) => {

    // Store the action that was actually executed
    payment.recoveryAction = action;

    switch (action) {

        case "RETRY_PAYMENT": {
            // Simulate a payment retry.
            // For our demo, 80% of retries succeed.
            const retrySuccessful = Math.random() < 0.8;

            payment.attemptCount += 1;

            if (retrySuccessful) {
                payment.status = "recovered";
                payment.recoveredAmount = payment.amount;
                payment.recoveryResult = "RECOVERED";

                return {
                    success: true,
                    result: "RECOVERED",
                    recoveredAmount: payment.amount
                };
            }

            payment.status = "failed";
            payment.recoveryResult = "FAILED";

            return {
                success: false,
                result: "FAILED",
                recoveredAmount: 0
            };
        }

        case "CREATE_PAYMENT_LINK": {
            const paymentLinkId = `pl_${crypto.randomUUID()}`;

            payment.paymentLinkId = paymentLinkId;

            payment.paymentLinkUrl =
                `https://reclaimai.demo/pay/${paymentLinkId}`;

            payment.status = "pending";
            payment.recoveryResult = "PENDING";

            return {
                success: true,
                result: "PENDING",
                paymentLinkId,
                paymentLinkUrl: payment.paymentLinkUrl
            };
        }

        case "ESCALATE_TO_HUMAN": {
            payment.status = "escalated";
            payment.recoveryResult = "ESCALATED";

            return {
                success: true,
                result: "ESCALATED"
            };
        }

        case "STOP_RECOVERY": {
            payment.status = "stopped";
            payment.recoveryResult = "STOPPED";

            return {
                success: true,
                result: "STOPPED"
            };
        }

        default:
            throw new Error(`Unknown recovery action: ${action}`);
    }
};

module.exports = {
    executeRecoveryAction
};