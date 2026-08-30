require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const crypto = require("crypto");

const AgentRun = require("../../models/AgentRun");

const {
    executeTool
} = require("./agentTools");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-3.6-flash";

const MAX_RETRY_ATTEMPTS = 3;

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
                error: error.message
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
        throw new Error(
            "Gemini returned an empty response."
        );
    }

    let cleaned = text.trim();

    if (cleaned.startsWith("```")) {
        cleaned = cleaned
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
    }

    let parsed;

    try {
        parsed = JSON.parse(cleaned);
    } catch (error) {
        throw new Error(
            `Invalid Gemini JSON response: ${cleaned}`
        );
    }

    return parsed;
};

const validateAIDecision = (decision) => {
    if (!decision || typeof decision !== "object") {
        throw new Error(
            "Gemini returned an invalid decision."
        );
    }

    const action =
        String(decision.action || "")
            .trim()
            .toUpperCase();

    if (!ALLOWED_ACTIONS.has(action)) {
        throw new Error(
            `Gemini returned unsupported action: ${action}`
        );
    }

    const confidence =
        Number(decision.confidence);

    if (
        Number.isNaN(confidence) ||
        confidence < 0 ||
        confidence > 1
    ) {
        throw new Error(
            "Gemini returned invalid confidence."
        );
    }

    const summary =
        String(decision.summary || "").trim();

    const whyThisDecision =
        String(decision.whyThisDecision || "").trim();

    const whatHappensNext =
        String(decision.whatHappensNext || "").trim();

    const reason =
        String(decision.reason || "").trim();

    if (!summary) {
        throw new Error(
            "Gemini returned no payment summary."
        );
    }

    if (!whyThisDecision) {
        throw new Error(
            "Gemini returned no decision explanation."
        );
    }

    if (!whatHappensNext) {
        throw new Error(
            "Gemini returned no next-step explanation."
        );
    }

    if (!reason) {
        throw new Error(
            "Gemini returned no recovery reason."
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

        /* ---------------------------------------------------
         * STEP 1 — PAYMENT INSPECTION
         * --------------------------------------------------- */

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

        /* ---------------------------------------------------
         * STEP 2 — CUSTOMER HISTORY
         * --------------------------------------------------- */

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

        /* ---------------------------------------------------
         * STEP 3 — GEMINI DECISION
         * IMPORTANT: GEMINI IS CALLED EXACTLY ONCE
         * --------------------------------------------------- */

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

        const response =
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
                tool: "gemini_recovery_decision",

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

        /* ---------------------------------------------------
         * NON-RETRY ACTIONS
         * --------------------------------------------------- */

        if (
            aiDecision.action !==
            "RETRY_PAYMENT"
        ) {

            currentStep += 1;

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
                            actionResult.policyDecision ||
                            null,

                        executionResult:
                            actionResult.executionResult ||
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

            currentStep += 1;

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
                        aiDecision.action,

                    output: {
                        status: finalStatus,

                        requestedAction:
                            aiDecision.action,

                        executedAction:
                            actionResult.actionExecuted ||
                            aiDecision.action,

                        blocked:
                            actionResult.blocked ||
                            false,

                        success:
                            actionResult.success,

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

            return {
                success:
                    actionResult.success,

                status:
                    finalStatus,

                steps:
                    currentStep,

                aiDecision,

                action:
                    actionResult.actionExecuted ||
                    aiDecision.action,

                confidence:
                    aiDecision.confidence,

                reason:
                    aiDecision.reason,

                result:
                    actionResult
            };
        }

        /* ---------------------------------------------------
         * STEP 4 — RETRY POLICY + MULTI-ATTEMPT EXECUTION
         * --------------------------------------------------- */

        const retryStartStep =
            currentStep + 1;

        let latestActionResult = null;
        let recovered = false;

        console.log(
            `[Agent] Retry strategy selected — maximum ${MAX_RETRY_ATTEMPTS} attempts`
        );

        /*
         * The retry loop is deterministic.
         * Gemini is NOT called again.
         */
        for (
            let attempt = 1;
            attempt <= MAX_RETRY_ATTEMPTS;
            attempt++
        ) {

            currentStep =
                retryStartStep +
                (attempt - 1);

            console.log(
                `[Agent] Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} — retrying payment`
            );

            const actionResult =
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

            latestActionResult =
                actionResult;

            const executionResult =
                actionResult.executionResult ||
                {};

            const attemptSuccess =
                executionResult.result ===
                "RECOVERED" ||
                actionResult.success === true;

            /*
             * Important:
             *
             * executeRecoveryAction() returns success=true
             * when the payment is actually recovered.
             *
             * For a failed retry it returns success=false.
             */

            await addStep(
                agentRun,
                {
                    step: currentStep,
                    type: "ACTION",
                    tool: "retry_payment",

                    input: {
                        paymentId,
                        attemptNumber:
                            attempt,
                        maxAttempts:
                            MAX_RETRY_ATTEMPTS,
                        requestedAction:
                            aiDecision.action,
                        confidence:
                            aiDecision.confidence,
                        reason:
                            aiDecision.reason
                    },

                    output: {
                        attemptNumber:
                            attempt,

                        maxAttempts:
                            MAX_RETRY_ATTEMPTS,

                        success:
                            actionResult.success,

                        result:
                            executionResult.result ||
                            null,

                        transactionId:
                            executionResult.transactionId ||
                            null,

                        gatewayStatus:
                            executionResult.gatewayStatus ||
                            null,

                        recoveredAmount:
                            executionResult.recoveredAmount ||
                            0,

                        message:
                            actionResult.message ||
                            executionResult.message ||
                            null
                    },

                    confidence:
                        aiDecision.confidence,

                    reason:
                        attemptSuccess
                            ? "Payment recovery succeeded."
                            : `Recovery attempt ${attempt} failed.`
                }
            );

            if (attemptSuccess) {

                recovered = true;

                currentStep++;

                console.log(
                    `[Agent] Recovery succeeded on attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`
                );

                await addStep(
                    agentRun,
                    {
                        step: currentStep,
                        type: "TERMINAL",
                        tool: "retry_payment",

                        output: {
                            status: "RECOVERED",

                            attemptNumber:
                                attempt,

                            maxAttempts:
                                MAX_RETRY_ATTEMPTS,

                            recoveredAmount:
                                executionResult.recoveredAmount ||
                                0,

                            transactionId:
                                executionResult.transactionId ||
                                null,

                            message:
                                executionResult.message ||
                                "Payment recovered successfully."
                        },

                        confidence:
                            aiDecision.confidence,

                        reason:
                            `Payment recovered successfully on attempt ${attempt}.`
                    }
                );

                await agentRun.updateOne({
                    $set: {
                        status: "RECOVERED",
                        completedAt:
                            new Date()
                    }
                });

                return {
                    success: true,
                    status: "RECOVERED",
                    steps: currentStep,

                    aiDecision,

                    action:
                        "RETRY_PAYMENT",

                    confidence:
                        aiDecision.confidence,

                    reason:
                        aiDecision.reason,

                    result:
                        latestActionResult
                };
            }

            /*
             * If this wasn't the last attempt, continue.
             */
            if (
                attempt <
                MAX_RETRY_ATTEMPTS
            ) {

                console.log(
                    `[Agent] Attempt ${attempt} failed — moving to attempt ${attempt + 1}`
                );
            }
        }

        /* ---------------------------------------------------
         * CIRCUIT BREAKER — ALL RETRIES FAILED
         * --------------------------------------------------- */

        currentStep++;

        console.log(
            `[Agent] Maximum retry attempts reached — stopping recovery`
        );

        const stopResult =
            await executeTool(
                "stop_recovery",
                {
                    paymentId,
                    confidence:
                        aiDecision.confidence,
                    reason:
                        `Maximum retry limit of ${MAX_RETRY_ATTEMPTS} attempts reached after repeated recovery failures.`
                }
            );

        await addStep(
            agentRun,
            {
                step: currentStep,
                type: "POLICY",
                tool: "stop_recovery",

                input: {
                    paymentId,

                    attemptsMade:
                        MAX_RETRY_ATTEMPTS,

                    maxAttempts:
                        MAX_RETRY_ATTEMPTS,

                    reason:
                        `All ${MAX_RETRY_ATTEMPTS} recovery attempts failed.`
                },

                output: {
                    circuitBreakerTriggered:
                        true,

                    attemptsMade:
                        MAX_RETRY_ATTEMPTS,

                    stopResult
                },

                confidence:
                    aiDecision.confidence,

                reason:
                    `Recovery stopped after ${MAX_RETRY_ATTEMPTS} failed attempts.`
            }
        );

        currentStep++;

        await addStep(
            agentRun,
            {
                step: currentStep,
                type: "TERMINAL",
                tool: "stop_recovery",

                output: {
                    status: "STOPPED",

                    attemptsMade:
                        MAX_RETRY_ATTEMPTS,

                    maxAttempts:
                        MAX_RETRY_ATTEMPTS,

                    success: false,

                    message:
                        `Recovery stopped after ${MAX_RETRY_ATTEMPTS} unsuccessful payment attempts.`
                },

                confidence:
                    aiDecision.confidence,

                reason:
                    `Maximum retry limit reached without successful recovery.`
            }
        );

        await agentRun.updateOne({
            $set: {
                status: "STOPPED",
                completedAt:
                    new Date()
            }
        });

        return {
            success: false,

            status: "STOPPED",

            steps: currentStep,

            aiDecision,

            action:
                "STOP_RECOVERY",

            confidence:
                aiDecision.confidence,

            reason:
                `Maximum retry limit of ${MAX_RETRY_ATTEMPTS} attempts reached.`,

            attemptsMade:
                MAX_RETRY_ATTEMPTS,

            result:
                stopResult
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