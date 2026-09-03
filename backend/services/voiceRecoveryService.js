const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-3.1-flash-lite";
const PENDING_ACTION_TTL_MS = 10 * 60 * 1000;

const pendingActions = new Map();

class GeminiUnavailableError extends Error {
    constructor(
        message,
        cause = null,
        type = "AI_UNKNOWN_ERROR",
        userMessage = null
    ) {
        super(message);
        this.name = "GeminiUnavailableError";
        this.code = "GEMINI_UNAVAILABLE";
        this.cause = cause;
        this.aiErrorType = type;
        this.aiUserMessage =
            userMessage ||
            message;
        this.aiProvider =
            "Gemini 3.1 Flash Lite";
    }
}

const classifyGeminiError = (error) => {
    const status = Number(
        error?.status ||
        error?.statusCode ||
        error?.response?.status ||
        0
    );

    const message = String(
        error?.message || error || ""
    ).toLowerCase();

    if (
        status === 429 ||
        message.includes("rate limit") ||
        message.includes("resource exhausted") ||
        message.includes("quota") ||
        message.includes("too many requests")
    ) {
        return {
            type: "AI_RATE_LIMITED",
            userMessage:
                "Reclaim-AI is working normally, but the Gemini 3.1 Flash Lite AI service has temporarily reached its usage limit. No recovery action was executed. Please try again later."
        };
    }

    if (
        status === 408 ||
        message.includes("timeout") ||
        message.includes("timed out") ||
        message.includes("deadline exceeded")
    ) {
        return {
            type: "AI_TIMEOUT",
            userMessage:
                "Reclaim-AI could not get a response from the Gemini 3.1 Flash Lite AI service in time. No recovery action was executed. Please try again."
        };
    }

    if (
        [500, 502, 503, 504].includes(status) ||
        message.includes("service unavailable") ||
        message.includes("temporarily unavailable")
    ) {
        return {
            type: "AI_SERVICE_UNAVAILABLE",
            userMessage:
                "Reclaim-AI is working normally, but the Gemini 3.1 Flash Lite AI service is temporarily unavailable. No recovery action was executed. Please try again in a moment."
        };
    }

    return {
        type: "AI_UNKNOWN_ERROR",
        userMessage:
            "Reclaim-AI could not complete the voice recovery decision because the connected Gemini 3.1 Flash Lite AI service encountered an unexpected problem. No recovery action was executed. Please try again."
    };
};

const normalizeHistory = (history) => {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .filter(
            (item) =>
                item &&
                (item.role === "user" ||
                    item.role === "assistant") &&
                typeof item.content === "string"
        )
        .slice(-8)
        .map((item) => ({
            role: item.role,
            content: item.content.slice(0, 1000)
        }));
};

const isExplicitConfirmation = (message) => {
    const text = String(message || "")
        .trim()
        .toLowerCase()
        .replace(/[.,!?;:]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!text) {
        return false;
    }

    const questionOrDiscussionTerms = [
        "what",
        "why",
        "how",
        "when",
        "which",
        "can you",
        "could you",
        "will it",
        "will this",
        "what will",
        "what happens",
        "tell me",
        "explain",
        "explain karo",
        "samjhao",
        "samjha",
        "batao",
        "bataiye",
        "kya",
        "kyun",
        "kaise",
        "kab",
        "kaunsa",
        "kaunsi",
        "lekin",
        "but"
    ];

    if (
        questionOrDiscussionTerms.some(
            (term) =>
                text === term ||
                text.startsWith(`${term} `) ||
                text.includes(` ${term} `)
        )
    ) {
        return false;
    }

    const refusals = [
        "no",
        "nope",
        "nah",
        "nahi",
        "nahin",
        "mat karo",
        "mat karna",
        "don't",
        "do not",
        "cancel",
        "cancel karo",
        "stop",
        "stop karo"
    ];

    if (
        refusals.some(
            (term) =>
                text === term ||
                text.startsWith(`${term} `)
        )
    ) {
        return false;
    }

    const exactConfirmations = [
        "yes",
        "yeah",
        "yep",
        "okay",
        "ok",
        "sure",
        "go ahead",
        "do it",
        "please do",
        "haan",
        "han",
        "ha",
        "ji",
        "jee",
        "theek hai",
        "thik hai",
        "kar do",
        "kardo",
        "bhej do",
        "bhejdo",
        "retry kar do",
        "payment kar do",
        "haan kar do",
        "haan bhej do",
        "han bhej do",
        "haan ji",
        "haan karo",
        "han karo",
        "kar dijiye",
        "kar dijiyega",
        "bhej dijiye"
    ];

    if (exactConfirmations.includes(text)) {
        return true;
    }

    const explicitActionConfirmations = [
        /^(yes|yeah|yep|okay|ok|sure) (do it|please do|go ahead|proceed)$/,
        /^(haan|han|ha) (kar do|kardo|karo|kar dijiye|kar dijiyega)$/,
        /^(haan|han|ha) (bhej do|bhejdo|bhej dijiye)$/,
        /^(yes|yeah|yep) please (do it|proceed)$/,
        /^(please )?(do it|go ahead|proceed)$/
    ];

    return explicitActionConfirmations.some(
        (pattern) =>
            pattern.test(text)
    );
};

