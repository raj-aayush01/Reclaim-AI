const express = require("express");
const { runRecovery } = require("../services/aiRecoveryOrchestrator");

const router = express.Router();

router.post("/ai/:paymentId", async (req, res) => {
    try {

        const { paymentId } = req.params;

        const result = await runRecovery(paymentId);

        res.status(200).json({
            message: "AI recovery executed successfully",
            result
        });

    } catch (error) {

        console.error("AI recovery execution error:", error);

        res.status(500).json({
            message: "AI recovery execution failed",
            error: error.message
        });
    }
});

module.exports = router;