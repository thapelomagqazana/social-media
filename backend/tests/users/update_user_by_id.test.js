/**
 * @fileoverview Tests for updating user profile (PUT /api/users/:userId)
 * @description Ensures user profile updates work correctly, covering authentication, validation, and security cases.
 */

import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import redisClient from "../../config/redisClient.js";

// Load environment variables
dotenv.config();

let mongoServer;
let userToken, adminToken, userId, anotherUserId, invalidToken = "invalidtoken123";

/**
 * @beforeAll Connect to test database, create users
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await User.deleteMany({});

  // Create a test user
  const user = await User.create({
    name: "Test User",
    email: "user@example.com",
    password: "User@123",
  });

  // Create another user
  const anotherUser = await User.create({
    name: "Another User",
    email: "another@example.com",
    password: "User@123",
  });

  // Create an admin user
  const admin = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@123",
    role: "admin",
  });

  // Generate JWT tokens
  userToken = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Store user IDs
  userId = user._id.toString();
  anotherUserId = anotherUser._id.toString();

  // Flush Redis before testing
  await redisClient.flushall();
});

/**
 * @group User Update Tests
 */
describe("PUT /api/users/:userId - Update User Profile", () => {
  /**
   * ✅ Positive Test Cases
   */
  it("✅ Should update user’s name", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Updated Name" });

    expect(response.status).toBe(200);
    expect(response.body.user).toHaveProperty("name", "Updated Name");
  });

  it("✅ Should update user’s email", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ email: "updated@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.user).toHaveProperty("email", "updated@example.com");
  });

  it("✅ Should update user’s avatar", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ avatar: "https://example.com/avatar.jpg" });

    expect(response.status).toBe(200);
    expect(response.body.user).toHaveProperty("avatar", "https://example.com/avatar.jpg");
  });

  it("✅ Should update multiple fields", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Updated Name", email: "updated@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.user).toHaveProperty("name", "Updated Name");
    expect(response.body.user).toHaveProperty("email", "updated@example.com");
  });

  it("✅ Should allow admin to update another user’s profile", async () => {
    const response = await request(app)
      .put(`/api/users/${anotherUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated by Admin" });

    expect(response.status).toBe(200);
    expect(response.body.user).toHaveProperty("name", "Updated by Admin");
  });

  it("✅ Should update user’s email and store it in lowercase", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ email: "USER@EXAMPLE.COM" });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("user@example.com");
  });


  /**
   * ❌ Negative Test Cases
   */
  it("❌ Should fail when no authentication token is provided", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .send({ name: "Unauthorized" });

    expect(response.status).toBe(401);
  });

  it("❌ Should fail when using an invalid authentication token", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${invalidToken}`)
      .send({ name: "Invalid Token" });

    expect(response.status).toBe(401);
  });

  it("❌ Should prevent a user from updating another user’s profile", async () => {
    const response = await request(app)
      .put(`/api/users/${anotherUserId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Hacker" });

    expect(response.status).toBe(403);
  });

  it("❌ Should return 404 when updating a non-existent user", async () => {
    const response = await request(app)
      .put(`/api/users/67a7b1203c503317485399b8`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Ghost User" });

    expect(response.status).toBe(404);
  });

  it("❌ Should reject SQL injection attempts", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "'; DROP TABLE users; --" });

    expect(response.status).toBe(400);
  });

  it("❌ Should reject XSS attack attempts", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "<script>alert(1)</script>" });

    expect(response.status).toBe(400);
  });

  it("❌ Should fail when request body is empty", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("❌ Should reject invalid email format", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ email: "invalid-email" });

    expect(response.status).toBe(400);
  });

  it("❌ Should reject too long names", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "a".repeat(256) });

    expect(response.status).toBe(400);
  });

  it("❌ Should return 400 for invalid user ID format", async () => {
    const response = await request(app)
      .put(`/api/users/123abc`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Invalid ID" });

    expect(response.status).toBe(400);
  });

  it("❌ Should return 400 for user ID containing special characters", async () => {
    const response = await request(app)
      .put(`/api/users/$%*&@!`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Invalid ID" });

    expect(response.status).toBe(400);
  });

  it("❌ Should return 400 when updating name with only spaces", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: " " });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid name");
  });

  it("❌ Should return 400 when updating email to an existing email", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ email: "another@example.com" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email already in use");
  });

  it("❌ Should return 400 when updating avatar with a non-image URL", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ avatar: "https://example.com/not-an-image.pdf" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid avatar URL");
  });

  it("❌ Should return 400 when updating name with special characters", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "@#$%^&*()!" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid characters in name");
  });

  it("🔺 Should return 200 OK when updating email to the same value", async () => {
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ email: "user@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("user@example.com");
  });

  it("🔺 Should return 200 OK when updating user with max-length name", async () => {
    const longName = "a".repeat(255);
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: longName });

    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe(longName);
  });

  // it("🔺 Should handle 1000 concurrent update requests correctly", async () => {
  //   jest.setTimeout(30000); // Increase timeout to 30s
  
  //   const batchSize = 100; // Process requests in batches of 100
  //   const totalRequests = 1000;
  //   const requests = [];
  
  //   for (let i = 0; i < totalRequests; i++) {
  //     requests.push(
  //       request(app)
  //         .put(`/api/users/${userId}`)
  //         .set("Authorization", `Bearer ${userToken}`)
  //         .send({ name: `User ${i}` })
  //     );
  
  //     if (requests.length === batchSize || i === totalRequests - 1) {
  //       const responses = await Promise.all(requests); // Process batch
  //       responses.forEach((response) => {
  //         expect(response.status).toBe(200);
  //       });
  //       requests.length = 0; // Clear batch
  //     }
  //   }
  // });

  it("🔺 Should ensure consistent updates when two requests are sent at the same time", async () => {
    const update1 = request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Simultaneous Update 1" });

    const update2 = request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Simultaneous Update 2" });

    await Promise.all([update1, update2]);

    const finalResponse = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(["Simultaneous Update 1", "Simultaneous Update 2"]).toContain(finalResponse.body.name);
  });

});

/**
 * @afterAll Close database connection
 */
afterAll(async () => {
  try {
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
