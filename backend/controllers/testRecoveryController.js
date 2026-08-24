const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const crypto = require("crypto");

const createTestPayment = async (req, res) => {
    try {

        const {
            scenario,
            amount,
            attemptCount = 1,
            failureReason
        } = req.body;

        const customerId = `test_customer_${crypto.randomUUID()}`;

        const customer = await Customer.create({
            customerId,
            name: "Test Customer",
            email: `${customerId}@example.com`,
            totalPayments: 1,
            successfulPayments: 0,
            failedPayments: 1,
            totalSpent: 0
        });

        const payment = await Payment.create({
            paymentId: `pay_${crypto.randomUUID()}`,
            orderId: `order_${crypto.randomUUID()}`,
            customerId,
            amount,
            currency: "INR",
            paymentMethod: "card",
            status: "failed",
            failureReason,
            attemptCount,
            recoveredAmount: 0,
            recoveryAction: null,
            scenario
        });

        res.status(201).json({
            message: "Test payment created",
            customer,
            payment
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to create test payment",
            error: error.message
        });
    }
};

module.exports = {
    createTestPayment
};