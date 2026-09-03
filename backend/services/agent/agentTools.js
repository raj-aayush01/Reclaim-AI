const Payment = require("../../models/Payment");
const Customer = require("../../models/Customer");
const RecoveryLog = require("../../models/RecoveryLog");

const { evaluateRecoveryPolicy } = require("../recoveryPolicy");

const {
    executeRecoveryAction,
    executeRecoveryRetryLoop
} = require("../recoveryExecutor");


// Convert a Mongoose payment document into the payment object returned to the frontend.

const serializePayment = (payment) => {
    return {
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
        paymentLinkId: payment.paymentLinkId,
        paymentLinkUrl: payment.paymentLinkUrl
    };
};


// Retrieve the current state of a payment.

const getPayment = async ({ paymentId }) => {

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
        return {
            success: false,
            error: "Payment not found"
        };
    }

    return {
        success: true,
        payment: serializePayment(payment)
    };
};


// Retrieve customer information and recent payment history.

const getCustomerHistory = async ({ customerId }) => {

    const customer = await Customer.findOne({ customerId });

    if (!customer) {
        return {
            success: false,
            error: "Customer not found"
        };
    }

    const payments = await Payment.find({ customerId })
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

        recentPayments: payments.map(
            payment => ({
                paymentId: payment.paymentId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                failureReason: payment.failureReason,
                attemptCount: payment.attemptCount,
                scenario: payment.scenario,
                recoveredAmount: payment.recoveredAmount
            })
        )
    };
};


/* RETRY_PAYMENT uses the shared retry-loop implementation
 * so voice recovery and the normal recovery agent follow the same retry behavior. */

