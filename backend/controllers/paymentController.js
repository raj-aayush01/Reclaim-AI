const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const RecoveryLog = require("../models/RecoveryLog");

// Get all payments with optional filtering, search, status (including 'at_risk'), and recoveryAction filter
const getPayments = async (req, res) => {
    try {
        const { search, status, scenario, action, limit = 50, page = 1 } = req.query;

        const query = {};

        // Status filter (special handling for 'at_risk')
        if (status && status !== "ALL" && status !== "all") {
            if (status.toLowerCase() === "at_risk") {
                query.status = { $in: ["failed", "pending", "escalated"] };
            } else {
                query.status = status.toLowerCase();
            }
        }

        // Failure Scenario filter
        if (scenario && scenario !== "ALL" && scenario !== "all") {
            query.scenario = scenario;
        }

        // Recovery Action filter
        if (action && action !== "ALL" && action !== "all") {
            query.recoveryAction = action;
        }

        // Search query across paymentId, orderId, or customerId
        if (search && search.trim() !== "") {
            const searchRegex = new RegExp(search.trim(), "i");
            query.$or = [
                { paymentId: searchRegex },
                { orderId: searchRegex },
                { customerId: searchRegex },
                { failureReason: searchRegex }
            ];
        }

        const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 500);
        const pageNum = Math.max(Number(page) || 1, 1);
        const skip = (pageNum - 1) * limitNum;

        const [payments, total] = await Promise.all([
            Payment.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Payment.countDocuments(query)
        ]);

        res.status(200).json({
            payments,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("Get payments error:", error);
        res.status(500).json({
            message: "Failed to retrieve payments",
            error: error.message
        });
    }
};

// Get single payment details with customer & recovery log history
const getPaymentById = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findOne({ paymentId }).lean();

        if (!payment) {
            return res.status(404).json({
                message: `Payment with ID '${paymentId}' not found`
            });
        }

        const [customer, logs] = await Promise.all([
            Customer.findOne({ customerId: payment.customerId }).lean(),
            RecoveryLog.find({ paymentId }).sort({ createdAt: -1 }).lean()
        ]);

        res.status(200).json({
            payment,
            customer: customer || null,
            logs: logs || []
        });
    } catch (error) {
        console.error("Get payment by ID error:", error);
        res.status(500).json({
            message: "Failed to retrieve payment details",
            error: error.message
        });
    }
};

module.exports = {
    getPayments,
    getPaymentById
};
