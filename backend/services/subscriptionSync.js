const Subscription = require("../models/Subscription");

/*
 * Called once, right after the existing recovery agent
 * pipeline finishes for a payment.
 *
 * This makes NO additional Gemini calls — it only reads
 * the already-computed payment outcome and updates the
 * linked Subscription document to match.
 */
const syncSubscriptionAfterRecovery = async (payment) => {

    if (!payment) {
        return null;
    }

    if (!payment.isSubscriptionRenewal) {
        return null;
    }

    if (!payment.subscriptionId) {
        return null;
    }

    const subscription = await Subscription.findOne({
        subscriptionId: payment.subscriptionId
    });

    if (!subscription) {
        return null;
    }

    switch (payment.status) {

        case "recovered": {

            subscription.status = "active";
            subscription.failedRenewalCount = 0;
            subscription.lastRenewalDate = new Date();
            subscription.currentPaymentId = null;

            break;
        }

        case "pending": {

            /*
             * A payment link was created. The subscription
             * stays past_due until the customer completes
             * the payment.
             */
            subscription.status = "past_due";

            break;
        }

        case "escalated": {

            subscription.status = "past_due";

            break;
        }

        case "stopped": {

            subscription.status = "canceled";

            break;
        }

        default: {
            // "failed" or any other in-progress state —
            // leave the subscription as past_due.
            subscription.status = "past_due";
        }
    }

    await subscription.save();

    return subscription;
};

module.exports = {
    syncSubscriptionAfterRecovery
};