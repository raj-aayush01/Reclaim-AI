require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const crypto = require("crypto");

const AgentRun = require("../../models/AgentRun");
const Payment = require("../../models/Payment");
const { MAX_RECOVERY_ATTEMPTS } = require("../recoveryExecutor");

const { executeTool } = require("./agentTools");

const getFinalRunAndPayment = async (runId, paymentId) => {
    const [finalRun, finalPayment] =
        await Promise.all([
            AgentRun.findOne({ runId }).lean(),
            Payment.findOne({ paymentId }).lean()
        ]);

    return {
        steps: finalRun?.steps || [],
        payment: finalPayment || null
    };
};

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-3.1-flash-lite";

const createGeminiUnavailableError = (
    error,
    type = "AI_UNKNOWN_ERROR",
    userMessage = null
) => {
    const aiError =
        new Error(
            userMessage ||
            "Reclaim-AI could not complete the AI recovery decision because the connected Gemini 3.1 Flash Lite AI service encountered an unexpected problem. No recovery action was executed. Please try again."
        );

    aiError.name =
        "GeminiUnavailableError";

    aiError.code =
        "GEMINI_UNAVAILABLE";

    aiError.cause =
        error || null;

    aiError.aiErrorType =
        type;

    aiError.aiUserMessage =
        userMessage ||
        aiError.message;

    aiError.aiProvider =
        "Gemini 3.1 Flash Lite";

    return aiError;
};

const classifyGeminiError = (error) => {
    const status = Number(
        error?.status ||
        error?.statusCode ||
        error?.response?.status ||
        0
    );

    const message = String(
        error?.message || error || ""
    ).toLowerCase();

    if (
        status === 429 ||
        message.includes("rate limit") ||
        message.includes("resource exhausted") ||
        message.includes("quota") ||
        message.includes("too many requests")
    ) {
        return {
            type: "AI_RATE_LIMITED",
            userMessage:
                "Reclaim-AI is working normally, but the Gemini 3.1 Flash Lite AI service has temporarily reached its usage limit. No recovery action was executed. Please try again later."
        };
    }

    if (
        status === 408 ||
        message.includes("timeout") ||
        message.includes("timed out") ||
        message.includes("deadline exceeded")
    ) {
        return {
            type: "AI_TIMEOUT",
            userMessage:
                "Reclaim-AI could not get a response from the Gemini 3.1 Flash Lite AI service in time. No recovery action was executed. Please try again."
        };
    }

    if (
        [500, 502, 503, 504].includes(status) ||
        message.includes("service unavailable") ||
        message.includes("temporarily unavailable")
    ) {
        return {
            type: "AI_SERVICE_UNAVAILABLE",
            userMessage:
                "Reclaim-AI is working normally, but the Gemini 3.1 Flash Lite AI service is temporarily unavailable. No recovery action was executed. Please try again in a moment."
        };
    }

    return {
        type: "AI_UNKNOWN_ERROR",
        userMessage:
            "Reclaim-AI could not complete the AI recovery decision because the connected Gemini 3.1 Flash Lite AI service encountered an unexpected problem. No recovery action was executed. Please try again."
    };
};

const SYSTEM_INSTRUCTION = `
You are Reclaim-AI Recovery Agent.

Your job is to analyze ONE failed payment and recommend ONE safe
recovery action.

You are operating inside a bounded financial recovery system.

You will receive:

1. Payment information
2. Customer payment history

You must return ONLY valid JSON.

Allowed actions:

RETRY_PAYMENT
CREATE_PAYMENT_LINK
ESCALATE_TO_HUMAN
STOP_RECOVERY

Recovery strategy:

1. TEMPORARY_FAILURE
   - Retry when retry attempts remain.
   - Do not create a payment link.
   - If retry attempts are exhausted, stop recovery.

2. CARD_DECLINED
   - Do not retry the same card.
   - Create a payment link for an alternative payment method.

3. REPEATED_FAILURE
   - If the retry limit has been reached, stop recovery.
   - Do not continue retrying.

4. HIGH_VALUE_FAILURE
   - Do not attempt automated payment recovery.
   - Escalate to a human.

5. UNKNOWN_FAILURE
   - Do not guess a recovery strategy.
   - Escalate to a human.

Important rules:

- Base the decision only on the supplied payment and customer data.
- Never invent information.
- Never recommend an action outside the allowed action list.
- Consider attemptCount before recommending RETRY_PAYMENT.
- Consider scenario before recommending an action.
- Prefer the safest recovery path.
- Confidence must be between 0 and 1.

User-facing explanation requirements:

The explanation must be understandable to a non-technical business user.

Do NOT use developer terminology such as:

- risk model
- deterministic engine
- parameters
- pipeline
- executor
- policy evaluation
- model inference

Explain the decision in business language.

The explanation must answer:

1. What happened to the payment?
2. Why did the AI choose this action?
3. What will happen next?

Do not claim that money was recovered unless the supplied information proves
that recovery actually happened.

Return exactly this structure:

{
    "action": "RETRY_PAYMENT",
    "confidence": 0.95,
    "summary": "The customer attempted a payment, but it could not be completed because of a temporary payment issue.",
    "whyThisDecision": "The failure appears temporary and the payment still has an allowed recovery attempt remaining.",
    "whatHappensNext": "The system will make another payment attempt. If it succeeds, the payment will be recovered. If it fails again, the next permitted recovery step will be considered.",
    "reason": "Temporary failure with a recovery attempt remaining."
}
`;

