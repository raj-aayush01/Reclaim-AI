import React from "react";
import { BarChart3, RefreshCw, Link as LinkIcon, AlertTriangle, XOctagon } from "lucide-react";

export const RecoveryChart = ({ actions = {} }) => {
    const {
        retryCount = 0,
        paymentLinkCount = 0,
        escalatedCount = 0,
        stoppedCount = 0
    } = actions;

    const totalActions = retryCount + paymentLinkCount + escalatedCount + stoppedCount;

    const items = [
        {
            key: "RETRY_PAYMENT",
            label: "Retry Engine",
            count: retryCount,
            color: "from-indigo-500 to-indigo-600",
            textColor: "text-indigo-400",
            icon: RefreshCw
        },
        {
            key: "CREATE_PAYMENT_LINK",
            label: "Payment Links",
            count: paymentLinkCount,
            color: "from-cyan-500 to-blue-600",
            textColor: "text-cyan-400",
            icon: LinkIcon
        },
        {
            key: "ESCALATE_TO_HUMAN",
            label: "Human Escalations",
            count: escalatedCount,
            color: "from-amber-500 to-orange-600",
            textColor: "text-amber-400",
            icon: AlertTriangle
        },
        {
            key: "STOP_RECOVERY",
            label: "Halted Recovery",
            count: stoppedCount,
            color: "from-slate-600 to-slate-700",
            textColor: "text-slate-400",
            icon: XOctagon
        }
    ];

    const maxCount = Math.max(...items.map((i) => i.count), 1);

    return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                        AI Recovery Actions Breakdown
                    </h3>
                    <p className="text-xs text-slate-400">
                        Distribution of actions executed across failed payments
                    </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {totalActions} Total Actions
                </span>
            </div>

            {/* Custom Bar Visualization */}
            <div className="space-y-4 my-2">
                {items.map((item) => {
                    const percentage = totalActions > 0 ? ((item.count / totalActions) * 100).toFixed(1) : 0;
                    const barWidth = Math.max(Math.round((item.count / maxCount) * 100), 4);
                    const Icon = item.icon;

                    return (
                        <div key={item.key} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-medium">
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-3.5 h-3.5 ${item.textColor}`} />
                                    <span className="text-slate-300">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400">{percentage}%</span>
                                    <span className={`font-bold ${item.textColor}`}>{item.count}</span>
                                </div>
                            </div>

                            {/* Bar Track */}
                            <div className="h-3 w-full bg-slate-900/90 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700 ease-out`}
                                    style={{ width: `${barWidth}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Determined by Gemini AI + Backend Recovery Policy</span>
                <span className="text-indigo-400 font-semibold">Deterministic Rule Enforcement</span>
            </div>
        </div>
    );
};

export default RecoveryChart;
