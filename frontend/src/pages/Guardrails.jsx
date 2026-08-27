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
        <div className="space-y-8 animate-fade-in font-sans">
            {/* Header Banner */}
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-0.5">
                        POLICY ENGINE
                    </span>
                    <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        Rules the Agent Follows
                    </h1>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 text-xs font-bold font-mono">
                    05 ACTIVE RULES
                </div>
            </div>

            {/* 5 Rule Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {rules.map((rule) => {
                    const Icon = rule.icon;
                    return (
                        <div key={rule.num} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold font-mono text-emerald-400">{rule.num}</span>
                                <div className="p-2 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800">
                                    <Icon className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xs font-bold text-slate-100">{rule.title}</h3>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{rule.desc}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Policy Firings Table */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-0.5">
                            LIVE EXAMPLES
                        </span>
                        <h3 className="text-base font-bold text-slate-100">Recent Policy Firings</h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">6 FIRED</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="px-4 py-3">Payment ID</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Action Taken</th>
                                <th className="px-4 py-3">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs">
                            {firings.map((f, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40">
                                    <td className="px-4 py-3 font-mono font-bold text-slate-200">{f.paymentId}</td>
                                    <td className="px-4 py-3 font-bold text-slate-100">{formatCurrency(f.amount)}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[10px] font-extrabold">
                                            {f.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-400">{f.reason}</td>
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
