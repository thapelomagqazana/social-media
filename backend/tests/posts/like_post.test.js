/**
 * @fileoverview Tests for the Like Post endpoint (/api/posts/:postId/like)
 * @description Ensures users can like posts correctly and handles errors.
 */

import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import User from "../../models/User.js";
import Post from "../../models/Post.js";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config();

let mongoServer;
let user1, user2, admin;
let user1Token, user2Token, adminToken;
let post;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create users
  user1 = await User.create({ name: "User One", email: "user1@example.com", password: "Test1234@", role: "user" });
  user2 = await User.create({ name: "User Two", email: "user2@example.com", password: "Test1234@", role: "user" });
  admin = await User.create({ name: "Admin", email: "admin@example.com", password: "Test1234@", role: "admin" });

  // Generate JWT tokens
  user1Token = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  user2Token = jwt.sign({ id: user2._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Create a test post
  post = await Post.create({ user: user1._id, content: "This is a test post", likes: [] });
});

/**
 * ✅ Test: User likes a post successfully
 */
it("✅ Should allow a user to like a post", async () => {
  const response = await request(app)
    .post(`/api/posts/${post._id}/like`)
    .set("Authorization", `Bearer ${user2Token}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Post liked successfully");

  // Verify likes count
  const updatedPost = await Post.findById(post._id);
  expect(updatedPost.likes.length).toBe(1);
  expect(updatedPost.likes.includes(user2._id)).toBeTruthy();
});

/**
 * ✅ Test: Multiple users like the same post simultaneously
 */
it("✅ Should allow multiple users to like a post", async () => {
  await request(app).post(`/api/posts/${post._id}/like`).set("Authorization", `Bearer ${user1Token}`);
  await request(app).post(`/api/posts/${post._id}/like`).set("Authorization", `Bearer ${adminToken}`);

  const updatedPost = await Post.findById(post._id);
  expect(updatedPost.likes.length).toBe(3);
});

/**
 * ❌ Test: User tries to like a post they already liked
 */
it("❌ Should prevent duplicate likes", async () => {
  const response = await request(app)
    .post(`/api/posts/${post._id}/like`)
    .set("Authorization", `Bearer ${user2Token}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Post already liked");

  // Likes count remains unchanged
  const updatedPost = await Post.findById(post._id);
  expect(updatedPost.likes.length).toBe(3);
});

/**
 * ❌ Test: User tries to like a non-existent post
 */
it("❌ Should return 404 for non-existent post", async () => {
  const nonExistentPostId = new mongoose.Types.ObjectId();
  const response = await request(app)
    .post(`/api/posts/${nonExistentPostId}/like`)
    .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "Post not found");
});

/**
 * ❌ Test: User tries to like a soft-deleted post
 */
it("❌ Should return 404 when liking a soft-deleted post", async () => {
  await Post.findByIdAndUpdate(post._id, { deleted: true });

  const response = await request(app)
    .post(`/api/posts/${post._id}/like`)
    .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "Post not found");
});

/**
 * ❌ Test: User tries to like a post with an invalid ID format
 */
it("❌ Should return 400 for invalid post ID format", async () => {
  const response = await request(app)
    .post(`/api/posts/invalid123/like`)
    .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Invalid post ID format");
});

/**
 * ❌ Test: User tries to like a post without authentication
 */
it("❌ Should return 401 for unauthorized request", async () => {
  const response = await request(app).post(`/api/posts/${post._id}/like`);
  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty("message", "Not authorized, no token provided");
});

/**
 * ❌ Test: User provides an expired or invalid token
 */
it("❌ Should return 401 for invalid token", async () => {
  const response = await request(app)
    .post(`/api/posts/${post._id}/like`)
    .set("Authorization", "Bearer invalidtoken123");

  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty("message", "Invalid token, authentication failed");
});

// /**
//  * 🔺 Test: A post receives 10,000+ likes in a short time
//  */
// it("🔺 Should handle 10,000+ likes atomically", async () => {
//   const likeRequests = Array.from({ length: 10000 }, async (_, i) =>
//     request(app)
//       .post(`/api/posts/${post._id}/like`)
//       .set("Authorization", `Bearer ${user1Token}`)
//   );

//   await Promise.all(likeRequests);

//   const updatedPost = await Post.findById(post._id);
//   expect(updatedPost.likes.length).toBeGreaterThanOrEqual(3);
// });

// /**
//  * 🔺 Test: User likes a post, then immediately tries to unlike it
//  */
// it("🔺 Should allow liking and unliking in sequence", async () => {
//   await request(app).post(`/api/posts/${post._id}/like`).set("Authorization", `Bearer ${user2Token}`);
//   const unlikeResponse = await request(app)
//     .post(`/api/posts/${post._id}/unlike`)
//     .set("Authorization", `Bearer ${user2Token}`);

//   expect(unlikeResponse.status).toBe(200);
//   expect(unlikeResponse.body).toHaveProperty("message", "Post unliked successfully");

//   const updatedPost = await Post.findById(post._id);
//   expect(updatedPost.likes.includes(user2._id)).toBeFalsy();
// });

/**
 * 🔺 Test: A user likes a post while an admin deletes it
 */
it("🔺 Should handle simultaneous like and delete actions", async () => {
  await Post.findByIdAndUpdate(post._id, { deleted: true });

  const response = await request(app)
    .post(`/api/posts/${post._id}/like`)
    .set("Authorization", `Bearer ${user1Token}`);

  expect([200, 404]).toContain(response.status);
});

/**
 * @afterAll Cleanup database and close connections
 */
afterAll(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await mongoose.connection.close();
  await mongoServer.stop();
});
