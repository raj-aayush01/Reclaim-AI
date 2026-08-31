const {
    processPaymentRetry,
    createPaymentLink
} = require("./paymentGatewaySimulator");

const MAX_RECOVERY_ATTEMPTS = 3;

/*
 * Count one automated recovery action.
 *
 * RETRY_PAYMENT, CREATE_PAYMENT_LINK and ESCALATE_TO_HUMAN
 * each consume one recovery attempt.
 *
 * STOP_RECOVERY does not consume an attempt.
 */
const incrementRecoveryAttempt = (payment) => {
    const currentCount =
        Number(payment.attemptCount) || 0;

    payment.attemptCount = Math.min(
        currentCount + 1,
        MAX_RECOVERY_ATTEMPTS
    );
};

const executeRecoveryAction = async (
    payment,
    action
) => {

    payment.recoveryAction = action;

    switch (action) {

        case "RETRY_PAYMENT": {

            const currentAttemptCount =
                Number(payment.attemptCount) || 0;

            if (
                currentAttemptCount >=
                MAX_RECOVERY_ATTEMPTS
            ) {

                payment.status = "stopped";
                payment.recoveryResult =
                    "STOPPED";

                return {
                    success: false,
                    result: "STOPPED",
                    recoveredAmount: 0,
                    blocked: true,
                    actionExecuted: "STOP_RECOVERY",
                    message:
                        `Recovery stopped because the maximum of ${MAX_RECOVERY_ATTEMPTS} automated recovery attempts has been reached.`
                };
            }

            incrementRecoveryAttempt(payment);

            const gatewayResult =
                await processPaymentRetry(payment);

            if (gatewayResult.success) {

                payment.status = "recovered";

                payment.recoveredAmount =
                    payment.amount;

                payment.recoveryResult =
                    "RECOVERED";

                return {
                    success: true,
                    result: "RECOVERED",
                    recoveredAmount:
                        payment.amount,
                    transactionId:
                        gatewayResult.transactionId,
                    gatewayStatus:
                        gatewayResult.status,
                    message:
                        gatewayResult.message
                };
            }

            payment.status = "failed";

            payment.recoveryResult =
                "FAILED";

            return {
                success: false,
                result: "FAILED",
                recoveredAmount: 0,
                transactionId:
                    gatewayResult.transactionId,
                gatewayStatus:
                    gatewayResult.status,
                message:
                    gatewayResult.message
            };
        }

        case "CREATE_PAYMENT_LINK": {

            const currentAttemptCount =
                Number(payment.attemptCount) || 0;

            if (
                currentAttemptCount >=
                MAX_RECOVERY_ATTEMPTS
            ) {

                payment.status = "stopped";

                payment.recoveryResult =
                    "STOPPED";

                return {
                    success: false,
                    result: "STOPPED",
                    recoveredAmount: 0,
                    blocked: true,
                    actionExecuted: "STOP_RECOVERY",
                    message:
                        `Recovery stopped because the maximum of ${MAX_RECOVERY_ATTEMPTS} automated recovery attempts has been reached.`
                };
            }

            incrementRecoveryAttempt(payment);

            const gatewayResult =
                await createPaymentLink(payment);

            payment.paymentLinkId =
                gatewayResult.paymentLinkId;

            payment.paymentLinkUrl =
                gatewayResult.paymentLinkUrl;

            payment.status = "pending";

            payment.recoveryResult =
                "PENDING";

            return {
                success: true,
                result: "PENDING",
                paymentLinkId:
                    gatewayResult.paymentLinkId,
                paymentLinkUrl:
                    gatewayResult.paymentLinkUrl,
                message:
                    gatewayResult.message
            };
        }

        case "ESCALATE_TO_HUMAN": {

            const currentAttemptCount =
                Number(payment.attemptCount) || 0;

            if (
                currentAttemptCount >=
                MAX_RECOVERY_ATTEMPTS
            ) {

                payment.status = "stopped";

                payment.recoveryResult =
                    "STOPPED";

                return {
                    success: false,
                    result: "STOPPED",
                    recoveredAmount: 0,
                    blocked: true,
                    actionExecuted: "STOP_RECOVERY",
                    message:
                        `Recovery stopped because the maximum of ${MAX_RECOVERY_ATTEMPTS} automated recovery attempts has been reached.`
                };
            }

            incrementRecoveryAttempt(payment);

            payment.status = "escalated";

            payment.recoveryResult =
                "ESCALATED";

            return {
                success: true,
                result: "ESCALATED",
                recoveredAmount: 0,
                message:
                    "The payment was sent for human review."
            };
        }

        case "STOP_RECOVERY": {

            /*
             * Stopping recovery does not consume
             * another recovery attempt.
             */
            payment.status = "stopped";

            payment.recoveryResult =
                "STOPPED";

            return {
                success: true,
                result: "STOPPED",
                recoveredAmount: 0,
                message:
                    "No further automated recovery will be attempted."
            };
        }

        default:
            throw new Error(
                `Unknown recovery action: ${action}`
            );
    }
};

module.exports = {
    executeRecoveryAction
};