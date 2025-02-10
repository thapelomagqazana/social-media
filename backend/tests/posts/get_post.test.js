/**
 * @fileoverview Tests for the GET /api/posts/:postId endpoint.
 * @description Ensures the retrieval of a specific post with caching.
 */

import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import User from "../../models/User.js";
import Post from "../../models/Post.js";
import redisClient from "../../config/redisClient.js";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config();

let mongoServer;
let user, userToken;
let post, cachedPost;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create a user
  user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "Test1234@",
    avatar: "https://example.com/avatar.jpg",
  });

  // Generate JWT token for authentication
  userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Create a post
  post = await Post.create({
    user: user._id,
    content: "This is a test post",
    media: "",
    likes: [],
  });

  // Store the post in Redis cache manually for testing
  cachedPost = {
    _id: post._id.toString(),
    user: { _id: user._id.toString(), name: user.name, avatar: user.avatar },
    content: post.content,
    media: post.media,
    likes: [],
    createdAt: post.createdAt,
  };

  await redisClient.set(`post:${post._id}`, JSON.stringify(cachedPost), "EX", 3600); // Store in cache for 1 hour
});

/**
 * ✅ Fetch an existing post
 */
it("✅ Should fetch an existing post", async () => {
  const response = await request(app)
    .get(`/api/posts/${post._id}`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(200);
  expect(response.body.post).toHaveProperty("content", post.content);
  expect(response.body.post).toHaveProperty("user");
  expect(response.body.post.user._id).toBe(user._id.toString());
});

/**
 * ✅ Fetch a cached post (previously requested)
 */
it("✅ Should fetch a cached post", async () => {
  const response = await request(app)
    .get(`/api/posts/${post._id}`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("cached", true); // Ensure it's from cache
});

/**
 * ✅ Fetch a post with a valid user reference
 */
it("✅ Should fetch a post with user details", async () => {
  const response = await request(app)
    .get(`/api/posts/${post._id}`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(200);
  expect(response.body.post).toHaveProperty("user");
  expect(response.body.post.user).toHaveProperty("name", user.name);
  expect(response.body.post.user).toHaveProperty("avatar", user.avatar);
});

/**
 * ❌ Fetch a post with an invalid ID format
 */
it("❌ Should return 400 for an invalid post ID format", async () => {
  const response = await request(app)
    .get(`/api/posts/invalid123`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Invalid post ID format");
});

/**
 * ❌ Fetch a non-existing post
 */
it("❌ Should return 404 for a non-existing post", async () => {
  const nonExistentPostId = new mongoose.Types.ObjectId(); // Generate valid but non-existent ID
  const response = await request(app)
    .get(`/api/posts/${nonExistentPostId}`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "Post not found");
});

/**
 * @afterAll Cleanup database and close connections
 */
afterAll(async () => {
  try {
    await User.deleteMany({});
    await Post.deleteMany({});
    await mongoose.connection.close();
    await mongoServer.stop();

    if (redisClient.status !== "end") {
      await redisClient.quit();
      console.log("🛑 Redis Connection Closed");
    }
  } catch (error) {
    console.error("❌ Error closing resources:", error);
  }
});
