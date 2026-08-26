import React from "react";

export const StatCard = ({
    title,
    value,
    subtext,
    icon: Icon,
    colorVariant = "indigo",
    onClick
}) => {
    const variants = {
        indigo: {
            iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
            glow: "hover:border-indigo-500/30"
        },
        rose: {
            iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
            glow: "hover:border-rose-500/30"
        },
        amber: {
            iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            glow: "hover:border-amber-500/30"
        },
        emerald: {
            iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            glow: "hover:border-emerald-500/30"
        },
        purple: {
            iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
            glow: "hover:border-purple-500/30"
        }
    };

    const currentVariant = variants[colorVariant] || variants.indigo;

    return (
        <div
            onClick={onClick}
            className={`glass-panel p-5 rounded-2xl transition-all duration-200 ${
                onClick ? "cursor-pointer glass-panel-hover" : ""
            } ${currentVariant.glow}`}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {title}
                </span>
                {Icon && (
                    <div className={`p-2.5 rounded-xl border ${currentVariant.iconBg}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-slate-100 tracking-tight mb-1">
                {value}
            </div>
            {subtext && (
                <div className="text-xs text-slate-400 font-medium">
                    {subtext}
                </div>
            )}
        </div>
    );
};

export default StatCard;
