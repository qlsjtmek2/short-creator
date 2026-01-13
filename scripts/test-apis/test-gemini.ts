import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    console.log("⏳ Testing Gemini API...");
    const result = await model.generateContent("Would You Rather 질문을 한국어로 하나만 만들어줘.");
    const response = await result.response;
    const text = response.text();
    console.log("✅ Gemini Response:", text);
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
  }
}

testGemini();
