const Payment = require("../models/Payment");
const RecoveryLog = require("../models/RecoveryLog");
const AgentRun = require("../models/AgentRun");

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

        const openExceptionsCount = await Payment.countDocuments({
            status: "escalated"
        });

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
            (sum, payment) => sum + (payment.recoveredAmount || 0),
            0
        );

        const recoveryRate =
            totalAtRisk > 0
                ? (
                      (recoveredAmount /
                          (recoveredAmount + totalAtRisk)) *
                      100
                  ).toFixed(2)
                : 0;

        const agentRuns = await AgentRun.find(dateQuery).lean();

        const executedActions = agentRuns.flatMap(run =>
            (run.steps || [])
                .filter(step => step.type === "ACTION")
                .map(step => {
                    const output = step.output || {};

                    const requestedAction =
                        output.requestedAction ||
                        step.input?.requestedAction ||
                        null;

                    const actionExecuted =
                        output.actionExecuted ||
                        output.executedAction ||
                        null;

                    /*
                     * The executed action is authoritative.
                     * Requested action is only a fallback for older
                     * AgentRun records that do not contain execution data.
                     */

                    if (actionExecuted) {
                        return [
                            "RETRY_PAYMENT",
                            "CREATE_PAYMENT_LINK",
                            "ESCALATE_TO_HUMAN",
                            "STOP_RECOVERY"
                        ].includes(actionExecuted)
                            ? actionExecuted
                            : null;
                    }

                    /*
                     * A retry can be evidenced by actual attempts even
                     * when actionExecuted was not persisted.
                     */

                    if (
                        requestedAction === "RETRY_PAYMENT" &&
                        (
                            Number(output.attemptsMade) > 0 ||
                            Number(output.retryAttempts?.length) > 0
                        )
                    ) {
                        return "RETRY_PAYMENT";
                    }

                    /*
                     * For legacy records without execution metadata,
                     * retain the requested action only when there is no
                     * conflicting execution result.
                     */

                    if (
                        requestedAction === "CREATE_PAYMENT_LINK" ||
                        requestedAction === "ESCALATE_TO_HUMAN" ||
                        requestedAction === "STOP_RECOVERY"
                    ) {
                        return requestedAction;
                    }

                    return null;
                })
                .filter(Boolean)
        );

        const retryCount = executedActions.filter(
            action => action === "RETRY_PAYMENT"
        ).length;

        const paymentLinkCount = executedActions.filter(
            action => action === "CREATE_PAYMENT_LINK"
        ).length;

        const escalatedCount = executedActions.filter(
            action => action === "ESCALATE_TO_HUMAN"
        ).length;

        const stoppedCount = executedActions.filter(
            action => action === "STOP_RECOVERY"
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

            openExceptionsCount,

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