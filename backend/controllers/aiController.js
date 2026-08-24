const { analyzePayment } = require("../services/aiAgent");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const { runAIRecovery } = require("../services/aiRecoveryEngine");

const analyzePaymentWithAI = async (req, res) => {
    try {
        const { payment, customer } = req.body;

        if (!payment || !customer) {
            return res.status(400).json({
                message: "Payment and customer data are required"
            });
        }

        const result = await analyzePayment(payment, customer);

        res.status(200).json({
            message: "AI analysis completed successfully",
            result
        });

    } catch (error) {
        console.error("AI analysis error:", error);

        res.status(500).json({
            message: "AI analysis failed",
            error: error.message
        });
    }
};

const analyzeStoredPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findOne({ paymentId });

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        const customer = await Customer.findOne({
            customerId: payment.customerId
        });

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        const result = await analyzePayment(
            payment.toObject(),
            customer.toObject()
        );

        res.json({
            message: "AI analysis completed successfully",
            paymentId: payment.paymentId,
            result
        });

    } catch (error) {
        console.error("AI analysis error:", error);

        res.status(500).json({
            message: "AI analysis failed",
            error: error.message
        });
    }
};

const runAIRecoveryForPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const result = await runAIRecovery(paymentId);

        res.json({
            message: "AI recovery analysis completed",
            result
        });

    } catch (error) {
        console.error("AI recovery error:", error);

        res.status(500).json({
            message: "AI recovery analysis failed",
            error: error.message
        });
    }
};

module.exports = {
    analyzePaymentWithAI,
    analyzeStoredPayment,
    runAIRecoveryForPayment
};