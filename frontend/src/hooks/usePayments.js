import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getPayments } from "../services/paymentService";

export const usePayments = (initialFilters = {}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Derive active filters directly from URL search parameters.
    const search = searchParams.get("search") || "";

    const status =
        searchParams.get("status") ||
        initialFilters.status ||
        "ALL";

    const scenario =
        searchParams.get("scenario") ||
        initialFilters.scenario ||
        "ALL";

    const action =
        searchParams.get("action") ||
        initialFilters.action ||
        "ALL";

    const page =
        Number(searchParams.get("page")) || 1;

    const filters = useMemo(
        () => ({
            search,
            status,
            scenario,
            action,
            page,
            limit: 50
        }),
        [
            search,
            status,
            scenario,
            action,
            page
        ]
    );

    const [payments, setPayments] = useState([]);

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 50,
        pages: 1
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch payments whenever the active filters or page changes.
    const fetchPayments = useCallback(
        async (isMounted = true) => {
            setLoading(true);
            setError(null);

            try {
                const data = await getPayments(filters);

                if (isMounted) {
                    setPayments(data.payments || []);

                    if (data.pagination) {
                        setPagination(data.pagination);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error(
                        "usePayments error:",
                        err
                    );

                    setError(
                        err.message ||
                            "Failed to load payments"
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

        fetchPayments(isMounted);

        return () => {
            isMounted = false;
        };
    }, [fetchPayments]);

    // Update URL parameters and reset pagination when filters change.
    const updateFilters = useCallback(
        (newFilters) => {
            const nextSearch =
                newFilters.search !== undefined
                    ? newFilters.search
                    : search;

            const nextStatus =
                newFilters.status !== undefined
                    ? newFilters.status
                    : status;

            const nextScenario =
                newFilters.scenario !== undefined
                    ? newFilters.scenario
                    : scenario;

            const nextAction =
                newFilters.action !== undefined
                    ? newFilters.action
                    : action;

            const filtersChanged =
                newFilters.search !== undefined ||
                newFilters.status !== undefined ||
                newFilters.scenario !== undefined ||
                newFilters.action !== undefined;

            const nextPage =
                newFilters.page !== undefined
                    ? newFilters.page
                    : filtersChanged
                        ? 1
                        : page;

            const params = new URLSearchParams();

            if (nextSearch) {
                params.set(
                    "search",
                    nextSearch
                );
            }

            if (
                nextStatus &&
                nextStatus !== "ALL"
            ) {
                params.set(
                    "status",
                    nextStatus
                );
            }

            if (
                nextScenario &&
                nextScenario !== "ALL"
            ) {
                params.set(
                    "scenario",
                    nextScenario
                );
            }

            if (
                nextAction &&
                nextAction !== "ALL"
            ) {
                params.set(
                    "action",
                    nextAction
                );
            }

            if (nextPage > 1) {
                params.set(
                    "page",
                    String(nextPage)
                );
            }

            setSearchParams(
                params,
                { replace: true }
            );
        },
        [
            search,
            status,
            scenario,
            action,
            page,
            setSearchParams
        ]
    );

    // Clear all active filters and return to the first page.
    const resetFilters = useCallback(() => {
        setSearchParams(
            {},
            { replace: true }
        );
    }, [setSearchParams]);

    return {
        payments,
        pagination,
        loading,
        error,
        filters,
        updateFilters,
        resetFilters,
        refetch: () => fetchPayments(true)
    };
};