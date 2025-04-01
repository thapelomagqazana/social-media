const express = require("express");
const {
  followUser,
  unfollowUser,
  whoToFollow,
} = require("../controllers/followController.js");
const { protect, checkBanned } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/:userId", protect, checkBanned, followUser);
router.delete("/:userId", protect, checkBanned, unfollowUser);
router.get("/suggestions", protect, checkBanned, whoToFollow);

module.exports = router;
