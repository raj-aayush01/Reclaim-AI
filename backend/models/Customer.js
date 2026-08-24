const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        customerId: {
            type: String,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true
        },

        totalPayments: {
            type: Number,
            default: 0
        },

        successfulPayments: {
            type: Number,
            default: 0
        },

        failedPayments: {
            type: Number,
            default: 0
        },

        totalSpent: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Customer", customerSchema);