const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        paymentId: {
            type: String,
            required: true,
            unique: true
        },

        orderId: {
            type: String,
            required: true
        },

        customerId: {
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

        paymentMethod: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: [
                "failed",
                "pending",
                "recovered",
                "escalated",
                "stopped"
            ],
            default: "failed"
        },

        failureReason: {
            type: String,
            default: null
        },

        attemptCount: {
            type: Number,
            default: 0
        },

        recoveredAmount: {
            type: Number,
            default: 0
        },

        recoveryAction: {
            type: String,
            enum: [
                "RETRY_PAYMENT",
                "CREATE_PAYMENT_LINK",
                "ESCALATE_TO_HUMAN",
                "STOP_RECOVERY",
                null
            ],
            default: null
        },
        scenario: {
            type: String,
            enum: [
                "TEMPORARY_FAILURE",
                "CARD_DECLINED",
                "REPEATED_FAILURE",
                "HIGH_VALUE_FAILURE",
                "UNKNOWN_FAILURE"
            ],
            required: true
        },
        paymentLinkId: {
            type: String,
            default: null
        },

        paymentLinkUrl: {
            type: String,
            default: null
        },

        recoveryResult: {
            type: String,
            enum: [
                "RECOVERED",
                "PENDING",
                "ESCALATED",
                "STOPPED",
                "FAILED",
                null
            ],
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);