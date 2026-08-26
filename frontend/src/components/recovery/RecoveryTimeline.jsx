import React from "react";
import { Clock, XCircle, Bot, ShieldCheck, Zap, UserCheck } from "lucide-react";
import { formatRecoveryAction } from "../../utils/statusHelpers";

export const RecoveryTimeline = ({ payment = {}, aiDecision, policyDecision, executionResult }) => {
    const aiAction = aiDecision?.action || payment.recoveryAction;
    const isPolicyAllowed = policyDecision?.allowed !== false && payment.status !== "escalated";
    const policyReason = policyDecision?.reason || policyDecision?.ruleApplied;
    const resultStatus = executionResult?.result || executionResult?.status || payment.status;

    // Extract exact executed action to format informative timeline outcome (e.g. Outcome: Generated Payment Link)
    const executedAction = executionResult?.actionExecuted || executionResult?.finalAction || policyDecision?.finalAction || payment.recoveryAction;

    const steps = [
        {
            title: "1. Payment Failure Detection",
            desc: `Scenario: ${payment.scenario || "CARD_DECLINED"} • Failure Recorded`,
            status: "completed",
            icon: XCircle,
            color: "text-rose-400 border-rose-500/30 bg-rose-950/40"
        },
        {
            title: "2. Gemini AI Analysis",
            desc: aiAction ? `Recommendation: ${formatRecoveryAction(aiAction)}` : "Analyzing failure parameters...",
            status: aiAction ? "completed" : "active",
            icon: Bot,
            color: "text-indigo-400 border-indigo-500/30 bg-indigo-950/40"
        },
        {
            title: "3. Policy Guardrail Check",
            desc: policyDecision ? (isPolicyAllowed ? "APPROVED by recovery rules" : `BLOCKED: ${policyReason}`) : "Evaluating safety rules...",
            status: policyDecision ? "completed" : (aiAction ? "active" : "pending"),
            icon: ShieldCheck,
            color: isPolicyAllowed ? "text-purple-400 border-purple-500/30 bg-purple-950/40" : "text-rose-400 border-rose-500/30 bg-rose-950/40"
        },
        {
            title: "4. Executor Execution",
            desc: executedAction
                ? `Outcome: ${formatRecoveryAction(executedAction)}`
                : "Awaiting execution",
            status: executionResult || payment.recoveryAction ? "completed" : "pending",
            icon: Zap,
            color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40"
        },
        {
            title: "5. Customer Outcome Resolution",
            desc: `Status: ${resultStatus || "pending"}`,
            status: resultStatus === "recovered" ? "completed" : "active",
            icon: UserCheck,
            color: resultStatus === "recovered" ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/40" : "text-amber-400 border-amber-500/30 bg-amber-950/40"
        }
    ];

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <h4 className="text-sm font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Autonomous Recovery Lifecycle Timeline
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                        <div key={idx} className="relative flex items-start gap-4 group">
                            {/* Node Bullet */}
                            <div className={`absolute -left-6 p-1.5 rounded-full border shadow-md shrink-0 ${step.color}`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>

                            {/* Step Content */}
                            <div>
                                <h5 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                                    {step.title}
                                </h5>
                                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecoveryTimeline;
