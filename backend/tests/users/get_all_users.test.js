/**
 * @fileoverview Tests for user listing endpoint (/api/users)
 * @description Ensures retrieval of user data works correctly, including authentication, pagination, and security cases.
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

// Dummy users and tokens
let adminToken, userToken, expiredToken, invalidToken = "invalidtoken123";

/**
 * @beforeAll Connect to the test database before running tests
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Clean database
  await User.deleteMany({});

  // Create admin user
  const adminUser = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@123",
    role: "admin",
  });

  // Create regular user
  const regularUser = await User.create({
    name: "Regular User",
    email: "user@example.com",
    password: "User@123",
    role: "user",
  });

  // Create multiple users for pagination tests
  await User.insertMany([
    { name: "Admin User1", email: "admin1@example.com", password: "Admin@123", role: "admin" },
    { name: "John Doe", email: "john@example.com", password: "JohnPass@123", role: "user" },
    { name: "Jane Smith", email: "jane.smith@example.com", password: "JanePass@456", role: "user" },
    { name: "Alice Johnson", email: "alice@example.com", password: "AlicePass@789", role: "user" },
    { name: "Bob Brown", email: "bob@example.com", password: "BobPass@321", role: "user" }
  ]);


  // Generate JWT tokens
  adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  userToken = jwt.sign({ id: regularUser._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  expiredToken = jwt.sign({ id: adminUser._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "-1h" });

    // Flush Redis before testing
    await redisClient.flushall();
});

/**
 * @group User Listing Tests
 * @description Runs tests for GET /api/users endpoint
 */
describe("GET /api/users - Retrieve Users", () => {
  /**
   * ✅ Positive Test Cases
   */
  it("✅ Should retrieve all users", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("users");
    expect(Array.isArray(response.body.users)).toBeTruthy();
  });

  it("✅ Should retrieve users with pagination (Page 1, Limit 5)", async () => {
    const response = await request(app)
      .get("/api/users?page=1&limit=5")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("users");
    expect(response.body.users.length).toBeLessThanOrEqual(5);
  });

  it("✅ Should retrieve users with search query 'Admin'", async () => {
    const response = await request(app)
      .get("/api/users?search=Admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("users");
  });

  it("✅ Should filter users by role (admin)", async () => {
    const response = await request(app)
      .get("/api/users?role=admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users.every(user => user.role === "admin")).toBeTruthy();
  });

  it("✅ Should return users sorted by creation date (default descending order)", async () => {
    const response = await request(app)
      .get("/api/users?sort=createdAt")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("users");
  });

  it("✅ Should retrieve first page of users (Page=1)", async () => {
    const response = await request(app)
      .get("/api/users?page=1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  it("✅ Should retrieve users with limit=1", async () => {
    const response = await request(app)
      .get("/api/users?limit=1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users.length).toBe(1);
  });

  it("✅ Should retrieve users with limit=1000", async () => {
    const response = await request(app)
      .get("/api/users?limit=1000")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  it("✅ Should return users or empty list for the last page", async () => {
    const response = await request(app)
      .get("/api/users?page=99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  it("✅ Should support case-insensitive email search", async () => {
    const response = await request(app)
      .get("/api/users?search=john@EXAMPLE.COM")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users.some(user => user.email === "john@example.com")).toBeTruthy();
  });

  // it("✅ Should search users by exact full name", async () => {
  //   const response = await request(app)
  //     .get('/api/users?search="John Doe"')
  //     .set("Authorization", `Bearer ${adminToken}`);
    
  //   console.log(response.body.message);
  //   expect(response.status).toBe(200);
  // });

  /**
   * ❌ Negative Test Cases
   */
  it("❌ Should fail when no authentication token is provided", async () => {
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Not authorized, no token provided");
  });

  it("❌ Should fail with an invalid authentication token", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${invalidToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token, authentication failed");
  });

  it("❌ Should fail with an invalid page number", async () => {
    const response = await request(app)
      .get("/api/users?page=-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid page number");
  });

  it("❌ Should fail with an invalid limit number", async () => {
    const response = await request(app)
      .get("/api/users?limit=-5")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid limit number");
  });

  /**
   * 🔺 Security Test Cases
   */
  it("🔺 Should reject SQL injection attempt in search query", async () => {
    const response = await request(app)
      .get("/api/users?search=john' OR 1=1 --")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid input");
  });

  it("🔺 Should reject cross-site scripting (XSS) attempt in search query", async () => {
    const response = await request(app)
      .get("/api/users?search=<script>alert(1)</script>")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid input");
  });

  it("🔺 Should reject search with special characters", async () => {
    const response = await request(app)
      .get("/api/users?search=<>;--")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid input");
  });

  it("🔺 Should return an empty user list for extremely large page numbers", async () => {
    const response = await request(app)
      .get("/api/users?page=99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users.length).toBe(0);
  });

  /**
   * 🔺 Edge & Corner Test Cases
   */
  it("🔺 Should return an empty user list when database has no users", async () => {
    await User.deleteMany({});
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users.length).toBe(0);
  });

  it("🔺 Should handle large-scale search query (255 characters)", async () => {
    const longQuery = "a".repeat(255);
    const response = await request(app)
      .get(`/api/users?search=${longQuery}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users.length).toBe(0);
  });

  // it("🔺 Should remain responsive under high server load (1000+ requests)", async () => {
  //   jest.setTimeout(30000); // Increase timeout to 30 seconds
  
  //   const requests = [];
  //   for (let i = 0; i < 500; i++) {
  //     requests.push(request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`));
  //   }
  
  //   const responses = await Promise.all(requests);
  //   responses.forEach(response => expect(response.status).toBe(200));
  // })
});

/**
 * @afterAll Close database connection
 * @description Ensures tests do not hang due to open DB connections
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
