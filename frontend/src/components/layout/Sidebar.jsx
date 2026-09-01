import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    CreditCard,
    AlertCircle,
    ShieldCheck,
    AlertOctagon,
    Zap,
    Bot,
    Repeat
} from "lucide-react";

export const Sidebar = () => {
    const location = useLocation();

        const navItems = [
        {
            path: "/overview",
            altPath: "/",
            label: "Overview",
            icon: LayoutDashboard
        },
        {
            path: "/control-room",
            label: "AI Control Room",
            icon: Bot
        },
        {
            path: "/failed-payments",
            label: "Failed Payments",
            icon: AlertOctagon
        },
        {
            path: "/failed-subscriptions",
            label: "Failed Subscriptions",
            icon: Repeat
        },
        {
            path: "/ledger",
            altPath: "/payments",
            label: "Ledger",
            icon: CreditCard
        },
        {
            path: "/exceptions",
            label: "Exceptions",
            icon: AlertCircle
        },
        {
            path: "/guardrails",
            label: "Guardrails",
            icon: ShieldCheck
        }
    ];

    return (
        <aside
            style={{
                width: "16rem",
                background: "var(--surface)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderRight: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "fixed",
                top: 0,
                bottom: 0,
                left: 0,
                zIndex: 30
            }}
        >
            <div>
                <div
                    style={{
                        height: "4rem",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 1.25rem",
                        borderBottom: "1px solid var(--line)",
                        gap: "0.625rem"
                    }}
                >
                    <div
                        style={{
                            width: "1.75rem",
                            height: "1.75rem",
                            borderRadius: "0.5rem",
                            background: "var(--primary-soft)",
                            border: "1px solid var(--primary-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--primary)",
                            flexShrink: 0
                        }}
                    >
                        <Zap size={14} strokeWidth={2.5} />
                    </div>

                    <div>
                        <h1
                            style={{
                                fontSize: "0.9375rem",
                                fontWeight: 700,
                                letterSpacing: "-0.025em",
                                color: "var(--ink)",
                                fontFamily: "'Inter', sans-serif",
                                lineHeight: 1.2
                            }}
                        >
                            Reclaim
                            <span style={{ color: "var(--primary)" }}>
                                .AI
                            </span>
                        </h1>

                        <p
                            className="eyebrow"
                            style={{ marginTop: "1px" }}
                        >
                            Revenue Recovery
                        </p>
                    </div>
                </div>

                <nav
                    style={{
                        padding: "1rem 0.75rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px"
                    }}
                >
                    <div
                        className="eyebrow"
                        style={{
                            padding: "0.5rem 0.75rem 0.75rem"
                        }}
                    >
                        Navigation
                    </div>

                    {navItems.map((item) => {
                        const Icon = item.icon;

                        const isCurrentPath =
                            location.pathname === item.path ||
                            (item.altPath &&
                                location.pathname === item.altPath);

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end
                                style={({ isActive }) => {
                                    const active =
                                        isActive || isCurrentPath;

                                    return {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.625rem",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        fontWeight: active ? 600 : 500,
                                        transition:
                                            "background-color 150ms ease, color 150ms ease",
                                        textDecoration: "none",
                                        background: active
                                            ? "var(--primary-soft)"
                                            : "transparent",
                                        color: active
                                            ? "var(--primary)"
                                            : "var(--mute)"
                                    };
                                }}
                                onMouseEnter={(e) => {
                                    const active =
                                        e.currentTarget.getAttribute(
                                            "aria-current"
                                        ) === "page";

                                    if (!active) {
                                        e.currentTarget.style.backgroundColor =
                                            "var(--line)";
                                        e.currentTarget.style.color =
                                            "var(--ink)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const active =
                                        e.currentTarget.getAttribute(
                                            "aria-current"
                                        ) === "page";

                                    if (!active) {
                                        e.currentTarget.style.backgroundColor =
                                            "transparent";
                                        e.currentTarget.style.color =
                                            "var(--mute)";
                                    }
                                }}
                            >
                                <Icon
                                    size={15}
                                    strokeWidth={1.75}
                                />

                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div
                style={{
                    padding: "1rem",
                    borderTop: "1px solid var(--line)"
                }}
            >
                <div
                    style={{
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        background: "var(--surface-solid)",
                        border: "1px solid var(--line)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.375rem"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                    >
                        <span
                            className="animate-blip"
                            style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "9999px",
                                background: "var(--up)",
                                display: "inline-block",
                                flexShrink: 0
                            }}
                        />

                        <span
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--up)",
                                fontFamily:
                                    "'JetBrains Mono', monospace"
                            }}
                        >
                            Agent · Online
                        </span>
                    </div>

                    <span
                        style={{
                            fontSize: "0.6875rem",
                            color: "var(--mute)",
                            fontFamily:
                                "'JetBrains Mono', monospace",
                            paddingLeft: "0.875rem"
                        }}
                    >
                        Gemini Flash 3.6
                    </span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;