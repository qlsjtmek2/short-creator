import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

async function testPexels() {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.error("❌ PEXELS_API_KEY is missing in .env");
    return;
  }

  try {
    console.log("⏳ Testing Pexels API...");
    const response = await axios.get("https://api.pexels.com/v1/search", {
      params: { query: "nature", per_page: 1 },
      headers: { Authorization: apiKey }
    });
    console.log("✅ Pexels Connection Successful!");
    console.log("📸 Sample Image URL:", response.data.photos[0]?.src?.original);
  } catch (error: any) {
    console.error("❌ Pexels API Error:", error.response?.data || error.message);
  }
}

testPexels();
