import React from "react";

const variantMap = {
    primary: {
        text: "var(--primary)",
        icon: {
            bg: "var(--primary-soft)",
            border: "var(--primary-border)",
            color: "var(--primary)"
        },
        panel: {
            borderColor: "var(--primary-border)"
        }
    },
    emerald: {
        text: "var(--up)",
        icon: {
            bg: "var(--up-soft)",
            border: "var(--up-border)",
            color: "var(--up)"
        },
        panel: {
            borderColor: "var(--up-border)"
        }
    },
    rose: {
        text: "var(--down)",
        icon: {
            bg: "var(--down-soft)",
            border: "var(--down-border)",
            color: "var(--down)"
        },
        panel: {
            borderColor: "var(--down-border)"
        }
    },
    amber: {
        text: "var(--warn)",
        icon: {
            bg: "var(--warn-soft)",
            border: "var(--warn-border)",
            color: "var(--warn)"
        },
        panel: {
            borderColor: "var(--warn-border)"
        }
    },
    indigo: {
        text: "var(--primary)",
        icon: {
            bg: "var(--primary-soft)",
            border: "var(--primary-border)",
            color: "var(--primary)"
        },
        panel: {
            borderColor: "var(--primary-border)"
        }
    },
    purple: {
        text: "var(--primary)",
        icon: {
            bg: "var(--primary-soft)",
            border: "var(--primary-border)",
            color: "var(--primary)"
        },
        panel: {
            borderColor: "var(--primary-border)"
        }
    }
};

export const StatCard = ({
    title,
    value,
    subtext,
    icon: Icon,
    colorVariant = "indigo",
    onClick
}) => {
    const variant = variantMap[colorVariant] || variantMap.indigo;

    return (
        <div
            onClick={onClick}
            className="panel animate-rise"
            style={{
                padding: "1.25rem",
                cursor: onClick ? "pointer" : "default",
                transition:
                    "box-shadow 150ms ease, border-color 150ms ease",
                borderColor: variant.panel.borderColor
            }}
            onMouseEnter={(event) => {
                if (onClick) {
                    event.currentTarget.style.boxShadow =
                        "var(--shadow-panel), 0 8px 24px -12px oklch(0.43 0.075 180 / 0.2)";
                }
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.boxShadow = "";
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem"
                }}
            >
                <span className="eyebrow">
                    {title}
                </span>

                {Icon && (
                    <div
                        style={{
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            background: variant.icon.bg,
                            border: `1px solid ${variant.icon.border}`,
                            color: variant.icon.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <Icon size={15} strokeWidth={1.75} />
                    </div>
                )}
            </div>

            <div
                style={{
                    fontSize: "1.875rem",
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                    color: variant.text,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                    marginBottom: "0.375rem"
                }}
            >
                {value}
            </div>

            {subtext && (
                <div
                    style={{
                        fontSize: "0.75rem",
                        color: "var(--mute)",
                        fontFamily: "'Inter', sans-serif"
                    }}
                >
                    {subtext}
                </div>
            )}
        </div>
    );
};

export default StatCard;