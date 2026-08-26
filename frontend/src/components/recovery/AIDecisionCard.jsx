import React from "react";
import { Sparkles, Brain } from "lucide-react";
import { formatRecoveryAction } from "../../utils/statusHelpers";

export const AIDecisionCard = ({ aiRecommendation, aiDecision }) => {
    // Support both backend aiDecision and legacy aiRecommendation keys
    const decision = aiDecision || aiRecommendation || {};
    const { action, confidence = 0.95, reason, suggestedChannel } = decision;

    const confidencePercent = Math.min(
        Math.round(confidence <= 1 ? confidence * 100 : confidence),
        100
    );

    return (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                            Gemini AI Recommendation
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        </h4>
                        <p className="text-[11px] text-slate-400">Autonomous Payment Recovery Diagnostic Engine</p>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Confidence Score</span>
                    <span className="text-base font-extrabold text-indigo-300">{confidencePercent}%</span>
                </div>
            </div>

            {/* Recommended Action Pill */}
            <div className="p-3.5 mb-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between">
                <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">Recommended Strategy</span>
                    <span className="text-base font-bold text-slate-100">{formatRecoveryAction(action)}</span>
                </div>
                {suggestedChannel && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                        Channel: {suggestedChannel}
                    </span>
                )}
            </div>

            {/* Reason Box */}
            <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Rationale</span>
                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-mono">
                    "{reason || "Transaction analyzed. Recommended recovery workflow based on risk model."}"
                </p>
            </div>
        </div>
    );
};

export default AIDecisionCard;
