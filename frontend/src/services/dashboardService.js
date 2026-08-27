import api from "./api";

/**
 * Fetch overview dashboard metrics and recent recovery logs filtered by timeRange (Today, 7D, 30D)
 * @param {string} timeRange 
 */
export const getDashboardSummary = async (timeRange = "7D") => {
    const response = await api.get(`/dashboard/summary?timeRange=${timeRange}`);
    return response.data;
};

/**
 * Check backend health status
 */
export const checkHealth = async () => {
    const response = await api.get("/health");
    return response.data;
};
