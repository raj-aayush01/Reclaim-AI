import React from "react";
import { ShieldCheck, DollarSign, Hash, AlertOctagon, HelpCircle, Target } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

export const Guardrails = () => {
    const rules = [
        {
            num: "01",
            icon: DollarSign,
            title: "High-Value Threshold",
            desc: "Payments above ₹20,000 are escalated to human review — never auto-retried."
        },
        {
            num: "02",
            icon: Hash,
            title: "Retry Limit",
            desc: "The system stops after 3 recovery attempts to prevent compounding losses."
        },
        {
            num: "03",
            icon: Target,
            title: "Scenario Guard",
            desc: "Retry is valid only for temporary failures; blocked for all other failure modes."
        },
        {
            num: "04",
            icon: AlertOctagon,
            title: "Unknown Failures",
            desc: "Any unrecognised failure mode is escalated, never guessed."
        },
        {
            num: "05",
            icon: HelpCircle,
            title: "Confidence Threshold",
            desc: "A recommendation is rejected if AI confidence is below the policy minimum."
        }
    ];

    const firings = [
        { paymentId: "pay_4940fdd1-ade4-493e-9fc9-64143a2fefb3", amount: 25202, action: "ESCALATE TO HUMAN", reason: "High-value payment requires human approval..." },
        { paymentId: "pay_277a00d4-8c8a-45e9-a26d-36254aeb6d79", amount: 7213, action: "ESCALATE TO HUMAN", reason: "The failure mode is unknown; escalate..." },
        { paymentId: "pay_38b85fd4-74b4-4b3e-b127-6b39c7f8bf88", amount: 13340, action: "STOP RECOVERY", reason: "Maximum retry attempts reached..." },
        { paymentId: "pay_0e195f9d-1af1-4cf1-ab0d-1cbeaf6973bf", amount: 35473, action: "ESCALATE TO HUMAN", reason: "High-value payment requires human approval..." }
    ];

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* Header Banner */}
            <div className="panel panel-accent-up p-6 rounded-xl flex items-center justify-between">
                <div>
                    <span className="eyebrow" style={{ color: "var(--up)", display: "block", marginBottom: "2px" }}>
                        POLICY ENGINE
                    </span>
                    <h1
                        style={{
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: "var(--ink)",
                            fontFamily: "'Inter', sans-serif",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                    >
                        <ShieldCheck className="w-5 h-5" style={{ color: "var(--up)" }} />
                        Rules the Agent Follows
                    </h1>
                </div>

                <div className="count-pill count-pill-up">
                    05 ACTIVE RULES
                </div>
            </div>

            {/* 5 Rule Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {rules.map((rule) => {
                    const Icon = rule.icon;
                    return (
                        <div key={rule.num} className="panel p-5 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span
                                    style={{
                                        fontSize: "1.125rem",
                                        fontWeight: 800,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        color: "var(--up)"
                                    }}
                                >
                                    {rule.num}
                                </span>
                                <div className="icon-box icon-box-sm icon-box-up">
                                    <Icon className="w-4 h-4" />
                                </div>
                            </div>
                            <h3
                                style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 700,
                                    color: "var(--ink)"
                                }}
                            >
                                {rule.title}
                            </h3>
                            <p
                                style={{
                                    fontSize: "0.6875rem",
                                    color: "var(--mute)",
                                    lineHeight: 1.5
                                }}
                            >
                                {rule.desc}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Policy Firings Table */}
            <div className="panel p-6 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="eyebrow" style={{ color: "var(--up)", display: "block", marginBottom: "2px" }}>
                            LIVE EXAMPLES
                        </span>
                        <h3
                            style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                color: "var(--ink)",
                                fontFamily: "'Inter', sans-serif"
                            }}
                        >
                            Recent Policy Firings
                        </h3>
                    </div>
                    <span
                        style={{
                            fontSize: "0.75rem",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            color: "var(--mute)"
                        }}
                    >
                        6 FIRED
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="tf-table">
                        <thead>
                            <tr>
                                <th>Payment ID</th>
                                <th>Amount</th>
                                <th>Action Taken</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {firings.map((f, idx) => (
                                <tr key={idx} className="row-hover">
                                    <td className="font-mono" style={{ fontWeight: 600, color: "var(--ink)" }}>{f.paymentId}</td>
                                    <td style={{ fontWeight: 700, color: "var(--ink)" }}>{formatCurrency(f.amount)}</td>
                                    <td>
                                        <span className="badge-warn" style={{ display: "inline-block", padding: "0.1875rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.625rem", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                                            {f.action}
                                        </span>
                                    </td>
                                    <td className="font-mono" style={{ color: "var(--mute)" }}>{f.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Guardrails;
