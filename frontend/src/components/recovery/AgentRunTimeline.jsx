import React from "react";
import {
    Search,
    Zap,
    Link as LinkIcon,
    ShieldAlert,
    XOctagon,
    CheckCircle2,
    XCircle,
    Clock,
    Bot,
    AlertTriangle
} from "lucide-react";

export const AgentRunTimeline = ({ runData = {}, fallbackSteps = [] }) => {

    const steps = runData?.steps?.length
        ? runData.steps
        : fallbackSteps;

    const status = runData?.status || "COMPLETED";

    /*
     * Map each actual agent tool/type to a visual representation.
     */
    const getStepMeta = (step) => {

        const tool = step?.tool || "";
        const type = step?.type || "";
        const value = `${tool} ${type}`.toLowerCase();

        if (value.includes("get_payment")) {
            return {
                icon: Search,
                iconColor:
                    "text-cyan-400 bg-cyan-950/60 border-cyan-800/60",
                title: "Payment Inspection",
                label: "get_payment",
                description: "Payment state inspected"
            };
        }

        if (value.includes("get_customer_history")) {
            return {
                icon: Search,
                iconColor:
                    "text-blue-400 bg-blue-950/60 border-blue-800/60",
                title: "Customer History",
                label: "get_customer_history",
                description: "Customer payment history inspected"
            };
        }

        if (value.includes("retry_payment")) {
            return {
                icon: Zap,
                iconColor:
                    "text-amber-400 bg-amber-950/60 border-amber-800/60",
                title: "Payment Retry",
                label: "retry_payment",
                description: "Automated payment retry requested"
            };
        }

        if (value.includes("create_payment_link")) {
            return {
                icon: LinkIcon,
                iconColor:
                    "text-indigo-400 bg-indigo-950/60 border-indigo-800/60",
                title: "Payment Link",
                label: "create_payment_link",
                description: "Alternative payment link requested"
            };
        }

        if (value.includes("escalate")) {
            return {
                icon: ShieldAlert,
                iconColor:
                    "text-purple-400 bg-purple-950/60 border-purple-800/60",
                title: "Human Escalation",
                label: "escalate_to_human",
                description: "Payment escalated to human review"
            };
        }

        if (value.includes("stop")) {
            return {
                icon: XOctagon,
                iconColor:
                    "text-rose-400 bg-rose-950/60 border-rose-800/60",
                title: "Recovery Stopped",
                label: "stop_recovery",
                description: "Recovery process was stopped"
            };
        }

        /*
         * If the backend records a POLICY / DECISION / RESULT
         * event without a specific tool, display it explicitly.
         */

        if (type === "POLICY") {
            return {
                icon: ShieldAlert,
                iconColor:
                    "text-purple-400 bg-purple-950/60 border-purple-800/60",
                title: "Policy Guardrail",
                label: "POLICY",
                description: "Recovery policy evaluated the proposed action"
            };
        }

        if (type === "DECISION") {
            return {
                icon: Bot,
                iconColor:
                    "text-indigo-400 bg-indigo-950/60 border-indigo-800/60",
                title: "Agent Decision",
                label: "DECISION",
                description: "Recovery agent selected the next action"
            };
        }

        if (type === "RESULT") {
            return {
                icon: CheckCircle2,
                iconColor:
                    "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
                title: "Action Result",
                label: "RESULT",
                description: "Recovery action result received"
            };
        }

        if (type === "TERMINAL") {
            return {
                icon: CheckCircle2,
                iconColor:
                    "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
                title: "Terminal Outcome",
                label: "TERMINAL",
                description: "Agent reached a final outcome"
            };
        }

        return {
            icon: AlertTriangle,
            iconColor:
                "text-slate-400 bg-slate-900 border-slate-700",
            title: "Agent Step",
            label: tool || type || "agent_step",
            description: "Agent execution step"
        };
    };


    /*
     * Convert the final backend status into a UI representation.
     */
    const getStatusMeta = (currentStatus) => {

        switch (currentStatus) {

            case "RECOVERED":
            case "recovered":
                return {
                    icon: CheckCircle2,
                    text: "RECOVERED",
                    container:
                        "bg-emerald-950/60 border-emerald-800/80 text-emerald-300",
                    iconColor: "text-emerald-400"
                };

            case "PENDING":
            case "pending":
                return {
                    icon: Clock,
                    text: "PENDING",
                    container:
                        "bg-amber-950/60 border-amber-800/80 text-amber-300",
                    iconColor: "text-amber-400"
                };

            case "ESCALATED":
            case "escalated":
                return {
                    icon: ShieldAlert,
                    text: "ESCALATED",
                    container:
                        "bg-purple-950/60 border-purple-800/80 text-purple-300",
                    iconColor: "text-purple-400"
                };

            case "STOPPED":
            case "stopped":
                return {
                    icon: XOctagon,
                    text: "STOPPED",
                    container:
                        "bg-slate-900 border-slate-700 text-slate-300",
                    iconColor: "text-slate-400"
                };

            case "FAILED":
            case "failed":
                return {
                    icon: XCircle,
                    text: "FAILED",
                    container:
                        "bg-rose-950/60 border-rose-800/80 text-rose-300",
                    iconColor: "text-rose-400"
                };

            case "MAX_STEPS_REACHED":
                return {
                    icon: AlertTriangle,
                    text: "MAX STEPS REACHED",
                    container:
                        "bg-orange-950/60 border-orange-800/80 text-orange-300",
                    iconColor: "text-orange-400"
                };

            case "RUNNING":
                return {
                    icon: Clock,
                    text: "RUNNING",
                    container:
                        "bg-indigo-950/60 border-indigo-800/80 text-indigo-300",
                    iconColor: "text-indigo-400"
                };

            default:
                return {
                    icon: Clock,
                    text: currentStatus || "COMPLETED",
                    container:
                        "bg-slate-900 border-slate-700 text-slate-300",
                    iconColor: "text-slate-400"
                };
        }
    };


    const statusMeta = getStatusMeta(status);
    const StatusIcon = statusMeta.icon;


    /*
     * Extract useful information from a step output.
     */
    const getResult = (step) => {

        if (!step?.output) {
            return null;
        }

        if (typeof step.output === "string") {
            return step.output;
        }

        return (
            step.output.result ||
            step.output.status ||
            step.output.executionResult?.result ||
            null
        );
    };


    const getPolicyInfo = (step) => {

        if (!step?.output || typeof step.output !== "object") {
            return null;
        }

        const policy =
            step.output.policyDecision ||
            step.output.policy ||
            null;

        if (!policy) {
            return null;
        }

        return policy;
    };


    return (
        <div className="space-y-6 font-mono text-xs">

            {/* Header */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">

                <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-0.5">
                        AI RECOVERY RUN
                    </span>

                    <h3 className="text-sm font-bold text-slate-100">
                        Agent Execution Timeline
                    </h3>

                    {runData?.runId && (
                        <p className="text-[10px] text-slate-500 mt-1">
                            Run ID: {runData.runId}
                        </p>
                    )}
                </div>

                <div className="text-right">

                    <span className="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-bold">
                        {steps.length} EVENTS
                    </span>

                </div>
            </div>


            {/* Empty state */}
            {steps.length === 0 && (
                <div className="glass-panel p-8 rounded-xl border border-slate-800 text-center">

                    <Bot className="w-8 h-8 text-indigo-400 mx-auto mb-3" />

                    <h4 className="text-sm font-bold text-slate-200">
                        No Agent Steps Available
                    </h4>

                    <p className="text-xs text-slate-500 mt-1">
                        The agent run did not return any execution events.
                    </p>

                </div>
            )}


            {/* Actual Agent Timeline */}
            {steps.length > 0 && (
                <div className="space-y-5 relative">

                    {/* Timeline vertical line */}
                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-800" />

                    {steps.map((step, index) => {

                        const meta = getStepMeta(step);

                        const Icon = meta.icon;

                        const result = getResult(step);

                        const policyInfo = getPolicyInfo(step);

                        const confidence =
                            step.confidence !== null &&
                            step.confidence !== undefined
                                ? `${(
                                      Number(step.confidence) <= 1
                                          ? Number(step.confidence) * 100
                                          : Number(step.confidence)
                                  ).toFixed(0)}%`
                                : null;

                        return (
                            <div
                                key={`${step.step}-${index}`}
                                className="relative pl-12"
                            >

                                {/* Timeline icon */}
                                <div
                                    className={`absolute left-0 top-0 w-10 h-10 rounded-xl border flex items-center justify-center shadow-md z-10 ${meta.iconColor}`}
                                >
                                    <Icon className="w-4 h-4" />
                                </div>


                                {/* Step Card */}
                                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">

                                    {/* Step header */}
                                    <div className="flex items-center justify-between gap-3">

                                        <div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                                                STEP {step.step || index + 1}
                                            </span>

                                            <h4 className="text-sm font-bold text-slate-100 mt-1">
                                                {meta.title}
                                            </h4>
                                        </div>

                                        {confidence && (
                                            <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 whitespace-nowrap">
                                                Confidence:{" "}
                                                <strong className="text-emerald-400">
                                                    {confidence}
                                                </strong>
                                            </span>
                                        )}

                                    </div>


                                    {/* Tool / Event */}
                                    <div className="flex items-center gap-2">

                                        <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                            Event
                                        </span>

                                        <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-bold text-indigo-300">
                                            {meta.label}
                                        </span>

                                    </div>


                                    {/* Description */}
                                    <p className="text-xs text-slate-400">
                                        {meta.description}
                                    </p>


                                    {/* Reason */}
                                    {step.reason && (
                                        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">

                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                                                Agent Reason
                                            </span>

                                            <p className="text-[11px] text-slate-300 leading-relaxed">
                                                {step.reason}
                                            </p>

                                        </div>
                                    )}


                                    {/* Policy information */}
                                    {policyInfo && (
                                        <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-900/50">

                                            <span className="text-[10px] uppercase tracking-wider text-purple-400 block mb-1">
                                                Policy Decision
                                            </span>

                                            <p className="text-[11px] text-slate-300">

                                                {policyInfo.allowed === true
                                                    ? "Action approved by recovery guardrails."
                                                    : "Action blocked by recovery guardrails."}

                                            </p>

                                            {policyInfo.reason && (
                                                <p className="text-[10px] text-slate-500 mt-1">
                                                    {policyInfo.reason}
                                                </p>
                                            )}

                                        </div>
                                    )}


                                    {/* Result */}
                                    {result && (
                                        <div className="flex items-center gap-2 pt-1">

                                            <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                                Result
                                            </span>

                                            <span
                                                className={`px-2 py-1 rounded-md border text-[10px] font-bold ${
                                                    String(result).includes("RECOVERED")
                                                        ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                                                        : String(result).includes("ESCALATED")
                                                        ? "bg-purple-950 text-purple-400 border-purple-800"
                                                        : String(result).includes("PENDING")
                                                        ? "bg-amber-950 text-amber-400 border-amber-800"
                                                        : String(result).includes("STOPPED")
                                                        ? "bg-slate-900 text-slate-400 border-slate-700"
                                                        : "bg-rose-950 text-rose-400 border-rose-800"
                                                }`}
                                            >
                                                {String(result)}
                                            </span>

                                        </div>
                                    )}


                                    {/* Raw output for useful execution details */}
                                    {step.output &&
                                        typeof step.output === "object" &&
                                        !step.output.result &&
                                        !step.output.status &&
                                        (
                                            <details className="pt-1">

                                                <summary className="cursor-pointer text-[10px] text-slate-500 hover:text-slate-300">
                                                    View tool output
                                                </summary>

                                                <pre className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                                                    {JSON.stringify(
                                                        step.output,
                                                        null,
                                                        2
                                                    )}
                                                </pre>

                                            </details>
                                        )}

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* Final Status */}
            <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${statusMeta.container}`}
            >

                <div className="flex items-center gap-2">

                    <StatusIcon
                        className={`w-4 h-4 ${statusMeta.iconColor}`}
                    />

                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest block">
                            FINAL STATUS
                        </span>

                        <span className="text-[10px] opacity-70">
                            Recovery agent execution outcome
                        </span>
                    </div>

                </div>

                <span className="font-mono text-sm tracking-wider font-extrabold">
                    {statusMeta.text}
                </span>

            </div>

        </div>
    );
};

export default AgentRunTimeline;