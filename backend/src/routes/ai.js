import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    
    // Assignment uses "gemini-pro"
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(question);
    const response = await result.response;
    const text = response.text();
    
    res.json({ answer: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI failed" });
  }
});

export default router;