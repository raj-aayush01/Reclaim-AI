const Payment = require("../../models/Payment");

const { runRecoveryAgent } = require("./recoveryAgent");

const runAgentBatch = async (limit = 10) => {

    const payments = await Payment.find({ status: "failed" }).limit(limit);

    const results = [];

    for (const payment of payments) {
        console.log(`\n[Batch] Starting agent for ${payment.paymentId}`);

        try {

            const result =await runRecoveryAgent( payment.paymentId );

            results.push({
                paymentId: payment.paymentId,
                success: result.success,
                status: result.status,
                steps: result.steps
            });

        } catch (error) {

            console.error( `[Batch] Agent failed for ${payment.paymentId}:`, error.message );

            results.push({
                paymentId: payment.paymentId,
                success: false,
                status: "FAILED",
                error: error.message
            });
        }
    }

    return {
        totalPayments: payments.length,
        processed: results.length,
        results
    };
};

module.exports = {
    runAgentBatch
};