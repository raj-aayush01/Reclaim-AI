import React, { useState } from "react";
import { Copy, ExternalLink, Cpu, Check } from "lucide-react";
import { formatRecoveryAction } from "../../utils/statusHelpers";
import PaymentStatusBadge from "../payments/PaymentStatusBadge";

export const ExecutionResult = ({ executionResult = {}, payment = {} }) => {
    const [copied, setCopied] = useState(false);

    const actionExecuted = executionResult.actionExecuted || executionResult.finalAction || payment.recoveryAction;
    const resultStatus = executionResult.result || executionResult.status || payment.status || "pending";
    
    // CHANGE 4 FIX: Only extract real paymentLinkUrl if payment link was actually generated!
    const linkUrl = (actionExecuted === "CREATE_PAYMENT_LINK" || payment.recoveryAction === "CREATE_PAYMENT_LINK" || executionResult.paymentLinkId || payment.paymentLinkId)
        ? (executionResult.paymentLinkUrl || payment.paymentLinkUrl || null)
        : null;

    const handleCopy = () => {
        if (!linkUrl) return;
        navigator.clipboard.writeText(linkUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 to-cyan-950/20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-100">Recovery Executor Result</h4>
                        <p className="text-[11px] text-slate-400">Database & Payment Engine Action Outcome</p>
                    </div>
                </div>

                <PaymentStatusBadge status={resultStatus} />
            </div>

            <div className="space-y-3">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Action Executed:</span>
                    <span className="font-bold text-cyan-300">{formatRecoveryAction(actionExecuted)}</span>
                </div>

                {/* Only render payment link box if an actual URL exists and action is CREATE_PAYMENT_LINK */}
                {linkUrl && (
                    <div className="p-3.5 bg-slate-950/80 rounded-xl border border-cyan-800/50 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                                Recovery Payment Link Created
                            </span>
                            <button
                                onClick={handleCopy}
                                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? "Copied!" : "Copy Link"}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800 truncate">
                            <span className="truncate flex-1">{linkUrl}</span>
                            <a
                                href={linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 hover:text-cyan-400 shrink-0"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExecutionResult;
