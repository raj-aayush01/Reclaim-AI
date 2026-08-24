const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const RecoveryLog = require("../models/RecoveryLog");

const { analyzePayment } = require("./aiAgent");
const { evaluateRecoveryPolicy } = require("./recoveryPolicy");
const { executeRecoveryAction } = require("./recoveryExecutor");

const runRecovery = async (paymentId) => {

    // 1. Get payment
    const payment = await Payment.findOne({
        paymentId
    });

    if (!payment) {
        throw new Error("Payment not found");
    }

    // 2. Get customer
    const customer = await Customer.findOne({
        customerId: payment.customerId
    });

    if (!customer) {
        throw new Error("Customer not found");
    }

    // 3. Ask Gemini
    const aiDecision = await analyzePayment(
        payment.toObject(),
        customer.toObject()
    );

    // 4. Validate AI decision using policy
    const policyDecision = evaluateRecoveryPolicy(
        payment,
        aiDecision
    );

    // 5. If policy blocks the AI
    if (!policyDecision.allowed) {

        const log = await RecoveryLog.create({
            paymentId: payment.paymentId,
            customerId: payment.customerId,

            aiAction: aiDecision.action,
            aiReason: aiDecision.reason,
            aiConfidence: aiDecision.confidence,

            policyAllowed: false,
            finalAction: policyDecision.finalAction,

            executionResult: "BLOCKED",

            recoveredAmount: 0,

            message: policyDecision.reason
        });

        return {
            executed: false,

            aiDecision,

            policyDecision,

            logId: log._id
        };
    }

    // 6. Execute the approved action
    const executionResult = await executeRecoveryAction(
        payment,
        policyDecision.finalAction
    );

    // 7. Save updated payment
    await payment.save();

    // 8. Create audit log
    const log = await RecoveryLog.create({
        paymentId: payment.paymentId,
        customerId: payment.customerId,

        aiAction: aiDecision.action,
        aiReason: aiDecision.reason,
        aiConfidence: aiDecision.confidence,

        policyAllowed: true,
        finalAction: policyDecision.finalAction,

        executionResult: executionResult.result,

        recoveredAmount:
            executionResult.recoveredAmount || 0,

        message: policyDecision.reason
    });

    return {
        executed: true,

        aiDecision,

        policyDecision,

        executionResult,

        logId: log._id
    };
};

module.exports = {
    runRecovery
};