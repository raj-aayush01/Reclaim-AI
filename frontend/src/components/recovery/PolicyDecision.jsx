import React from "react";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { formatRecoveryAction } from "../../utils/statusHelpers";

export const PolicyDecision = ({ policyDecision, policyCheck }) => {
    // Support both backend policyDecision and legacy policyCheck props
    const decision = policyDecision || policyCheck || {};

    const isAllowed = decision.allowed !== false && decision.status !== "BLOCKED";
    const finalAction = decision.finalAction || decision.actionExecuted;
    const reasonText = decision.reason || decision.ruleApplied || (
        isAllowed
            ? "AI recommendation passed all deterministic recovery guardrails."
            : "High-value or repeated failure payment blocked by policy rules."
    );

    return (
        <div className={`glass-panel p-6 rounded-2xl border transition-all ${
            isAllowed
                ? "border-emerald-500/30 bg-emerald-950/10"
                : "border-rose-500/30 bg-rose-950/10"
        }`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl border ${
                        isAllowed
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    }`}>
                        {isAllowed ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-100">Recovery Policy Guardrail</h4>
                        <p className="text-[11px] text-slate-400">Deterministic Backend Rule Engine Check</p>
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider border flex items-center gap-1.5 ${
                    isAllowed
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/80"
                        : "bg-rose-950/60 text-rose-400 border-rose-800/80"
                }`}>
                    {isAllowed ? (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>APPROVED</span>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>BLOCKED</span>
                        </>
                    )}
                </div>
            </div>

            {finalAction && (
                <div className="mb-3 flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Final Permitted Action:</span>
                    <span className="font-semibold text-slate-200">{formatRecoveryAction(finalAction)}</span>
                </div>
            )}

            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-mono">
                {isAllowed ? `✓ ${reasonText}` : `✕ ${reasonText}`}
            </p>
        </div>
    );
};

export default PolicyDecision;
