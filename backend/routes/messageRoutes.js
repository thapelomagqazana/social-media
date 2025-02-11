import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/messages/send
 * @description Send a message via REST API (Testable)
 * @access Private
 */
router.post("/send", protect, sendMessage);

/**
 * @route GET /api/messages
 * @description Fetch chat messages between two users (paginated).
 * @access Private (Requires authentication)
 */
router.get("/", protect, getMessages);

export default router;
