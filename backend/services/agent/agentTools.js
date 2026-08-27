const Payment = require("../../models/Payment");
const Customer = require("../../models/Customer");

const {
    evaluateRecoveryPolicy
} = require("../recoveryPolicy");

const {
    executeRecoveryAction
} = require("../recoveryExecutor");


// READ TOOLS

const getPayment = async ({ paymentId }) => {

    const payment = await Payment.findOne({
        paymentId
    });

    if (!payment) {
        return {
            success: false,
            error: "Payment not found"
        };
    }

    return {
        success: true,

        payment: {
            paymentId: payment.paymentId,
            orderId: payment.orderId,
            customerId: payment.customerId,

            amount: payment.amount,
            currency: payment.currency,

            paymentMethod: payment.paymentMethod,

            status: payment.status,
            failureReason: payment.failureReason,

            attemptCount: payment.attemptCount,
            recoveredAmount: payment.recoveredAmount,

            scenario: payment.scenario,

            recoveryAction: payment.recoveryAction,
            recoveryResult: payment.recoveryResult,

            paymentLinkId: payment.paymentLinkId
        }
    };
};


const getCustomerHistory = async ({ customerId }) => {

    const customer = await Customer.findOne({
        customerId
    });

    if (!customer) {
        return {
            success: false,
            error: "Customer not found"
        };
    }

    const payments = await Payment.find({
        customerId
    })
        .sort({ createdAt: -1 })
        .limit(10);

    return {
        success: true,

        customer: {
            customerId: customer.customerId,
            name: customer.name,

            totalPayments: customer.totalPayments,
            successfulPayments: customer.successfulPayments,
            failedPayments: customer.failedPayments,
            totalSpent: customer.totalSpent
        },

        recentPayments: payments.map(payment => ({
            paymentId: payment.paymentId,
            amount: payment.amount,
            currency: payment.currency,

            status: payment.status,
            failureReason: payment.failureReason,

            attemptCount: payment.attemptCount,
            scenario: payment.scenario,

            recoveredAmount: payment.recoveredAmount
        }))
    };
};


// ACTION TOOL

const performRecoveryAction = async ({
    paymentId,
    action,
    confidence,
    reason
}) => {

    const payment = await Payment.findOne({
        paymentId
    });

    if (!payment) {
        return {
            success: false,
            error: "Payment not found"
        };
    }

    const aiDecision = {
        action,
        confidence,
        reason
    };

    const policyDecision = evaluateRecoveryPolicy(
        payment,
        aiDecision
    );

    if (!policyDecision.allowed) {

        // Execute the policy-mandated terminal action.
        if (
            policyDecision.finalAction === "ESCALATE_TO_HUMAN" &&
            action !== "ESCALATE_TO_HUMAN"
        ) {

            const executionResult =
                await executeRecoveryAction(
                    payment,
                    "ESCALATE_TO_HUMAN"
                );

            await payment.save();

            return {
                success: executionResult.success,

                executed: true,

                blocked: true,

                actionRequested: action,

                actionExecuted: "ESCALATE_TO_HUMAN",

                policyDecision: {
                    allowed: false,
                    finalAction:
                        "ESCALATE_TO_HUMAN",
                    reason:
                        policyDecision.reason
                },

                executionResult,

                terminal: true,

                message:
                    `Action blocked. Payment escalated because: ${policyDecision.reason}`
            };
        }

        // Execute the policy-mandated stop action.
        if (
            policyDecision.finalAction === "STOP_RECOVERY" &&
            action !== "STOP_RECOVERY"
        ) {

            const executionResult =
                await executeRecoveryAction(
                    payment,
                    "STOP_RECOVERY"
                );

            await payment.save();

            return {
                success: executionResult.success,

                executed: true,

                blocked: true,

                actionRequested: action,

                actionExecuted: "STOP_RECOVERY",

                policyDecision: {
                    allowed: false,
                    finalAction:
                        "STOP_RECOVERY",
                    reason:
                        policyDecision.reason
                },

                executionResult,

                terminal: true,

                message:
                    `Action blocked. Recovery stopped because: ${policyDecision.reason}`
            };
        }

        return {
            success: false,

            executed: false,

            blocked: true,

            terminal: true,

            actionRequested: action,

            policyDecision: {
                allowed: false,
                finalAction:
                    policyDecision.finalAction,
                reason:
                    policyDecision.reason
            },

            message:
                `Agent action blocked by policy: ${policyDecision.reason}`
        };
    }

    const executionResult =
        await executeRecoveryAction(
            payment,
            policyDecision.finalAction
        );

    await payment.save();

    return {
        success: executionResult.success,

        executed: true,

        blocked: false,

        terminal:
            executionResult.result === "RECOVERED" ||
            executionResult.result === "ESCALATED" ||
            executionResult.result === "STOPPED",

        actionRequested: action,

        actionExecuted:
            policyDecision.finalAction,

        policyDecision: {
            allowed: true,
            reason:
                policyDecision.reason
        },

        executionResult
    };
};


// TOOL WRAPPERS

const retryPayment = async ({
    paymentId,
    confidence,
    reason
}) => {

    return performRecoveryAction({
        paymentId,
        action: "RETRY_PAYMENT",
        confidence,
        reason
    });
};


