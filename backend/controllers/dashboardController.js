const Payment = require("../models/Payment");
const RecoveryLog = require("../models/RecoveryLog");

const getDashboardSummary = async (req, res) => {
    try {

        const payments = await Payment.find();

        const totalPayments = payments.length;

        const failedPayments = payments.filter(
            payment => payment.status === "failed"
        ).length;

        const atRiskPayments = payments.filter(
            payment =>
                payment.status === "failed" ||
                payment.status === "pending" ||
                payment.status === "escalated"
        );

        const totalAtRisk = atRiskPayments.reduce(
            (sum, payment) => sum + payment.amount,
            0
        );

        const recoveredAmount = payments.reduce(
            (sum, payment) =>
                sum + (payment.recoveredAmount || 0),
            0
        );

        const recoveryRate =
            totalAtRisk > 0
                ? ((recoveredAmount / totalAtRisk) * 100).toFixed(2)
                : 0;

        const retryCount = payments.filter(
            payment =>
                payment.recoveryAction === "RETRY_PAYMENT"
        ).length;

        const paymentLinkCount = payments.filter(
            payment =>
                payment.recoveryAction === "CREATE_PAYMENT_LINK"
        ).length;

        const escalatedCount = payments.filter(
            payment =>
                payment.recoveryAction === "ESCALATE_TO_HUMAN"
        ).length;

        const stoppedCount = payments.filter(
            payment =>
                payment.recoveryAction === "STOP_RECOVERY"
        ).length;

        const recentLogs = await RecoveryLog.find()
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            totalPayments,
            failedPayments,
            totalAtRisk,
            recoveredAmount,
            recoveryRate: Number(recoveryRate),

            actions: {
                retryCount,
                paymentLinkCount,
                escalatedCount,
                stoppedCount
            },

            recentLogs
        });

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        res.status(500).json({
            message: "Failed to load dashboard",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardSummary
};