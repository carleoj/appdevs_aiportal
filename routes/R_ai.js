import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import Tool from "../models/Tool.js";
dotenv.config();

const router = express.Router();

// POST /api/ai/ask
router.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Fetch all tools from the database
    const tools = await Tool.find({});
    
    // Create a structured tool collection for the AI
    const toolCatalog = tools.map(tool => ({
      title: tool.title,
      category: tool.category,
      description: tool.caption,
      link: tool.link,
      likesCount: tool.likesCount || 0
    }));

    // Create a categorized tool summary
    const categories = {};
    tools.forEach(tool => {
      tool.category.forEach(cat => {
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(tool.title);
      });
    });

    const systemMessage = `You are AIPortal Assistant, a knowledgeable AI companion specializing in helping users discover and understand AI tools. 

Latest Available Tools :
${JSON.stringify(toolCatalog, null, 2)}

Categories Overview:
${Object.entries(categories).map(([category, tools]) => 
  `${category}: ${tools.join(', ')}`
).join('\n')}

Your main functions include:
1. Finding and recommending specific Web Applications, AI tools from our collection based on user needs
2. Explaining how our listed tools work
3. Making personalized tool recommendations from our collection
4. Answering questions about AI technology and the web applications
5. Providing insights about latest AI trends and best practices

When recommending tools:
- Only recommend tools that exist in our collection, or search the internet if none fit the user's needs
- Include tool names exactly as they appear in the collection
- Mention relevant categories when appropriate
- Consider tools' like counts as a popularity indicator
- Include the tool's link when making specific recommendations

You are friendly, professional, and always aim to provide practical, accurate information about our AI tools and technologies. When users ask about specific tasks or needs, prioritize recommending relevant tools searched from the internet.`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          // "HTTP-Referer": "https://your-app-url.com", // optional
          "X-Title": "AIPortal", // optional
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply = response.data.choices[0].message.content;
    res.json({ reply: aiReply });
  } catch (error) {
    console.error("DeepSeek API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch AI response" });
  }
});

export default router;
