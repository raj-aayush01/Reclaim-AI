import api from "./api";

/**
 * Fetch overview dashboard metrics and recent recovery logs
 */
export const getDashboardSummary = async () => {
    const response = await api.get("/dashboard/summary");
    return response.data;
};

/**
 * Check backend health status
 */
export const checkHealth = async () => {
    const response = await api.get("/health");
    return response.data;
};
