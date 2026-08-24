const {
    evaluateRecoveryPolicy
} = require("../services/recoveryPolicy");

const {
    runRecoveryEngine
} = require("../services/recoveryEngine");

const evaluatePayment = async (req, res) => {
    try {
        const result = evaluateRecoveryPolicy(req.body);

        res.json({
            payment: req.body,
            decision: result
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to evaluate payment",
            error: error.message
        });
    }
    };

const runRecovery = async (req, res) => {
    try {
        const result = await runRecoveryEngine();

        res.json({
            message: "Recovery engine completed successfully",
            result
        });
    } catch (error) {
        console.error("Recovery engine error:", error);

        res.status(500).json({
            message: "Failed to run recovery engine",
            error: error.message
        });
    }
};

module.exports = {
    evaluatePayment,
    runRecovery
};