const Payment = require("../../models/Payment");
const Customer = require("../../models/Customer");
const RecoveryLog = require("../../models/RecoveryLog");

const {
    evaluateRecoveryPolicy
} = require("../recoveryPolicy");

const {
    executeRecoveryAction
} = require("../recoveryExecutor");

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
        const finalAction = policyDecision.finalAction;

        const safePolicyActions = [
            "ESCALATE_TO_HUMAN",
            "STOP_RECOVERY"
        ];

        if (safePolicyActions.includes(finalAction)) {
            const executionResult =
                await executeRecoveryAction(
                    payment,
                    finalAction
                );

            await payment.save();

            await RecoveryLog.create({
                paymentId: payment.paymentId,
                customerId: payment.customerId,
                aiAction: action,
                aiReason: reason,
                aiConfidence: confidence,
                policyAllowed: false,
                finalAction,
                executionResult:
                    executionResult.result || "UNKNOWN",
                recoveredAmount:
                    executionResult.recoveredAmount || 0,
                message:
                    `AI action was overridden by policy. ${policyDecision.reason}`
            });

            return {
                success: executionResult.success,
                executed: true,
                blocked: true,
                actionRequested: action,
                actionExecuted: finalAction,
                policyDecision: {
                    allowed: false,
                    finalAction,
                    reason: policyDecision.reason
                },
                executionResult,
                terminal: true,
                message:
                    `AI action was overridden by policy. ${policyDecision.reason}`
            };
        }

        await RecoveryLog.create({
            paymentId: payment.paymentId,
            customerId: payment.customerId,
            aiAction: action,
            aiReason: reason,
            aiConfidence: confidence,
            policyAllowed: false,
            finalAction,
            executionResult: "BLOCKED",
            recoveredAmount: 0,
            message:
                `Agent action blocked by policy: ${policyDecision.reason}`
        });

        return {
            success: false,
            executed: false,
            blocked: true,
            terminal: true,
            actionRequested: action,
            actionExecuted: null,
            policyDecision: {
                allowed: false,
                finalAction,
                reason: policyDecision.reason
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

    await RecoveryLog.create({
        paymentId: payment.paymentId,
        customerId: payment.customerId,
        aiAction: action,
        aiReason: reason,
        aiConfidence: confidence,
        policyAllowed: true,
        finalAction: policyDecision.finalAction,
        executionResult:
            executionResult.result || "UNKNOWN",
        recoveredAmount:
            executionResult.recoveredAmount || 0,
        message:
            executionResult.message || null
    });

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
            reason: policyDecision.reason
        },
        executionResult
    };
};

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

const toolDeclarations = [
    {
        functionDeclarations: [
            {
                name: "get_payment",
                description:
                    "Retrieve the current state and details of a payment.",
                parameters: {
                    type: "object",
                    properties: {
                        paymentId: {
                            type: "string",
                            description:
                                "The unique payment ID to inspect."
                        }
                    },
                    required: ["paymentId"]
                }
            },
            {
                name: "get_customer_history",
                description:
                    "Retrieve customer information and recent payment history.",
                parameters: {
                    type: "object",
                    properties: {
                        customerId: {
                            type: "string",
                            description:
                                "The unique customer ID."
                        }
                    },
                    required: ["customerId"]
                }
            },
            {
                name: "retry_payment",
                description:
                    "Request a payment retry. The recovery policy validates whether retrying is allowed.",
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
                                "The agent confidence between 0 and 1."
                        },
                        reason: {
                            type: "string",
                            description:
                                "Why retrying is appropriate."
                        }
                    },
                    required: [
                        "paymentId",
                        "confidence",
                        "reason"
                    ]
                }
            },
            {
                name: "create_payment_link",
                description:
                    "Request an alternative payment link. The recovery policy validates whether this action is allowed.",
                parameters: {
                    type: "object",
                    properties: {
                        paymentId: {
                            type: "string",
                            description:
                                "The payment for which the link should be created."
                        },
                        confidence: {
                            type: "number",
                            description:
                                "The agent confidence between 0 and 1."
                        },
                        reason: {
                            type: "string",
                            description:
                                "Why creating a payment link is appropriate."
                        }
                    },
                    required: [
                        "paymentId",
                        "confidence",
                        "reason"
                    ]
                }
            },
            {
                name: "escalate_to_human",
                description:
                    "Escalate the payment to human review when automated recovery is unsafe.",
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
                                "The agent confidence between 0 and 1."
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
            {
                name: "stop_recovery",
                description:
                    "Stop automated recovery when no safe recovery path remains.",
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
                                "The agent confidence between 0 and 1."
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

const toolHandlers = {
    get_payment: getPayment,
    get_customer_history: getCustomerHistory,
    retry_payment: retryPayment,
    create_payment_link: createPaymentLink,
    escalate_to_human: escalateToHuman,
    stop_recovery: stopRecovery
};

const executeTool = async (functionName, args) => {
    const handler = toolHandlers[functionName];

    if (!handler) {
        return {
            success: false,
            error: `Unknown agent tool: ${functionName}`
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