const isGeminiAvailabilityError = (error) => {
    const status = Number(
        error?.status ||
        error?.statusCode ||
        error?.response?.status ||
        0
    );

    if (
        [408, 429, 500, 502, 503, 504].includes(
            status
        )
    ) {
        return true;
    }

    const message = String(
        error?.message || error || ""
    ).toLowerCase();

    return [
        "resource exhausted",
        "rate limit",
        "quota",
        "too many requests",
        "service unavailable",
        "temporarily unavailable",
        "deadline exceeded",
        "timeout",
        "timed out",
        "503",
        "429"
    ].some((term) =>
        message.includes(term)
    );
};

const ensureGeminiConfigured = () => {
    if (!process.env.GEMINI_API_KEY) {
        const error =
            classifyGeminiError(
                new Error(
                    "Gemini API is not configured."
                )
            );

        throw new GeminiUnavailableError(
            error.userMessage,
            null,
            error.type,
            error.userMessage
        );
    }

    console.log(
        "[Gemini] Voice recovery request"
    );
};

const getPendingActionKey = (
    paymentId,
    voiceSessionId
) => {
    return `${paymentId}:${voiceSessionId}`;
};

const setPendingVoiceAction = ({
    paymentId,
    voiceSessionId,
    action,
    confidence,
    reason,
    summary,
    whyThisDecision,
    whatHappensNext
}) => {
    const allowedActions = new Set([
        "RETRY_PAYMENT",
        "CREATE_PAYMENT_LINK",
        "ESCALATE_TO_HUMAN",
        "STOP_RECOVERY"
    ]);

    const key = getPendingActionKey(
        paymentId,
        voiceSessionId
    );

    if (!allowedActions.has(action)) {
        pendingActions.delete(key);
        return;
    }

    pendingActions.set(key, {
        action,
        confidence:
            Number(confidence) || 0,
        reason: String(
            reason ||
                "Voice recovery action proposed."
        ).slice(0, 500),
        summary: String(
            summary ||
                "The voice recovery agent evaluated the failed payment and selected a recovery action."
        ).slice(0, 1000),
        whyThisDecision: String(
            whyThisDecision ||
                reason ||
                "The selected recovery action was based on the payment context and recovery safety rules."
        ).slice(0, 1000),
        whatHappensNext: String(
            whatHappensNext ||
                "The selected action will be executed only after your confirmation and the recovery policy check."
        ).slice(0, 1000),
        createdAt: Date.now()
    });
};

const getPendingVoiceAction = (
    paymentId,
    voiceSessionId
) => {
    const key = getPendingActionKey(
        paymentId,
        voiceSessionId
    );

    const pending =
        pendingActions.get(key);

    if (!pending) {
        return null;
    }

    if (
        Date.now() -
            pending.createdAt >
        PENDING_ACTION_TTL_MS
    ) {
        pendingActions.delete(key);
        return null;
    }

    return pending;
};

const clearPendingVoiceAction = (
    paymentId,
    voiceSessionId
) => {
    const key = getPendingActionKey(
        paymentId,
        voiceSessionId
    );

    pendingActions.delete(key);
};

const getVoiceGeminiUsage = () => ({
    available:
        Boolean(process.env.GEMINI_API_KEY),

    providerManaged: true
});