const ALLOWED_ACTIONS = new Set([
    "RETRY_PAYMENT",
    "CREATE_PAYMENT_LINK",
    "ESCALATE_TO_HUMAN",
    "STOP_RECOVERY"
]);

const ACTION_TO_TOOL = {
    RETRY_PAYMENT: "retry_payment",
    CREATE_PAYMENT_LINK: "create_payment_link",
    ESCALATE_TO_HUMAN: "escalate_to_human",
    STOP_RECOVERY: "stop_recovery"
};

const addStep = async (
    agentRun,
    {
        step,
        type,
        tool = null,
        input = null,
        output = null,
        confidence = null,
        reason = null
    }
) => {
    await agentRun.updateOne({
        $push: {
            steps: {
                step,
                type,
                tool,
                input,
                output,
                confidence,
                reason
            }
        }
    });
};

const markFailed = async (
    agentRun,
    error,
    step
) => {
    await addStep(
        agentRun,
        {
            step,
            type: "TERMINAL",
            output: {
                status: "FAILED",
                error:
                    error.message,
                aiUnavailable:
                    error.aiErrorType
                        ? true
                        : false,
                aiErrorType:
                    error.aiErrorType ||
                    null,
                aiProvider:
                    error.aiProvider ||
                    null
            }
        }
    );

    await agentRun.updateOne({
        $set: {
            status: "FAILED",
            completedAt: new Date()
        }
    });
};

