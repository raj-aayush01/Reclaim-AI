import React from "react";
import { formatCurrency } from "../../utils/formatCurrency";

export const RecoveryRunSummary = ({ batchData = {} }) => {
    const {
        batchId = "Current",
        evaluated = 0,
        recoveredAmount = 0,
        blocked = 0,
        exceptions = 0,
        recoveryRate = 0
    } = batchData;

    const rows = [
        { label: "Run", value: batchId, isMono: true },
        { label: "Evaluated", value: evaluated },
        { label: "Recovered ₹", value: formatCurrency(recoveredAmount) },
        {
            label: "Blocked",
            value: blocked,
            textColor: "text-rose-400 font-bold"
        },
        {
            label: "Exceptions",
            value: exceptions,
            textColor: "text-amber-400 font-bold"
        },
        {
            label: "Recovery Rate",
            value: `${Number(recoveryRate).toFixed(1)}%`
        }
    ];

    return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-0.5">
                            RECOVERY SUMMARY
                        </span>
                        <h3 className="text-base font-bold text-slate-100">
                            Recovery Performance
                        </h3>
                    </div>
                </div>

                <div className="divide-y divide-slate-800/80">
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className="py-2.5 flex items-center justify-between text-xs"
                        >
                            <span className="text-slate-400 font-medium">
                                {row.label}
                            </span>

                            <span
                                className={`text-slate-200 ${
                                    row.isMono
                                        ? "font-mono text-[11px]"
                                        : "font-semibold"
                                } ${row.textColor || ""}`}
                            >
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RecoveryRunSummary;