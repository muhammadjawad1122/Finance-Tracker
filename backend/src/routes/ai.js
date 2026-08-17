import express from "express";

const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Using v1 endpoint (stable) instead of v1beta
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }],
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No answer";

    res.json({ answer: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI failed" });
  }
});

export default router;