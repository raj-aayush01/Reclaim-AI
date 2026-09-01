const {
    processPaymentRetry,
    createPaymentLink
} = require("./paymentGatewaySimulator");

const MAX_RECOVERY_ATTEMPTS = 3;

/*
 * attemptCount represents ONLY actual payment retry attempts.
 *
 * RETRY_PAYMENT          -> consumes one attempt
 * CREATE_PAYMENT_LINK    -> does not consume an attempt
 * ESCALATE_TO_HUMAN      -> does not consume an attempt
 * STOP_RECOVERY          -> does not consume an attempt
 */
const incrementRetryAttempt = (payment) => {
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

        // =====================================================
        // RETRY PAYMENT
        // =====================================================

        case "RETRY_PAYMENT": {

            const currentAttemptCount =
                Number(payment.attemptCount) || 0;

            /*
             * Retry is the ONLY action that consumes
             * attemptCount.
             *
             * Once 3 actual retries have already happened,
             * another retry is not allowed.
             */
            if (
                currentAttemptCount >=
                MAX_RECOVERY_ATTEMPTS
            ) {

                payment.recoveryAction =
                    "STOP_RECOVERY";

                payment.status =
                    "stopped";

                payment.recoveryResult =
                    "STOPPED";

                return {
                    success: false,
                    result: "STOPPED",
                    recoveredAmount: 0,
                    blocked: true,
                    actionExecuted:
                        "STOP_RECOVERY",
                    message:
                        `Recovery stopped because the maximum of ${MAX_RECOVERY_ATTEMPTS} payment retry attempts has been reached.`
                };
            }

            /*
             * Count the actual retry.
             */
            incrementRetryAttempt(payment);

            const gatewayResult =
                await processPaymentRetry(payment);

            // -------------------------------------------------
            // Retry succeeded
            // -------------------------------------------------

            if (gatewayResult.success) {

                payment.status =
                    "recovered";

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

            // -------------------------------------------------
            // Retry failed
            // -------------------------------------------------

            payment.status =
                "failed";

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

        // =====================================================
        // CREATE PAYMENT LINK
        // =====================================================

        case "CREATE_PAYMENT_LINK": {

            /*
             * Creating a payment link is NOT a payment retry.
             *
             * Therefore:
             *
             * attemptCount stays unchanged.
             *
             * Even if attemptCount is already 3, creating a
             * payment link can still be allowed by the policy.
             */

            const gatewayResult =
                await createPaymentLink(payment);

            payment.paymentLinkId =
                gatewayResult.paymentLinkId;

            payment.paymentLinkUrl =
                gatewayResult.paymentLinkUrl;

            payment.status =
                "pending";

            payment.recoveryResult =
                "PENDING";

            return {
                success: true,
                result: "PENDING",
                recoveredAmount: 0,
                paymentLinkId:
                    gatewayResult.paymentLinkId,
                paymentLinkUrl:
                    gatewayResult.paymentLinkUrl,
                message:
                    gatewayResult.message
            };
        }

        // =====================================================
        // ESCALATE TO HUMAN
        // =====================================================

        case "ESCALATE_TO_HUMAN": {

            /*
             * Escalation is not a payment retry.
             *
             * Therefore attemptCount remains unchanged.
             */

            payment.status =
                "escalated";

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

        // =====================================================
        // STOP RECOVERY
        // =====================================================

        case "STOP_RECOVERY": {

            /*
             * Stopping recovery does not consume
             * another payment retry attempt.
             */

            payment.status =
                "stopped";

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

        // =====================================================
        // UNKNOWN ACTION
        // =====================================================

        default:
            throw new Error(
                `Unknown recovery action: ${action}`
            );
    }
};

module.exports = {
    executeRecoveryAction
};