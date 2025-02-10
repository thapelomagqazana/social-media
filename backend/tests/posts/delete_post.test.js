/**
 * @fileoverview Tests for DELETE /api/posts/:postId (Soft Delete)
 * @module tests/posts/delete_post.test.js
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
let post1, post2, post3, softDeletedPost;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });

  // Create users (user1, user2, and an admin)
  user1 = await User.create({ name: "User One", email: "user1@example.com", password: "Test1234@", role: "user" });
  user2 = await User.create({ name: "User Two", email: "user2@example.com", password: "Test1234@", role: "user" });
  admin = await User.create({ name: "Admin", email: "admin@example.com", password: "Test1234@", role: "admin" });

  // Generate JWT tokens
  user1Token = jwt.sign({ id: user1._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  user2Token = jwt.sign({ id: user2._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Create posts
  post1 = await Post.create({ user: user1._id, content: "User1's post" });
  post2 = await Post.create({ user: user2._id, content: "User2's post" });
  post3 = await Post.create({ user: user1._id, content: "Another post by User1" });

  // Soft delete a post in advance
  softDeletedPost = await Post.create({ user: user1._id, content: "This post is already deleted", deleted: true, deletedAt: new Date() });
});

/**
 * ✅ User deletes their own post
 */
it("✅ Should allow a user to delete their own post", async () => {
  const response = await request(app)
    .delete(`/api/posts/${post1._id}`)
    .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Post deleted successfully");

  // Check if post is marked as deleted
  const deletedPost = await Post.findById(post1._id);
  expect(deletedPost.deleted).toBe(true);
  expect(deletedPost.deletedAt).toBeTruthy();
});

/**
 * ✅ Admin deletes a user's post
 */
it("✅ Should allow an admin to delete a user's post", async () => {
  const response = await request(app)
    .delete(`/api/posts/${post2._id}`)
    .set("Authorization", `Bearer ${adminToken}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Post deleted successfully");

  // Check if post is marked as deleted
  const deletedPost = await Post.findById(post2._id);
  expect(deletedPost.deleted).toBe(true);
  expect(deletedPost.deletedAt).toBeTruthy();
});

/**
 * ✅ Soft deleted post no longer appears in the newsfeed
 */
it("✅ Soft deleted post should not appear in newsfeed", async () => {
  const response = await request(app).get("/api/posts")
  .set("Authorization", `Bearer ${adminToken}`);

  // Ensure deleted post is not in response
  expect(response.status).toBe(200);
  expect(response.body.posts.some(post => post._id === post1._id.toString())).toBeFalsy();
});

/**
 * ✅ Deleted post details remain accessible (admin only)
 */
it("✅ Admin can fetch a soft deleted post", async () => {
  const response = await request(app)
    .get(`/api/posts/${post1._id}?includeDeleted=true`)
    .set("Authorization", `Bearer ${adminToken}`);

  console.log(response.body.message);
  expect(response.status).toBe(200);
  expect(response.body.post.deleted).toBe(true);
});

//
// ❌ Negative Test Cases
//

/**
 * ❌ User tries to delete someone else's post
 */
it("❌ Should prevent a user from deleting someone else's post", async () => {
  const response = await request(app)
    .delete(`/api/posts/${post3._id}`)
    .set("Authorization", `Bearer ${user2Token}`);

  expect(response.status).toBe(403);
  expect(response.body.message).toBe("Unauthorized to delete this post");
});

/**
 * ❌ User tries to delete a post with an invalid ID format
 */
it("❌ Should return 400 for invalid post ID format", async () => {
  const response = await request(app)
    .delete(`/api/posts/invalid123`)
    .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Invalid post ID format");
});

/**
 * ❌ User tries to delete a non-existent post
 */
it("❌ Should return 404 for non-existent post", async () => {
  const nonExistentPostId = new mongoose.Types.ObjectId();
  const response = await request(app)
    .delete(`/api/posts/${nonExistentPostId}`)
    .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Post not found");
});

/**
 * ❌ User tries to delete a post without authentication
 */
it("❌ Should return 401 for unauthorized request", async () => {
  const response = await request(app).delete(`/api/posts/${post1._id}`);

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Not authorized, no token provided");
});

/**
 * ❌ User provides an expired/invalid token
 */
it("❌ Should return 401 for invalid token", async () => {
  const response = await request(app)
    .delete(`/api/posts/${post1._id}`)
    .set("Authorization", `Bearer invalidToken123`);

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Invalid token, authentication failed");
});

/**
 * ❌ User attempts to delete an already soft-deleted post
 */
it("❌ Should return 200 even if post is already soft deleted", async () => {
  const response = await request(app)
    .delete(`/api/posts/${softDeletedPost._id}`)
    .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(200);
  expect(response.body.message).toBe("Post deleted successfully");

  // Ensure post remains soft deleted
  const checkPost = await Post.findById(softDeletedPost._id);
  expect(checkPost.deleted).toBe(true);
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
