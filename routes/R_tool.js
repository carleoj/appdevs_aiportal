import express from "express";
import protectRoute from "../middleware/auth.js";
import Tool from "../models/Tool.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

// infinite loading pagination
router.get("/fetchall/:category", protectRoute, async (req, res) => {
  try {
    const { category } = req.params;

    // default pagination values
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // category filter
    const filter = category === "All" ? {} : { category };

    // fetch tools with pagination
    const tools = await Tool.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // newest first (optional)

    const totalTools = await Tool.countDocuments(filter);

    res.status(200).json({
      tools,
      currentPage: page,
      totalTools,
      totalPages: Math.ceil(totalTools / limit),
      hasMore: page < Math.ceil(totalTools / limit),
    });
  } catch (error) {
    console.error("Error in R_tool get all tools:", error);
    res.status(500).json({ message: "R_tool Server Error." });
  }
});

//search tool by title
router.get("/search/:title", protectRoute, async (req, res) => {
  const { title } = req.params;
  try {
    // Case-insensitive, partial match
    const tools = await Tool.find({ title: { $regex: title, $options: "i" } });

    if (tools.length === 0) {
      return res.status(404).json({ message: "No matching tools found" });
    }

    res.json(tools);
  } catch (error) {
    console.error("Error in R_tool search tool by title", error);
    res.status(500).json({ message: "R_tool Server Error." });
  }
});

// Get liked tools for the authenticated user with category filter
router.get("/liked", protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("likedTools")
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const category = req.query.category;
    let likedTools = user.likedTools || [];

    if (category && category !== "All") {
      likedTools = likedTools.filter((tool) => {
        if (!tool.category) return false;

        // If tool.category is an array
        if (Array.isArray(tool.category)) {
          return tool.category.some(
            (c) => c.toLowerCase() === category.toLowerCase()
          );
        }

        // If tool.category is a string
        return tool.category.toLowerCase() === category.toLowerCase();
      });
    }

    return res.status(200).json({ likedTools });
  } catch (error) {
    console.error("Error fetching liked tools:", error);
    return res.status(500).json({
      message: "Server error while fetching liked tools",
      error: error.message,
    });
  }
});

// Like or unlike a tool
router.post("/like/:toolId", protectRoute, async (req, res) => {
  try {
    const { toolId } = req.params;

    // Validate toolId
    if (!mongoose.Types.ObjectId.isValid(toolId)) {
      return res.status(400).json({ message: "Invalid tool ID" });
    }

    // Find user and tool
    const user = await User.findById(req.user.id);
    const tool = await Tool.findById(toolId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!tool) return res.status(404).json({ message: "Tool not found" });

    const alreadyLiked = user.likedTools.includes(toolId);

    if (alreadyLiked) {
      // Unlike tool
      user.likedTools.pull(toolId);
      tool.likesCount = Math.max(0, tool.likesCount - 1);
      await tool.save();
    } else {
      // Like tool
      user.likedTools.push(toolId);
      tool.likesCount = (tool.likesCount || 0) + 1;
      await tool.save();
    }

    await user.save();

    res.json({
      message: alreadyLiked ? "Tool unliked" : "Tool liked",
      likedTools: user.likedTools, 
    });
  } catch (error) {
    console.error("Error liking/unliking tool:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;