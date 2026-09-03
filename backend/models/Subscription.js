const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        subscriptionId: {
            type: String,
            required: true,
            unique: true
        },

        customerId: {
            type: String,
            required: true
        },

        planName: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        currency: {
            type: String,
            default: "INR"
        },

        billingCycle: {
            type: String,
            enum: [
                "MONTHLY",
                "QUARTERLY",
                "YEARLY"
            ],
            default: "MONTHLY"
        },

        status: {
            type: String,
            enum: [
                "active",
                "past_due",
                "canceled",
                "recovered"
            ],
            default: "active"
        },

        lastRenewalDate: {
            type: Date,
            default: null
        },

        nextRenewalDate: {
            type: Date,
            default: null
        },

        failedRenewalCount: {
            type: Number,
            default: 0
        },

        currentPaymentId: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Subscription",
    subscriptionSchema
);