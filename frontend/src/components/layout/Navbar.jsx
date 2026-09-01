import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sun, Moon } from "lucide-react";

export const Navbar = ({ timeRange = "7D", onTimeRangeChange }) => {
    const location = useLocation();

    const [dark, setDark] = useState(() => {
        const storedTheme = localStorage.getItem("reclaim-theme");

        if (storedTheme) {
            return storedTheme === "dark";
        }

        return (
            window.matchMedia?.("(prefers-color-scheme: dark)").matches ??
            true
        );
    });

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("reclaim-theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("reclaim-theme", "light");
        }
    }, [dark]);

    const getBreadcrumb = () => {
        const path = location.pathname.toLowerCase();

        /* =========================
           Dashboard / Overview
           ========================= */
        if (path === "/" || path === "/overview") {
            return "Overview";
        }

        /* =========================
           Payment Ledger
           ========================= */
        if (path === "/ledger" || path === "/payments") {
            return "Payment Ledger";
        }

        /* =========================
           AI Control Room
           ========================= */
        if (path === "/control-room") {
            return "AI Control Room";
        }

        /* =========================
           Failed Payments
           ========================= */
        if (path === "/failed-payments") {
            return "Failed Payments";
        }

        /* =========================
           Failed Subscriptions
           ========================= */
        if (path === "/failed-subscriptions") {
            return "Failed Subscriptions";
        }

        /* =========================
           Exceptions
           ========================= */
        if (path === "/exceptions") {
            return "Exceptions";
        }

        /* =========================
           Guardrails
           ========================= */
        if (path === "/guardrails") {
            return "Guardrails";
        }

        /* =========================
           Payment Details
           ========================= */
        if (path.startsWith("/payments/")) {
            return "Payment Details";
        }

        /* =========================
           Fallback
           ========================= */
        return "Overview";
    };

    return (
        <header
            style={{
                height: "4rem",
                background: "var(--surface)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid var(--line)",
                position: "fixed",
                top: 0,
                right: 0,
                left: "16rem",
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 2rem"
            }}
        >
            {/* =========================
                Page title
               ========================= */}
            <div>
                <span
                    className="eyebrow"
                    style={{
                        display: "block",
                        marginBottom: "1px"
                    }}
                >
                    Reclaim AI
                </span>

                <h2
                    style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--ink)",
                        letterSpacing: "-0.01em",
                        fontFamily: "'Inter', sans-serif"
                    }}
                >
                    {getBreadcrumb()}
                </h2>
            </div>

            {/* =========================
                Navbar controls
               ========================= */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem"
                }}
            >
                {/* Time range */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "3px",
                        borderRadius: "0.5rem",
                        background: "var(--surface-solid)",
                        border: "1px solid var(--line)",
                        gap: "2px"
                    }}
                >
                    {["Today", "7D", "30D"].map((t) => (
                        <button
                            key={t}
                            onClick={() =>
                                onTimeRangeChange &&
                                onTimeRangeChange(t)
                            }
                            style={{
                                padding: "0.25rem 0.625rem",
                                borderRadius: "0.375rem",
                                fontSize: "0.6875rem",
                                fontWeight: timeRange === t ? 600 : 500,
                                fontFamily:
                                    "'JetBrains Mono', monospace",
                                cursor: "pointer",
                                transition: "all 150ms ease",
                                border: "none",
                                background:
                                    timeRange === t
                                        ? "var(--primary)"
                                        : "transparent",
                                color:
                                    timeRange === t
                                        ? "white"
                                        : "var(--mute)"
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Theme toggle */}
                <button
                    type="button"
                    onClick={() => setDark((value) => !value)}
                    aria-label={
                        dark
                            ? "Switch to light mode"
                            : "Switch to dark mode"
                    }
                    title={
                        dark
                            ? "Switch to light mode"
                            : "Switch to dark mode"
                    }
                    style={{
                        width: "2rem",
                        height: "2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--line)",
                        background: "var(--surface-solid)",
                        color: "var(--mute)",
                        cursor: "pointer",
                        transition:
                            "background-color 150ms ease, color 150ms ease, border-color 150ms ease"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                            "var(--line)";
                        e.currentTarget.style.color = "var(--ink)";
                        e.currentTarget.style.borderColor =
                            "var(--line-strong)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                            "var(--surface-solid)";
                        e.currentTarget.style.color = "var(--mute)";
                        e.currentTarget.style.borderColor =
                            "var(--line)";
                    }}
                >
                    {dark ? (
                        <Sun size={15} strokeWidth={1.8} />
                    ) : (
                        <Moon size={15} strokeWidth={1.8} />
                    )}
                </button>

                {/* Live status */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "9999px",
                        background: "var(--primary-soft)",
                        border: "1px solid var(--primary-border)"
                    }}
                >
                    <span
                        className="animate-blip"
                        style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "9999px",
                            background: "var(--primary)",
                            display: "inline-block",
                            flexShrink: 0
                        }}
                    />

                    <span
                        style={{
                            fontSize: "0.625rem",
                            fontWeight: 600,
                            fontFamily:
                                "'JetBrains Mono', monospace",
                            letterSpacing: "0.1em",
                            color: "var(--primary)",
                            textTransform: "uppercase"
                        }}
                    >
                        Live
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Navbar;