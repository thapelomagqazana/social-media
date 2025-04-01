const Post = require("../models/Post");
const User = require("../models/User");

/**
 * @desc    Search users or posts
 * @route   GET /api/search?q=term&type=users|posts
 * @access  Public
 */
const search = async (req, res) => {
  const { q, type } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const regex = new RegExp(q.trim(), "i"); // case-insensitive

    if (type === "users") {
      const users = await User.find({ name: regex }).select("name email");
      return res.status(200).json({ results: users });
    }

    if (type === "posts") {
      const posts = await Post.find({ text: regex })
        .populate("user", "name")
        .sort({ createdAt: -1 });
      return res.status(200).json({ results: posts });
    }

    res.status(400).json({ message: "Invalid search type" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { search };
