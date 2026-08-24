const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const recoverySchema = {
    type: "object",
    properties: {
        action: {
            type: "string",
            enum: [
                "RETRY_PAYMENT",
                "CREATE_PAYMENT_LINK",
                "ESCALATE_TO_HUMAN",
                "STOP_RECOVERY"
            ]
        },
        reason: {
            type: "string"
        },
        confidence: {
            type: "number"
        }
    },
    required: [
        "action",
        "reason",
        "confidence"
    ]
};

const analyzePayment = async (payment, customer) => {

    const prompt = `
        You are ReclaimAI, an AI-powered revenue recovery agent.

        Analyze the failed payment using the payment information
        and the customer's historical behavior.

        Your task is to recommend exactly ONE recovery action.

        Allowed actions:

        RETRY_PAYMENT
        CREATE_PAYMENT_LINK
        ESCALATE_TO_HUMAN
        STOP_RECOVERY

        Decision guidelines:

        1. Temporary bank failures can usually be retried
        when the retry count is low.

        2. Card declines can usually be recovered by offering
        an alternative payment method.

        3. Repeated failures should eventually be stopped.

        4. High-value transactions should be escalated
        for human review.

        5. Unknown failures should generally be escalated.

        6. Never invent an action outside the allowed actions.

        Payment:

        ${JSON.stringify(payment, null, 2)}

        Customer:

        ${JSON.stringify(customer, null, 2)}

        Return only the structured JSON response.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",

        contents: prompt,

        config: {
            responseMimeType: "application/json",
            responseSchema: recoverySchema
        }
    });

    return JSON.parse(response.text);
};

module.exports = {
    analyzePayment
};