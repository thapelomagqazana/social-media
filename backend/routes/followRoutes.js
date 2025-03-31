import express from "express";
import { followUser, unfollowUser, whoToFollow } from "../controllers/followController.js";
import { protect, checkBanned } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:userId", protect, checkBanned, followUser);
router.delete("/:userId", protect, checkBanned, unfollowUser);
router.get("/suggestions", protect, checkBanned, whoToFollow);

export default router;