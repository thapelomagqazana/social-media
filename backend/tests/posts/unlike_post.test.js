/**
 * @fileoverview Tests for unliking a post (POST /api/posts/:postId/unlike)
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
let user, userToken, post, softDeletedPost;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create a test user
  user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "Test1234@",
  });

  // Generate JWT token for the user
  userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  // Create a test post
  post = await Post.create({
    user: user._id,
    content: "This is a test post",
    likes: [user._id], // User has already liked this post
  });

  // Create a soft-deleted post
  softDeletedPost = await Post.create({
    user: user._id,
    content: "This is a soft-deleted post",
    likes: [user._id],
    deleted: true,
  });
});

/**
 * ✅ Test: User unlikes a post successfully
 */
it("✅ Should allow a user to unlike a post successfully", async () => {
  const response = await request(app)
    .post(`/api/posts/${post._id}/unlike`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Post unliked successfully");

  // Verify post is unliked
  const updatedPost = await Post.findById(post._id);
  expect(updatedPost.likes.includes(user._id)).toBeFalsy();
});

/**
 * ❌ Test: User tries to unlike a post they haven't liked
 */
it("❌ Should return 200 OK if user hasn't liked the post", async () => {
  const response = await request(app)
    .post(`/api/posts/${post._id}/unlike`) // Unliking the post again
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Post not liked yet");
});

/**
 * ❌ Test: User tries to unlike a soft-deleted post
 */
it("❌ Should return 404 Not Found for a soft-deleted post", async () => {
  const response = await request(app)
    .post(`/api/posts/${softDeletedPost._id}/unlike`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "Post not found");
});

/**
 * ❌ Test: User provides an invalid post ID
 */
it("❌ Should return 400 Bad Request for an invalid post ID", async () => {
  const response = await request(app)
    .post(`/api/posts/invalid123/unlike`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Invalid post ID format");
});

/**
 * ❌ Test: User tries to unlike a non-existent post
 */
it("❌ Should return 404 Not Found for a non-existent post", async () => {
  const nonExistentPostId = new mongoose.Types.ObjectId();
  const response = await request(app)
    .post(`/api/posts/${nonExistentPostId}/unlike`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "Post not found");
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
