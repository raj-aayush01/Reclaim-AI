const processPaymentRetry = async (payment) => {

    console.log(
        "[Simulator] FORCE_RETRY_FAILURE =",
        process.env.FORCE_RETRY_FAILURE
    );

    const forceFailure =
        process.env.FORCE_RETRY_FAILURE === "true";

    const success =
        forceFailure
            ? false
            : Math.random() < 0.8;

    if (success) {
        return {
            success: true,
            status: "SUCCESS",
            transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            message: "Payment processed successfully"
        };
    }

    return {
        success: false,
        status: "FAILED",
        transactionId: null,
        message: "Payment gateway rejected the retry"
    };
};

const createPaymentLink = async (payment) => {

    const paymentLinkId =
        `pl_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    return {
        success: true,
        status: "PENDING",
        paymentLinkId,
        paymentLinkUrl:
            `https://reclaimai.demo/pay/${paymentLinkId}`,
        message: "Payment link created successfully"
    };
};

module.exports = {
    processPaymentRetry,
    createPaymentLink
};