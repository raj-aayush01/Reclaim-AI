const Payment = require("../models/Payment");
const RecoveryLog = require("../models/RecoveryLog");

const {
    evaluateRecoveryPolicy
} = require("./recoveryPolicy");

const {
    executeRecoveryAction
} = require("./recoveryExecutor");


const runRecoveryEngine = async () => {

    const payments = await Payment.find({
        status: "failed"
    });

    let totalAtRisk = 0;

    let retryCount = 0;
    let paymentLinkCount = 0;
    let stoppedCount = 0;
    let escalatedCount = 0;

    let recoveredAmount = 0;
    let pendingAmount = 0;
    let stoppedAmount = 0;
    let escalatedAmount = 0;
    let failedAmount = 0;


    for (const payment of payments) {

        // 1. Ask policy what should be done
        const decision = evaluateRecoveryPolicy(payment);

        payment.recoveryAction = decision.action;

        totalAtRisk += payment.amount;


        // Count recommended actions

        if (decision.action === "RETRY_PAYMENT") {
            retryCount++;
        }

        if (decision.action === "CREATE_PAYMENT_LINK") {
            paymentLinkCount++;
        }

        if (decision.action === "STOP_RECOVERY") {
            stoppedCount++;
        }

        if (decision.action === "ESCALATE_TO_HUMAN") {
            escalatedCount++;
        }


        // 2. Actually execute the action

        const result = await executeRecoveryAction(
            payment,
            decision.action
        );


        // 3. Track financial result

        if (result.result === "RECOVERED") {
            recoveredAmount += result.recoveredAmount;
        }

        if (result.result === "PENDING") {
            pendingAmount += payment.amount;
        }

        if (result.result === "STOPPED") {
            stoppedAmount += payment.amount;
        }

        if (result.result === "ESCALATED") {
            escalatedAmount += payment.amount;
        }

        if (result.result === "FAILED") {
            failedAmount += payment.amount;
        }


        // 4. Save everything to MongoDB

        await payment.save();
        await RecoveryLog.create({
            paymentId: payment.paymentId,
            customerId: payment.customerId,
            amount: payment.amount,
            action: decision.action,
            result: result.result,
            recoveredAmount: result.recoveredAmount || 0,
            reason: decision.reason,
            source: "POLICY"
        });
    }


    return {
        totalPayments: payments.length,

        totalAtRisk,

        actions: {
            retryCount,
            paymentLinkCount,
            stoppedCount,
            escalatedCount
        },

        financials: {
            recoveredAmount,
            pendingAmount,
            stoppedAmount,
            escalatedAmount,
            failedAmount
        }
    };
};


module.exports = {
    runRecoveryEngine
};