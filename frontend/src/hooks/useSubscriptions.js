import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getSubscriptions } from "../services/subscriptionService";

export const useSubscriptions = (initialFilters = {}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const status =
        searchParams.get("status") ||
        initialFilters.status ||
        "past_due";

    const page =
        Number(searchParams.get("page")) || 1;

    const filters = useMemo(
        () => ({
            status,
            page,
            limit: 50
        }),
        [status, page]
    );

    const [subscriptions, setSubscriptions] = useState([]);

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 50,
        pages: 1
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubscriptions = useCallback(
        async (isMounted = true) => {
            setLoading(true);
            setError(null);

            try {
                const data = await getSubscriptions(filters);

                if (isMounted) {
                    setSubscriptions(data.subscriptions || []);

                    if (data.pagination) {
                        setPagination(data.pagination);
                    }
                }

                return data;
            } catch (err) {
                if (isMounted) {
                    console.error(
                        "useSubscriptions error:",
                        err
                    );

                    setError(
                        err.message ||
                            "Failed to load subscriptions"
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        },
        [filters]
    );

    useEffect(() => {
        let isMounted = true;

        fetchSubscriptions(isMounted);

        return () => {
            isMounted = false;
        };
    }, [fetchSubscriptions]);

    const updateFilters = useCallback(
        (newFilters) => {
            const nextPage =
                newFilters.page !== undefined
                    ? newFilters.page
                    : 1;

            const params = new URLSearchParams();

            if (nextPage > 1) {
                params.set("page", String(nextPage));
            }

            setSearchParams(params, { replace: true });
        },
        [setSearchParams]
    );

    return {
        subscriptions,
        pagination,
        loading,
        error,
        filters,
        updateFilters,
        refetch: () => fetchSubscriptions(true)
    };
};