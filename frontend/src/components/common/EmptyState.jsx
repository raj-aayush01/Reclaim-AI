import React from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";

export const EmptyState = ({
    title = "No data found",
    description = "There are no records matching your current filter criteria.",
    actionText,
    onAction,
    icon: Icon = Inbox
}) => {
    return (
        <div
            className="panel animate-rise"
            style={{
                padding: "3.5rem 2rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem"
            }}
        >
            <div
                style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.625rem",
                    background: "var(--primary-soft)",
                    border: "1px solid oklch(0.43 0.075 180 / 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary)"
                }}
            >
                <Icon size={18} />
            </div>

            <h3
                style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--ink)",
                    fontFamily: "'Inter', sans-serif"
                }}
            >
                {title}
            </h3>

            <p
                style={{
                    fontSize: "0.8125rem",
                    color: "var(--mute)",
                    maxWidth: "28rem",
                    lineHeight: 1.6
                }}
            >
                {description}
            </p>

            {actionText && onAction && (
                <Button
                    variant="primary"
                    onClick={onAction}
                >
                    {actionText}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;