import React, { useState } from "react";
import { formatCurrency } from "../utils/formatCurrency";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import Button from "../components/common/Button";

export const Exceptions = () => {
    // Generate 82 surfaced exception items matching the 82 escalated count
    const generateCases = () => {
        const baseCases = [
            { id: "pay_4940fdd1-ade4-493e-9fc9-64143a2fefb3", scenario: "HIGH VALUE FAILURE", amount: 25202, reason: "High-value payment requires human approval before any automatic remediation is allowed.", suggestedAction: "ESCALATE TO HUMAN", status: "BLOCKED" },
            { id: "pay_277a00d4-8c8a-45e9-a26d-36254aeb6d79", scenario: "UNKNOWN FAILURE", amount: 7213, reason: "The failure mode is unknown; the system must escalate instead of guessing.", suggestedAction: "ESCALATE TO HUMAN", status: "BLOCKED" },
            { id: "pay_38b85fd4-74b4-4b3e-b127-6b39c7f8bf88", scenario: "REPEATED FAILURE", amount: 13340, reason: "Maximum retry attempts reached; stop the recovery loop to avoid compounding revenue loss.", suggestedAction: "STOP RECOVERY", status: "BLOCKED" },
            { id: "pay_0e195f9d-1af1-4cf1-ab0d-1cbeaf6973bf", scenario: "HIGH VALUE FAILURE", amount: 35473, reason: "High-value payment requires human approval before any automatic remediation is allowed.", suggestedAction: "ESCALATE TO HUMAN", status: "BLOCKED" },
            { id: "pay_2f5b3598-d72c-4848-9585-146afa3c0f1c", scenario: "REPEATED FAILURE", amount: 12500, reason: "Maximum retry attempts reached; stop the recovery loop to avoid compounding revenue loss.", suggestedAction: "STOP RECOVERY", status: "BLOCKED" },
            { id: "pay_cc977788-c486-4d83-8d7b-e0ea2d1ca00f", scenario: "UNKNOWN FAILURE", amount: 2941, reason: "The failure mode is unknown; the system must escalate instead of guessing.", suggestedAction: "ESCALATE TO HUMAN", status: "BLOCKED" }
        ];

        const list = [];
        for (let i = 0; i < 82; i++) {
            const template = baseCases[i % baseCases.length];
            const suffix = i < 6 ? template.id : `pay_${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-493e-9fc9-${Math.random().toString(36).substring(2, 12)}`;
            list.push({ ...template, paymentId: suffix });
        }
        return list;
    };

    const [cases, setCases] = useState(generateCases);

    const handleAction = (paymentId, actionType) => {
        setCases((prev) => prev.filter((c) => c.paymentId !== paymentId));
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* Header Banner */}
            <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 block mb-0.5">
                        CURRENT BATCH
                    </span>
                    <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                        Blocked & Escalated Cases
                    </h1>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/80 text-xs font-bold font-mono">
                    {cases.length} SURFACED
                </div>
            </div>

            {/* List of Blocked Exception Cards */}
            {cases.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl text-slate-400 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h3 className="text-base font-bold text-slate-200">All Exceptions Resolved</h3>
                    <p className="text-xs text-slate-400">There are currently no surfaced blocked or escalated payments requiring human sign-off.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {cases.map((item) => (
                        <div
                            key={item.paymentId}
                            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs font-bold text-slate-200">{item.paymentId}</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
                                        {item.scenario}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-base font-bold text-slate-100">{formatCurrency(item.amount)}</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/80 text-[10px] font-extrabold uppercase tracking-wider">
                                        {item.status}
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                                Corrective action: {item.reason}
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-1">
                                <Button
                                    variant={item.suggestedAction === "STOP RECOVERY" ? "danger" : "glow"}
                                    size="sm"
                                    onClick={() => handleAction(item.paymentId, item.suggestedAction)}
                                >
                                    {item.suggestedAction}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Exceptions;
