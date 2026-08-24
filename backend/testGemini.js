require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function testGemini() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "Say hello to ReclaimAI in one sentence."
        });

        console.log("Gemini response:");
        console.log(response.text);

    } catch (error) {
        console.error("Gemini error:");
        console.error(error.message);
    }
}

testGemini();