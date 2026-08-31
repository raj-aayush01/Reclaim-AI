const RecoveryLog = require("../models/RecoveryLog");
const Payment = require("../models/Payment");

const getPolicyFirings = async (req, res) => {
    try {
        const {
            limit = 20,
            page = 1
        } = req.query;

        const limitNum = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const pageNum = Math.max(
            Number(page) || 1,
            1
        );

        const skip =
            (pageNum - 1) * limitNum;

        /*
         * A policy firing means the AI recommendation
         * was rejected/overridden by the recovery policy.
         */
        const query = {
            policyAllowed: false
        };

        const [
            logs,
            total
        ] = await Promise.all([
            RecoveryLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),

            RecoveryLog.countDocuments(query)
        ]);

        /*
         * RecoveryLog does not store payment amount,
         * so fetch the corresponding payments separately.
         */
        const paymentIds = [
            ...new Set(
                logs.map(
                    (log) => log.paymentId
                )
            )
        ];

        const payments =
            await Payment.find({
                paymentId: {
                    $in: paymentIds
                }
            })
            .select(
                "paymentId amount currency scenario"
            )
            .lean();

        const paymentMap =
            new Map(
                payments.map(
                    (payment) => [
                        payment.paymentId,
                        payment
                    ]
                )
            );

        const firings = logs.map((log) => {

            const payment =
                paymentMap.get(
                    log.paymentId
                );

            return {
                id: log._id,

                paymentId:
                    log.paymentId,

                customerId:
                    log.customerId,

                amount:
                    payment?.amount ?? 0,

                currency:
                    payment?.currency || "INR",

                scenario:
                    payment?.scenario || null,

                aiAction:
                    log.aiAction,

                aiConfidence:
                    log.aiConfidence,

                policyAllowed:
                    log.policyAllowed,

                finalAction:
                    log.finalAction,

                executionResult:
                    log.executionResult,

                recoveredAmount:
                    log.recoveredAmount,

                reason:
                    log.message ||
                    log.aiReason ||
                    "Policy rule was triggered.",

                createdAt:
                    log.createdAt
            };
        });

        res.status(200).json({
            success: true,

            firings,

            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages:
                    Math.ceil(
                        total / limitNum
                    )
            }
        });

    } catch (error) {

        console.error(
            "Get policy firings error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to retrieve policy firings",

            error:
                error.message
        });
    }
};

module.exports = {
    getPolicyFirings
};