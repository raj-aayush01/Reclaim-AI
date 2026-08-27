const Payment = require("../models/Payment");

const completePaymentLink = async (paymentLinkId) => {

    const payment = await Payment.findOne({
        paymentLinkId
    });

    if (!payment) {
        throw new Error("Payment link not found");
    }

    if (payment.status !== "pending") {
        return {
            success: false,
            status: payment.status,
            message:
                "Payment link is no longer active"
        };
    }

    const paymentSuccessful =
        process.env.FORCE_LINK_PAYMENT_FAILURE === "true"
            ? false
            : Math.random() < 0.9;

    if (paymentSuccessful) {

        payment.status = "recovered";
        payment.recoveredAmount = payment.amount;
        payment.recoveryResult = "RECOVERED";

        await payment.save();

        return {
            success: true,
            status: "RECOVERED",
            recoveredAmount: payment.amount,
            paymentId: payment.paymentId,
            paymentLinkId: payment.paymentLinkId
        };
    }

    payment.status = "pending";
    payment.recoveryResult = "PENDING";

    await payment.save();

    return {
        success: false,
        status: "PENDING",
        recoveredAmount: 0,
        paymentId: payment.paymentId,
        paymentLinkId: payment.paymentLinkId,
        message:
            "Customer payment attempt failed"
    };
};

module.exports = {
    completePaymentLink
};