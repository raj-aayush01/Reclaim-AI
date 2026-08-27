import api from "./api";

/**
 * Triggers autonomous AI recovery agent for a specific failed payment
 * Calls POST /api/agent/ai/:paymentId
 */
export const runAIRecovery = async (paymentId) => {
    try {
        const response = await api.post(`/agent/ai/${paymentId}`);
        return response.data;
    } catch (error) {
        console.error("runAIRecovery error:", error);
        throw new Error(
            error.response?.data?.message || "Failed to execute AI recovery"
        );
    }
};

/**
 * Fetches the dynamic AgentRun history & step logs for a payment
 * Calls GET /api/agent/runs/:paymentId
 */
export const getAgentRun = async (paymentId) => {
    try {
        const response = await api.get(`/agent/runs/${paymentId}`);
        return response.data;
    } catch (error) {
        console.error("getAgentRun error:", error);
        throw new Error(
            error.response?.data?.message || "Failed to fetch agent run history"
        );
    }
};

// Evaluates policy rules against AI decision before execution

export const evaluatePolicy = async (paymentId, decisionData) => {
    try {
        const response = await api.post(`/recovery/policy/${paymentId}`, decisionData);
        return response.data;
    } catch (error) {
        console.error("evaluatePolicy error:", error);
        throw new Error(
            error.response?.data?.message || "Failed to evaluate recovery policy"
        );
    }
};
