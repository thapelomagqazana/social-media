/**
 * @fileoverview Tests for adding comments to posts (POST /api/posts/:postId/comment)
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
let user1, user2, admin;
let post, softDeletedPost, deletedPost;
let user1Token, user2Token, adminToken;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {});

  // Create users
  user1 = await User.create({ name: "User One", email: "user1@example.com", password: "Test1234@", role: "user" });
  user2 = await User.create({ name: "User Two", email: "user2@example.com", password: "Test1234@", role: "user" });
  admin = await User.create({ name: "Admin", email: "admin@example.com", password: "Admin1234@", role: "admin" });

  // Generate JWT tokens
  user1Token = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  user2Token = jwt.sign({ id: user2._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Create posts
  post = await Post.create({ user: user1._id, content: "Test Post" });
  softDeletedPost = await Post.create({ user: user1._id, content: "Soft Deleted Post", deleted: true });
  deletedPost = new mongoose.Types.ObjectId(); // Simulate a non-existent post ID
});

/**
 * ✅ Test: User adds a comment successfully
 */
it("✅ Should allow a user to add a comment", async () => {
  const response = await request(app)
    .post(`/api/posts/${post._id}/comment`)
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ text: "This is a test comment." });

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty("message", "Comment added successfully");
  expect(response.body.comment).toHaveProperty("text", "This is a test comment.");
});

/**
 * ✅ Test: User adds a second comment to the same post
 */
it("✅ Should allow a user to comment multiple times on the same post", async () => {
  const response = await request(app)
    .post(`/api/posts/${post._id}/comment`)
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ text: "Another test comment." });

  expect(response.status).toBe(201);
  expect(response.body.comment).toHaveProperty("text", "Another test comment.");
});

/**
 * ✅ Test: Comment count increments after adding a comment
 */
it("✅ Should increment the comment count on the post", async () => {
  const updatedPost = await Post.findById(post._id);
  expect(updatedPost.commentCount).toBeGreaterThan(0);
});

/**
 * ✅ Test: Multiple users comment simultaneously
 */
it("✅ Should allow multiple users to comment on the same post", async () => {
  const response1 = request(app)
    .post(`/api/posts/${post._id}/comment`)
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ text: "User1 comment." });

  const response2 = request(app)
    .post(`/api/posts/${post._id}/comment`)
    .set("Authorization", `Bearer ${user2Token}`)
    .send({ text: "User2 comment." });

  const [res1, res2] = await Promise.all([response1, response2]);

  expect(res1.status).toBe(201);
  expect(res2.status).toBe(201);
});

/**
 * ❌ Test: User tries to comment on a soft-deleted post
 */
it("❌ Should return 404 when commenting on a soft-deleted post", async () => {
  const response = await request(app)
    .post(`/api/posts/${softDeletedPost._id}/comment`)
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ text: "Comment on deleted post" });

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "Post not found");
});

/**
 * ❌ Test: User tries to comment on a non-existent post
 */
it("❌ Should return 404 for a non-existent post", async () => {
  const response = await request(app)
    .post(`/api/posts/${deletedPost}/comment`)
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ text: "Comment on non-existent post" });

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "Post not found");
});

/**
 * ❌ Test: User tries to comment with an invalid post ID format
 */
it("❌ Should return 400 for an invalid post ID format", async () => {
  const response = await request(app)
    .post(`/api/posts/invalid123/comment`)
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ text: "Invalid post ID format" });

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Invalid post ID format");
});

/**
 * ❌ Test: User tries to comment with an empty text body
 */
it("❌ Should return 400 for an empty comment", async () => {
  const response = await request(app)
    .post(`/api/posts/${post._id}/comment`)
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ text: "" });

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Comment text is required");
});

/**
 * ❌ Test: User tries to comment with text exceeding 500 characters
 */
it("❌ Should return 400 for comment exceeding 500 characters", async () => {
  const longComment = "a".repeat(501);
  const response = await request(app)
    .post(`/api/posts/${post._id}/comment`)
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ text: longComment });

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Comment cannot exceed 500 characters");
});

/**
 * ❌ Test: User tries to comment without authentication
 */
it("❌ Should return 401 for an unauthorized request", async () => {
  const response = await request(app)
    .post(`/api/posts/${post._id}/comment`)
    .send({ text: "No auth token" });

  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty("message", "Not authorized, no token provided");
});

/**
 * ❌ Test: User provides an expired or invalid token
 */
it("❌ Should return 401 for an invalid or expired token", async () => {
  const response = await request(app)
    .post(`/api/posts/${post._id}/comment`)
    .set("Authorization", `Bearer invalidToken123`)
    .send({ text: "Invalid token test" });

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
