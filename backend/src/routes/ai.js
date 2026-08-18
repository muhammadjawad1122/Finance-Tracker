import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "missing" });

router.post("/ask", async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash", // 👈 changed
      contents: question,
    });

    return res.json({
      answer: response.text || "No answer",
    });
  } catch (error) {
    console.error("AI error:", error?.message || error);
    return res.status(500).json({
      error: "AI failed",
      details: error?.message || "unknown",
    });
  }
});

router.post("/debug", async (req, res) => {
  try {
    const interaction = await ai.models.generateContent({
      model: "gemini-3.6-flash", // 👈 changed
      contents: req.body?.question || "Hi",
    });
    res.json(interaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;