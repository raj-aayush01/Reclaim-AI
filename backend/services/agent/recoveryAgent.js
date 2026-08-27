require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const crypto = require("crypto");

const AgentRun = require("../../models/AgentRun");

const {
    toolDeclarations,
    executeTool
} = require("./agentTools");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MAX_STEPS = 5;

const SYSTEM_INSTRUCTION = `
You are Reclaim-AI Recovery Agent.

Your goal is to safely recover the specified failed payment.

You are an autonomous recovery agent operating inside a bounded financial recovery system.

You can inspect payment information, inspect customer history, retry payments, create payment links, escalate to a human, and stop recovery.

Recovery strategy:

1. TEMPORARY_FAILURE
   - Retry the payment when retry attempts remain.
   - Do not create a payment link for this scenario.
   - If retries are exhausted, stop recovery.

2. CARD_DECLINED
   - Do not retry the declined card.
   - Create a payment link so the customer can use an alternative payment method.

3. REPEATED_FAILURE
   - Do not retry again when the retry limit has been reached.
   - Stop recovery.

4. HIGH_VALUE_FAILURE
   - Do not attempt automated payment recovery.
   - Escalate to a human.

5. UNKNOWN_FAILURE
   - Do not guess a recovery strategy.
   - Escalate to a human.

Rules:

1. Always inspect the payment before taking a recovery action.
2. Use customer history when it is relevant.
3. Base decisions on the actual tool results.
4. Never invent payment information or tool results.
5. Never assume an action succeeded.
6. After every recovery action, inspect the returned result.
7. If an action fails, reconsider the next safe action.
8. Never bypass or override the recovery policy.
9. Never repeatedly perform the same failed action without justification.
10. Stop when the payment is recovered.
11. Escalate when automated recovery is unsafe or blocked.
12. Stop recovery when no safe recovery path remains.
13. Maximum recovery steps: 5.

Your objective is to recover the payment safely, not merely recommend an action.

Every recovery action must include:
- a confidence value between 0 and 1
- a concise reason explaining the decision
`;

const runRecoveryAgent = async (paymentId) => {

    const runId = `run_${crypto.randomUUID()}`;

    const agentRun = await AgentRun.create({
        runId,
        paymentId,
        status: "RUNNING"
    });

    const addStep = async ({
        step,
        type,
        tool = null,
        input = null,
        output = null,
        confidence = null,
        reason = null
    }) => {

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

    const markFailed = async (error, step) => {

        await addStep({
            step,
            type: "TERMINAL",
            output: {
                status: "FAILED",
                error: error.message
            }
        });

        await agentRun.updateOne({
            $set: {
                status: "FAILED",
                completedAt: new Date()
            }
        });
    };

    const contents = [
        {
            role: "user",
            parts: [
                {
                    text: `
Start a recovery run for payment ${paymentId}.

Goal:
Recover this payment safely.

Begin by inspecting the payment state.
`
                }
            ]
        }
    ];

    let step = 0;

    try {

        while (step < MAX_STEPS) {

            step += 1;

            console.log(
                `\n[Agent] Step ${step}/${MAX_STEPS}`
            );

            const response = await ai.models.generateContent({
                model: "gemini-3.6-flash",

                contents,

                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    tools: toolDeclarations
                }
            });

            const functionCalls =
                response.functionCalls || [];

            if (functionCalls.length === 0) {

                await addStep({
                    step,
                    type: "TERMINAL",
                    output: {
                        status: "COMPLETED",
                        message: response.text || null
                    }
                });

                await agentRun.updateOne({
                    $set: {
                        status: "COMPLETED",
                        completedAt: new Date()
                    }
                });

                return {
                    success: true,
                    status: "COMPLETED",
                    steps: step,
                    message: response.text || null
                };
            }

            contents.push(
                response.candidates[0].content
            );

            const functionResponses = [];

            for (const functionCall of functionCalls) {

                const args =
                    functionCall.args || {};

                console.log(
                    `[Agent] Tool: ${functionCall.name}`
                );

                console.log(
                    `[Agent] Args:`,
                    args
                );

                await addStep({
                    step,
                    type: "DECISION",
                    tool: functionCall.name,
                    input: args,
                    confidence:
                        args.confidence ?? null,
                    reason:
                        args.reason ?? null
                });

                let result;

                try {

                    result = await executeTool(
                        functionCall.name,
                        args
                    );

                } catch (error) {

                    await addStep({
                        step,
                        type: "RESULT",
                        tool: functionCall.name,
                        output: {
                            success: false,
                            error: error.message
                        }
                    });

                    throw error;
                }

                console.log(
                    `[Agent] Result:`,
                    result
                );

                if (result.policyDecision) {

                    await addStep({
                        step,
                        type: "POLICY",
                        tool: functionCall.name,
                        input: args,
                        output: result.policyDecision,
                        confidence:
                            args.confidence ?? null,
                        reason:
                            result.policyDecision.reason ||
                            null
                    });
                }

                await addStep({
                    step,
                    type: "ACTION",
                    tool: functionCall.name,
                    input: args,
                    output: result,
                    confidence:
                        args.confidence ?? null,
                    reason:
                        args.reason ?? null
                });

                if (result.executionResult) {

                    await addStep({
                        step,
                        type: "RESULT",
                        tool: functionCall.name,
                        output: result.executionResult
                    });
                }

                if (
                    functionCall.name === "get_payment" ||
                    functionCall.name === "get_customer_history"
                ) {

                    await addStep({
                        step,
                        type: "OBSERVATION",
                        tool: functionCall.name,
                        input: args,
                        output: result
                    });
                }

                if (result.terminal === true) {

                    const finalStatus =
                        result.executionResult?.result ||
                        "TERMINAL";

                    await addStep({
                        step,
                        type: "TERMINAL",
                        tool:
                            result.actionExecuted ||
                            functionCall.name,
                        output: {
                            status: finalStatus,
                            message:
                                result.message || null
                        }
                    });

                    await agentRun.updateOne({
                        $set: {
                            status: finalStatus,
                            completedAt: new Date()
                        }
                    });

                    return {
                        success: result.success,
                        status: finalStatus,
                        steps: step,
                        action:
                            result.actionExecuted ||
                            functionCall.name,
                        result
                    };
                }

                functionResponses.push({
                    functionResponse: {
                        name: functionCall.name,

                        response: {
                            result
                        },

                        id: functionCall.id
                    }
                });
            }

            contents.push({
                role: "user",
                parts: functionResponses
            });
        }

        await addStep({
            step: MAX_STEPS,
            type: "TERMINAL",
            output: {
                status: "MAX_STEPS_REACHED"
            }
        });

        await agentRun.updateOne({
            $set: {
                status: "MAX_STEPS_REACHED",
                completedAt: new Date()
            }
        });

        return {
            success: false,
            status: "MAX_STEPS_REACHED",
            steps: MAX_STEPS,
            message:
                "Agent reached the maximum recovery step limit."
        };

    } catch (error) {

        console.error(
            "[Agent] Recovery error:",
            error
        );

        await markFailed(error, step);

        throw error;
    }
};

module.exports = {
    runRecoveryAgent
};