const generateVoiceResponse = async ({
    payment,
    customer,
    message,
    history = [],
    phase = "INTRO"
}) => {
    const safeHistory =
        normalizeHistory(history);

    ensureGeminiConfigured();

    const prompt = `
You are Reclaim-AI's customer recovery voice assistant.

Speak naturally in concise Hinglish: mostly simple Hindi written in Roman script,
with common English payment words such as payment, card, link, recovery and bank.
Do not sound robotic. Keep the response to 1-3 short sentences.

You are discussing ONE failed payment.

Payment context:
- Payment ID: ${payment?.paymentId || "unknown"}
- Amount: ${payment?.amount ?? "unknown"} ${payment?.currency || "INR"}
- Scenario: ${payment?.scenario || "unknown"}
- Failure reason: ${payment?.failureReason || "unknown"}
- Current status: ${payment?.status || "unknown"}
- Recovery attempts used: ${payment?.attemptCount ?? 0}
- Maximum automated attempts: 3

Customer:
- Name: ${customer?.name || "customer"}

Conversation phase: ${phase}

Rules:
1. Never ask for card number, CVV, OTP, UPI PIN, password, bank credentials, or other secrets.
2. Never claim money was recovered unless the system result proves it.
3. Never promise that a payment will definitely succeed.
4. Explain the issue simply and ask for confirmation before an automated recovery action.
5. If the payment is a card decline, explain that an alternative payment link may be offered instead of retrying the same card.
6. If the payment is high-value or unknown, explain that human review is required.
7. If the user is confused or refuses, do not execute anything.
8. If the user appears to confirm an action but the previous action is not clear, evaluate the safest recovery option and propose it clearly before asking for confirmation.
9. Do not invent payment details.
10. suggestedAction must be the single safest next action for this failed payment. When the customer has asked for recovery help or has given a generic confirmation such as "yes", "haan", "haan karo", "kar do", or "go ahead" without a previously proposed specific action, you MUST select a concrete safest action. Do not return NONE unless no safe recovery action exists.
11. The summary must describe what the agent concluded at this point in the conversation. Do not describe a future confirmation or execution as if it has already happened.
12. Only say that the customer "confirmed", "accepted", or "approved" an action when the conversation history contains a clear proposal for that same specific action and the latest customer message explicitly confirms it.
13. If the customer has requested help but no specific recovery action was previously proposed, describe the customer as requesting help, not as confirming or accepting a recovery action.
14. If an action is being proposed but has not yet been confirmed, whatHappensNext must describe the action conditionally, using wording such as "If the customer confirms, the system will...".
15. The summary, whyThisDecision, and whatHappensNext must describe the AI recommendation stage separately from actual execution. Do not claim that an action was executed unless the system has actually executed it.
16. If the latest customer message is a generic confirmation but the conversation history does not contain a previous assistant message clearly proposing the same specific recovery action, treat the message as permission to evaluate the failed payment. Immediately evaluate the safest recovery option, return that concrete action in suggestedAction, explain that specific option in reply, and ask for confirmation to execute THAT action. Never ask the customer to confirm the evaluation itself, never say that you will check the option in a later turn, and never require another message such as "check", "karo check", or "jaldi karo" before proposing the action.
17. When a generic confirmation triggers evaluation, the reply MUST contain one concrete recovery option and a confirmation question for that option in the same response. The system must follow this sequence: generic confirmation → recommendation → specific confirmation → execution.

Conversation history:
${JSON.stringify(safeHistory)}

Latest customer message:
${String(message || "").slice(0, 1000)}

Return ONLY valid JSON:
{
  "reply": "short Hinglish response",
  "intent": "DISCUSS|CONFIRM|DECLINE|QUESTION|OTHER",
  "suggestedAction": "RETRY_PAYMENT|CREATE_PAYMENT_LINK|ESCALATE_TO_HUMAN|STOP_RECOVERY|NONE",
  "confidence": 0.0,
  "reason": "short reason for the proposed action",
  "summary": "concise explanation of the agent's current conclusion; do not claim customer confirmation or execution unless it actually happened",
  "whyThisDecision": "why this recovery action is appropriate for this payment",
  "whatHappensNext": "what will happen if the customer confirms the proposed action; describe it conditionally until confirmation"
}
`;

    let response;

    try {
        response =
            await ai.models.generateContent({
                model: MODEL,
                contents: prompt
            });
    } catch (error) {
        console.error(
            "[Gemini] Voice request failed:",
            error?.message || error
        );

        const aiError =
            classifyGeminiError(error);

        throw new GeminiUnavailableError(
            aiError.userMessage,
            error,
            aiError.type,
            aiError.userMessage
        );
    }

    const text =
        response?.text?.trim();

    if (!text) {
        const aiError = {
            type: "AI_INVALID_RESPONSE",
            userMessage:
                "Reclaim-AI could not complete the voice recovery decision because the Gemini 3.1 Flash Lite AI service returned no usable response. No recovery action was executed. Please try again."
        };

        throw new GeminiUnavailableError(
            aiError.userMessage,
            null,
            aiError.type,
            aiError.userMessage
        );
    }

    let parsed;

    try {
        parsed = JSON.parse(text);
    } catch {
        const match =
            text.match(/\{[\s\S]*\}/);

        if (!match) {
            const aiError = {
                type: "AI_INVALID_RESPONSE",
                userMessage:
                    "Reclaim-AI could not complete the voice recovery decision because the Gemini 3.1 Flash Lite AI service returned an invalid response. No recovery action was executed. Please try again."
            };

            throw new GeminiUnavailableError(
                aiError.userMessage,
                null,
                aiError.type,
                aiError.userMessage
            );
        }

        try {
            parsed = JSON.parse(
                match[0]
            );
        } catch (error) {
            const aiError = {
                type: "AI_INVALID_RESPONSE",
                userMessage:
                    "Reclaim-AI could not complete the voice recovery decision because the Gemini 3.1 Flash Lite AI service returned an invalid response. No recovery action was executed. Please try again."
            };

            throw new GeminiUnavailableError(
                aiError.userMessage,
                error,
                aiError.type,
                aiError.userMessage
            );
        }
    }

    const allowedActions = new Set([
        "RETRY_PAYMENT",
        "CREATE_PAYMENT_LINK",
        "ESCALATE_TO_HUMAN",
        "STOP_RECOVERY",
        "NONE"
    ]);

    const suggestedAction =
        String(
            parsed.suggestedAction ||
                "NONE"
        ).toUpperCase();

    const confidence =
        Number(parsed.confidence);

    return {
        reply:
            typeof parsed.reply ===
                "string" &&
            parsed.reply.trim()
                ? parsed.reply.trim()
                : "Payment issue samajh aa gaya. Main aapko next safe step batata hoon.",

        intent:
            typeof parsed.intent ===
                "string"
                ? parsed.intent.toUpperCase()
                : "OTHER",

        suggestedAction:
            allowedActions.has(
                suggestedAction
            )
                ? suggestedAction
                : "NONE",

        confidence:
            Number.isFinite(
                confidence
            )
                ? Math.max(
                      0,
                      Math.min(
                          1,
                          confidence
                      )
                  )
                : 0,

        reason:
            typeof parsed.reason ===
                "string"
                ? parsed.reason
                      .trim()
                      .slice(0, 500)
                : "AI proposed a recovery action based on the payment context.",

        summary:
            typeof parsed.summary ===
                "string"
                ? parsed.summary
                    .trim()
                    .slice(0, 1000)
                : "The voice recovery agent evaluated the failed payment and selected a recovery action.",

        whyThisDecision:
            typeof parsed.whyThisDecision ===
                "string"
                ? parsed.whyThisDecision
                    .trim()
                    .slice(0, 1000)
                : typeof parsed.reason === "string"
                    ? parsed.reason
                        .trim()
                        .slice(0, 1000)
                    : "The selected recovery action was based on the payment context and recovery safety rules.",

        whatHappensNext:
            typeof parsed.whatHappensNext ===
                "string"
                ? parsed.whatHappensNext
                    .trim()
                    .slice(0, 1000)
                : "The selected action will be executed only after your confirmation and the recovery policy check.",

        explicitConfirmation:
            isExplicitConfirmation(
                message
            )
    };
};