const performRecoveryAction = async ({
    paymentId,
    action,
    confidence,
    reason
}) => {

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
        return {
            success: false,
            error: "Payment not found"
        };
    }

    const terminalPaymentStatuses = [
        "recovered",
        "escalated",
        "stopped"
    ];

    if (
        terminalPaymentStatuses.includes(
            payment.status
        )
    ) {
        return {
            success: false,

            executed: false,

            blocked: true,

            terminal: true,

            actionRequested:
                action,

            actionExecuted:
                null,

            policyDecision: {
                allowed: false,

                finalAction:
                    "STOP_RECOVERY",

                reason:
                    "Payment is already in a terminal state"
            },

            payment:
                serializePayment(payment),

            message:
                "Recovery cannot be executed because the payment has already been resolved."
        };
    }

    if (payment.status === "pending") {
        return {
            success: false,
            executed: false,
            blocked: true,
            terminal: false,
            actionRequested: action,
            actionExecuted: null,
            policyDecision: {
                allowed: false,
                finalAction: null,
                reason:
                    "Payment is awaiting completion of its payment link"
            },
            payment:
                serializePayment(payment),
            message:
                "Recovery cannot be started while the payment link is awaiting customer payment."
        };
    }

    const aiDecision = {
        action,
        confidence,
        reason
    };

    // First evaluate the recovery policy.

    const policyDecision =
        evaluateRecoveryPolicy(
            payment,
            aiDecision
        );

    // AI recommendation was NOT allowed.

    if (!policyDecision.allowed) {

        const finalAction =
            policyDecision.finalAction;

        const safePolicyActions = [
            "ESCALATE_TO_HUMAN",
            "STOP_RECOVERY"
        ];

        /* If policy redirected the request to a safe
         * action, execute that safe action. */

        if (
            safePolicyActions.includes(
                finalAction
            )
        ) {

            const executionResult =
                await executeRecoveryAction(
                    payment,
                    finalAction
                );

            await payment.save();

            const updatedPayment =
                serializePayment(payment);

            await RecoveryLog.create({
                paymentId:
                    payment.paymentId,

                customerId:
                    payment.customerId,

                aiAction:
                    action,

                aiReason:
                    reason,

                aiConfidence:
                    confidence,

                policyAllowed:
                    false,

                finalAction:
                    finalAction,

                executionResult:
                    executionResult.result ||
                    "UNKNOWN",

                recoveredAmount:
                    executionResult.recoveredAmount ||
                    0,

                message:
                    `AI action was overridden by policy. ${policyDecision.reason}`
            });

            return {
                success:
                    executionResult.success,

                executed: true,

                blocked: true,

                actionRequested:
                    action,

                actionExecuted:
                    finalAction,

                policyDecision: {
                    allowed: false,

                    finalAction:
                        finalAction,

                    reason:
                        policyDecision.reason
                },

                executionResult: {
                    ...(executionResult || {}),

                    actionRequested:
                        action,

                    actionExecuted:
                        finalAction,

                    result:
                        executionResult.result
                },

                payment:
                    updatedPayment,

                terminal: true,

                message:
                    `AI action was overridden by policy. ${policyDecision.reason}`
            };
        }

        // Policy completely blocked the action.

        await RecoveryLog.create({
            paymentId:
                payment.paymentId,

            customerId:
                payment.customerId,

            aiAction:
                action,

            aiReason:
                reason,

            aiConfidence:
                confidence,

            policyAllowed:
                false,

            finalAction:
                finalAction,

            executionResult:
                "BLOCKED",

            recoveredAmount:
                0,

            message:
                `Agent action blocked by policy: ${policyDecision.reason}`
        });

        return {
            success: false,

            executed: false,

            blocked: true,

            terminal: true,

            actionRequested:
                action,

            actionExecuted:
                null,

            policyDecision: {
                allowed: false,

                finalAction:
                    finalAction,

                reason:
                    policyDecision.reason
            },

            payment:
                serializePayment(payment),

            message:
                `Agent action blocked by policy: ${policyDecision.reason}`
        };
    }


    /*
     * AI recommendation was allowed.
     *
     * RETRY_PAYMENT is handled by the shared retry loop.
     *
     * This makes voice-confirmed retries behave the same
     * way as retries initiated by the normal recovery agent.
     */

    if (
        policyDecision.finalAction ===
        "RETRY_PAYMENT"
    ) {

        const retryResult =
            await executeRecoveryRetryLoop(
                payment,
                {
                    confidence,
                    reason
                }
            );

        /* Persist the final payment state after the
         * complete retry strategy has finished.
         */

        await payment.save();

        const updatedPayment =
            serializePayment(payment);

        /*
         * Log the overall recovery decision.
         */

        await RecoveryLog.create({
            paymentId:
                payment.paymentId,

            customerId:
                payment.customerId,

            aiAction:
                action,

            aiReason:
                reason,

            aiConfidence:
                confidence,

            policyAllowed:
                true,

            finalAction:
                retryResult.actionExecuted ||
                "RETRY_PAYMENT",

            executionResult:
                retryResult.result ||
                "UNKNOWN",

            recoveredAmount:
                retryResult.recoveredAmount ||
                0,

            message:
                retryResult.reason ||
                retryResult.executionResult?.message ||
                null
        });

        return {
            success:
                retryResult.success,

            executed: true,

            blocked: false,

            terminal:
                retryResult.result ===
                    "RECOVERED" ||
                retryResult.result ===
                    "STOPPED",

            actionRequested:
                action,

            actionExecuted:
                retryResult.actionExecuted,

            policyDecision: {
                allowed: true,

                finalAction:
                    "RETRY_PAYMENT",

                reason:
                    policyDecision.reason
            },

            executionResult: {
                ...(retryResult.executionResult || {}),

                actionRequested:
                    action,

                actionExecuted:
                    retryResult.actionExecuted,

                attemptsMade:
                    retryResult.attemptsMade,

                maxAttempts:
                    retryResult.maxAttempts,

                attemptsRemaining:
                    retryResult.attemptsRemaining,

                recoveredAmount:
                    retryResult.recoveredAmount,

                result:
                    retryResult.result
            },

            retryAttempts:
                retryResult.attempts,

            attemptsMade:
                retryResult.attemptsMade,

            maxAttempts:
                retryResult.maxAttempts,

            attemptsRemaining:
                retryResult.attemptsRemaining,

            payment:
                updatedPayment,

            message:
                retryResult.reason ||
                retryResult.executionResult?.message ||
                null
        };
    }


    // Non-retry actions are still executed exactly once.

    const executionResult =
        await executeRecoveryAction(
            payment,
            policyDecision.finalAction
        );

    await payment.save();

    const updatedPayment =
        serializePayment(payment);

    await RecoveryLog.create({
        paymentId:
            payment.paymentId,

        customerId:
            payment.customerId,

        aiAction:
            action,

        aiReason:
            reason,

        aiConfidence:
            confidence,

        policyAllowed:
            true,

        finalAction:
            policyDecision.finalAction,

        executionResult:
            executionResult.result ||
            "UNKNOWN",

        recoveredAmount:
            executionResult.recoveredAmount ||
            0,

        message:
            executionResult.message ||
            null
    });

    return {
        success:
            executionResult.success,

        executed: true,

        blocked: false,

        terminal:
            executionResult.result ===
                "RECOVERED" ||
            executionResult.result ===
                "ESCALATED" ||
            executionResult.result ===
                "STOPPED",

        actionRequested:
            action,

        actionExecuted:
            policyDecision.finalAction,

        policyDecision: {
            allowed: true,

            finalAction:
                policyDecision.finalAction,

            reason:
                policyDecision.reason
        },

        executionResult: {
            ...(executionResult || {}),

            actionRequested:
                action,

            actionExecuted:
                policyDecision.finalAction,

            result:
                executionResult.result
        },

        payment:
            updatedPayment,

        message:
            executionResult.message ||
            null
    };
};


// Retry a failed payment.

const retryPayment = async ({
    paymentId,
    confidence,
    reason
}) => {

    return performRecoveryAction({
        paymentId,

        action:
            "RETRY_PAYMENT",

        confidence,

        reason
    });
};


// Create an alternative payment link.

const createPaymentLink = async ({
    paymentId,
    confidence,
    reason
}) => {

    return performRecoveryAction({
        paymentId,

        action:
            "CREATE_PAYMENT_LINK",

        confidence,

        reason
    });
};


// Escalate the payment to human review.

const escalateToHuman = async ({
    paymentId,
    confidence,
    reason
}) => {

    return performRecoveryAction({
        paymentId,

        action:
            "ESCALATE_TO_HUMAN",

        confidence,

        reason
    });
};


// Stop automated recovery.

const stopRecovery = async ({
    paymentId,
    confidence,
    reason
}) => {

    return performRecoveryAction({
        paymentId,

        action:
            "STOP_RECOVERY",

        confidence,

        reason
    });
};


// Gemini tool declarations.

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

                    required: [
                        "paymentId"
                    ]
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

                    required: [
                        "customerId"
                    ]
                }
            },


            {
                name:
                    "retry_payment",

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
                name:
                    "create_payment_link",

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
                name:
                    "escalate_to_human",

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
                name:
                    "stop_recovery",

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


// Map tool names to their handlers.

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


// Execute an agent tool safely.

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

            error:
                error.message
        };
    }
};


module.exports = {
    toolDeclarations,
    executeTool,
    performRecoveryAction
};