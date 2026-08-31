import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Activity, BookOpen, Check, X, Sun, Moon } from "lucide-react";

/* ─── Recovery Ledger Demo Data ─────────────────────────── */
const ledgerRows = [
    { id: "inv_8f21c", amount: "$2,480.00", status: "Recovered", statusKey: "recovered", agent: "retry 1" },
    { id: "inv_a39e0", amount: "$1,120.00", status: "Recovered", statusKey: "recovered", agent: "retry 2" },
    { id: "inv_51b77", amount: "$960.00",   status: "Retrying",  statusKey: "retrying",  agent: "next 1.4h" },
    { id: "inv_c04d2", amount: "$3,300.00", status: "Failed",    statusKey: "failed",    agent: "3 attempts" },
];

const statusStyles = {
    recovered: { color: "var(--up)" },
    retrying:  { color: "var(--primary)" },
    failed:    { color: "var(--down)" },
};

/* ─── Recovery Ledger Panel ─────────────────────────────── */
function RecoveryLedger() {
    return (
        <div
            className="animate-rise-3"
            style={{
                background: "var(--surface)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid var(--line)",
                borderRadius: "0.875rem",
                boxShadow: "var(--shadow-panel)",
                overflow: "hidden",
                maxWidth: "440px",
                width: "100%"
            }}
        >
            {/* Top bar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--line)"
                }}
            >
                {/* Window controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    {["var(--down)", "var(--warn)", "var(--up)"].map((c, i) => (
                        <span
                            key={i}
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "9999px",
                                background: c,
                                opacity: 0.7,
                                display: "inline-block"
                            }}
                        />
                    ))}
                </div>
                {/* Live label */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span
                        className="animate-blip"
                        style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "9999px",
                            background: "var(--primary)",
                            display: "inline-block"
                        }}
                    />
                    <span
                        style={{
                            fontSize: "0.5625rem",
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: "0.2em",
                            color: "var(--mute)",
                            textTransform: "uppercase"
                        }}
                    >
                        Recovery Ledger · Live
                    </span>
                </div>
            </div>

            {/* Table */}
            <div style={{ padding: "0" }}>
                {/* Headers */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        padding: "0.5rem 1rem",
                        borderBottom: "1px solid var(--line)"
                    }}
                >
                    {["Invoice", "Amount", "Status", "Agent"].map((h) => (
                        <span
                            key={h}
                            style={{
                                fontSize: "0.5625rem",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 600,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: "var(--mute)"
                            }}
                        >
                            {h}
                        </span>
                    ))}
                </div>

                {/* Rows */}
                {ledgerRows.map((row, i) => (
                    <div
                        key={row.id}
                        className={row.statusKey === "retrying" ? "animate-catch" : ""}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr",
                            padding: "0.5625rem 1rem",
                            borderBottom: i < ledgerRows.length - 1 ? "1px solid var(--line)" : "none",
                            transition: "background-color 150ms ease",
                            background: row.statusKey === "retrying" ? "var(--primary-muted)" : "transparent",
                            cursor: "default"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--primary-soft)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                row.statusKey === "retrying" ? "var(--primary-muted)" : "transparent";
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.6875rem",
                                fontFamily: "'JetBrains Mono', monospace",
                                color: "var(--ink)",
                                fontWeight: 500
                            }}
                        >
                            {row.id}
                        </span>
                        <span
                            style={{
                                fontSize: "0.6875rem",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontVariantNumeric: "tabular-nums",
                                color: "var(--ink)"
                            }}
                        >
                            {row.amount}
                        </span>
                        <span
                            style={{
                                fontSize: "0.6875rem",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 600,
                                ...statusStyles[row.statusKey]
                            }}
                        >
                            {row.status}
                        </span>
                        <span
                            style={{
                                fontSize: "0.6875rem",
                                fontFamily: "'JetBrains Mono', monospace",
                                color: "var(--mute)"
                            }}
                        >
                            {row.agent}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 1rem",
                    borderTop: "1px solid var(--line)"
                }}
            >
                <span
                    style={{
                        fontSize: "0.6875rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "var(--mute)"
                    }}
                >
                    total recovered{" "}
                    <span style={{ color: "var(--up)", fontWeight: 600 }}>$4,215,980.00</span>
                </span>
                <span
                    style={{
                        fontSize: "0.6875rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "var(--mute)"
                    }}
                >
                    38.6% of volume
                </span>
            </div>
        </div>
    );
}

