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

    const selectStyle = {
        width: "100%",
        background: "var(--surface-solid)",
        border: "1px solid var(--line)",
        borderRadius: "0.5rem",
        padding: "0.5rem 0.75rem",
        fontSize: "0.8125rem",
        fontFamily: "'Inter', sans-serif",
        color: "var(--ink)",
        cursor: "pointer",
        outline: "none",
        transition: "border-color 150ms ease",
        appearance: "none",
        backgroundImage:
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.625rem center",
        paddingRight: "2rem"
    };

    return (
        <div
            className="panel"
            style={{
                padding: "0.875rem 1rem",
                marginBottom: "1.5rem"
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.625rem",
                    alignItems: "center"
                }}
            >
                <div
                    style={{
                        position: "relative",
                        flex: "1 1 240px",
                        minWidth: "200px"
                    }}
                >
                    <Search
                        size={14}
                        style={{
                            position: "absolute",
                            left: "0.75rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--mute)",
                            pointerEvents: "none"
                        }}
                    />

                    <input
                        type="text"
                        placeholder="Search payment ID, customer ID, or order..."
                        value={filters.search || ""}
                        onChange={(e) =>
                            onFilterChange({
                                search: e.target.value
                            })
                        }
                        className="tf-input"
                        style={{
                            paddingLeft: "2.125rem",
                            paddingRight: filters.search
                                ? "2rem"
                                : "0.75rem"
                        }}
                    />

                    {filters.search && (
                        <button
                            type="button"
                            onClick={() =>
                                onFilterChange({
                                    search: ""
                                })
                            }
                            style={{
                                position: "absolute",
                                right: "0.625rem",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                color: "var(--mute)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div
                    style={{
                        flex: "0 1 200px"
                    }}
                >
                    <select
                        value={filters.status || "ALL"}
                        onChange={(e) =>
                            onFilterChange({
                                status: e.target.value
                            })
                        }
                        style={selectStyle}
                    >
                        <option value="ALL">
                            All Statuses
                        </option>

                        <option value="at_risk">
                            Money at Risk (Failed/Pending/Escalated)
                        </option>

                        <option value="failed">
                            Failed
                        </option>

                        <option value="pending">
                            Pending
                        </option>

                        <option value="recovered">
                            Recovered
                        </option>

                        <option value="escalated">
                            Escalated
                        </option>

                        <option value="stopped">
                            Stopped
                        </option>
                    </select>
                </div>

                <div
                    style={{
                        flex: "0 1 200px"
                    }}
                >
                    <select
                        value={filters.action || "ALL"}
                        onChange={(e) =>
                            onFilterChange({
                                action: e.target.value
                            })
                        }
                        style={selectStyle}
                    >
                        <option value="ALL">
                            All AI Actions
                        </option>

                        <option value="RETRY_PAYMENT">
                            Auto-Retry Engine
                        </option>

                        <option value="CREATE_PAYMENT_LINK">
                            Generated Payment Link
                        </option>

                        <option value="ESCALATE_TO_HUMAN">
                            Human Escalation
                        </option>

                        <option value="STOP_RECOVERY">
                            Halted Recovery
                        </option>
                    </select>
                </div>

                <div
                    style={{
                        flex: "0 1 200px"
                    }}
                >
                    <select
                        value={filters.scenario || "ALL"}
                        onChange={(e) =>
                            onFilterChange({
                                scenario: e.target.value
                            })
                        }
                        style={selectStyle}
                    >
                        <option value="ALL">
                            All Scenarios
                        </option>

                        <option value="TEMPORARY_FAILURE">
                            Temporary Failure
                        </option>

                        <option value="CARD_DECLINED">
                            Card Declined
                        </option>

                        <option value="REPEATED_FAILURE">
                            Repeated Failure
                        </option>

                        <option value="HIGH_VALUE_FAILURE">
                            High-Value Failure
                        </option>

                        <option value="UNKNOWN_FAILURE">
                            Unknown Failure
                        </option>
                    </select>
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={X}
                        onClick={onReset}
                    >
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PaymentFilters;