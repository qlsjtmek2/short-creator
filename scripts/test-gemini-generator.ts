import { GeminiQuestionGenerator } from "../src/generators/GeminiQuestionGenerator";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY missing");
    return;
  }

  const generator = new GeminiQuestionGenerator(apiKey);
  
  console.log("⏳ Generating 3 questions...");
  try {
    const questions = await generator.generateQuestions(3);
    console.log("✅ Successfully generated questions:");
    console.table(questions);
  } catch (error) {
    console.error("❌ Generation failed:", error);
  }
}

main();
