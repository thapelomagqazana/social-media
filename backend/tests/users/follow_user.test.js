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
let user1, user2;
let userToken;

/**
 * @beforeAll - Setup test database and create sample users
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });

  // Create test users
  user1 = await User.create({ name: "User One", email: "user1@example.com", password: "Test1234@", followerCount: 0, followingCount: 0 });
  user2 = await User.create({ name: "User Two", email: "user2@example.com", password: "Test1234@", followerCount: 0, followingCount: 0 });

  // Generate JWT token for user1
  userToken = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Flush Redis cache
  await redisClient.flushall();
});

/**
 * @group POST /api/users/:userId/follow - Follow a User
 */
describe("POST /api/users/:userId/follow - Follow a User", () => {
  /**
   * ✅ Positive Test Cases
   */
  it("✅ Should allow a user to follow another user", async () => {
    const response = await request(app)
      .post(`/api/users/${user2._id}/follow`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Successfully followed user");
  });

  it("✅ Should increase the follower and following count correctly", async () => {
    const updatedUser1 = await User.findById(user1._id);
    const updatedUser2 = await User.findById(user2._id);

    expect(updatedUser1.followingCount).toBe(1);
    expect(updatedUser2.followerCount).toBe(1);
  });

  /**
   * ❌ Negative Test Cases
   */
  it("❌ Should not allow following the same user twice", async () => {
    const response = await request(app)
      .post(`/api/users/${user2._id}/follow`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Already following this user");
  });

  it("❌ Should not allow a user to follow themselves", async () => {
    const response = await request(app)
      .post(`/api/users/${user1._id}/follow`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("You cannot follow yourself");
  });

  it("❌ Should return 400 for an invalid user ID format", async () => {
    const response = await request(app)
      .post("/api/users/invalidID/follow")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid user ID");
  });

  it("❌ Should return 404 if the user to follow does not exist", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post(`/api/users/${nonExistentUserId}/follow`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  /**
   * 🔺 Edge Test Cases
   */
  it("🔺 Should handle a high volume of follow requests concurrently", async () => {
    const followRequests = Array.from({ length: 100 }, () =>
      request(app).post(`/api/users/${user2._id}/follow`).set("Authorization", `Bearer ${userToken}`)
    );
    const responses = await Promise.all(followRequests);
    
    responses.forEach(response => expect([200, 400]).toContain(response.status));
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