const parseAIResponse = (text) => {
    if (!text) {
        const aiError =
            classifyGeminiError(
                new Error(
                    "Gemini returned an empty response."
                )
            );

        throw createGeminiUnavailableError(
            null,
            "AI_INVALID_RESPONSE",
            "Reclaim-AI could not complete the AI recovery decision because the Gemini 3.1 Flash Lite AI service returned no usable response. No recovery action was executed. Please try again."
        );
    }

    let cleaned = text.trim();

    if (cleaned.startsWith("```")) {
        cleaned = cleaned
            .replace(
                /^```json\s*/i,
                ""
            )
            .replace(
                /^```\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();
    }

    let parsed;

    try {
        parsed = JSON.parse(cleaned);
    } catch (error) {
        throw createGeminiUnavailableError(
            error,
            "AI_INVALID_RESPONSE",
            "Reclaim-AI could not complete the AI recovery decision because the Gemini 3.1 Flash Lite AI service returned an invalid response. No recovery action was executed. Please try again."
        );
    }

    return parsed;
};

const validateAIDecision = (decision) => {
    if (!decision || typeof decision !== "object") {
        throw createGeminiUnavailableError(
            null,
            "AI_INVALID_RESPONSE",
            "Reclaim-AI could not complete the AI recovery decision because the Gemini 3.1 Flash Lite AI service returned an invalid decision. No recovery action was executed. Please try again."
        );
    }

    const action =
        String(decision.action || "")
            .trim()
            .toUpperCase();

    if (!ALLOWED_ACTIONS.has(action)) {
        throw createGeminiUnavailableError(
            null,
            "AI_INVALID_RESPONSE",
            "Reclaim-AI could not complete the AI recovery decision because the Gemini 3.1 Flash Lite AI service returned an unsupported recovery action. No recovery action was executed. Please try again."
        );
    }

    const confidence =
        Number(decision.confidence);

    if (
        Number.isNaN(confidence) ||
        confidence < 0 ||
        confidence > 1
    ) {
        throw createGeminiUnavailableError(
            null,
            "AI_INVALID_RESPONSE",
            "Reclaim-AI could not complete the AI recovery decision because the Gemini 3.1 Flash Lite AI service returned invalid confidence data. No recovery action was executed. Please try again."
        );
    }

    const summary =
        String(decision.summary || "").trim();

    const whyThisDecision =
        String(
            decision.whyThisDecision || ""
        ).trim();

    const whatHappensNext =
        String(
            decision.whatHappensNext || ""
        ).trim();

    const reason =
        String(decision.reason || "").trim();

    if (!summary) {
        throw createGeminiUnavailableError(
            null,
            "AI_INVALID_RESPONSE",
            "Reclaim-AI could not complete the AI recovery decision because the Gemini 3.1 Flash Lite AI service returned no payment summary. No recovery action was executed. Please try again."
        );
    }

    if (!whyThisDecision) {
        throw createGeminiUnavailableError(
            null,
            "AI_INVALID_RESPONSE",
            "Reclaim-AI could not complete the AI recovery decision because the Gemini 3.1 Flash Lite AI service returned no decision explanation. No recovery action was executed. Please try again."
        );
    }

    if (!whatHappensNext) {
        throw createGeminiUnavailableError(
            null,
            "AI_INVALID_RESPONSE",
            "Reclaim-AI could not complete the AI recovery decision because the Gemini 3.1 Flash Lite AI service returned no next-step explanation. No recovery action was executed. Please try again."
        );
    }

    if (!reason) {
        throw createGeminiUnavailableError(
            null,
            "AI_INVALID_RESPONSE",
            "Reclaim-AI could not complete the AI recovery decision because the Gemini 3.1 Flash Lite AI service returned no recovery reason. No recovery action was executed. Please try again."
        );
    }

    return {
        action,
        confidence,
        summary,
        whyThisDecision,
        whatHappensNext,
        reason
    };
};

const runRecoveryAgent = async (paymentId) => {
    const runId =
        `run_${crypto.randomUUID()}`;

    const agentRun =
        await AgentRun.create({
            runId,
            paymentId,
            status: "RUNNING"
        });

    let currentStep = 0;

    try {
        // Step 1: Inspect the failed payment.

        currentStep = 1;

        console.log(
            `\n[Agent] Step 1 — Payment inspection`
        );

        const paymentResult =
            await executeTool(
                "get_payment",
                {
                    paymentId
                }
            );

        if (!paymentResult.success) {
            throw new Error(
                paymentResult.error ||
                "Unable to retrieve payment."
            );
        }

        const payment =
            paymentResult.payment;

        await addStep(
            agentRun,
            {
                step: currentStep,
                type: "OBSERVATION",
                tool: "get_payment",
                input: {
                    paymentId
                },
                output: paymentResult
            }
        );

        // Step 2: Retrieve customer payment history.

        currentStep = 2;

        console.log(
            `[Agent] Step 2 — Customer history`
        );

        const customerResult =
            await executeTool(
                "get_customer_history",
                {
                    customerId:
                        payment.customerId
                }
            );

        if (!customerResult.success) {
            throw new Error(
                customerResult.error ||
                "Unable to retrieve customer history."
            );
        }

        await addStep(
            agentRun,
            {
                step: currentStep,
                type: "OBSERVATION",
                tool: "get_customer_history",
                input: {
                    customerId:
                        payment.customerId
                },
                output: customerResult
            }
        );

        // Step 3: Ask Gemini for one recovery recommendation.

        currentStep = 3;

        console.log(
            `[Agent] Step 3 — Gemini decision`
        );

        console.log(
            `[Agent] Calling Gemini exactly once...`
        );

        const aiInput = {
            payment,
            customer:
                customerResult.customer,
            recentPayments:
                customerResult.recentPayments
        };

        let response;

        try {
            response =
                await ai.models.generateContent({
                    model: MODEL,

                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: `
        Analyze this failed payment and recommend the safest recovery action.

        Payment and customer information:

        ${JSON.stringify(
            aiInput,
            null,
            2
        )}

        Return ONLY the required JSON object.
        `
                                }
                            ]
                        }
                    ],

                    config: {
                        systemInstruction:
                            SYSTEM_INSTRUCTION,

                        responseMimeType:
                            "application/json",

                        temperature: 0
                    }
                });
        } catch (error) {
            const aiError =
                classifyGeminiError(error);

            console.error(
                "[Agent] Gemini request failed"
            );

            console.error(
                "[Agent] AI error type:",
                aiError.type
            );

            console.error(
                "[Agent] Gemini error:",
                error
            );

            throw createGeminiUnavailableError(
                error,
                aiError.type,
                aiError.userMessage
            );
        }

        const aiDecision =
            validateAIDecision(
                parseAIResponse(
                    response.text
                )
            );

        console.log(
            `[Agent] Gemini decision:`,
            aiDecision
        );

        await addStep(
            agentRun,
            {
                step: currentStep,
                type: "DECISION",
                tool:
                    "gemini_recovery_decision",

                input: {
                    paymentId,
                    scenario:
                        payment.scenario,
                    attemptCount:
                        payment.attemptCount
                },

                output: aiDecision,

                confidence:
                    aiDecision.confidence,

                reason:
                    aiDecision.reason
            }
        );

        /* Non-retry recovery actions are executed once.

           RETRY_PAYMENT is handled separately below because
           the shared retry strategy controls the complete
           retry sequence and stopping rule. */

        if (
            aiDecision.action !==
            "RETRY_PAYMENT"
        ) {
            currentStep++;

            console.log(
                `[Agent] Step ${currentStep} — Policy + execution`
            );

            const toolName =
                ACTION_TO_TOOL[
                    aiDecision.action
                ];

            if (!toolName) {
                throw new Error(
                    `No recovery tool mapped for action: ${aiDecision.action}`
                );
            }

            const actionResult =
                await executeTool(
                    toolName,
                    {
                        paymentId,
                        confidence:
                            aiDecision.confidence,
                        reason:
                            aiDecision.reason
                    }
                );

            await addStep(
                agentRun,
                {
                    step: currentStep,
                    type: "ACTION",
                    tool: toolName,

                    input: {
                        paymentId,
                        requestedAction:
                            aiDecision.action,
                        confidence:
                            aiDecision.confidence,
                        reason:
                            aiDecision.reason
                    },

                    output: {
                        policyDecision:
                            actionResult
                                .policyDecision ||
                            null,

                        executionResult:
                            actionResult
                                .executionResult ||
                            null,

                        success:
                            actionResult.success,

                        blocked:
                            actionResult.blocked ||
                            false,

                        actionExecuted:
                            actionResult.actionExecuted ||
                            null,

                        message:
                            actionResult.message ||
                            actionResult
                                ?.executionResult
                                ?.message ||
                            null
                    },

                    confidence:
                        aiDecision.confidence,

                    reason:
                        actionResult
                            ?.policyDecision
                            ?.reason ||
                        aiDecision.reason
                }
            );

            const executionResult =
                actionResult.executionResult;

            const finalStatus =
                executionResult?.result ||
                (
                    actionResult.blocked
                        ? "BLOCKED"
                        : actionResult.success
                            ? "COMPLETED"
                            : "FAILED"
                );

            currentStep++;

            console.log(
                `[Agent] Step ${currentStep} — Final result: ${finalStatus}`
            );

            await addStep(
                agentRun,
                {
                    step: currentStep,
                    type: "TERMINAL",

                    tool:
                        actionResult.actionExecuted ||
                        null,

                    output: {
                        status: finalStatus,

                        requestedAction:
                            aiDecision.action,

                        executedAction:
                            actionResult.actionExecuted ||
                            null,

                        blocked:
                            actionResult.blocked ||
                            false,

                        success:
                            actionResult.success,

                        payment:
                            actionResult.payment ||
                            null,

                        attemptsMade:
                            actionResult.payment
                                ?.attemptCount ??
                            null,

                        message:
                            actionResult.message ||
                            executionResult?.message ||
                            null
                    },

                    confidence:
                        aiDecision.confidence,

                    reason:
                        actionResult
                            ?.policyDecision
                            ?.reason ||
                        aiDecision.reason
                }
            );

            await agentRun.updateOne({
                $set: {
                    status: finalStatus,
                    completedAt: new Date()
                }
            });

            const {
                steps: finalSteps,
                payment: finalPayment
            } =
                await getFinalRunAndPayment(
                    runId,
                    paymentId
                );

            return {
                success:
                    actionResult.success,

                status:
                    finalStatus,

                runId,

                steps:
                    finalSteps,

                payment:
                    finalPayment ||
                    actionResult?.payment ||
                    null,

                aiDecision,

                action:
                    actionResult.actionExecuted ||
                    null,

                confidence:
                    aiDecision.confidence,

                reason:
                    aiDecision.reason,

                attemptsMade:
                    finalPayment?.attemptCount ??
                    null,

                maxAttempts:
                    MAX_RECOVERY_ATTEMPTS,

                result:
                    actionResult
            };
        }

        /* RETRY_PAYMENT
         *
         * The agent requests the retry tool exactly once.
         * agentTools -> performRecoveryAction ->
         * executeRecoveryRetryLoop owns the retry attempts,
         * retry limit and terminal STOP_RECOVERY behavior. */

        currentStep++;

        console.log(
            `[Agent] Step ${currentStep} — Retry strategy + execution`
        );

        const retryResult =
            await executeTool(
                "retry_payment",
                {
                    paymentId,
                    confidence:
                        aiDecision.confidence,
                    reason:
                        aiDecision.reason
                }
            );

        await addStep(
            agentRun,
            {
                step: currentStep,
                type: "ACTION",
                tool: "retry_payment",

                input: {
                    paymentId,
                    requestedAction:
                        aiDecision.action,
                    confidence:
                        aiDecision.confidence,
                    reason:
                        aiDecision.reason
                },

                output: {
                    policyDecision:
                        retryResult
                            .policyDecision ||
                        null,

                    executionResult:
                        retryResult
                            .executionResult ||
                        null,

                    retryAttempts:
                        retryResult.retryAttempts ||
                        null,

                    attemptsMade:
                        retryResult.attemptsMade ??
                        null,

                    maxAttempts:
                        retryResult.maxAttempts ??
                        MAX_RECOVERY_ATTEMPTS,

                    attemptsRemaining:
                        retryResult.attemptsRemaining ??
                        null,

                    success:
                        retryResult.success,

                    blocked:
                        retryResult.blocked ||
                        false,

                    actionExecuted:
                        retryResult.actionExecuted ||
                        null,

                    message:
                        retryResult.message ||
                        null
                },

                confidence:
                    aiDecision.confidence,

                reason:
                    retryResult
                        ?.policyDecision
                        ?.reason ||
                    aiDecision.reason
            }
        );

        currentStep++;

        const retryExecutionResult =
            retryResult.executionResult ||
            {};

        const finalStatus =
            retryExecutionResult.result ||
            (
                retryResult.blocked
                    ? "BLOCKED"
                    : retryResult.success
                        ? "COMPLETED"
                        : "FAILED"
            );

        console.log(
            `[Agent] Step ${currentStep} — Final result: ${finalStatus}`
        );

        await addStep(
            agentRun,
            {
                step: currentStep,
                type: "TERMINAL",

                tool:
                    retryResult.actionExecuted ||
                    null,

                output: {
                    status:
                        finalStatus,

                    requestedAction:
                        aiDecision.action,

                    executedAction:
                        retryResult.actionExecuted ||
                        null,

                    blocked:
                        retryResult.blocked ||
                        false,

                    success:
                        retryResult.success,

                    payment:
                        retryResult.payment ||
                        null,

                    attemptsMade:
                        retryResult
                            ?.payment
                            ?.attemptCount ??
                        retryResult
                            ?.attemptsMade ??
                        null,

                    maxAttempts:
                        retryResult.maxAttempts ??
                        MAX_RECOVERY_ATTEMPTS,

                    attemptsRemaining:
                        retryResult.attemptsRemaining ??
                        null,

                    retryAttempts:
                        retryResult.retryAttempts ||
                        null,

                    message:
                        retryResult.message ||
                        retryExecutionResult.message ||
                        null
                },

                confidence:
                    aiDecision.confidence,

                reason:
                    retryResult
                        ?.policyDecision
                        ?.reason ||
                    aiDecision.reason
            }
        );

        await agentRun.updateOne({
            $set: {
                status: finalStatus,
                completedAt: new Date()
            }
        });

        const {
            steps: finalSteps,
            payment: finalPayment
        } =
            await getFinalRunAndPayment(
                runId,
                paymentId
            );

        return {
            success:
                retryResult.success,

            status:
                finalStatus,

            runId,

            steps:
                finalSteps,

            payment:
                finalPayment ||
                retryResult.payment ||
                null,

            aiDecision,

            action:
                retryResult.actionExecuted ||
                null,

            confidence:
                aiDecision.confidence,

            reason:
                aiDecision.reason,

            attemptsMade:
                finalPayment?.attemptCount ??
                retryResult.attemptsMade ??
                null,

            maxAttempts:
                MAX_RECOVERY_ATTEMPTS,

            result:
                retryResult
        };
    } catch (error) {
        console.error(
            "\n========== AI RECOVERY ERROR =========="
        );

        console.error(
            "[Agent] Payment ID:",
            paymentId
        );

        console.error(
            "[Agent] Failed at step:",
            currentStep
        );

        console.error(
            "[Agent] Error name:",
            error?.name
        );

        console.error(
            "[Agent] Error message:",
            error?.message
        );

        console.error(
            "[Agent] Full error:",
            error
        );

        console.error(
            "=======================================\n"
        );

        await markFailed(
            agentRun,
            error,
            currentStep
        );

        throw error;
    }
};

module.exports = {
    runRecoveryAgent
};