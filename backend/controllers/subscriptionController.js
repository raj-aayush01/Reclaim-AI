const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");

// Get all subscriptions with optional status filtering
const getSubscriptions = async (req, res) => {
    try {
        const { status, limit = 50, page = 1 } = req.query;

        const query = {};

        if (status && status !== "ALL" && status !== "all") {
            query.status = status.toLowerCase();
        }

        const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 500);
        const pageNum = Math.max(Number(page) || 1, 1);
        const skip = (pageNum - 1) * limitNum;

        const [subscriptions, total] = await Promise.all([
            Subscription.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Subscription.countDocuments(query)
        ]);

        res.status(200).json({
            subscriptions,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("Get subscriptions error:", error);
        res.status(500).json({
            message: "Failed to retrieve subscriptions",
            error: error.message
        });
    }
};

// Get single subscription with customer info and linked payment
const getSubscriptionById = async (req, res) => {
    try {
        const { subscriptionId } = req.params;

        const subscription = await Subscription.findOne({
            subscriptionId
        }).lean();

        if (!subscription) {
            return res.status(404).json({
                message: `Subscription with ID '${subscriptionId}' not found`
            });
        }

        const [customer, currentPayment] = await Promise.all([
            Customer.findOne({
                customerId: subscription.customerId
            }).lean(),

            subscription.currentPaymentId
                ? Payment.findOne({
                    paymentId: subscription.currentPaymentId
                }).lean()
                : null
        ]);

        res.status(200).json({
            subscription,
            customer: customer || null,
            currentPayment: currentPayment || null
        });
    } catch (error) {
        console.error("Get subscription by ID error:", error);
        res.status(500).json({
            message: "Failed to retrieve subscription details",
            error: error.message
        });
    }
};

module.exports = {
    getSubscriptions,
    getSubscriptionById
};