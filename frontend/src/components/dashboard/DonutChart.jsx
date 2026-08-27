import React from "react";
import { useNavigate } from "react-router-dom";

export const DonutChart = ({ actions = {} }) => {
    const navigate = useNavigate();

    const {
        retryCount = 0,
        paymentLinkCount = 0,
        escalatedCount = 0,
        stoppedCount = 0
    } = actions;

    const total =
        retryCount +
        paymentLinkCount +
        escalatedCount +
        stoppedCount;

    const segments = [
        {
            label: "Retry",
            count: retryCount,
            color: "#10b981",
            path: "/ledger?action=RETRY_PAYMENT"
        },
        {
            label: "Payment Link",
            count: paymentLinkCount,
            color: "#f59e0b",
            path: "/ledger?action=CREATE_PAYMENT_LINK"
        },
        {
            label: "Escalate",
            count: escalatedCount,
            color: "#8b5cf6",
            path: "/ledger?action=ESCALATE_TO_HUMAN"
        },
        {
            label: "Stop",
            count: stoppedCount,
            color: "#f43f5e",
            path: "/ledger?action=STOP_RECOVERY"
        }
    ];

    const radius = 70;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * radius;

    let accumulatedAngle = 0;

    return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-full">
            <div>
                <h3 className="text-base font-bold text-slate-100 mb-0.5">
                    Action Breakdown
                </h3>

                <p className="text-xs text-slate-400 mb-6">
                    How the agent intervenes
                </p>

                <div className="relative flex items-center justify-center my-4">
                    <svg className="w-52 h-52 transform -rotate-90">
                        {segments.map((seg, idx) => {
                            const segmentLength =
                                (seg.count / (total || 1)) * circumference;

                            const strokeDasharray = `${segmentLength} ${circumference}`;
                            const strokeDashoffset = -accumulatedAngle;

                            accumulatedAngle += segmentLength;

                            return (
                                <circle
                                    key={idx}
                                    cx="104"
                                    cy="104"
                                    r={radius}
                                    fill="transparent"
                                    stroke={seg.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-700 cursor-pointer hover:opacity-80"
                                    onClick={() => navigate(seg.path)}
                                />
                            );
                        })}
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
                            {total}
                        </span>

                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            ACTIONS
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                    {segments.map((seg, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(seg.path)}
                            className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: seg.color }}
                                />

                                <span className="text-slate-300 font-medium">
                                    {seg.label}
                                </span>
                            </div>

                            <span className="font-bold text-slate-100 font-mono">
                                {seg.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DonutChart;