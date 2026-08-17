import express from "express";

const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }],
      }),
    });

    const data = await response.json();

    // Improved extraction with fallback
    let text = "No answer received";
    if (data.candidates && data.candidates[0]) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        text = candidate.content.parts[0].text || "No text in response";
      }
    }

    // If Gemini blocked it for safety, show that clearly
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      text = `Blocked: ${data.promptFeedback.blockReason}`;
    }

    res.json({ answer: text, fullResponse: data }); // fullResponse helps debug
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI failed", details: error.message });
  }
});

export default router;