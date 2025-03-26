import express from "express";
import { followUser, unfollowUser, whoToFollow } from "../controllers/followController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:userId", protect, followUser);
router.delete("/:userId", protect, unfollowUser);
router.get("/suggestions", protect, whoToFollow);

export default router;