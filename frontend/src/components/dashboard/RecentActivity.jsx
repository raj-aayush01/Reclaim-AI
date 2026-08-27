import React from "react";
import { formatRelativeTime } from "../../utils/formatDate";
import { formatRecoveryAction } from "../../utils/statusHelpers";
import { Activity, ArrowRight, Bot, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RecentActivity = ({ logs = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        Recent AI Decisions & Logs
                    </h3>

                    <button
                        onClick={() => navigate("/payments")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                        <span>View All Payments</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                        No AI recovery logs recorded yet. Run a recovery action to see live decisions!
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {logs.map((log, index) => {
                            const aiAction =
                                log.aiAction ||
                                log.aiRecommendation?.action ||
                                log.actionExecuted;

                            const aiReason =
                                log.aiReason ||
                                log.aiRecommendation?.reason ||
                                log.message;

                            const aiConfidence =
                                log.aiConfidence ??
                                log.aiRecommendation?.confidence;

                            const isAllowed =
                                log.policyAllowed !== undefined
                                    ? log.policyAllowed
                                    : log.policyCheck?.allowed !== false;

                            return (
                                <div
                                    key={log._id || log.logId || `${log.paymentId}-${log.createdAt}-${index}`}
                                    onClick={() =>
                                        log.paymentId &&
                                        navigate(`/payments/${log.paymentId}`)
                                    }
                                    className={`p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-start justify-between gap-3 group ${
                                        log.paymentId
                                            ? "cursor-pointer"
                                            : "cursor-default"
                                    }`}
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div
                                            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                                isAllowed
                                                    ? "bg-indigo-950/60 text-indigo-400 border border-indigo-800/50"
                                                    : "bg-rose-950/60 text-rose-400 border border-rose-800/50"
                                            }`}
                                        >
                                            <Bot className="w-4 h-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                                                    {log.paymentId || "Unknown Payment"}
                                                </span>

                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                                                        isAllowed
                                                            ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
                                                            : "bg-rose-950/50 text-rose-400 border-rose-800/50"
                                                    }`}
                                                >
                                                    {isAllowed
                                                        ? "APPROVED"
                                                        : "BLOCKED"}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-300 font-medium">
                                                Action:{" "}
                                                <span className="text-indigo-400 font-semibold">
                                                    {aiAction
                                                        ? formatRecoveryAction(
                                                              aiAction
                                                          )
                                                        : "No action recorded"}
                                                </span>
                                            </p>

                                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                {aiReason ||
                                                    "Processed by AI Recovery pipeline"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] text-slate-500 font-medium block">
                                            {formatRelativeTime(
                                                log.createdAt ||
                                                    log.timestamp
                                            )}
                                        </span>

                                        {aiConfidence !== null &&
                                            aiConfidence !== undefined && (
                                                <span className="text-[10px] font-semibold text-slate-400 block mt-1">
                                                    {(Number(aiConfidence) <= 1
                                                        ? Number(aiConfidence) *
                                                          100
                                                        : Number(
                                                              aiConfidence
                                                          )
                                                    ).toFixed(0)}
                                                    % Conf.
                                                </span>
                                            )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Automatic Policy Enforcement Active
                </span>
            </div>
        </div>
    );
};

export default RecentActivity;