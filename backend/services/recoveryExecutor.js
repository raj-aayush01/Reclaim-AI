const {
    processPaymentRetry,
    createPaymentLink
} = require("./paymentGatewaySimulator");

const executeRecoveryAction = async (payment, action) => {

    payment.recoveryAction = action;

    switch (action) {

        case "RETRY_PAYMENT": {

            payment.attemptCount += 1;

            const gatewayResult =
                await processPaymentRetry(payment);

            if (gatewayResult.success) {

                payment.status = "recovered";
                payment.recoveredAmount = payment.amount;
                payment.recoveryResult = "RECOVERED";

                return {
                    success: true,
                    result: "RECOVERED",
                    recoveredAmount: payment.amount,
                    transactionId:
                        gatewayResult.transactionId,
                    gatewayStatus:
                        gatewayResult.status,
                    message:
                        gatewayResult.message
                };
            }

            payment.status = "failed";
            payment.recoveryResult = "FAILED";

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

            const gatewayResult =
                await createPaymentLink(payment);

            payment.paymentLinkId =
                gatewayResult.paymentLinkId;

            payment.paymentLinkUrl =
                gatewayResult.paymentLinkUrl;

            payment.status = "pending";
            payment.recoveryResult = "PENDING";

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
            throw new Error(
                `Unknown recovery action: ${action}`
            );
    }
};

module.exports = {
    executeRecoveryAction
};