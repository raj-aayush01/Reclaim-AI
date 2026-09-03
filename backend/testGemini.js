require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const MODEL = "gemini-3.1-flash-lite";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function testGemini() {
    console.log("=================================");
    console.log("      Reclaim-AI Gemini Test");
    console.log("=================================");

    console.log(`Model: ${MODEL}`);

    if (!process.env.GEMINI_API_KEY) {
        console.error("\n❌ GEMINI_API_KEY is missing.");
        console.error(
            "Check your backend/.env file."
        );
        process.exit(1);
    }

    console.log("API key: Found");
    console.log("\nSending test request...");

    try {
        const response =
            await ai.models.generateContent({
                model: MODEL,
                contents:
                    "Reply with exactly: RECLAIM-AI TEST OK"
            });

        const text =
            response?.text?.trim();

        console.log("\n=================================");
        console.log("       Gemini API Response");
        console.log("=================================");

        console.log(text || "(empty response)");

        if (
            text ===
            "RECLAIM-AI TEST OK"
        ) {
            console.log(
                "\n✅ GEMINI API TEST PASSED"
            );
            console.log(
                "The API key and model are working."
            );
        } else {
            console.log(
                "\n⚠️ Gemini responded, but the response was different from expected."
            );
            console.log(
                "The API connection itself appears to be working."
            );
        }

    } catch (error) {
        console.error(
            "\n================================="
        );
        console.error(
            "       Gemini API Test Failed"
        );
        console.error(
            "================================="
        );

        console.error(
            "\nError:",
            error?.message || error
        );

        console.error(
            "\nStatus:",
            error?.status ||
            error?.statusCode ||
            "Unknown"
        );

        process.exit(1);
    }
}

testGemini();