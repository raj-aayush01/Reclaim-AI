import api from "./api";

/**
 * Execute full AI Recovery pipeline (Gemini diagnosis -> Policy guardrail evaluation -> Execution engine -> MongoDB update)
 */
export const runAIRecovery = async (paymentId) => {
    const response = await api.post(`/recovery/ai/${paymentId}`);
    return response.data;
};

/**
 * Analyze payment with Gemini AI only
 */
export const analyzePaymentWithAI = async (paymentId) => {
    const response = await api.post(`/ai/analyze/${paymentId}`);
    return response.data;
};