const buildRecoveryReply = ({
    recovery,
    payment
}) => {
    const result =
        recovery?.executionResult
            ?.result ||
        recovery?.executionResult
            ?.status ||
        payment?.recoveryResult ||
        "UNKNOWN";

    const action =
        recovery?.actionExecuted ||
        recovery?.actionRequested ||
        payment?.recoveryAction ||
        "UNKNOWN";

    if (result === "RECOVERED") {
        return "Done. Payment successfully recover ho gayi hai. Recovery action complete ho gaya hai aur audit log mein record ho gaya hai.";
    }

    if (
        result === "PENDING" &&
        action ===
            "CREATE_PAYMENT_LINK"
    ) {
        return "Done. Maine aapke liye alternative payment link create kar diya hai. Payment abhi pending hai; aap link se payment complete kar sakte hain.";
    }

    if (
        result === "ESCALATED" ||
        action ===
            "ESCALATE_TO_HUMAN"
    ) {
        return "Theek hai. Is payment ko human review ke liye escalate kar diya gaya hai. Automated recovery aage execute nahi ki gayi.";
    }

    if (
        result === "STOPPED" ||
        action === "STOP_RECOVERY"
    ) {
        return "Recovery ko safe rules ke according stop kar diya gaya hai. Koi further automated payment action execute nahi kiya gaya.";
    }

    if (result === "FAILED") {
        return "Recovery attempt execute hua, lekin payment recover nahi hui. System ne result ko audit log mein record kar diya hai.";
    }

    return "Recovery action execute ho gaya hai. Maine actual system result ke according status update kar diya hai.";
};

module.exports = {
    generateVoiceResponse,
    isExplicitConfirmation,
    setPendingVoiceAction,
    getPendingVoiceAction,
    clearPendingVoiceAction,
    buildRecoveryReply,
    getVoiceGeminiUsage,
    GeminiUnavailableError
};