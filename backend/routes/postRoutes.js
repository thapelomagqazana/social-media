const express = require("express");
const { protect, checkBanned } = require("../middleware/authMiddleware.js");
const { upload } = require("../middleware/uploadMiddleware.js");
const {
  createPost,
  deletePost,
  toggleLikePost,
  commentOnPost,
  getNewsfeed,
} = require("../controllers/postController.js");

const router = express.Router();

/**
 * @route POST    /api/posts               Create new post (text/image)
 * @route DELETE  /api/posts/:postId       Delete a post
 * @route PUT     /api/posts/:postId/like  Like/Unlike a post
 * @route POST    /api/posts/:postId/comment  Add a comment
 * @route GET     /api/posts/newsfeed      Get newsfeed
 */
router.post("/", protect, checkBanned, upload.single("image"), createPost);
router.delete("/:postId", protect, checkBanned, deletePost);
router.put("/:postId/like", protect, checkBanned, toggleLikePost);
router.post("/:postId/comment", protect, checkBanned, commentOnPost);
router.get("/newsfeed", protect, checkBanned, getNewsfeed);

module.exports = router;
