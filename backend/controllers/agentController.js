const AgentRun = require("../models/AgentRun");

const getAgentRun = async (req, res) => {
    try {

        const { paymentId } = req.params;

        const agentRun = await AgentRun.findOne({
            paymentId
        }).sort({
            createdAt: -1
        });

        if (!agentRun) {
            return res.status(404).json({
                message: "No agent run found for this payment"
            });
        }

        res.json({
            success: true,
            run: agentRun
        });

    } catch (error) {

        console.error("Agent run fetch error:", error);

        res.status(500).json({
            message: "Failed to fetch agent run",
            error: error.message
        });
    }
};

module.exports = {
    getAgentRun
};