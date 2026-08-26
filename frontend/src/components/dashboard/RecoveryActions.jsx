import React from "react";
import { RefreshCw, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RecoveryActions = ({ actions = {} }) => {
    const navigate = useNavigate();

    const actionCards = [
        {
            title: "Auto-Retry Engine",
            count: actions.retryCount || 0,
            desc: "Temporary failures automatically retried",
            icon: RefreshCw,
            color: "border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-950/20 text-indigo-400",
            path: "/payments?action=RETRY_PAYMENT"
        },
        {
            title: "Payment Links Generated",
            count: actions.paymentLinkCount || 0,
            desc: "Custom recovery payment links sent",
            icon: LinkIcon,
            color: "border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-950/20 text-cyan-400",
            path: "/payments?action=CREATE_PAYMENT_LINK"
        },
        {
            title: "Human Escalations",
            count: actions.escalatedCount || 0,
            desc: "High value payments flagged for review",
            icon: AlertTriangle,
            color: "border-amber-500/30 hover:border-amber-500/60 bg-amber-950/20 text-amber-400",
            path: "/payments?action=ESCALATE_TO_HUMAN"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actionCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div
                        key={idx}
                        onClick={() => navigate(card.path)}
                        className={`glass-panel p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${card.color}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Icon className="w-5 h-5" />
                            <span className="text-xl font-extrabold text-slate-100">{card.count}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 mb-0.5">{card.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-tight">{card.desc}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default RecoveryActions;
