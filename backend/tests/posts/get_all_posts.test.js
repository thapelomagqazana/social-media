/**
 * @fileoverview Tests for GET /api/posts (Newsfeed)
 * @description Ensures posts are fetched correctly with pagination, caching, and filtering.
 */

import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import Post from "../../models/Post.js";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import redisClient from "../../config/redisClient.js";

dotenv.config();

let mongoServer;
let user1, user2;
let user1Token, user2Token;

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

  // Generate JWT tokens
  user1Token = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  user2Token = jwt.sign({ id: user2._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Create sample posts
  await Post.insertMany([
    { user: user1._id, content: "First post!", media: "" },
    { user: user1._id, content: "Second post!", media: "https://example.com/image.jpg"},
    { user: user2._id, content: "User2's post"}
  ]);

  // Flush Redis before testing
  await redisClient.flushall();
});

/**
 * ✅ Fetch first page of posts
 */
it("✅ Should fetch first page of posts", async () => {
  const response = await request(app).get("/api/posts")
  .set("Authorization", `Bearer ${user1Token}`);
  expect(response.status).toBe(200);
  expect(response.body.posts.length).toBeGreaterThan(0);
});

/**
 * ✅ Fetch paginated posts (limit = 2)
 */
it("✅ Should fetch posts with pagination (limit=2)", async () => {
  const response = await request(app).get("/api/posts?limit=2")
  .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(200);
  expect(response.body.posts.length).toBeLessThanOrEqual(2);
});

/**
 * ✅ Fetch posts by user ID
 */
it("✅ Should fetch posts by user ID", async () => {
  const response = await request(app).get(`/api/posts?userId=${user1._id}`)
  .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(200);
});

/**
 * ❌ Fetch posts with an invalid page number
 */
it("❌ Should return 400 for invalid page number", async () => {
  const response = await request(app).get("/api/posts?page=-1")
  .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Invalid page number");
});

/**
 * ❌ Fetch posts with invalid limit number
 */
it("❌ Should return 400 for invalid limit", async () => {
  const response = await request(app).get("/api/posts?limit=-5")
  .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Invalid limit number");
});

/**
 * ❌ Fetch posts with invalid user ID
 */
it("❌ Should return 400 for invalid user ID", async () => {
  const response = await request(app).get("/api/posts?userId=invalid123")
  .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Invalid user ID format");
});

/**
 * ✅ Fetch empty page of posts
 */
it("✅ Should return empty list when requesting a non-existing page", async () => {
  const response = await request(app).get("/api/posts?page=99999")
  .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(200);
  expect(response.body.posts.length).toBe(0);
});

// /**
//  * ❌ Fetch posts when database is down
//  */
// it("❌ Should return 500 if the database is down", async () => {
//   await mongoose.connection.close();
//   const response = await request(app).get("/api/posts");

//   expect(response.status).toBe(500);
//   expect(response.body).toHaveProperty("message", "Database error");

//   // Reconnect database for next tests
//   await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
// });

/**
 * @afterAll Cleanup database and close connections
 */
afterAll(async () => {
  try {
    await Post.deleteMany({});
    await User.deleteMany({});
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
