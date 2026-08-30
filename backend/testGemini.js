require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function testGemini() {
    try {
        console.log("Testing Gemini API...");
        console.log("Model: gemini-3.6-flash");

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "Reply with exactly: RECLAIM-AI TEST OK"
        });

        console.log("\nGemini response:");
        console.log(response.text);

    } catch (error) {
        console.error("\nGemini test failed:");
        console.error(error.message);
    }
}

testGemini();