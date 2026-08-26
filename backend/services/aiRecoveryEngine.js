const Payment = require("../models/Payment");
const Customer = require("../models/Customer");

const { analyzePayment } = require("./aiAgent");

const { evaluateRecoveryPolicy } = require("./recoveryPolicy");

const runAIRecovery = async (paymentId) => {

    const payment = await Payment.findOne({
        paymentId
    });

    if (!payment) {
        throw new Error("Payment not found");
    }

    const customer = await Customer.findOne({
        customerId: payment.customerId
    });

    if (!customer) {
        throw new Error("Customer not found");
    }

    // 1. Ask AI for a recommendation
    const aiDecision = await analyzePayment(
        payment.toObject(),
        customer.toObject()
    );

    // 2. Asking deterministic policy whether the AI recommendation is allowed - Policy GuardRail

    const policyDecision = evaluateRecoveryPolicy( payment, aiDecision );

    const allowed = policyDecision.allowed;

    return {
        paymentId: payment.paymentId,
        aiDecision,
        policyDecision,
        allowed
    };
};

module.exports = {
    runAIRecovery
};