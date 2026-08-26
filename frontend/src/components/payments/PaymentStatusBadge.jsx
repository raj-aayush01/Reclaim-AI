import React from "react";
import { getStatusConfig } from "../../utils/statusHelpers";
import { CheckCircle2, Clock, XCircle, AlertTriangle, AlertCircle } from "lucide-react";

export const PaymentStatusBadge = ({ status, className = "" }) => {
    const config = getStatusConfig(status);

    const getIcon = () => {
        switch ((status || "").toLowerCase()) {
            case "recovered":
                return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
            case "pending":
                return <Clock className="w-3 h-3 text-amber-400" />;
            case "failed":
                return <XCircle className="w-3 h-3 text-rose-400" />;
            case "escalated":
                return <AlertTriangle className="w-3 h-3 text-purple-400" />;
            case "stopped":
                return <AlertCircle className="w-3 h-3 text-slate-400" />;
            default:
                return null;
        }
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${className}`}
            style={{
                backgroundColor: config.bg,
                color: config.color,
                borderColor: config.border
            }}
        >
            {getIcon()}
            <span>{config.label}</span>
        </span>
    );
};

export default PaymentStatusBadge;
