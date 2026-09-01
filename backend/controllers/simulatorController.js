const {
    generateCustomersAndPayments
} = require("../services/paymentSimulator");

const {
    generateSubscriptions
} = require("../services/subscriptionSimulator");

const generateDemoData = async (req, res) => {
    try {
        const count = Number(req.body.count) || 200;

        if (count < 1 || count > 1000) {
            return res.status(400).json({
                message: "Count must be between 1 and 1000"
            });
        }

        const subscriptionCount =
            Number(req.body.subscriptionCount) ||
            Math.max(20, Math.floor(count * 0.3));

        const [paymentResult, subscriptionResult] =
            await Promise.all([
                generateCustomersAndPayments(count),
                generateSubscriptions(subscriptionCount)
            ]);

        res.status(201).json({
            message: "Demo payment and subscription data generated successfully",
            ...paymentResult,
            subscriptions: subscriptionResult
        });
    } catch (error) {
        console.error("Simulator error:", error);

        res.status(500).json({
            message: "Failed to generate demo data",
            error: error.message
        });
    }
};

module.exports = {
    generateDemoData
};