/* ─── Landing Page ──────────────────────────────────────── */
export const LandingPage = () => {
    const navigate = useNavigate();
    const [dark, setDark] = useState(() =>
        window.matchMedia?.("(prefers-color-scheme: dark)").matches
    );

    useEffect(() => {
        if (dark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
    }, [dark]);

    const btnPrimary = {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.625rem 1.125rem",
        borderRadius: "0.5rem",
        background: "var(--primary)",
        color: "white",
        fontWeight: 600,
        fontSize: "0.875rem",
        fontFamily: "'Inter', sans-serif",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 8px oklch(0.43 0.075 180 / 0.35)",
        transition: "opacity 150ms ease, transform 80ms ease",
        textDecoration: "none"
    };

    const btnSecondary = {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.625rem 1.125rem",
        borderRadius: "0.5rem",
        background: "transparent",
        color: "var(--ink)",
        fontWeight: 500,
        fontSize: "0.875rem",
        fontFamily: "'Inter', sans-serif",
        border: "1px solid var(--line)",
        cursor: "pointer",
        transition: "all 150ms ease",
        textDecoration: "none"
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--background)",
                color: "var(--ink)",
                display: "flex",
                flexDirection: "column",
                fontFamily: "'Inter', sans-serif"
            }}
        >
            {/* ── Site Header ─────────────────────────────── */}
            <header
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                    background: "var(--surface)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    borderBottom: "1px solid var(--line)"
                }}
            >
                <div
                    style={{
                        maxWidth: "72rem",
                        margin: "0 auto",
                        padding: "0 1.5rem",
                        height: "4rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}
                >
                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div
                            style={{
                                width: "1.625rem",
                                height: "1.625rem",
                                borderRadius: "0.4375rem",
                                background: "var(--primary-soft)",
                                border: "1px solid oklch(0.43 0.075 180 / 0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--primary)"
                            }}
                        >
                            <Zap size={13} strokeWidth={2.5} />
                        </div>
                        <span
                            style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                letterSpacing: "-0.025em",
                                color: "var(--ink)"
                            }}
                        >
                            Reclaim<span style={{ color: "var(--primary)" }}>.AI</span>
                        </span>
                    </div>

                    {/* Nav */}
                    <nav
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "2rem"
                        }}
                    >
                        {[
                            { label: "How it works", href: "#how" },
                            { label: "Guardrails", href: "#guardrails" },
                            { label: "Ledger", href: "#ledger" }
                        ].map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 500,
                                    color: "var(--mute)",
                                    textDecoration: "none",
                                    transition: "color 150ms ease"
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--mute)")}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Right: dark toggle + CTA */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <button
                            onClick={() => setDark((d) => !d)}
                            style={{
                                padding: "0.375rem",
                                borderRadius: "0.4375rem",
                                border: "1px solid var(--line)",
                                background: "transparent",
                                color: "var(--mute)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                transition: "all 150ms ease"
                            }}
                        >
                            {dark ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                        <Link to="/overview" style={{ textDecoration: "none" }}>
                            <button
                                style={btnPrimary}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                                <span>Open Console</span>
                                <ArrowRight size={14} />
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Hero ────────────────────────────────────── */}
            <section
                style={{
                    maxWidth: "72rem",
                    margin: "0 auto",
                    padding: "5rem 1.5rem 4rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4rem",
                    alignItems: "center"
                }}
            >
                {/* Left copy */}
                <div>
                    <div className="animate-rise" style={{ marginBottom: "1.25rem" }}>
                        <span
                            className="eyebrow-primary"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.25rem 0.625rem",
                                borderRadius: "9999px",
                                background: "var(--primary-soft)",
                                border: "1px solid oklch(0.43 0.075 180 / 0.2)"
                            }}
                        >
                            <span
                                className="animate-blip"
                                style={{
                                    width: "5px",
                                    height: "5px",
                                    borderRadius: "9999px",
                                    background: "var(--primary)",
                                    display: "inline-block"
                                }}
                            />
                            Revenue Recovery Agent
                        </span>
                    </div>

                    <h1
                        className="animate-rise-1"
                        style={{
                            fontSize: "clamp(2.25rem, 4vw, 3.25rem)",
                            fontWeight: 700,
                            lineHeight: 1.06,
                            letterSpacing: "-0.03em",
                            color: "var(--ink)",
                            marginBottom: "1.25rem"
                        }}
                    >
                        Failed payments,{" "}
                        <span style={{ color: "var(--primary)" }}>caught and recovered</span>{" "}
                        automatically.
                    </h1>

                    <p
                        className="animate-rise-2"
                        style={{
                            fontSize: "1rem",
                            color: "var(--mute)",
                            lineHeight: 1.7,
                            marginBottom: "2rem",
                            maxWidth: "36rem"
                        }}
                    >
                        Reclaim AI's agent re-routes declined charges, corrects failure scenarios, and re-submits within the recovery window — so revenue that slips through never stays gone.
                    </p>

                    <div
                        className="animate-rise-2"
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}
                    >
                        <button
                            onClick={() => navigate("/overview")}
                            style={btnPrimary}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                            <span>See Live Recovery</span>
                            <ArrowRight size={14} />
                        </button>
                        <a
                            href="#guardrails"
                            style={btnSecondary}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--line)";
                                e.currentTarget.style.borderColor = "var(--line-strong)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.borderColor = "var(--line)";
                            }}
                        >
                            <ShieldCheck size={14} style={{ color: "var(--primary)" }} />
                            <span>View Guardrails</span>
                        </a>
                    </div>

                    {/* KPI pills */}
                    <div
                        className="animate-rise-3"
                        style={{
                            display: "flex",
                            gap: "1.5rem",
                            marginTop: "2.5rem",
                            flexWrap: "wrap"
                        }}
                    >
                        {[
                            { value: "$4.2M", label: "Recovered · 90d" },
                            { value: "38.6%", label: "Recovery Rate" },
                            { value: "1.9m", label: "Median Recovery Time" }
                        ].map((kpi) => (
                            <div key={kpi.label}>
                                <div
                                    style={{
                                        fontSize: "1.5rem",
                                        fontWeight: 700,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontVariantNumeric: "tabular-nums",
                                        color: "var(--ink)",
                                        letterSpacing: "-0.02em",
                                        lineHeight: 1.1
                                    }}
                                >
                                    {kpi.value}
                                </div>
                                <div className="eyebrow" style={{ marginTop: "3px" }}>{kpi.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Ledger Panel */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <RecoveryLedger />
                </div>
            </section>

            {/* ── How It Works ────────────────────────────── */}
            <section
                id="how"
                style={{
                    background: "var(--surface-solid)",
                    borderTop: "1px solid var(--line)",
                    borderBottom: "1px solid var(--line)"
                }}
            >
                <div
                    style={{
                        maxWidth: "72rem",
                        margin: "0 auto",
                        padding: "4rem 1.5rem"
                    }}
                >
                    <div className="animate-rise" style={{ marginBottom: "3rem" }}>
                        <span className="eyebrow" style={{ display: "block", marginBottom: "0.5rem" }}>
                            How the Agent Works
                        </span>
                        <h2
                            style={{
                                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                                fontWeight: 700,
                                letterSpacing: "-0.025em",
                                color: "var(--ink)"
                            }}
                        >
                            A recovery timeline, end to end.
                        </h2>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "1.5px",
                            background: "var(--line)"
                        }}
                    >
                        {[
                            { step: "01", title: "Detect", desc: "Every decline is classified by code and wallet the moment it drops." },
                            { step: "02", title: "Diagnose", desc: "Agent reads the reject reason and the customer's payment history." },
                            { step: "03", title: "Act", desc: "Re-route, correct address, or schedule a smart retry within window." },
                            { step: "04", title: "Log", desc: "Each decision is written to an auditable, replayable log." }
                        ].map((item, i) => (
                            <div
                                key={item.step}
                                className={`animate-rise-${i + 1}`}
                                style={{
                                    padding: "2rem 1.5rem",
                                    background: "var(--surface-solid)"
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "0.8125rem",
                                        fontFamily: "'JetBrains Mono', monospace",
                                        color: "var(--primary)",
                                        fontWeight: 600,
                                        marginBottom: "0.75rem"
                                    }}
                                >
                                    ({item.step})
                                </div>
                                <h3
                                    style={{
                                        fontSize: "0.9375rem",
                                        fontWeight: 600,
                                        color: "var(--ink)",
                                        marginBottom: "0.625rem",
                                        fontFamily: "'Inter', sans-serif"
                                    }}
                                >
                                    {item.title}
                                </h3>
                                <p style={{ fontSize: "0.8125rem", color: "var(--mute)", lineHeight: 1.6 }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Failed Payments Ledger Preview ──────────── */}
            <section
                id="ledger"
                style={{
                    maxWidth: "72rem",
                    margin: "0 auto",
                    padding: "4rem 1.5rem"
                }}
            >
                <div
                    className="panel animate-rise"
                    style={{ overflow: "hidden" }}
                >
                    {/* Panel Header */}
                    <div
                        style={{
                            padding: "1.25rem 1.5rem",
                            borderBottom: "1px solid var(--line)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}
                    >
                        <div>
                            <span className="eyebrow" style={{ display: "block", marginBottom: "3px" }}>
                                In Product
                            </span>
                            <h3
                                style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    color: "var(--ink)",
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: "-0.01em"
                                }}
                            >
                                Failed payments ledger
                            </h3>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span
                                className="animate-blip"
                                style={{
                                    width: "5px",
                                    height: "5px",
                                    borderRadius: "9999px",
                                    background: "var(--primary)",
                                    display: "inline-block"
                                }}
                            />
                            <span
                                style={{
                                    fontSize: "0.6875rem",
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: "var(--mute)"
                                }}
                            >
                                last sync 12s ago
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="tf-table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Amount</th>
                                <th>Code</th>
                                <th>Retry State</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { id: "inv_8f21c", amount: "$2,480.00", code: "expired card",    state: "Recovered · retry 1", stateKey: "recovered" },
                                { id: "inv_a39e0", amount: "$1,120.00", code: "insufficient",    state: "Recovered · retry 2", stateKey: "recovered" },
                                { id: "inv_51b77", amount: "$960.00",   code: "expired card",    state: "Retrying · next 1.4h", stateKey: "retrying" },
                                { id: "inv_c04d2", amount: "$3,300.00", code: "card declined",   state: "Failed · 3 attempts",  stateKey: "failed" },
                                { id: "inv_77ba1", amount: "$12,400.00", code: "over auto-cap",  state: "Held · awaiting sign-off", stateKey: "held" }
                            ].map((row, i) => (
                                <tr
                                    key={row.id}
                                    className={row.stateKey === "retrying" ? "animate-catch" : "row-hover"}
                                    style={{
                                        borderBottom: "1px solid var(--line)"
                                    }}
                                >
                                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "var(--ink)" }}>
                                        {row.id}
                                    </td>
                                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>
                                        {row.amount}
                                    </td>
                                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "var(--mute)" }}>
                                        {row.code}
                                    </td>
                                    <td
                                        style={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            ...statusStyles[row.stateKey] || { color: "var(--warn)" }
                                        }}
                                    >
                                        {row.state}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── Guardrails Section ───────────────────────── */}
            <section
                id="guardrails"
                style={{
                    background: "var(--surface-solid)",
                    borderTop: "1px solid var(--line)",
                    borderBottom: "1px solid var(--line)"
                }}
            >
                <div
                    style={{
                        maxWidth: "72rem",
                        margin: "0 auto",
                        padding: "4rem 1.5rem",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "3rem",
                        alignItems: "start"
                    }}
                >
                    {/* Left copy */}
                    <div className="animate-rise">
                        <span className="eyebrow" style={{ display: "block", marginBottom: "0.5rem" }}>
                            Guardrails &amp; Trust
                        </span>
                        <h2
                            style={{
                                fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                                fontWeight: 700,
                                letterSpacing: "-0.025em",
                                color: "var(--ink)",
                                marginBottom: "1rem"
                            }}
                        >
                            The agent acts only inside the boundary you set.
                        </h2>
                        <p
                            style={{
                                fontSize: "0.9rem",
                                color: "var(--mute)",
                                lineHeight: 1.7,
                                marginBottom: "1.5rem"
                            }}
                        >
                            Hard caps, a human-approval layer above a threshold, and a replayable decision log mean every recovery is explainable before it happens — not after.
                        </p>

                        {/* Policy Table */}
                        <div
                            className="panel"
                            style={{ overflow: "hidden" }}
                        >
                            {[
                                { label: "max retry per invoice", value: "4", color: "var(--ink)" },
                                { label: "auto-recover cap", value: "$5,000.00", color: "var(--ink)" },
                                { label: "approval required above", value: "$10,000.00", color: "var(--warn)" },
                                { label: "quiet hours (customer local)", value: "20:00 – 08:00", color: "var(--ink)" }
                            ].map((row, i, arr) => (
                                <div
                                    key={row.label}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "0.625rem 1rem",
                                        borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none"
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "0.75rem",
                                            fontFamily: "'JetBrains Mono', monospace",
                                            color: "var(--mute)"
                                        }}
                                    >
                                        {row.label}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.75rem",
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontWeight: 600,
                                            fontVariantNumeric: "tabular-nums",
                                            color: row.color
                                        }}
                                    >
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Decision Log */}
                    <div className="animate-rise-1">
                        <div
                            className="panel"
                            style={{ overflow: "hidden" }}
                        >
                            <div
                                style={{
                                    padding: "0.75rem 1rem",
                                    borderBottom: "1px solid var(--line)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "0.6875rem",
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontWeight: 600,
                                        letterSpacing: "0.1em",
                                        color: "var(--ink)",
                                        textTransform: "uppercase"
                                    }}
                                >
                                    Agent Decision Log
                                </span>
                                <span
                                    style={{
                                        fontSize: "0.625rem",
                                        fontFamily: "'JetBrains Mono', monospace",
                                        color: "var(--mute)"
                                    }}
                                >
                                    replayable
                                </span>
                            </div>
                            {[
                                { time: "14:02:11", id: "inv_51b77", action: "schedule retry in 1.4h", color: "var(--primary)" },
                                { time: "14:02:07", id: "inv_a39e0", action: "re-route via acquirer B", color: "var(--up)" },
                                { time: "14:01:58", id: "inv_c04d2", action: "hold · 3 fails, escalate", color: "var(--down)" },
                                { time: "14:01:22", id: "inv_77ba1", action: "route to human · above cap", color: "var(--warn)" }
                            ].map((entry, i) => (
                                <div
                                    key={entry.id}
                                    style={{
                                        padding: "0.625rem 1rem",
                                        borderBottom: i < 3 ? "1px solid var(--line)" : "none",
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: "0.6875rem"
                                    }}
                                >
                                    <span style={{ color: "var(--mute)" }}>{entry.time}&nbsp;&nbsp;</span>
                                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{entry.id}</span>
                                    <span style={{ color: "var(--mute)" }}> → </span>
                                    <span style={{ color: entry.color, fontWeight: 600 }}>{entry.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Does / Never Does ───────────────────────── */}
            <section
                style={{
                    maxWidth: "72rem",
                    margin: "0 auto",
                    padding: "4rem 1.5rem"
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1.5rem"
                    }}
                >
                    {/* Does */}
                    <div
                        className="panel panel-accent-up animate-rise"
                        style={{
                            padding: "1.5rem"
                        }}
                    >
                        <h3
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "var(--up)",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: "1rem"
                            }}
                        >
                            <Check size={14} />
                            What the Agent Does
                        </h3>
                        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                            {[
                                "Retries only safe, temporary failures — never invalid ones",
                                "Sends payment links for declined cards with no retry budget",
                                "Escalates to a human for high-value payments above ₹20,000",
                                "Logs every decision with AI reason and confidence score",
                                "Halts after 3 attempts to prevent compounding losses"
                            ].map((item) => (
                                <li
                                    key={item}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "0.5rem",
                                        fontSize: "0.8125rem",
                                        color: "var(--ink)",
                                        lineHeight: 1.5
                                    }}
                                >
                                    <span style={{ color: "var(--up)", fontWeight: 700, flexShrink: 0 }}>·</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Never Does */}
                    <div
                        className="panel panel-accent-down animate-rise-1"
                        style={{
                            padding: "1.5rem"
                        }}
                    >
                        <h3
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "var(--down)",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: "1rem"
                            }}
                        >
                            <X size={14} />
                            What It Will Never Do
                        </h3>
                        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                            {[
                                "Never guesses on unknown failure modes — escalates instead",
                                "Never retries a payment that was intentionally declined",
                                "Never acts without a policy-validated decision",
                                "Never exposes customer data in logs or API responses",
                                "Never auto-recovers blocked payments without human sign-off"
                            ].map((item) => (
                                <li
                                    key={item}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "0.5rem",
                                        fontSize: "0.8125rem",
                                        color: "var(--ink)",
                                        lineHeight: 1.5
                                    }}
                                >
                                    <span style={{ color: "var(--down)", fontWeight: 700, flexShrink: 0 }}>·</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ──────────────────────────────── */}
            <section
                style={{
                    background: "var(--surface-solid)",
                    borderTop: "1px solid var(--line)"
                }}
            >
                <div
                    style={{
                        maxWidth: "72rem",
                        margin: "0 auto",
                        padding: "4rem 1.5rem",
                        textAlign: "center"
                    }}
                >
                    <h2
                        className="animate-rise"
                        style={{
                            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                            fontWeight: 700,
                            letterSpacing: "-0.03em",
                            color: "var(--ink)",
                            marginBottom: "0.75rem"
                        }}
                    >
                        Stop losing revenue to declines.
                    </h2>
                    <p
                        className="animate-rise-1"
                        style={{
                            fontSize: "0.9375rem",
                            color: "var(--mute)",
                            marginBottom: "2rem"
                        }}
                    >
                        Reclaim AI recovers failed payments autonomously, within your guardrails.
                    </p>
                    <div
                        className="animate-rise-2"
                        style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}
                    >
                        <button
                            onClick={() => navigate("/overview")}
                            style={btnPrimary}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                            <span>Open Recovery Console</span>
                            <ArrowRight size={14} />
                        </button>
                        <a
                            href="#how"
                            style={btnSecondary}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--line)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                            }}
                        >
                            Talk to the team
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────── */}
            <footer
                style={{
                    borderTop: "1px solid var(--line)"
                }}
            >
                <div
                    style={{
                        maxWidth: "72rem",
                        margin: "0 auto",
                        padding: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}
                >
                    <span
                        style={{
                            fontSize: "0.875rem",
                            fontWeight: 700,
                            color: "var(--ink)",
                            letterSpacing: "-0.02em"
                        }}
                    >
                        Reclaim<span style={{ color: "var(--primary)" }}>.AI</span>
                    </span>
                    <span
                        style={{
                            fontSize: "0.6875rem",
                            fontFamily: "'JetBrains Mono', monospace",
                            color: "var(--mute)"
                        }}
                    >
                        © 2026 Reclaim Systems · operator-grade recovery
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
