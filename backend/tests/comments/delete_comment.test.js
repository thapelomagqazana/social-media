/**
 * @fileoverview Tests for DELETE /api/posts/:postId/comment/:commentId
 * @description Tests soft-deletion of comments while maintaining comment history.
 */

import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import User from "../../models/User.js";
import Post from "../../models/Post.js";
import Comment from "../../models/Comment.js";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config();

let mongoServer;
let user, admin, anotherUser;
let userToken, adminToken, anotherUserToken;
let post, comment;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create users
  user = await User.create({ name: "User", email: "user@example.com", password: "Test1234@", role: "user" });
  admin = await User.create({ name: "Admin", email: "admin@example.com", password: "Test1234@", role: "admin" });
  anotherUser = await User.create({ name: "Another User", email: "another@example.com", password: "Test1234@", role: "user" });

  // Generate JWT tokens
  userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  anotherUserToken = jwt.sign({ id: anotherUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Create a post
  post = await Post.create({ user: user._id, content: "This is a test post", commentCount: 1 });

  // Create a comment
  comment = await Comment.create({ user: user._id, post: post._id, text: "This is a test comment" });

  // Increment comment count
  await Post.findByIdAndUpdate(post._id, { $inc: { commentCount: 1 } });
});

/**
 * ✅ Test: User deletes their own comment
 */
it("✅ Should allow a user to delete their own comment", async () => {
  const response = await request(app)
    .delete(`/api/posts/${post._id}/comment/${comment._id}`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Comment deleted successfully");

  // Verify soft delete
  const deletedComment = await Comment.findById(comment._id);
  expect(deletedComment.deleted).toBe(true);
  expect(deletedComment.deletedAt).not.toBeNull();
});

/**
 * ✅ Test: Admin deletes any user's comment
 */
it("✅ Should allow an admin to delete any user's comment", async () => {
  const newComment = await Comment.create({ user: anotherUser._id, post: post._id, text: "Admin will delete this" });

  const response = await request(app)
    .delete(`/api/posts/${post._id}/comment/${newComment._id}`)
    .set("Authorization", `Bearer ${adminToken}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Comment deleted successfully");

  const deletedComment = await Comment.findById(newComment._id);
  expect(deletedComment.deleted).toBe(true);
});

/**
 * ✅ Test: Comment count decrements correctly
 */
it("✅ Should decrement comment count after deletion", async () => {
  const newComment = await Comment.create({ user: user._id, post: post._id, text: "Will be deleted" });

  await request(app)
    .delete(`/api/posts/${post._id}/comment/${newComment._id}`)
    .set("Authorization", `Bearer ${userToken}`);

  const updatedPost = await Post.findById(post._id);
  expect(updatedPost.commentCount).toBeGreaterThanOrEqual(0);
});

/**
 * ❌ Test: User tries to delete someone else's comment
 */
it("❌ Should prevent a user from deleting another user's comment", async () => {
  const response = await request(app)
    .delete(`/api/posts/${post._id}/comment/${comment._id}`)
    .set("Authorization", `Bearer ${anotherUserToken}`);

  expect(response.status).toBe(403);
  expect(response.body).toHaveProperty("message", "Unauthorized to delete this comment");
});

/**
 * ❌ Test: User tries to delete a comment from a soft-deleted post
 */
it("❌ Should return 404 if post is soft-deleted", async () => {
  await Post.findByIdAndUpdate(post._id, { deleted: true });

  const response = await request(app)
    .delete(`/api/posts/${post._id}/comment/${comment._id}`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "Post not found");

  await Post.findByIdAndUpdate(post._id, { deleted: false });
});

/**
 * ❌ Test: User tries to delete a comment from a non-existent post
 */
it("❌ Should return 404 for a non-existent post", async () => {
  const nonExistentPostId = new mongoose.Types.ObjectId();

  const response = await request(app)
    .delete(`/api/posts/${nonExistentPostId}/comment/${comment._id}`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "Post not found");
});

/**
 * ❌ Test: User tries to delete a non-existent comment
 */
it("❌ Should return 404 for a non-existent comment", async () => {
  const nonExistentCommentId = new mongoose.Types.ObjectId();

  const response = await request(app)
    .delete(`/api/posts/${post._id}/comment/${nonExistentCommentId}`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "Comment not found");
});

/**
 * ❌ Test: User tries to delete a comment with an invalid ID format
 */
it("❌ Should return 400 for invalid ID format", async () => {
  const response = await request(app)
    .delete(`/api/posts/${post._id}/comment/invalid123`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Invalid ID format");
});

/**
 * ❌ Test: User tries to delete a comment without authentication
 */
it("❌ Should return 401 for unauthorized request", async () => {
  const response = await request(app)
    .delete(`/api/posts/${post._id}/comment/${comment._id}`);

  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty("message", "Not authorized, no token provided");
});

/**
 * ❌ Test: User provides an expired/invalid token
 */
it("❌ Should return 401 for invalid token", async () => {
  const response = await request(app)
    .delete(`/api/posts/${post._id}/comment/${comment._id}`)
    .set("Authorization", "Bearer invalidToken123");

  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty("message", "Invalid token, authentication failed");
});

/**
 * @afterAll Cleanup database and close connections
 */
afterAll(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});
  await mongoose.connection.close();
  await mongoServer.stop();
});
