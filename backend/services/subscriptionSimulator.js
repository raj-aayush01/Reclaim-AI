const crypto = require("crypto");

const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");

const planNames = [
    "Starter",
    "Pro",
    "Business",
    "Enterprise"
];

const billingCycles = [
    "MONTHLY",
    "QUARTERLY",
    "YEARLY"
];

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

/*
 * Generates `count` subscriptions.
 *
 * Roughly 70% are seeded as "past_due" with a linked FAILED
 * renewal Payment (isSubscriptionRenewal: true) so the existing
 * recovery agent pipeline can act on them immediately.
 *
 * The remaining 30% are seeded as healthy "active" subscriptions
 * with no current failed payment, for realism.
 */
const generateSubscriptions = async (count = 60) => {

    const customers = [];
    const payments = [];
    const subscriptions = [];

    for (let i = 0; i < count; i++) {

        const customerId = `cust_${crypto.randomUUID()}`;

        const totalPayments = Math.floor(Math.random() * 13) + 3;

        const successfulPayments = Math.floor(
            Math.random() * (totalPayments + 1)
        );

        const failedPayments = totalPayments - successfulPayments;

        const isPastDue = Math.random() < 0.7;

        const subscriptionAmount = randomAmount(500, 5000);

        const totalSpent =
            subscriptionAmount * successfulPayments;

        customers.push({
            customerId,
            name: `Customer ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            totalPayments,
            successfulPayments,
            failedPayments,
            totalSpent
        });

        const subscriptionId = `sub_${crypto.randomUUID()}`;

        const now = new Date();

        const lastRenewalDate = new Date(
            now.getTime() - 1000 * 60 * 60 * 24 * (Math.floor(Math.random() * 10) + 1)
        );

        if (isPastDue) {

            const scenario = randomItem(scenarios);

            const scenarioData =
                generatePaymentScenario(scenario);

            const paymentId = `pay_${crypto.randomUUID()}`;

            payments.push({
                paymentId,

                orderId: `sub_order_${crypto.randomUUID()}`,

                customerId,

                amount: subscriptionAmount,

                currency: "INR",

                paymentMethod: randomItem(paymentMethods),

                status: "failed",

                failureReason: scenarioData.failureReason,

                attemptCount: scenarioData.attemptCount,

                recoveredAmount: 0,

                recoveryAction: null,

                scenario,

                subscriptionId,

                isSubscriptionRenewal: true
            });

            subscriptions.push({
                subscriptionId,
                customerId,
                planName: randomItem(planNames),
                amount: subscriptionAmount,
                currency: "INR",
                billingCycle: randomItem(billingCycles),
                status: "past_due",
                lastRenewalDate,
                nextRenewalDate: lastRenewalDate,
                failedRenewalCount:
                    Math.floor(Math.random() * 2) + 1,
                currentPaymentId: paymentId
            });

        } else {

            const nextRenewalDate = new Date(
                now.getTime() + 1000 * 60 * 60 * 24 * (Math.floor(Math.random() * 25) + 3)
            );

            subscriptions.push({
                subscriptionId,
                customerId,
                planName: randomItem(planNames),
                amount: subscriptionAmount,
                currency: "INR",
                billingCycle: randomItem(billingCycles),
                status: "active",
                lastRenewalDate,
                nextRenewalDate,
                failedRenewalCount: 0,
                currentPaymentId: null
            });
        }
    }

    await Customer.insertMany(customers);

    if (payments.length > 0) {
        await Payment.insertMany(payments);
    }

    await Subscription.insertMany(subscriptions);

    return {
        generated: subscriptions.length,

        pastDue: subscriptions.filter(
            (subscription) => subscription.status === "past_due"
        ).length,

        active: subscriptions.filter(
            (subscription) => subscription.status === "active"
        ).length
    };
};

module.exports = {
    generateSubscriptions
};