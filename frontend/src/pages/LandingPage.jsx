import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Activity, BookOpen, Check, X } from "lucide-react";

export const LandingPage = () => {
    const navigate = useNavigate();

    const tickerItems = [
        { id: "pay_3ea0af54", action: "escalate", status: "ESCALATED", conf: "78%", color: "text-amber-400 border-amber-800/60 bg-amber-950/30" },
        { id: "pay_913ff981", action: "stop", status: "BLOCKED", conf: "94%", color: "text-rose-400 border-rose-800/60 bg-rose-950/30" },
        { id: "pay_c1de2405", action: "retry", status: "RECOVERED", conf: "87%", color: "text-emerald-400 border-emerald-800/60 bg-emerald-950/30" },
        { id: "pay_78aa9912", action: "link", status: "RECOVERED", conf: "89%", color: "text-cyan-400 border-cyan-800/60 bg-cyan-950/30" },
        { id: "pay_b4cb3162", action: "retry", status: "RECOVERED", conf: "82%", color: "text-emerald-400 border-emerald-800/60 bg-emerald-950/30" }
    ];

    return (
        <div className="min-h-screen bg-[#060910] text-slate-100 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
            {/* Top Navigation */}
            <header className="h-20 px-8 max-w-7xl w-full mx-auto flex items-center justify-between border-b border-slate-800/40">
                <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-lg font-extrabold tracking-tight font-mono">
                        Reclaim<span className="text-emerald-400">.AI</span>
                    </span>
                </div>

                <div className="flex items-center gap-8 text-xs font-semibold text-slate-400">
                    <a href="#how" className="hover:text-slate-200 transition-colors">How It Works</a>
                    <a href="#guardrails" className="hover:text-slate-200 transition-colors">Guardrails</a>
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-200 transition-colors">GitHub</a>
                </div>

                <Link to="/overview">
                    <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2">
                        <span>Open Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </Link>
            </header>

            {/* Hero Section */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
                {/* Buildathon Tag */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-[11px] font-bold text-emerald-400 mb-8 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>RAZORPAY AI BUILDATHON · TRACK 03 · REVENUE RECOVERY</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-100 max-w-4xl leading-[1.08] mb-6">
                    Every rupee lost has a{" "}
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                        recovery path.
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base md:text-lg text-slate-400 max-w-2xl font-normal leading-relaxed mb-10">
                    Reclaim.AI detects revenue at risk, diagnoses the root cause, and executes a bounded, auditable recovery workflow — automatically.
                </p>

                {/* CTA Action Buttons */}
                <div className="flex items-center gap-4 mb-16">
                    <button
                        onClick={() => navigate("/overview")}
                        className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2"
                    >
                        <span>See Live Recovery</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>

                    <a href="#guardrails">
                        <button className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-sm transition-all cursor-pointer flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>View Guardrails</span>
                        </button>
                    </a>
                </div>

                {/* Metric Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-12">
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
                        <span className="text-2xl font-extrabold text-emerald-400 font-mono block">₹4.86L</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">RECOVERED · LATEST BATCH</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
                        <span className="text-2xl font-extrabold text-teal-300 font-mono block">68.7%</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">RECOVERY RATE</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
                        <span className="text-2xl font-extrabold text-cyan-400 font-mono block">247</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ACTIVE INTERVENTIONS</span>
                    </div>
                </div>
            </main>

            {/* Live Ticker Bar */}
            <div className="w-full bg-[#080c14] border-y border-slate-800/60 py-3 overflow-x-auto whitespace-nowrap">
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 text-xs font-mono">
                    {tickerItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-slate-400">{item.id}</span>
                            <span className="text-slate-500">→ {item.action}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.color}`}>
                                {item.status}
                            </span>
                            <span className="text-slate-500">{item.conf} conf</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section: How It Works */}
            <section id="how" className="max-w-6xl w-full mx-auto px-6 py-20">
                <div className="text-center mb-12">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">HOW IT WORKS</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight font-mono">
                        Perceive · Decide · Act · Log
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        { step: "01", title: "Detect", icon: Activity, desc: "Payment failure signals are captured and scored for recoverability in real-time." },
                        { step: "02", title: "Diagnose", icon: Sparkles, desc: "Gemini AI analyses failure mode, customer segment, and retry history." },
                        { step: "03", title: "Intervene", icon: Zap, desc: "The right action — retry, payment link, or escalation — is dispatched within policy bounds." },
                        { step: "04", title: "Log", icon: BookOpen, desc: "Every decision, reason, and outcome is written to the immutable audit trail." }
                    ].map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <div key={idx} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold font-mono text-emerald-400">{card.step}</span>
                                    <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-slate-100">{card.title}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Section: Guardrails, Not Suggestions */}
            <section id="guardrails" className="max-w-6xl w-full mx-auto px-6 py-16 border-t border-slate-800/60">
                <div className="text-center mb-12">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">POLICY ENGINE</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight font-mono">
                        Guardrails, not suggestions
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Does */}
                    <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-900/40 space-y-4">
                        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            WHAT THE AGENT DOES
                        </h3>
                        <ul className="space-y-3 text-xs text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>Retries only safe, temporary failures — never invalid ones</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>Sends payment links for declined cards with no retry budget</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>Escalates to a human for high-value payments above ₹20,000</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>Logs every decision with AI reason and confidence score</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>Halts after 3 attempts to prevent compounding losses</span>
                            </li>
                        </ul>
                    </div>

                    {/* Never Does */}
                    <div className="p-6 rounded-2xl bg-slate-900/60 border border-rose-900/40 space-y-4">
                        <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                            <X className="w-4 h-4" />
                            WHAT IT WILL NEVER DO
                        </h3>
                        <ul className="space-y-3 text-xs text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-rose-400 font-bold">•</span>
                                <span>Never guesses on unknown failure modes — escalates instead</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-rose-400 font-bold">•</span>
                                <span>Never retries a payment that was intentionally declined</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-rose-400 font-bold">•</span>
                                <span>Never acts without a policy-validated decision</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-rose-400 font-bold">•</span>
                                <span>Never exposes customer data in logs or API responses</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-rose-400 font-bold">•</span>
                                <span>Never auto-recovers blocked payments without human sign-off</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom CTA Banner */}
                <div className="mt-12 p-8 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-100 font-mono">Ready to see the agent work?</h3>
                        <p className="text-xs text-slate-400 mt-1">Trigger a real recovery, inspect the AI decision, follow the audit trail.</p>
                    </div>

                    <button
                        onClick={() => navigate("/overview")}
                        className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                    >
                        <span>Open Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
