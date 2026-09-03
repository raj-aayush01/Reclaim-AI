const express = require("express");

const { runRecovery } = require("../services/aiRecoveryOrchestrator");
const { runAgentBatch } = require("../services/agent/agentBatchRunner");
const { getAgentRun, getControlRoom } = require("../controllers/agentController");
const { processVoiceRecovery } = require("../services/voiceRecoveryOrchestrator");
const { GeminiUnavailableError } = require("../services/voiceRecoveryService");

const router = express.Router();


// RUN AI RECOVERY FOR ONE PAYMENT

router.post("/ai/:paymentId", async (req, res) => {

    const { paymentId } = req.params;

    try {

        const result =
            await runRecovery(paymentId);

        res.status(200).json({

            message: "AI recovery executed successfully",

            result,

            payment: result?.payment || null,

            subscription: result?.subscription || null,

            run: {
                runId: result?.runId || null,
                paymentId,
                status: result?.status || "COMPLETED",
                steps: result?.steps || []
            }

        });

    } catch (error) {

        console.error("AI recovery execution error:", error);

        if (error?.aiErrorType) {

            return res.status(503).json({

                message:
                    "AI recovery could not be completed.",

                aiUnavailable:
                    true,

                aiErrorType:
                    error.aiErrorType,

                aiProvider:
                    error.aiProvider ||
                    "Gemini 3.1 Flash Lite",

                userMessage:
                    error.aiUserMessage ||
                    "The connected AI service is temporarily unavailable. No recovery action was executed.",

                paymentId,

                recoveryExecuted:
                    false

            });

        }

        return res.status(500).json({

            message: "AI recovery execution failed.",
            aiUnavailable: false,
            recoveryExecuted: false,
            error: error.message

        });

    }

});


// HINGLISH VOICE RECOVERY

router.post("/voice/:paymentId", async (req, res) => {

    try {

        const result =
            await processVoiceRecovery({
                paymentId:
                    req.params.paymentId,

                message:
                    req.body?.message || "",

                history:
                    req.body?.history || [],

                phase:
                    req.body?.phase || "INTRO",

                voiceSessionId:
                    req.body?.voiceSessionId
            });

        return res
            .status(
                result?.statusCode || 200
            )
            .json(
                result?.body || {}
            );

    } catch (error) {

        if (
            error instanceof
            GeminiUnavailableError
        ) {

            console.error(
                "[Voice] Gemini unavailable:",
                error.message
            );

            return res.status(503).json({

                message:
                    "Voice AI is temporarily unavailable. No recovery action was executed.",

                aiUnavailable:
                    true,

                aiErrorType:
                    error.aiErrorType,

                aiProvider:
                    error.aiProvider ||
                    "Gemini 3.1 Flash Lite",

                userMessage:
                    error.aiUserMessage ||
                    "The connected AI service is temporarily unavailable. No recovery action was executed.",

                recoveryExecuted:
                    false,

                voice: {

                    reply:
                        error.aiUserMessage ||
                        "Abhi voice AI temporarily unavailable hai. Koi recovery action execute nahi hua. Aap console se AI Recovery use kar sakte hain.",

                    intent:
                        "OTHER",

                    suggestedAction:
                        "NONE",

                    recoveryExecuted:
                        false,

                    aiUnavailable:
                        true

                },

                recovery:
                    null,

                usage:
                    {
                        available:
                            Boolean(
                                process.env.GEMINI_API_KEY
                            ),

                        providerManaged:
                            true
                    }

            });

        }

        if (
            error?.statusCode === 400
        ) {

            return res.status(400).json({

                message:
                    error.message

            });

        }

        if (
            error?.statusCode === 404
        ) {

            return res.status(404).json({

                message:
                    error.message

            });

        }

        console.error(
            "Voice recovery error:",
            error
        );

        return res.status(500).json({

            message:
                "Voice recovery failed. No recovery action was executed.",

            error:
                error.message

        });

    }

});


// BATCH AI RECOVERY

router.post("/batch", async (req, res) => {

    try {

        const limit =
            Number(req.body.limit) || 10;

        if (
            limit < 1 ||
            limit > 50
        ) {

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


// AI CONTROL ROOM

router.get(
    "/control-room",
    getControlRoom
);


// AGENT RUN HISTORY

router.get(
    "/runs/:paymentId",
    getAgentRun
);


module.exports = router;