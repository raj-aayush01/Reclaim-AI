import React from "react";
import { Loader2 } from "lucide-react";

export const Button = ({
    children,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    icon: Icon,
    className = "",
    onClick,
    type = "button",
    ...props
}) => {
    const base = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        borderRadius: "0.5rem",
        border: "none",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.5 : 1,
        transition: "background-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 80ms ease",
        outline: "none",
        textDecoration: "none",
        whiteSpace: "nowrap",
        userSelect: "none"
    };

    const variants = {
        primary: {
            background: "var(--primary)",
            color: "white",
            boxShadow: "0 2px 8px oklch(0.43 0.075 180 / 0.3)"
        },
        glow: {
            background: "var(--primary)",
            color: "white",
            boxShadow: "0 0 0 3px var(--primary-muted), 0 2px 8px oklch(0.43 0.075 180 / 0.3)"
        },
        secondary: {
            background: "var(--surface-solid)",
            color: "var(--ink)",
            border: "1px solid var(--line)"
        },
        outline: {
            background: "transparent",
            color: "var(--mute)",
            border: "1px solid var(--line)"
        },
        danger: {
            background: "var(--down)",
            color: "white",
            boxShadow: "0 2px 8px oklch(0.52 0.18 27 / 0.3)"
        },
        ghost: {
            background: "transparent",
            color: "var(--mute)",
            border: "none"
        }
    };

    const sizes = {
        sm: { padding: "0.3125rem 0.625rem", fontSize: "0.6875rem", gap: "0.375rem" },
        md: { padding: "0.5rem 0.875rem", fontSize: "0.8125rem", gap: "0.5rem" },
        lg: { padding: "0.625rem 1.125rem", fontSize: "0.9375rem", gap: "0.5rem" }
    };

    const variantStyle = variants[variant] || variants.primary;
    const sizeStyle = sizes[size] || sizes.md;

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            style={{ ...base, ...variantStyle, ...sizeStyle }}
            onMouseEnter={(e) => {
                if (!disabled && !loading) {
                    e.currentTarget.style.opacity = "0.88";
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled && !loading) {
                    e.currentTarget.style.opacity = "1";
                }
            }}
            onMouseDown={(e) => {
                if (!disabled && !loading) {
                    e.currentTarget.style.transform = "translateY(1px)";
                }
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = "";
            }}
            className={className}
            {...props}
        >
            {loading ? (
                <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
            ) : Icon ? (
                <Icon style={{ width: "14px", height: "14px" }} />
            ) : null}
            <span>{children}</span>
        </button>
    );
};

export default Button;
