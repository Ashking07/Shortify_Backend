import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com", // Deepseek-compatible base URL
  apiKey: process.env.DEEPSEEK_API_KEY, // Your secret key from .env
});

export const categorizeURL = async (longUrl) => {
  const systemPrompt =
    "You are a smart assistant that categorizes URLs into simple topics like Social Media, News, Shopping, Education, Entertainment, Developer Tools, etc.";
  const userPrompt = `Categorize this URL: ${longUrl}\n\nOnly give the category name.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 50,
    });

    const category = completion.choices[0].message.content.trim();
    return category;
  } catch (err) {
    console.error("🧠 Deepseek AI categorization error:", err.message);
    return "Uncategorized"; // fallback category
  }
};
