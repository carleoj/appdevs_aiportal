import express from "express";
import protectRoute from "../middleware/auth.js";
import Tool from "../models/Tool.js";

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
    const { category } = req.query;
    const user = await User.findById(req.user.id).populate("likedTools");

    if (!user) return res.status(404).json({ message: "User not found" });

    let likedTools = user.likedTools;

    // If not "All" and not empty → filter by category
    if (category && category !== "All") {
      likedTools = likedTools.filter(
        (tool) => tool.category.toLowerCase() === category.toLowerCase()
      );
    }

    res.json({ likedTools });
  } catch (error) {
    console.error("Error fetching liked tools:", error);
    res.status(500).json({ message: "Server error while fetching liked tools" });
  }
});

// Like or unlike a tool
router.post("/like/:toolId", protectRoute, async (req, res) => {
  try {
    const { toolId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const alreadyLiked = user.likedTools.includes(toolId);

    if (alreadyLiked) {
      // Unlike
      user.likedTools.pull(toolId);
      await Tool.findByIdAndUpdate(toolId, { $inc: { likesCount: -1 } });
    } else {
      // Like
      user.likedTools.push(toolId);
      await Tool.findByIdAndUpdate(toolId, { $inc: { likesCount: 1 } });
    }

    await user.save();

    res.json({
      message: alreadyLiked ? "Tool unliked" : "Tool liked",
      likedTools: user.likedTools,
    });
  } catch (error) {
    console.error("Error liking/unliking tool:", error);
    res.status(500).json({ message: "Server error while liking tool" });
  }
});


export default router;