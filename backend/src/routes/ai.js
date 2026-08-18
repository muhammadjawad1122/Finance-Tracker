import express from "express";
import { GoogleGenAI } from "google-genai";

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    const interaction = await ai.interactions.create({
      model: "gemini-2.5-flash",
      input: question,
    });

    return res.json({
      answer: interaction?.output_text || "No answer",
    });
  } catch (error) {
    console.error("AI error:", error?.message || error);
    return res.status(500).json({
      error: "AI failed",
      details: error?.message || "unknown",
    });
  }
});

// Temporary debug route to see the raw response from Gemini
router.post("/debug", async (req, res) => {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-2.5-flash",
      input: req.body?.question || "Hi",
    });
    res.json(interaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;