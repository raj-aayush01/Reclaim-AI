import api from "./api";

export const runAIRecovery = async (paymentId) => {
    try {
        const response = await api.post(`/agent/ai/${paymentId}`);
        return response.data;
    } catch (error) {
        console.error("runAIRecovery error:", error);

        throw new Error(
            error.response?.data?.message ||
                "Failed to execute AI recovery"
        );
    }
};

export const getAgentRun = async (paymentId) => {
    try {
        const response = await api.get(`/agent/runs/${paymentId}`);
        return response.data;
    } catch (error) {
        console.error("getAgentRun error:", error);

        throw new Error(
            error.response?.data?.message ||
                "Failed to fetch agent run history"
        );
    }
};

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
        console.error("evaluatePolicy error:", error);

        throw new Error(
            error.response?.data?.message ||
                "Failed to evaluate recovery policy"
        );
    }
};

export const getControlRoom = async () => {
    try {
        const response = await api.get(
            "/agent/control-room"
        );

        return response.data;
    } catch (error) {
        console.error("getControlRoom error:", error);

        throw new Error(
            error.response?.data?.message ||
                "Failed to fetch agent control room data"
        );
    }
};