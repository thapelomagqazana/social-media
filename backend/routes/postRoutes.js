import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  createPost,
  deletePost,
  toggleLikePost,
  commentOnPost,
} from "../controllers/postController.js";

const router = express.Router();

/**
 * @route POST    /api/posts        Create new post (text/image)
 * @route DELETE  /api/posts/:postId   Delete a post
 * @route PUT     /api/posts/:postId/like     Like/Unlike a post
 * @route POST    /api/posts/:postId/comment  Add a comment
 */
router.post("/", protect, upload.single("image"), createPost);
router.delete("/:postId", protect, deletePost);
router.put("/:postId/like", protect, toggleLikePost);
router.post("/:postId/comment", protect, commentOnPost);

export default router;
