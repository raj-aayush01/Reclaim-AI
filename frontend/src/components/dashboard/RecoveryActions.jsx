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
            accentClass: "icon-box-primary",
            accentColor: "var(--primary)",
            path: "/payments?action=RETRY_PAYMENT"
        },
        {
            title: "Payment Links Generated",
            count: actions.paymentLinkCount || 0,
            desc: "Custom recovery payment links sent",
            icon: LinkIcon,
            accentClass: "icon-box-up",
            accentColor: "var(--up)",
            path: "/payments?action=CREATE_PAYMENT_LINK"
        },
        {
            title: "Human Escalations",
            count: actions.escalatedCount || 0,
            desc: "High value payments flagged for review",
            icon: AlertTriangle,
            accentClass: "icon-box-warn",
            accentColor: "var(--warn)",
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
                        className="panel p-4 rounded-xl cursor-pointer hover:translate-y-[-2px] transition-all duration-200"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between"
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`icon-box icon-box-sm ${card.accentClass}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <span
                                style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 800,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: "var(--ink)"
                                }}
                            >
                                {card.count}
                            </span>
                        </div>
                        <div>
                            <h4
                                style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    color: "var(--ink)",
                                    marginBottom: "0.25rem"
                                }}
                            >
                                {card.title}
                            </h4>
                            <p
                                style={{
                                    fontSize: "0.6875rem",
                                    color: "var(--mute)",
                                    lineHeight: 1.4
                                }}
                            >
                                {card.desc}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RecoveryActions;
