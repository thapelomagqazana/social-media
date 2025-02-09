import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../../models/User.js";
import Follower from "../../models/Follower.js";
import jwt from "jsonwebtoken";
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
  user1 = await User.create({ name: "User One", email: "user1@example.com", password: "Test@1234" });
  user2 = await User.create({ name: "User Two", email: "user2@example.com", password: "Test@1234" });
  user3 = await User.create({ name: "User Three", email: "user3@example.com", password: "Test@1234" });

  // Create follow relationships
  await Follower.create({ follower: user2._id, following: user1._id });
  await Follower.create({ follower: user3._id, following: user1._id });

  // Generate JWT token for user1
  userToken = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
});

/**
 * @group GET /api/users/:userId/followers - Retrieve Followers
 */
describe("GET /api/users/:userId/followers - Retrieve Followers", () => {
  /**
   * ✅ Positive Test Cases
   */
  it("✅ Should return a list of followers for a valid user", async () => {
    const response = await request(app)
      .get(`/api/users/${user1._id}/followers`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("followers");
    expect(response.body.followers.length).toBe(2);
  });

  it("✅ Should return an empty list for a user with no followers", async () => {
    const response = await request(app)
      .get(`/api/users/${user3._id}/followers`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.followers.length).toBe(0);
  });

  it("✅ Should paginate results correctly (limit=1)", async () => {
    const response = await request(app)
      .get(`/api/users/${user1._id}/followers?limit=1`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.followers.length).toBe(1);
  });

  /**
   * ❌ Negative Test Cases
   */
  it("❌ Should return 400 for an invalid user ID format", async () => {
    const response = await request(app)
      .get("/api/users/invalidID/followers")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid user ID");
  });

  it("❌ Should return 404 if user does not exist", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/users/${nonExistentUserId}/followers`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  it("❌ Should return 401 if no authentication token is provided", async () => {
    const response = await request(app).get(`/api/users/${user1._id}/followers`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Not authorized, no token provided");
  });

  it("❌ Should return 401 for an invalid token", async () => {
    const response = await request(app)
      .get(`/api/users/${user1._id}/followers`)
      .set("Authorization", "Bearer invalidtoken");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid token, authentication failed");
  });

  /**
   * 🔺 Edge Test Cases
   */
  it("🔺 Should handle pagination gracefully when requesting a high page number", async () => {
    const response = await request(app)
      .get(`/api/users/${user1._id}/followers?page=100`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.followers.length).toBe(0);
  });

  it("🔺 Should return all followers when limit is very high", async () => {
    const response = await request(app)
      .get(`/api/users/${user1._id}/followers?limit=1000`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.followers.length).toBe(2);
  });
});

/**
 * @afterAll - Cleanup database & close connection
 */
afterAll(async () => {
  await User.deleteMany({});
  await Follower.deleteMany({});
  await mongoose.connection.close();
  await mongoServer.stop();
});
