import { useState, useEffect, useCallback } from "react";
import { getDashboardSummary } from "../services/dashboardService";

export const useDashboard = (timeRange = "7D") => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboard = useCallback(async (isMounted = true) => {
        setLoading(true);
        setError(null);
        try {
            const summary = await getDashboardSummary(timeRange);
            if (isMounted) {
                setData(summary);
            }
        } catch (err) {
            if (isMounted) {
                console.error("useDashboard error:", err);
                setError(err.message || "Failed to load dashboard summary");
            }
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    }, [timeRange]);

    useEffect(() => {
        let isMounted = true;
        fetchDashboard(isMounted);

        return () => {
            isMounted = false;
        };
    }, [fetchDashboard]);

    return {
        data,
        loading,
        error,
        refetch: () => fetchDashboard(true)
    };
};

export default useDashboard;
