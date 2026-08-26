import React from "react";
import { Search, X } from "lucide-react";
import Button from "../common/Button";

export const PaymentFilters = ({
    filters,
    onFilterChange,
    onReset
}) => {
    const hasActiveFilters = Boolean(
        filters.search ||
        (filters.status && filters.status !== "ALL") ||
        (filters.scenario && filters.scenario !== "ALL") ||
        (filters.action && filters.action !== "ALL")
    );

    return (
        <div className="glass-panel p-4 rounded-2xl mb-6 space-y-3">
            <div className="flex flex-col lg:flex-row items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search payment ID, customer ID, or order..."
                        value={filters.search || ""}
                        onChange={(e) => onFilterChange({ search: e.target.value })}
                        className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    {filters.search && (
                        <button
                            onClick={() => onFilterChange({ search: "" })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Status Filter */}
                <div className="w-full lg:w-44">
                    <select
                        value={filters.status || "ALL"}
                        onChange={(e) => onFilterChange({ status: e.target.value })}
                        className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="at_risk">Money at Risk (Failed/Pending/Escalated)</option>
                        <option value="failed">Failed</option>
                        <option value="pending">Pending</option>
                        <option value="recovered">Recovered</option>
                        <option value="escalated">Escalated</option>
                        <option value="stopped">Stopped</option>
                    </select>
                </div>

                {/* Action Filter */}
                <div className="w-full lg:w-48">
                    <select
                        value={filters.action || "ALL"}
                        onChange={(e) => onFilterChange({ action: e.target.value })}
                        className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="ALL">All AI Actions</option>
                        <option value="RETRY_PAYMENT">Auto-Retry Engine</option>
                        <option value="CREATE_PAYMENT_LINK">Generated Payment Link</option>
                        <option value="ESCALATE_TO_HUMAN">Human Escalation</option>
                        <option value="STOP_RECOVERY">Halted Recovery</option>
                    </select>
                </div>

                {/* Scenario Filter */}
                <div className="w-full lg:w-48">
                    <select
                        value={filters.scenario || "ALL"}
                        onChange={(e) => onFilterChange({ scenario: e.target.value })}
                        className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="ALL">All Scenarios</option>
                        <option value="TEMPORARY_FAILURE">Temporary Failure</option>
                        <option value="CARD_DECLINED">Card Declined</option>
                        <option value="REPEATED_FAILURE">Repeated Failure</option>
                        <option value="HIGH_VALUE_FAILURE">High-Value Failure</option>
                        <option value="UNKNOWN_FAILURE">Unknown Failure</option>
                    </select>
                </div>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={X}
                        onClick={onReset}
                        className="shrink-0"
                    >
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PaymentFilters;
