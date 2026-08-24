const mongoose = require("mongoose");

const recoveryLogSchema = new mongoose.Schema(
    {
        paymentId: {
            type: String,
            required: true
        },

        customerId: {
            type: String,
            required: true
        },

        aiAction: {
            type: String,
            required: true
        },

        aiReason: {
            type: String,
            default: null
        },

        aiConfidence: {
            type: Number,
            default: null
        },

        policyAllowed: {
            type: Boolean,
            required: true
        },

        finalAction: {
            type: String,
            required: true
        },

        executionResult: {
            type: String,
            required: true
        },

        recoveredAmount: {
            type: Number,
            default: 0
        },

        message: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "RecoveryLog",
    recoveryLogSchema
);