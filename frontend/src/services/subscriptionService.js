import api from "./api";

/**
 * Fetch subscriptions list with optional status filter
 */
export const getSubscriptions = async (params = {}) => {
    const response = await api.get("/subscriptions", { params });
    return response.data;
};

/**
 * Fetch single subscription details, customer info, and current payment
 */
export const getSubscriptionById = async (subscriptionId) => {
    const response = await api.get(`/subscriptions/${subscriptionId}`);
    return response.data;
};