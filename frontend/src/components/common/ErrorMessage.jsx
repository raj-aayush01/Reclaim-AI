import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Button from "./Button";

export const ErrorMessage = ({
    message = "An error occurred",
    onRetry
}) => {
    return (
        <div
            className="panel animate-rise"
            style={{
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                borderColor: "oklch(0.52 0.18 27 / 0.3)"
            }}
        >
            <div
                style={{
                    flexShrink: 0,
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "0.5rem",
                    background: "var(--down-soft)",
                    border: "1px solid oklch(0.52 0.18 27 / 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--down)"
                }}
            >
                <AlertTriangle size={14} />
            </div>

            <div
                style={{
                    flex: 1,
                    minWidth: 0
                }}
            >
                <span
                    className="eyebrow"
                    style={{
                        color: "var(--down)",
                        display: "block",
                        marginBottom: "2px"
                    }}
                >
                    Execution Failure
                </span>

                <p
                    style={{
                        fontSize: "0.8125rem",
                        color: "var(--ink)",
                        fontFamily: "'JetBrains Mono', monospace"
                    }}
                >
                    {message}
                </p>
            </div>

            {onRetry && (
                <Button
                    variant="danger"
                    size="sm"
                    icon={RefreshCw}
                    onClick={onRetry}
                >
                    Retry Action
                </Button>
            )}
        </div>
    );
};

export default ErrorMessage;