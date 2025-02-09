import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../../models/User.js";
import Follower from "../../models/Follower.js";
import jwt from "jsonwebtoken";
import redisClient from "../../config/redisClient.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let mongoServer;
let user1, user2, user3;
let userToken;

/**
 * @beforeAll - Setup test database and create sample users
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });

  // Create test users
  user1 = await User.create({ name: "User One", email: "user1@example.com", password: "Test1234@" });
  user2 = await User.create({ name: "User Two", email: "user2@example.com", password: "Test1234@" });
  user3 = await User.create({ name: "User Three", email: "user3@example.com", password: "Test1234@" });

  // Create follow relationships
  await Follower.create({ follower: user1._id, following: user2._id });
  await Follower.create({ follower: user1._id, following: user3._id });

  // Generate JWT token for user1
  userToken = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Flush Redis cache
  await redisClient.flushall();
});

/**
 * @group GET /api/users/:userId/following - Retrieve Users Followed by User
 */
describe("GET /api/users/:userId/following - Retrieve Following", () => {
  /**
   * ✅ Positive Test Cases
   */
  it("✅ Should return a list of users followed by a valid user", async () => {
    const response = await request(app)
      .get(`/api/users/${user1._id}/following`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("following");
    expect(response.body.following.length).toBe(2);
  });

  it("✅ Should return an empty list for a user following no one", async () => {
    const response = await request(app)
      .get(`/api/users/${user3._id}/following`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.following.length).toBe(0);
  });

  it("✅ Should paginate results correctly (limit=1)", async () => {
    const response = await request(app)
      .get(`/api/users/${user1._id}/following?limit=1`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.following.length).toBe(1);
  });

  /**
   * ❌ Negative Test Cases
   */
  it("❌ Should return 400 for an invalid user ID format", async () => {
    const response = await request(app)
      .get("/api/users/invalidID/following")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid user ID");
  });

  it("❌ Should return 404 if user does not exist", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/users/${nonExistentUserId}/following`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  /**
   * 🔺 Edge Test Cases
   */
  it("🔺 Should handle pagination gracefully when requesting a high page number", async () => {
    const response = await request(app)
      .get(`/api/users/${user1._id}/following?page=100`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.following.length).toBe(0);
  });
});

/**
 * @afterAll - Cleanup database & close connection
 */
afterAll(async () => {
    try {
        await User.deleteMany({});
        await Follower.deleteMany({});
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
