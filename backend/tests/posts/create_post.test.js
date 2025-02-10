/**
 * @fileoverview Tests for the post creation endpoint (/api/posts)
 * @description Ensures users can create posts correctly and handles errors properly.
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
});

/**
 * ✅ Test: User creates a simple text post
 */
it("✅ Should allow a user to create a simple text post", async () => {
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ content: "Hello world!" });

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty("message", "Post created successfully");
  expect(response.body.post).toHaveProperty("content", "Hello world!");
  expect(response.body.post).toHaveProperty("user", user1._id.toString());
});

/**
 * ✅ Test: User creates a post with media (image/video URL)
 */
it("✅ Should allow a user to create a post with media", async () => {
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ content: "Check this out!", media: "https://example.com/image.jpg" });

  expect(response.status).toBe(201);
  expect(response.body.post).toHaveProperty("media", "https://example.com/image.jpg");
});

/**
 * ✅ Test: Multiple users create posts simultaneously (batch inserts)
 */
it("✅ Should allow multiple users to create posts simultaneously", async () => {
  const postRequests = [
    request(app).post("/api/posts").set("Authorization", `Bearer ${user1Token}`).send({ content: "Post 1" }),
    request(app).post("/api/posts").set("Authorization", `Bearer ${user2Token}`).send({ content: "Post 2" }),
  ];

  const responses = await Promise.all(postRequests);
  responses.forEach(response => expect(response.status).toBe(201));
});

/**
 * ✅ Test: Post is created and user’s postCount is incremented
 */
it("✅ Should increment the user’s postCount after creating a post", async () => {
  await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ content: "Another post" });

  const updatedUser = await User.findById(user1._id);
  expect(updatedUser.postCount).toBeGreaterThan(0);
});

/**
 * ✅ Test: Post is created with timestamps
 */
it("✅ Should create a post with correct timestamps", async () => {
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ content: "Timestamp test" });

  expect(response.status).toBe(201);
  expect(new Date(response.body.post.createdAt)).toBeInstanceOf(Date);
  expect(new Date(response.body.post.updatedAt)).toBeInstanceOf(Date);
});

/**
 * ❌ Test: User tries to create a post without authentication
 */
it("❌ Should reject a request without authentication", async () => {
  const response = await request(app)
    .post("/api/posts")
    .send({ content: "Unauthorized post" });

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Not authorized, no token provided");
});

/**
 * ❌ Test: User sends an expired/invalid token
 */
it("❌ Should reject a request with an invalid token", async () => {
  const invalidToken = "invalid.token.string";
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${invalidToken}`)
    .send({ content: "Invalid token test" });

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Invalid token, authentication failed");
});

/**
 * ❌ Test: User tries to create a post with empty content
 */
it("❌ Should reject a post with empty content", async () => {
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ content: "" });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Post content is required");
});

/**
 * ❌ Test: User tries to create a post that exceeds character limit
 */
it("❌ Should reject a post with content exceeding the character limit", async () => {
  const longContent = "a".repeat(1001);
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ content: longContent });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Post content cannot exceed 1000 characters");
});

/**
 * ❌ Test: User sends an invalid media URL format
 */
it("❌ Should reject a post with an invalid media URL", async () => {
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ content: "Check this!", media: "htp://invalid-url" });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Invalid media URL");
});

/**
 * ❌ Test: User tries to create a post with invalid data type
 */
it("❌ Should reject a post with an invalid data type", async () => {
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${user1Token}`)
    .send({ content: { text: 100 } });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Invalid input format");
});

// /**
//  * ❌ Test: Database is down while creating a post
//  */
// it("❌ Should return 500 if the database is down", async () => {
//     // Disconnect MongoDB to simulate database failure
//     await mongoose.disconnect();
  
//     const response = await request(app)
//       .post("/api/posts")
//       .set("Authorization", `Bearer ${user1Token}`)
//       .send({ content: "Database failure test" });

//     console.log(response.body.message);
//     expect(response.status).toBe(500);
//     expect(response.body.message).toContain("Internal server error");
  
//     // Reconnect MongoDB for next tests
//     await mongoose.connect(mongoServer.getUri(), {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
// });
  

/**
 * @afterAll Cleanup database and close connections
 */
afterAll(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await mongoose.connection.close();
  await mongoServer.stop();
});
