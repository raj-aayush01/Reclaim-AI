const crypto = require("crypto");

const AgentRun = require("../models/AgentRun");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");

const {
    generateVoiceResponse,
    isExplicitConfirmation,
    setPendingVoiceAction,
    getPendingVoiceAction,
    clearPendingVoiceAction,
    buildRecoveryReply,
    getVoiceGeminiUsage
} = require("./voiceRecoveryService");

const {
    performRecoveryAction
} = require("./agent/agentTools");

const {
    MAX_RECOVERY_ATTEMPTS
} = require("./recoveryExecutor");

const {
    syncSubscriptionAfterRecovery
} = require("./subscriptionSync");


const TERMINAL_VOICE_STATUSES = new Set([
    "RECOVERED",
    "ESCALATED",
    "STOPPED",
    "BLOCKED",
    "PENDING",
    "COMPLETED"
]);


const getLatestVoiceRun = async (
    paymentId,
    voiceSessionId
) => {
    return AgentRun.findOne({
        paymentId,
        source: "VOICE_RECOVERY",
        voiceSessionId
    })
        .sort({
            createdAt: -1
        })
        .lean();
};


const processVoiceRecovery = async ({
    paymentId,
    message = "",
    history = [],
    phase = "INTRO",
    voiceSessionId
}) => {
    const cleanMessage =
        String(message || "").trim();

    if (!cleanMessage) {
        const error =
            new Error(
                "Voice message is required"
            );

        error.statusCode = 400;

        throw error;
    }

    const sessionId =
        typeof voiceSessionId === "string" &&
        voiceSessionId.trim()
            ? voiceSessionId.trim().slice(0, 100)
            : crypto.randomUUID();

    const payment =
        await Payment.findOne({
            paymentId
        }).lean();

    if (!payment) {
        const error =
            new Error(
                "Payment not found"
            );

        error.statusCode = 404;

        throw error;
    }

    if (payment.status !== "failed") {
        return {
            statusCode: 200,

            body: {
                message:
                    "This payment has already been resolved.",

                voiceSessionId:
                    sessionId,

                run: {
                    paymentId,

                    status:
                        payment.status,

                    source:
                        "VOICE_RECOVERY"
                },

                voice: {
                    reply:
                        "Ye payment ab recovery ke liye available nahi hai. Payment already resolve ho chuki hai, isliye main koi further recovery action execute nahi karunga.",

                    intent:
                        "OTHER",

                    suggestedAction:
                        "NONE",

                    recoveryExecuted:
                        false,

                    aiUnavailable:
                        false
                },

                recovery:
                    null,

                usage:
                    getVoiceGeminiUsage()
            }
        };
    }

    const customer =
        await Customer.findOne({
            customerId:
                payment.customerId
        }).lean();

    const latestVoiceRun =
        await getLatestVoiceRun(
            paymentId,
            sessionId
        );

    if (
        TERMINAL_VOICE_STATUSES.has(
            latestVoiceRun?.status
        )
    ) {
        return {
            statusCode: 200,

            body: {
                message:
                    "Voice recovery session has already completed.",

                voiceSessionId:
                    sessionId,

                run: {
                    runId:
                        latestVoiceRun.runId,

                    paymentId,

                    status:
                        latestVoiceRun.status,

                    source:
                        "VOICE_RECOVERY"
                },

                voice: {
                    reply:
                        "Ye voice recovery session already complete ho chuka hai. Koi further recovery action execute nahi kiya jayega.",

                    intent:
                        "OTHER",

                    suggestedAction:
                        "NONE",

                    recoveryExecuted:
                        true,

                    aiUnavailable:
                        false
                },

                recovery:
                    null,

                usage:
                    getVoiceGeminiUsage()
            }
        };
    }

    const pendingAction =
        getPendingVoiceAction(
            paymentId,
            sessionId
        );

    /*
     * A specific recovery action has already been proposed.
     * Only an explicit confirmation can execute it.
     */

    if (
        pendingAction &&
        isExplicitConfirmation(
            cleanMessage
        )
    ) {
        console.log(
            `[Voice] Confirmation received for ${paymentId} [session: ${sessionId}]: ${pendingAction.action}`
        );

        const voiceRun =
            new AgentRun({
                runId:
                    `voice_${crypto.randomUUID()}`,

                paymentId,

                source:
                    "VOICE_RECOVERY",

                voiceSessionId:
                    sessionId,

                status:
                    "RUNNING",

                steps: [
                    {
                        step:
                            1,

                        type:
                            "OBSERVATION",

                        tool:
                            "get_payment",

                        output: {
                            payment
                        }
                    },

                    {
                        step:
                            2,

                        type:
                            "OBSERVATION",

                        tool:
                            "get_customer_history",

                        output: {
                            customer
                        }
                    },

                    {
                        step:
                            3,

                        type:
                            "DECISION",

                        tool:
                            "VOICE_GEMINI",

                        output: {
                            action:
                                pendingAction.action,

                            confidence:
                                pendingAction.confidence,

                            reason:
                                pendingAction.reason,

                            summary:
                                pendingAction.summary,

                            whyThisDecision:
                                pendingAction.whyThisDecision,

                            whatHappensNext:
                                pendingAction.whatHappensNext
                        },

                        confidence:
                            pendingAction.confidence,

                        reason:
                            pendingAction.reason,

                        summary:
                            pendingAction.summary,

                        whyThisDecision:
                            pendingAction.whyThisDecision,

                        whatHappensNext:
                            pendingAction.whatHappensNext
                    }
                ]
            });

        await voiceRun.save();

        let recovery;

        try {
            recovery =
                await performRecoveryAction({
                    paymentId,

                    action:
                        pendingAction.action,

                    confidence:
                        pendingAction.confidence,

                    reason:
                        pendingAction.reason
                });
        } catch (recoveryError) {
            voiceRun.status =
                "FAILED";

            voiceRun.completedAt =
                new Date();

            voiceRun.steps.push({
                step:
                    4,

                type:
                    "TERMINAL",

                output: {
                    success:
                        false,

                    error:
                        recoveryError.message,

                    attemptsMade:
                        payment.attemptCount ??
                        null,

                    maxAttempts:
                        MAX_RECOVERY_ATTEMPTS
                },

                reason:
                    recoveryError.message
            });

            await voiceRun.save();

            throw recoveryError;
        }

        const policyDecision =
            recovery?.policyDecision ||
            null;

        const executionResult =
            recovery?.executionResult ||
            null;

        voiceRun.steps.push({
            step:
                4,

            type:
                "POLICY",

            tool:
                "RECOVERY_POLICY",

            output: {
                ...(policyDecision || {}),

                maxAttempts:
                    policyDecision?.maxAttempts ??
                    MAX_RECOVERY_ATTEMPTS
            },

            reason:
                policyDecision?.reason ||
                null
        });

        voiceRun.steps.push({
            step:
                5,

            type:
                "ACTION",

            tool:
                recovery?.actionExecuted ||
                pendingAction.action,

            input: {
                requestedAction:
                    pendingAction.action
            },

            output: {
                ...(executionResult || {}),

                requestedAction:
                    pendingAction.action,

                executedAction:
                    recovery?.actionExecuted ||
                    pendingAction.action
            }
        });

        const finalStatus =
            executionResult?.result ===
            "RECOVERED"
                ? "RECOVERED"
                : executionResult?.result ===
                      "ESCALATED"
                    ? "ESCALATED"
                    : executionResult?.result ===
                          "STOPPED"
                        ? "STOPPED"
                        : executionResult?.result ===
                              "PENDING"
                            ? "PENDING"
                            : recovery?.blocked
                                ? "BLOCKED"
                                : recovery?.success
                                    ? "COMPLETED"
                                    : "FAILED";

        voiceRun.status =
            finalStatus;

        voiceRun.completedAt =
            new Date();

        voiceRun.steps.push({
            step:
                6,

            type:
                "TERMINAL",

            output: {
                status:
                    finalStatus,

                result:
                    executionResult?.result ||
                    null,

                requestedAction:
                    pendingAction.action,

                executedAction:
                    recovery?.actionExecuted ||
                    pendingAction.action,

                message:
                    recovery?.message ||
                    null,

                attemptsMade:
                    recovery?.payment
                        ?.attemptCount ??
                    executionResult?.attemptsMade ??
                    null,

                maxAttempts:
                    MAX_RECOVERY_ATTEMPTS
            },

            reason:
                recovery?.message ||
                null
        });

        await voiceRun.save();

        clearPendingVoiceAction(
            paymentId,
            sessionId
        );

        let subscription = null;

        if (recovery?.payment) {
            subscription =
                await syncSubscriptionAfterRecovery({
                    ...recovery.payment,

                    isSubscriptionRenewal:
                        payment.isSubscriptionRenewal,

                    subscriptionId:
                        payment.subscriptionId
                });
        }

        const finalRecovery = {
            ...recovery,
            subscription
        };

        return {
            statusCode: 200,

            body: {
                message:
                    "Voice recovery action executed",

                voiceSessionId:
                    sessionId,

                run: {
                    runId:
                        voiceRun.runId,

                    paymentId,

                    status:
                        voiceRun.status,

                    source:
                        "VOICE_RECOVERY"
                },

                voice: {
                    reply:
                        buildRecoveryReply({
                            recovery:
                                finalRecovery,

                            payment:
                                finalRecovery.payment
                        }),

                    intent:
                        "CONFIRM",

                    suggestedAction:
                        pendingAction.action,

                    recoveryExecuted:
                        true,

                    aiUnavailable:
                        false
                },

                recovery:
                    finalRecovery,

                usage:
                    getVoiceGeminiUsage()
            }
        };
    }

    const voiceResult =
        await generateVoiceResponse({
            payment,

            customer,

            message:
                cleanMessage,

            history,

            phase
        });

/*
 * A generic confirmation without a pending action means:
 * "Yes, evaluate the recovery options for me."
 *
 * It does not authorize execution because no specific action
 * has been proposed yet.
 */

    const evaluationRequest =
        voiceResult.explicitConfirmation &&
        !pendingAction;

    if (evaluationRequest) {
        voiceResult.explicitConfirmation =
            false;

        voiceResult.intent =
            "OTHER";

        voiceResult.summary =
            "Customer requested recovery help. The assistant evaluated the payment and selected the safest recovery option.";

        voiceResult.whatHappensNext =
            "If the customer confirms the proposed recovery action, the system will run the required safety checks before executing it.";
    }


    const hasConcreteRecommendation =
        voiceResult.suggestedAction &&
        voiceResult.suggestedAction !==
            "NONE";


    if (hasConcreteRecommendation) {
        setPendingVoiceAction({
            paymentId,

            voiceSessionId:
                sessionId,

            action:
                voiceResult.suggestedAction,

            confidence:
                voiceResult.confidence,

            reason:
                voiceResult.reason,

            summary:
                voiceResult.summary,

            whyThisDecision:
                voiceResult.whyThisDecision,

            whatHappensNext:
                voiceResult.whatHappensNext
        });
    } else {
        clearPendingVoiceAction(
            paymentId,
            sessionId
        );
    }


    /*
    * For an initial confirmation, Gemini must not leave the
    * customer waiting for another evaluation turn.
    *
    * Once a concrete action has been selected, immediately
    * present that action and ask for confirmation to execute it.
    */

    let reply =
        voiceResult.reply;

    if (
        evaluationRequest &&
        hasConcreteRecommendation
    ) {
        const recommendationReplies = {
            RETRY_PAYMENT:
                "Maine payment details check kar li hain. Safest option payment ko retry karna hai. Kya main payment retry kar doon?",

            CREATE_PAYMENT_LINK:
                "Maine payment details check kar li hain. Safest option ek alternative payment link create karna hai. Kya main payment link create kar doon?",

            ESCALATE_TO_HUMAN:
                "Maine payment details check kar li hain. Safest option is payment ko human review ke liye escalate karna hai. Kya main ise human review ke liye bhej doon?",

            STOP_RECOVERY:
                "Maine payment details check kar li hain. Safe rules ke according recovery ko stop karna safest option hai. Kya main recovery stop kar doon?"
        };

        reply =
            recommendationReplies[
                voiceResult.suggestedAction
            ] ||
            voiceResult.reply;
    }

    return {
        statusCode: 200,

        body: {
            message:
                "Voice recovery response generated",

            voiceSessionId:
                sessionId,

            voice: {
                reply,

                intent:
                    voiceResult.intent,

                suggestedAction:
                    voiceResult.suggestedAction,

                confidence:
                    voiceResult.confidence,

                reason:
                    voiceResult.reason,

                summary:
                    voiceResult.summary,

                whyThisDecision:
                    voiceResult.whyThisDecision,

                whatHappensNext:
                    voiceResult.whatHappensNext,

                recoveryExecuted:
                    false,

                aiUnavailable:
                    false
            },

            recovery:
                null,

            usage:
                getVoiceGeminiUsage()
        }
    };
};


module.exports = {
    processVoiceRecovery
};