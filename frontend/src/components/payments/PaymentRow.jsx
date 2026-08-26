import React from "react";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatScenario, formatRecoveryAction } from "../../utils/statusHelpers";
import { formatDate } from "../../utils/formatDate";
import PaymentStatusBadge from "./PaymentStatusBadge";
import Button from "../common/Button";
import { Zap, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PaymentRow = ({ payment, onRunRecovery, isExecuting = false }) => {
    const navigate = useNavigate();

    return (
        <tr className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors group">
            {/* Payment ID */}
            <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-200">
                <button
                    onClick={() => navigate(`/payments/${payment.paymentId}`)}
                    className="hover:text-indigo-400 hover:underline transition-colors text-left font-mono"
                >
                    {payment.paymentId}
                </button>
            </td>

            {/* Customer ID */}
            <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">
                {payment.customerId}
            </td>

            {/* Amount */}
            <td className="px-4 py-3.5 text-sm font-bold text-slate-100">
                {formatCurrency(payment.amount)}
            </td>

            {/* Failure Scenario */}
            <td className="px-4 py-3.5 text-xs text-slate-300">
                <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80 font-medium">
                    {formatScenario(payment.scenario)}
                </span>
            </td>

            {/* Status */}
            <td className="px-4 py-3.5">
                <PaymentStatusBadge status={payment.status} />
            </td>

            {/* Attempts & Last Action */}
            <td className="px-4 py-3.5 text-xs text-slate-400">
                <div>Attempts: <span className="font-semibold text-slate-200">{payment.attemptCount}</span></div>
                {payment.recoveryAction && (
                    <div className="text-[11px] text-indigo-400 font-medium">
                        {formatRecoveryAction(payment.recoveryAction)}
                    </div>
                )}
            </td>

            {/* Date */}
            <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                {formatDate(payment.createdAt)}
            </td>

            {/* Actions */}
            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => navigate(`/payments/${payment.paymentId}`)}
                    >
                        Inspect
                    </Button>
                    {payment.status !== "recovered" && (
                        <Button
                            variant="glow"
                            size="sm"
                            icon={Zap}
                            loading={isExecuting}
                            onClick={() => onRunRecovery(payment.paymentId)}
                        >
                            AI Recovery
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default PaymentRow;
