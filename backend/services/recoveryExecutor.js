const {
    processPaymentRetry,
    createPaymentLink
} = require("./paymentGatewaySimulator");

const MAX_RECOVERY_ATTEMPTS = 3;

const TERMINAL_PAYMENT_STATUSES = new Set([
    "recovered",
    "escalated",
    "stopped"
]);

/* attemptCount represents ONLY actual payment retry attempts.
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


/* Execute exactly ONE recovery action.
 *
 * This function intentionally performs only one retry when
 * RETRY_PAYMENT is requested.
 *
 * The higher-level recovery flow decides whether additional
 * permitted retries should be attempted.
 */

const executeRecoveryAction = async (
    payment,
    action
) => {

    if (
        TERMINAL_PAYMENT_STATUSES.has(
            payment.status
        )
    ) {
        return {
            success: false,
            result: "BLOCKED",
            recoveredAmount: 0,
            blocked: true,
            terminal: true,
            actionExecuted: null,
            message:
                "Recovery action was blocked because the payment is already in a terminal state."
        };
    }

    if (
        payment.status === "pending"
    ) {
        return {
            success: false,
            result: "BLOCKED",
            recoveredAmount: 0,
            blocked: true,
            terminal: false,
            actionExecuted: null,
            message:
                "Recovery action was blocked because the payment is awaiting completion of its payment link."
        };
    }

    payment.recoveryAction = action;

    switch (action) {

        // =====================================================
        // RETRY PAYMENT
        // =====================================================

        case "RETRY_PAYMENT": {

            const currentAttemptCount =
                Number(payment.attemptCount) || 0;

            // Retry is the ONLY action that consumes attemptCount.

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


/* Execute all remaining permitted retry attempts.
 *
 * The caller must already have validated that RETRY_PAYMENT
 * is an allowed recovery action.
 */

const executeRecoveryRetryLoop = async (
    payment,
    {
        confidence = null,
        reason = null
    } = {}
) => {

    /*
     * Do not start or alter a retry loop for a payment that
     * has already reached a terminal or pending state.
     */

    if (
        TERMINAL_PAYMENT_STATUSES.has(
            payment.status
        ) ||
        payment.status === "pending"
    ) {
        const blockedResult =
            await executeRecoveryAction(
                payment,
                "RETRY_PAYMENT"
            );

        return {
            success: false,
            result: "BLOCKED",
            actionExecuted: null,
            attemptsMade:
                Number(payment.attemptCount) || 0,
            maxAttempts:
                MAX_RECOVERY_ATTEMPTS,
            attemptsRemaining:
                Math.max(
                    0,
                    MAX_RECOVERY_ATTEMPTS -
                    (
                        Number(payment.attemptCount) || 0
                    )
                ),
            recoveredAmount: 0,
            attempts: [],
            executionResult:
                blockedResult,
            blocked: true,
            terminal:
                blockedResult.terminal || false,
            confidence,
            reason:
                blockedResult.message
        };
    }

    const existingAttemptCount =
        Math.max(
            0,
            Number(payment.attemptCount) || 0
        );

    const remainingAttempts =
        Math.max(
            0,
            MAX_RECOVERY_ATTEMPTS -
            existingAttemptCount
        );

    // No retry attempts remain.

    if (remainingAttempts === 0) {

        const stopResult =
            await executeRecoveryAction(
                payment,
                "STOP_RECOVERY"
            );

        return {
            success: false,
            result:
                stopResult.result,
            actionExecuted:
                stopResult.actionExecuted ||
                null,
            attemptsMade:
                Number(payment.attemptCount) || 0,
            maxAttempts:
                MAX_RECOVERY_ATTEMPTS,
            attemptsRemaining: 0,
            recoveredAmount: 0,
            attempts: [],
            executionResult:
                stopResult,
            blocked:
                stopResult.blocked || false,
            terminal:
                stopResult.terminal || false,
            confidence,
            reason:
                reason ||
                stopResult.message ||
                `Recovery stopped because the maximum of ${MAX_RECOVERY_ATTEMPTS} payment retry attempts has been reached.`
        };
    }

    const attempts = [];

    // Use every retry attempt that is still permitted,
    // stopping immediately if payment recovery succeeds.

    for (
        let attemptIndex = 1;
        attemptIndex <= remainingAttempts;
        attemptIndex++
    ) {

        const previousAttempts =
            Number(payment.attemptCount) || 0;

        const attemptNumber =
            previousAttempts + 1;

        const actionResult =
            await executeRecoveryAction(
                payment,
                "RETRY_PAYMENT"
            );

        attempts.push({
            attemptNumber,
            maxAttempts:
                MAX_RECOVERY_ATTEMPTS,
            previousAttempts,
            attemptsRemaining:
                Math.max(
                    0,
                    MAX_RECOVERY_ATTEMPTS -
                    (
                        Number(payment.attemptCount) || 0
                    )
                ),
            success:
                actionResult.success,
            result:
                actionResult.result ||
                null,
            recoveredAmount:
                actionResult.recoveredAmount ||
                0,
            transactionId:
                actionResult.transactionId ||
                null,
            gatewayStatus:
                actionResult.gatewayStatus ||
                null,
            message:
                actionResult.message ||
                null
        });

        /*
         * If execution was blocked, return immediately.
         * Do not convert a blocked payment into STOPPED.
         */

        if (
            actionResult.blocked
        ) {
            return {
                success: false,
                result:
                    actionResult.result ||
                    "BLOCKED",
                actionExecuted:
                    actionResult.actionExecuted ||
                    null,
                attemptsMade:
                    Number(payment.attemptCount) ||
                    previousAttempts,
                maxAttempts:
                    MAX_RECOVERY_ATTEMPTS,
                attemptsRemaining:
                    Math.max(
                        0,
                        MAX_RECOVERY_ATTEMPTS -
                        (
                            Number(payment.attemptCount) ||
                            previousAttempts
                        )
                    ),
                recoveredAmount: 0,
                attempts,
                executionResult:
                    actionResult,
                blocked: true,
                terminal:
                    actionResult.terminal ||
                    false,
                confidence,
                reason:
                    actionResult.message ||
                    reason
            };
        }

        // Recovery succeeded. Do not perform another retry.

        if (
            actionResult.result ===
            "RECOVERED"
        ) {

            return {
                success: true,
                result: "RECOVERED",
                actionExecuted:
                    "RETRY_PAYMENT",
                attemptsMade:
                    Number(payment.attemptCount) ||
                    attemptNumber,
                maxAttempts:
                    MAX_RECOVERY_ATTEMPTS,
                attemptsRemaining:
                    Math.max(
                        0,
                        MAX_RECOVERY_ATTEMPTS -
                        (
                            Number(payment.attemptCount) ||
                            attemptNumber
                        )
                    ),
                recoveredAmount:
                    actionResult.recoveredAmount ||
                    0,
                attempts,
                executionResult:
                    actionResult,
                confidence,
                reason
            };
        }

        // If this was the final permitted retry, stop automated recovery.

        if (
            attemptIndex ===
            remainingAttempts
        ) {

            const stopReason =
                `Recovery stopped after ${Number(payment.attemptCount) || attemptNumber} unsuccessful payment retries.`;

            const stopResult =
                await executeRecoveryAction(
                    payment,
                    "STOP_RECOVERY"
                );

            return {
                success:
                    stopResult.success,
                result:
                    stopResult.result,
                actionExecuted:
                    stopResult.actionExecuted ||
                    "STOP_RECOVERY",
                attemptsMade:
                    Number(payment.attemptCount) ||
                    attemptNumber,
                maxAttempts:
                    MAX_RECOVERY_ATTEMPTS,
                attemptsRemaining: 0,
                recoveredAmount: 0,
                attempts,
                executionResult:
                    stopResult,
                blocked:
                    stopResult.blocked || false,
                terminal:
                    stopResult.terminal || false,
                confidence,
                reason:
                    stopResult.message ||
                    stopReason
            };
        }
    }

    // Defensive fallback.

    throw new Error(
        "Recovery retry loop completed without a terminal result."
    );
};


module.exports = {
    MAX_RECOVERY_ATTEMPTS,
    executeRecoveryAction,
    executeRecoveryRetryLoop
};