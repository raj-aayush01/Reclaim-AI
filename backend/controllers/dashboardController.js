const Payment = require("../models/Payment");
const RecoveryLog = require("../models/RecoveryLog");

const getDashboardSummary = async (req, res) => {
    try {
        const { timeRange = "7D" } = req.query;

        const normalizedTimeRange = timeRange.toLowerCase();

        const now = new Date();
        let startDate = null;

        if (normalizedTimeRange === "today") {
            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );
        } else if (normalizedTimeRange === "7d") {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else if (normalizedTimeRange === "30d") {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
        }

        const dateQuery = startDate
            ? { createdAt: { $gte: startDate } }
            : {};

        const payments = await Payment.find(dateQuery);

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

        const recoveredPayments = payments.filter(
            payment => payment.status === "recovered"
        ).length;

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

        const recentLogs = await RecoveryLog.find(dateQuery)
            .sort({ createdAt: -1 })
            .limit(10);

        const recoveryFlow = [];

        if (startDate) {
            const rangeDays =
                normalizedTimeRange === "today"
                    ? 1
                    : normalizedTimeRange === "7d"
                        ? 7
                        : 30;

            for (let i = rangeDays - 1; i >= 0; i--) {
                const dayStart = new Date(now);
                dayStart.setHours(0, 0, 0, 0);
                dayStart.setDate(dayStart.getDate() - i);

                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);

                const dayPayments = payments.filter(payment => {
                    const createdAt = new Date(payment.createdAt);

                    return (
                        createdAt >= dayStart &&
                        createdAt < dayEnd
                    );
                });

                const dayAtRisk = dayPayments
                    .filter(
                        payment =>
                            payment.status === "failed" ||
                            payment.status === "pending" ||
                            payment.status === "escalated"
                    )
                    .reduce(
                        (sum, payment) => sum + payment.amount,
                        0
                    );

                const dayRecovered = dayPayments.reduce(
                    (sum, payment) =>
                        sum + (payment.recoveredAmount || 0),
                    0
                );

                recoveryFlow.push({
                    date: dayStart.toISOString().split("T")[0],
                    label: dayStart.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short"
                    }),
                    atRisk: dayAtRisk,
                    recovered: dayRecovered
                });
            }
        }

        res.status(200).json({
            timeRange,
            totalPayments,
            failedPayments,
            atRiskCount: atRiskPayments.length,
            totalAtRisk,
            recoveredCount: recoveredPayments,
            recoveredAmount,
            recoveryRate: Number(recoveryRate),

            actions: {
                retryCount,
                paymentLinkCount,
                escalatedCount,
                stoppedCount
            },

            recentLogs,
            recoveryFlow
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        res.status(500).json({
            message: "Failed to load dashboard",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardSummary
};