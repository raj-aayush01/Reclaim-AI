import api from "./api";

/**
 * Fetch payments list with optional search query & status/scenario filters
 */
export const getPayments = async (params = {}) => {
    const response = await api.get("/payments", { params });
    return response.data;
};

/**
 * Fetch single payment details, customer info, and logs
 */
export const getPaymentById = async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
};

/**
 * Trigger backend simulator to generate synthetic demo payments
 */
export const generateDemoData = async (count = 200) => {
    const response = await api.post("/simulator/generate", { count });
    return response.data;
};