const createPaymentLink = async ({
    paymentId,
    confidence,
    reason
}) => {

    return performRecoveryAction({
        paymentId,
        action: "CREATE_PAYMENT_LINK",
        confidence,
        reason
    });
};


const escalateToHuman = async ({
    paymentId,
    confidence,
    reason
}) => {

    return performRecoveryAction({
        paymentId,
        action: "ESCALATE_TO_HUMAN",
        confidence,
        reason
    });
};


const stopRecovery = async ({
    paymentId,
    confidence,
    reason
}) => {

    return performRecoveryAction({
        paymentId,
        action: "STOP_RECOVERY",
        confidence,
        reason
    });
};


// GEMINI TOOL DECLARATIONS

const toolDeclarations = [
    {
        functionDeclarations: [

            // READ: PAYMENT

            {
                name: "get_payment",

                description:
                    "Retrieve the current state and details of a payment. Use this before taking a recovery action.",

                parameters: {
                    type: "object",

                    properties: {
                        paymentId: {
                            type: "string",
                            description:
                                "The unique payment ID to inspect."
                        }
                    },

                    required: [
                        "paymentId"
                    ]
                }
            },

            // READ: CUSTOMER HISTORY

            {
                name: "get_customer_history",

                description:
                    "Retrieve customer information and recent payment history. Use this to understand the customer's historical payment behavior.",

                parameters: {
                    type: "object",

                    properties: {
                        customerId: {
                            type: "string",
                            description:
                                "The unique customer ID."
                        }
                    },

                    required: [
                        "customerId"
                    ]
                }
            },


            // ACTION: RETRY

            {
                name: "retry_payment",

                description:
                    "Request a payment retry. The recovery policy will validate whether retrying this payment is allowed before execution.",

                parameters: {
                    type: "object",

                    properties: {

                        paymentId: {
                            type: "string",
                            description:
                                "The payment to retry."
                        },

                        confidence: {
                            type: "number",
                            description:
                                "The agent's confidence in this recovery decision, between 0 and 1."
                        },

                        reason: {
                            type: "string",
                            description:
                                "Why retrying this payment is the appropriate next action."
                        }
                    },

                    required: [
                        "paymentId",
                        "confidence",
                        "reason"
                    ]
                }
            },

            // ACTION: PAYMENT LINK

            {
                name: "create_payment_link",

                description:
                    "Request creation of an alternative payment link. The recovery policy will validate whether this action is allowed.",

                parameters: {
                    type: "object",

                    properties: {

                        paymentId: {
                            type: "string",
                            description:
                                "The payment for which the payment link should be created."
                        },

                        confidence: {
                            type: "number",
                            description:
                                "The agent's confidence in this recovery decision, between 0 and 1."
                        },

                        reason: {
                            type: "string",
                            description:
                                "Why creating a payment link is the appropriate next action."
                        }
                    },

                    required: [
                        "paymentId",
                        "confidence",
                        "reason"
                    ]
                }
            },


            // ACTION: HUMAN ESCALATION

            {
                name: "escalate_to_human",

                description:
                    "Escalate the payment to human review when automated recovery is unsafe, blocked, or uncertain.",

                parameters: {
                    type: "object",

                    properties: {

                        paymentId: {
                            type: "string",
                            description:
                                "The payment requiring human review."
                        },

                        confidence: {
                            type: "number",
                            description:
                                "The agent's confidence in the escalation decision, between 0 and 1."
                        },

                        reason: {
                            type: "string",
                            description:
                                "Why human intervention is required."
                        }
                    },

                    required: [
                        "paymentId",
                        "confidence",
                        "reason"
                    ]
                }
            },

            // ACTION: STOP

            {
                name: "stop_recovery",

                description:
                    "Stop automated recovery when no safe recovery path remains or continuing would risk additional loss.",

                parameters: {
                    type: "object",

                    properties: {

                        paymentId: {
                            type: "string",
                            description:
                                "The payment whose recovery should stop."
                        },

                        confidence: {
                            type: "number",
                            description:
                                "The agent's confidence in stopping recovery, between 0 and 1."
                        },

                        reason: {
                            type: "string",
                            description:
                                "Why recovery should be stopped."
                        }
                    },

                    required: [
                        "paymentId",
                        "confidence",
                        "reason"
                    ]
                }
            }

        ]
    }
];


// Gemini gives us a function name.
// We map that name to a real JavaScript function.


const toolHandlers = {

    get_payment:
        getPayment,

    get_customer_history:
        getCustomerHistory,

    retry_payment:
        retryPayment,

    create_payment_link:
        createPaymentLink,

    escalate_to_human:
        escalateToHuman,

    stop_recovery:
        stopRecovery
};


const executeTool = async (
    functionName,
    args
) => {

    const handler =
        toolHandlers[functionName];

    if (!handler) {

        return {
            success: false,
            error:
                `Unknown agent tool: ${functionName}`
        };
    }

    try {

        return await handler(args);

    } catch (error) {

        console.error(
            `Agent tool error [${functionName}]:`,
            error
        );

        return {
            success: false,
            error: error.message
        };
    }
};


module.exports = {

    toolDeclarations,

    executeTool

};