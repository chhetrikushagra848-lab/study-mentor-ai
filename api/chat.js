// chat.js - API route for Vercel deployment

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { message } = req.body;

  // Use environment variable for API key
  const openaiApiKey = process.env.OPENAI_API_KEY;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful study mentor." },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ message: "Something went wrong with OpenAI API." });
  }
}
