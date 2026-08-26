/**
 * Map payment statuses to display labels, badge CSS variants, and colors
 */
export const STATUS_CONFIG = {
    failed: {
        label: "Failed",
        variant: "danger",
        bg: "rgba(244, 63, 94, 0.15)",
        color: "#f43f5e",
        border: "rgba(244, 63, 94, 0.3)"
    },
    pending: {
        label: "Pending",
        variant: "warning",
        bg: "rgba(245, 158, 11, 0.15)",
        color: "#f59e0b",
        border: "rgba(245, 158, 11, 0.3)"
    },
    recovered: {
        label: "Recovered",
        variant: "success",
        bg: "rgba(16, 185, 129, 0.15)",
        color: "#10b981",
        border: "rgba(16, 185, 129, 0.3)"
    },
    escalated: {
        label: "Escalated",
        variant: "purple",
        bg: "rgba(139, 92, 246, 0.15)",
        color: "#a78bfa",
        border: "rgba(139, 92, 246, 0.3)"
    },
    stopped: {
        label: "Stopped",
        variant: "neutral",
        bg: "rgba(100, 116, 139, 0.15)",
        color: "#94a3b8",
        border: "rgba(100, 116, 139, 0.3)"
    }
};

/**
 * Map payment failure scenarios to human readable labels
 */
export const SCENARIO_LABELS = {
    TEMPORARY_FAILURE: "Temporary Network Issue",
    CARD_DECLINED: "Card Declined / Insufficient",
    REPEATED_FAILURE: "Repeated Failure",
    HIGH_VALUE_FAILURE: "High-Value Transaction",
    UNKNOWN_FAILURE: "Unknown Technical Failure"
};

/**
 * Map recovery action ENUMs to clean labels
 */
export const RECOVERY_ACTION_LABELS = {
    RETRY_PAYMENT: "Retry Payment Engine",
    CREATE_PAYMENT_LINK: "Generated Payment Link",
    ESCALATE_TO_HUMAN: "Escalated to Support",
    STOP_RECOVERY: "Halted Recovery"
};

export const getStatusConfig = (status) => {
    const key = (status || "").toLowerCase();
    return STATUS_CONFIG[key] || {
        label: status || "Unknown",
        variant: "neutral",
        bg: "rgba(100, 116, 139, 0.15)",
        color: "#94a3b8",
        border: "rgba(100, 116, 139, 0.3)"
    };
};

export const formatScenario = (scenario) => {
    return SCENARIO_LABELS[scenario] || scenario || "Standard Failure";
};

export const formatRecoveryAction = (action) => {
    return RECOVERY_ACTION_LABELS[action] || action || "None";
};
