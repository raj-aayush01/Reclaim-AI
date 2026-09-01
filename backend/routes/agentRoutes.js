const express = require("express");

const {
    runRecovery
} = require("../services/aiRecoveryOrchestrator");

const {
    runAgentBatch
} = require("../services/agent/agentBatchRunner");

const {
    getAgentRun,
    getControlRoom
} = require("../controllers/agentController");

const router = express.Router();


// =========================================================
// RUN AI RECOVERY FOR ONE PAYMENT
// =========================================================

router.post("/ai/:paymentId", async (req, res) => {

    try {

        const { paymentId } = req.params;

        const result =
            await runRecovery(paymentId);

        res.status(200).json({

            message:
                "AI recovery executed successfully",

            result,

            payment:
                result?.payment || null,

            subscription:
                result?.subscription || null,

            run: {

                runId:
                    result?.runId || null,

                paymentId,

                status:
                    result?.status || "COMPLETED",

                steps:
                    result?.steps || []

            }

        });

    } catch (error) {

        console.error(
            "AI recovery execution error:",
            error
        );

        res.status(500).json({

            message:
                "AI recovery execution failed",

            error:
                error.message

        });

    }

});


// =========================================================
// BATCH AI RECOVERY
// =========================================================

router.post("/batch", async (req, res) => {

    try {

        const limit =
            Number(req.body.limit) || 10;

        if (limit < 1 || limit > 50) {

            return res.status(400).json({

                message:
                    "Limit must be between 1 and 50"

            });

        }

        const result =
            await runAgentBatch(limit);

        res.status(200).json({

            message:
                "Agent batch recovery completed",

            result

        });

    } catch (error) {

        console.error(
            "Agent batch recovery error:",
            error
        );

        res.status(500).json({

            message:
                "Agent batch recovery failed",

            error:
                error.message

        });

    }

});


// =========================================================
// AI CONTROL ROOM
// =========================================================

router.get(
    "/control-room",
    getControlRoom
);


// =========================================================
// AGENT RUN HISTORY
// =========================================================

router.get(
    "/runs/:paymentId",
    getAgentRun
);


module.exports = router;