import React from "react";
import { getStatusConfig } from "../../utils/statusHelpers";
import {
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    AlertCircle
} from "lucide-react";

const themeMap = {
    recovered: {
        color: "var(--up)",
        bg: "var(--up-soft)",
        border: "var(--up-border)"
    },
    pending: {
        color: "var(--warn)",
        bg: "var(--warn-soft)",
        border: "var(--warn-border)"
    },
    failed: {
        color: "var(--down)",
        bg: "var(--down-soft)",
        border: "var(--down-border)"
    },
    escalated: {
        color: "var(--warn)",
        bg: "var(--warn-soft)",
        border: "var(--warn-border)"
    },
    stopped: {
        color: "var(--mute)",
        bg: "var(--line)",
        border: "var(--line-strong)"
    },
    retrying: {
        color: "var(--primary)",
        bg: "var(--primary-soft)",
        border: "var(--primary-border)"
    },
    held: {
        color: "var(--warn)",
        bg: "var(--warn-soft)",
        border: "var(--warn-border)"
    }
};

export const PaymentStatusBadge = ({
    status,
    className = ""
}) => {
    const key = (status || "").toLowerCase();
    const config = getStatusConfig(status);

    const theme = themeMap[key] || {
        color: "var(--mute)",
        bg: "var(--line)",
        border: "var(--line-strong)"
    };

    const getIcon = () => {
        switch (key) {
            case "recovered":
                return <CheckCircle2 size={11} />;

            case "pending":
                return <Clock size={11} />;

            case "failed":
                return <XCircle size={11} />;

            case "escalated":
                return <AlertTriangle size={11} />;

            case "stopped":
                return <AlertCircle size={11} />;

            default:
                return null;
        }
    };

    return (
        <span
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.1875rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.625rem",
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: theme.color,
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                whiteSpace: "nowrap"
            }}
        >
            {getIcon()}

            <span>
                {config?.label || status || "Unknown"}
            </span>
        </span>
    );
};

export default PaymentStatusBadge;