const mongoose = require("mongoose");

const agentStepSchema = new mongoose.Schema(
    {
        step: {
            type: Number,
            required: true
        },

        type: {
            type: String,
            enum: [
                "OBSERVATION",
                "DECISION",
                "ACTION",
                "POLICY",
                "TERMINAL"
            ],
            required: true
        },

        tool: {
            type: String,
            default: null
        },

        input: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        output: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        confidence: {
            type: Number,
            default: null,
            min: 0,
            max: 1
        },

        reason: {
            type: String,
            default: null
        }
    },
    {
        _id: false
    }
);

const agentRunSchema = new mongoose.Schema(
    {

        runId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        paymentId: {
            type: String,
            required: true,
            index: true
        },

        status: {
            type: String,
            enum: [
                "RUNNING",
                "RECOVERED",
                "PENDING",
                "COMPLETED",
                "BLOCKED",
                "ESCALATED",
                "STOPPED",
                "FAILED",
                "MAX_STEPS_REACHED"
            ],
            default: "RUNNING",
            index: true
        },

        steps: {
            type: [agentStepSchema],
            default: []
        },

        startedAt: {
            type: Date,
            default: Date.now
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

agentRunSchema.index({
    paymentId: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "AgentRun",
    agentRunSchema
);