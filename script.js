const express = require("express");
const cors = require("cors");
const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;

// ✅ No trailing slashes in origins
const allowedOrigins = [
  "https://ai-music-chatbot-git-main-vanishas-projects-f4b1addc.vercel.app",
  "https://ai-music-chatbot-gold.vercel.app",
  "http://localhost:3000",
];

// ✅ CORS config
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        console.log(`Origin allowed: ${origin}`);
        callback(null, true);
      } else {
        console.log(`Origin blocked: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ✅ API key hardcoded (not recommended for production)
const apiKey = 'AIzaSyAViG5_lKGGXXoOfb2-gWL6qNJ5W5tHLXM';
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro-exp-03-25",
  systemInstruction:
    "You are a music-focused AI chatbot. When the user asks about any song genre, mashup, remix, or songs by any singer or artist, respond with helpful and relevant information. Always try to include YouTube links to the requested songs, mashups, or related content whenever possible.",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseMimeType: "text/plain",
};

const chatSession = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [{ text: "hi" }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Hello! I'm your music mashup assistant. How can I help you create amazing music today?",
        },
      ],
    },
  ],
});

// ✅ Chat endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const result = await chatSession.sendMessage(message);
    const aiResponse = result.response.text();
    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ response: "Sorry, something went wrong with the AI service!" });
  }
});

// ✅ Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
