import React, { useEffect, useRef, useState } from "react";
import {
    Bot,
    CheckCircle2,
    Mic,
    MicOff,
    Send,
    ShieldCheck,
    User,
    Volume2
} from "lucide-react";

import Modal from "../common/Modal";
import Button from "../common/Button";
import Loader from "../common/Loader";
import { sendVoiceRecoveryMessage } from "../../services/voiceRecoveryService";
import AIDecisionCard from "./AIDecisionCard";
import ExecutionResult from "./ExecutionResult";
import { formatCurrency } from "../../utils/formatCurrency";


const getSpeechRecognition = () => {
    if (typeof window === "undefined") {
        return null;
    }

    return (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        null
    );
};


const createVoiceSessionId = () => {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `voice-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
};


const initialGreeting = (payment, customer) => {
    const amount = formatCurrency(payment?.amount || 0);
    const name = customer?.name || "ji";

    return `Namaste ${name}. Aapki ${amount} ki payment complete nahi ho paayi. Main safe recovery option check kar sakta hoon. Kya main aapki help karun?`;
};


const speak = (text) => {
    if (
        typeof window === "undefined" ||
        !window.speechSynthesis ||
        !text
    ) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.96;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
};


export const VoiceRecovery = ({
    isOpen,
    onClose,
    payment,
    customer,
    onRecoveryComplete,
    onDecisionReady
}) => {
    const recognitionRef = useRef(null);
    const transcriptRef = useRef(null);
    const finalTranscriptRef = useRef("");
    const autoSendRef = useRef(false);
    const sendingRef = useRef(false);

    const voiceSessionIdRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [listening, setListening] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [aiDecision, setAiDecision] = useState(null);
    const [recoveryResult, setRecoveryResult] = useState(null);
    const [aiUnavailable, setAiUnavailable] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);


    useEffect(() => {
        setVoiceSupported(Boolean(getSpeechRecognition()));
    }, []);


    useEffect(() => {
        if (!isOpen || !payment) {
            return;
        }

        voiceSessionIdRef.current =
            createVoiceSessionId();

        const greeting = initialGreeting(
            payment,
            customer
        );

        setMessages([
            {
                role: "assistant",
                content: greeting
            }
        ]);

        setInput("");
        setError(null);
        setPendingAction(null);
        setAiDecision(null);
        setRecoveryResult(null);
        setAiUnavailable(false);
        setSessionEnded(false);

        finalTranscriptRef.current = "";
        autoSendRef.current = false;

        speak(greeting);

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }

            if (
                typeof window !== "undefined" &&
                window.speechSynthesis
            ) {
                window.speechSynthesis.cancel();
            }
        };
    }, [
        isOpen,
        payment?.paymentId,
        customer?.name
    ]);


    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop =
                transcriptRef.current.scrollHeight;
        }
    }, [messages, sending]);

    useEffect(() => {
        if (!recoveryResult) {
            return;
        }

        autoSendRef.current = false;

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        setListening(false);
    }, [recoveryResult]);


    useEffect(() => {
        if (!sessionEnded) {
            return;
        }

        autoSendRef.current = false;

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        if (
            typeof window !== "undefined" &&
            window.speechSynthesis
        ) {
            window.speechSynthesis.cancel();
        }

        setListening(false);
    }, [sessionEnded]);


    const publishDecision = (decision) => {
        setAiDecision(decision);

        onDecisionReady?.(decision);
    };

    const isVoiceRecoveryComplete =
        Boolean(recoveryResult);


    const sendMessage = async (message) => {
        const cleanMessage =
            String(message || "").trim();

        if (
            !cleanMessage ||
            sending ||
            sendingRef.current ||
            isVoiceRecoveryComplete ||
            sessionEnded ||
            !payment?.paymentId
        ) {
            return;
        }

        sendingRef.current = true;
        autoSendRef.current = false;
        setSending(true);
        setError(null);
        setAiUnavailable(false);

        const userMessage = {
            role: "user",
            content: cleanMessage
        };

        const nextHistory = [
            ...messages,
            userMessage
        ];

        setMessages(nextHistory);
        setInput("");
        finalTranscriptRef.current = "";

        try {
            const response =
                await sendVoiceRecoveryMessage(
                    payment.paymentId,
                    cleanMessage,
                    nextHistory,
                    "INTRO",
                    voiceSessionIdRef.current
                );

            if (response?.voiceSessionId) {
                voiceSessionIdRef.current =
                    response.voiceSessionId;
            }

            const terminalStatuses = new Set([
                "recovered",
                "escalated",
                "stopped",
                "blocked",
                "pending",
                "completed",
                "RECOVERED",
                "ESCALATED",
                "STOPPED",
                "BLOCKED",
                "PENDING",
                "COMPLETED"
            ]);

            const responseStatus =
                response?.run?.status;

            const paymentAlreadyResolved =
                terminalStatuses.has(responseStatus) &&
                !response?.recovery;

            const reply =
                response?.voice?.reply ||
                "Samajh gaya. Main safe next step check kar raha hoon.";

            if (paymentAlreadyResolved) {
                setSessionEnded(true);

                setMessages((current) => [
                    ...current,
                    {
                        role: "assistant",
                        content: reply
                    }
                ]);

                speak(reply);

                setTimeout(() => {
                    onClose?.();
                }, 1800);

                return;
            }
            setMessages((current) => [
                ...current,
                {
                    role: "assistant",
                    content: reply
                }
            ]);


            if (
                response?.voice?.suggestedAction &&
                response.voice.suggestedAction !== "NONE" &&
                !response?.voice?.recoveryExecuted
            ) {
                const decision = {
                    action:
                        response.voice.suggestedAction,
                    confidence:
                        response.voice.confidence,
                    reason:
                        response.voice.reason,
                    summary:
                        response.voice.summary,
                    whyThisDecision:
                        response.voice.whyThisDecision,
                    whatHappensNext:
                        response.voice.whatHappensNext
                };

                setPendingAction(decision);
                publishDecision(decision);
            } else if (
                response?.voice?.suggestedAction ===
                "NONE"
            ) {
                setPendingAction(null);
                setAiDecision(null);
            }


            if (response?.recovery) {
                setRecoveryResult(
                    response.recovery
                );

                setPendingAction(null);
            }

            speak(reply);

        } catch (err) {
            console.error(
                "Voice recovery error:",
                err
            );

            const responseData =
                err.responseData || {};

            const unavailable =
                responseData.aiUnavailable === true ||
                responseData.voice?.aiUnavailable === true;

            const messageText =
                responseData.userMessage ||
                responseData.voice?.reply ||
                err.message ||
                "Voice AI is temporarily unavailable. No recovery action was executed.";

            setAiUnavailable(unavailable);
            setError(messageText);
            setPendingAction(null);

        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };


    const startListening = () => {
        if (
            isVoiceRecoveryComplete ||
            sessionEnded ||
            sending
        ) {
            return;
        }

        const Recognition =
            getSpeechRecognition();

        if (!Recognition) {
            setError(
                "Voice input is not supported in this browser. You can type your response instead."
            );
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const recognition =
            new Recognition();

        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = true;

        finalTranscriptRef.current = "";
        autoSendRef.current = true;

        recognition.onstart = () => {
            setListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let finalText = "";
            let interimText = "";

            for (
                let index = event.resultIndex;
                index < event.results.length;
                index += 1
            ) {
                const transcript =
                    event.results[index][0]
                        .transcript;

                if (
                    event.results[index].isFinal
                ) {
                    finalText += transcript;
                } else {
                    interimText += transcript;
                }
            }

            if (finalText.trim()) {
                finalTranscriptRef.current =
                    finalText.trim();
            }

            setInput(
                `${finalText}${interimText}`.trim()
            );
        };

        recognition.onerror = (event) => {
            setListening(false);
            autoSendRef.current = false;

            if (event.error !== "aborted") {
                setError(
                    "Microphone input could not be captured. You can type your response instead."
                );
            }
        };

        recognition.onend = () => {
            setListening(false);

            const finalText =
                finalTranscriptRef.current.trim();

            const shouldSend =
                autoSendRef.current;

            autoSendRef.current = false;

            if (
                shouldSend &&
                finalText &&
                !sendingRef.current
            ) {
                sendMessage(finalText);
            }
        };

        recognitionRef.current =
            recognition;

        try {
            recognition.start();
        } catch (error) {
            setListening(false);
            autoSendRef.current = false;

            setError(
                "Microphone could not be started. You can type your response instead."
            );
        }
    };


    const stopListening = () => {
        recognitionRef.current?.stop();
        setListening(false);
    };


    if (!isOpen) {
        return null;
    }


    const handleDone = async () => {
        if (recoveryResult) {
            await onRecoveryComplete?.(
                recoveryResult
            );
        }

        onClose?.();
    };


    const updatedPayment =
        recoveryResult?.payment || payment;


    return (
        <Modal
            isOpen={isOpen}
            onClose={
                sending
                    ? () => {}
                    : onClose
            }
            title={`Voice Recovery — ${
                payment?.paymentId || ""
            }`}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-5">

                <div
                    className="rounded-xl border p-4"
                    style={{
                        borderColor:
                            "var(--line)",
                        background:
                            "var(--surface)"
                    }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="icon-box icon-box-primary">
                                <Bot className="w-5 h-5" />
                            </div>

                            <div>
                                <div
                                    className="text-[10px] font-bold uppercase tracking-widest"
                                    style={{
                                        color:
                                            "var(--primary)"
                                    }}
                                >
                                    LIVE VOICE RECOVERY
                                </div>

                                <h3
                                    className="mt-1 text-sm font-bold"
                                    style={{
                                        color:
                                            "var(--ink)"
                                    }}
                                >
                                    Talk to the recovery agent
                                </h3>

                                <p
                                    className="mt-1 text-xs leading-relaxed"
                                    style={{
                                        color:
                                            "var(--mute)"
                                    }}
                                >
                                    The agent speaks in Hinglish, explains the payment issue,
                                    and asks for confirmation before recovery is executed.
                                </p>
                            </div>
                        </div>

                        <div
                            className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold"
                            style={{
                                color:
                                    aiUnavailable
                                        ? "var(--down)"
                                        : "var(--up)"
                            }}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />

                            {aiUnavailable
                                ? "AI unavailable"
                                : "Guardrails active"}
                        </div>
                    </div>
                </div>


                {aiDecision && (
                    <AIDecisionCard
                        aiDecision={aiDecision}
                        payment={payment}
                        customer={customer}
                    />
                )}


                {recoveryResult?.executionResult && (
                    <ExecutionResult
                        executionResult={{
                            ...recoveryResult.executionResult,
                            actionExecuted:
                                recoveryResult.actionExecuted,
                            attemptsMade:
                                recoveryResult.attemptsMade,
                            maxAttempts:
                                recoveryResult.maxAttempts,
                            attemptsRemaining:
                                recoveryResult.attemptsRemaining
                        }}
                        payment={updatedPayment}
                    />
                )}


                <div
                    ref={transcriptRef}
                    className="rounded-xl border p-4 space-y-4 overflow-y-auto"
                    style={{
                        borderColor:
                            "var(--line)",
                        background:
                            "var(--surface-solid)",
                        minHeight: "280px",
                        maxHeight: "390px"
                    }}
                >
                    {messages.map(
                        (message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`flex gap-3 ${
                                    message.role ===
                                    "user"
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                {message.role ===
                                    "assistant" && (
                                    <div className="icon-box icon-box-sm icon-box-primary flex-shrink-0">
                                        <Bot className="w-3.5 h-3.5" />
                                    </div>
                                )}

                                <div
                                    className="max-w-[82%] rounded-xl px-4 py-3 text-xs leading-relaxed"
                                    style={{
                                        background:
                                            message.role ===
                                            "user"
                                                ? "var(--primary-muted)"
                                                : "var(--surface)",
                                        border:
                                            "1px solid var(--line)",
                                        color:
                                            "var(--ink)"
                                    }}
                                >
                                    {
                                        message.content
                                    }
                                </div>

                                {message.role ===
                                    "user" && (
                                    <div className="icon-box icon-box-sm icon-box-primary flex-shrink-0">
                                        <User className="w-3.5 h-3.5" />
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {sending && (
                        <div className="flex items-center gap-3">
                            <div className="icon-box icon-box-sm icon-box-primary">
                                <Bot className="w-3.5 h-3.5" />
                            </div>

                            <Loader text="Agent is responding..." />
                        </div>
                    )}
                </div>


                {error && (
                    <div className="banner-down">
                        <div>
                            <div className="banner-down-title">
                                {aiUnavailable
                                    ? "Voice AI unavailable"
                                    : "Voice input issue"}
                            </div>

                            <div className="banner-down-text">
                                {error}
                            </div>
                        </div>
                    </div>
                )}


                {!recoveryResult &&
                    !sessionEnded &&
                    !aiUnavailable && (
                        <div
                            className="rounded-xl border p-4"
                            style={{
                                borderColor:
                                    "var(--line)",
                                background:
                                    "var(--surface)"
                            }}
                        >
                            <div className="flex gap-2">
                                <input
                                    value={input}
                                    onChange={(event) =>
                                        setInput(
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            sendMessage(
                                                input
                                            );
                                        }
                                    }}
                                    placeholder="Speak or type: Haan, kar do"
                                    disabled={sending}
                                    className="flex-1 rounded-lg border px-3 py-2 text-xs outline-none"
                                    style={{
                                        borderColor:
                                            "var(--line)",
                                        background:
                                            "var(--surface-solid)",
                                        color:
                                            "var(--ink)"
                                    }}
                                />

                                <Button
                                    variant="primary"
                                    size="md"
                                    icon={Send}
                                    disabled={
                                        !input.trim() ||
                                        sending
                                    }
                                    onClick={() =>
                                        sendMessage(
                                            input
                                        )
                                    }
                                >
                                    Send
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                {voiceSupported ? (
                                    <Button
                                        variant={
                                            listening
                                                ? "danger"
                                                : "secondary"
                                        }
                                        size="sm"
                                        icon={
                                            listening
                                                ? MicOff
                                                : Mic
                                        }
                                        onClick={
                                            listening
                                                ? stopListening
                                                : startListening
                                        }
                                        disabled={
                                            sending
                                        }
                                    >
                                        {listening
                                            ? "Stop listening"
                                            : "Speak"}
                                    </Button>
                                ) : (
                                    <span
                                        className="text-[10px]"
                                        style={{
                                            color:
                                                "var(--mute)"
                                        }}
                                    >
                                        Voice input is unavailable in this browser. Typing is enabled.
                                    </span>
                                )}

                                <button
                                    type="button"
                                    disabled={ isVoiceRecoveryComplete || sessionEnded }
                                    onClick={() => {
                                        const lastAssistant =
                                            [
                                                ...messages
                                            ]
                                                .reverse()
                                                .find(
                                                    (item) =>
                                                        item.role ===
                                                        "assistant"
                                                );

                                        if (lastAssistant) {
                                            speak(lastAssistant.content);
                                        }
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold"
                                    style={{
                                        borderColor:
                                            "var(--line)",
                                        color:
                                            "var(--mute)",
                                        background:
                                            "transparent"
                                    }}
                                >
                                    <Volume2 className="w-3.5 h-3.5" />
                                    Replay
                                </button>

                                <span
                                    className="ml-auto text-[10px]"
                                    style={{
                                        color:
                                            "var(--mute)"
                                    }}
                                >
                                    No card, CVV or OTP details are requested.
                                </span>
                            </div>
                        </div>
                    )}


                {recoveryResult && (
                    <div className="flex items-center justify-between gap-3">
                        <div
                            className="flex items-center gap-2 text-[10px]"
                            style={{
                                color:
                                    "var(--mute)"
                            }}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />

                            <span>
                                Action passed through the existing recovery policy and was recorded.
                            </span>
                        </div>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleDone}
                        >
                            Done
                        </Button>
                    </div>
                )}


                {!recoveryResult && !sessionEnded && (
                    <div
                        className="flex items-center gap-2 text-[10px]"
                        style={{
                            color:
                                "var(--mute)"
                        }}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />

                        <span>
                            Recovery still passes through the existing AI decision and safety rules.
                        </span>
                    </div>
                )}

            </div>
        </Modal>
    );
};


export default VoiceRecovery;