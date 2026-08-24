const crypto = require("crypto");

const Customer = require("../models/Customer");
const Payment = require("../models/Payment");

const paymentMethods = ["upi", "card", "netbanking", "wallet"];

const scenarios = [
    "TEMPORARY_FAILURE",
    "CARD_DECLINED",
    "REPEATED_FAILURE",
    "HIGH_VALUE_FAILURE",
    "UNKNOWN_FAILURE"
];

const randomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

const randomAmount = (min = 500, max = 20000) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generatePaymentScenario = (scenario) => {
    switch (scenario) {
        case "TEMPORARY_FAILURE":
            return {
                failureReason: "bank_timeout",
                attemptCount: 0,
                amount: randomAmount()
            };

        case "CARD_DECLINED":
            return {
                failureReason: "card_declined",
                attemptCount: 1,
                amount: randomAmount()
            };

        case "REPEATED_FAILURE":
            return {
                failureReason: "bank_timeout",
                attemptCount: 3,
                amount: randomAmount()
            };

        case "HIGH_VALUE_FAILURE":
            return {
                failureReason: "unknown",
                attemptCount: 1,
                amount: randomAmount(20000, 50000)
            };

        case "UNKNOWN_FAILURE":
            return {
                failureReason: "unknown",
                attemptCount: 0,
                amount: randomAmount()
            };
    }
};

const generateCustomersAndPayments = async (count = 200) => {
    const customers = [];
    const payments = [];

    for (let i = 0; i < count; i++) {

        const customerId = `cust_${crypto.randomUUID()}`;

        const totalPayments = Math.floor(Math.random() * 13) + 3;

        const successfulPayments = Math.floor(
            Math.random() * (totalPayments + 1)
        );

        const failedPayments = totalPayments - successfulPayments;

        const totalSpent =
            randomAmount() * successfulPayments;

        customers.push({
            customerId,
            name: `Customer ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            totalPayments,
            successfulPayments,
            failedPayments,
            totalSpent
        });

        const scenario = randomItem(scenarios);

        const scenarioData =
            generatePaymentScenario(scenario);

        payments.push({
            paymentId: `pay_${crypto.randomUUID()}`,

            orderId: `order_${crypto.randomUUID()}`,

            customerId,

            amount: scenarioData.amount,

            currency: "INR",

            paymentMethod: randomItem(paymentMethods),

            status: "failed",

            failureReason: scenarioData.failureReason,

            attemptCount: scenarioData.attemptCount,

            recoveredAmount: 0,

            recoveryAction: null,

            scenario
        });
    }

    await Customer.insertMany(customers);
    await Payment.insertMany(payments);

    return {
        generated: payments.length,

        totalValue: payments.reduce(
            (sum, payment) => sum + payment.amount,
            0
        ),

        scenarios: payments.reduce((result, payment) => {
            result[payment.scenario] =
                (result[payment.scenario] || 0) + 1;

            return result;
        }, {})
    };
};

module.exports = {
    generateCustomersAndPayments
};