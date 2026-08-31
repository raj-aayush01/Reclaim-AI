/**
 * Map payment statuses to display labels, badge CSS variants, and colors
 */
export const STATUS_CONFIG = {
    failed: {
        label: "Failed",
        variant: "danger",
        bg: "var(--down-soft)",
        color: "var(--down)",
        border: "var(--down-border)"
    },
    pending: {
        label: "Pending",
        variant: "warning",
        bg: "var(--warn-soft)",
        color: "var(--warn)",
        border: "var(--warn-border)"
    },
    recovered: {
        label: "Recovered",
        variant: "success",
        bg: "var(--up-soft)",
        color: "var(--up)",
        border: "var(--up-border)"
    },
    escalated: {
        label: "Escalated",
        variant: "warning",
        bg: "var(--warn-soft)",
        color: "var(--warn)",
        border: "var(--warn-border)"
    },
    stopped: {
        label: "Stopped",
        variant: "neutral",
        bg: "var(--line)",
        color: "var(--mute)",
        border: "var(--line-strong)"
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
        bg: "var(--line)",
        color: "var(--mute)",
        border: "var(--line-strong)"
    };
};

export const formatScenario = (scenario) => {
    return SCENARIO_LABELS[scenario] || scenario || "Standard Failure";
};

export const formatRecoveryAction = (action) => {
    return RECOVERY_ACTION_LABELS[action] || action || "None";
};
