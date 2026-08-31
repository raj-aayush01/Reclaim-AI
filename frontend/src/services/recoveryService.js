import api from "./api";

/**
 * Triggers autonomous AI recovery for a specific failed payment.
 * Calls POST /api/agent/ai/:paymentId
 */
export const runAIRecovery = async (paymentId) => {
    try {
        const response = await api.post(
            `/agent/ai/${paymentId}`
        );

        return response.data;
    } catch (error) {
        console.error(
            "runAIRecovery error:",
            error
        );

        throw new Error(
            error.response?.data?.message ||
            "Failed to execute AI recovery"
        );
    }
};

/**
 * Fetches the latest AgentRun history for a payment.
 * Calls GET /api/agent/runs/:paymentId
 */
export const getAgentRun = async (paymentId) => {
    try {
        const response = await api.get(
            `/agent/runs/${paymentId}`
        );

        return response.data;
    } catch (error) {
        console.error(
            "getAgentRun error:",
            error
        );

        throw new Error(
            error.response?.data?.message ||
            "Failed to fetch agent run history"
        );
    }
};

/**
 * Evaluates a recovery decision against the policy engine.
 * Calls POST /api/recovery/policy/:paymentId
 */
export const evaluatePolicy = async (
    paymentId,
    decisionData
) => {
    try {
        const response = await api.post(
            `/recovery/policy/${paymentId}`,
            decisionData
        );

        return response.data;
    } catch (error) {
        console.error(
            "evaluatePolicy error:",
            error
        );

        throw new Error(
            error.response?.data?.message ||
            "Failed to evaluate recovery policy"
        );
    }
};

/**
 * Fetches recent recovery events where a policy rule
 * rejected or overrode an AI recommendation.
 *
 * Calls GET /api/recovery/policy-firings
 */
export const getPolicyFirings = async (
    params = {}
) => {
    try {
        const response = await api.get(
            "/recovery/policy-firings",
            {
                params
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "getPolicyFirings error:",
            error
        );

        throw new Error(
            error.response?.data?.message ||
            "Failed to fetch policy firings"
        );
    }
};