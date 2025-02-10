/**
 * @fileoverview Tests for the user unfollow endpoint (/api/users/:userId/unfollow)
 * @description Ensures users can unfollow properly and handles errors correctly.
 */

import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import User from "../../models/User.js";
import Follower from "../../models/Follower.js";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config();

let mongoServer;
let user1, user2, user3;
let user1Token, user2Token, user3Token;

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
    user3 = await User.create({ name: "User Three", email: "user3@example.com", password: "Test1234@", role: "user" });
  
    // User1 follows User2 (This should exist before testing unfollow)
    await Follower.create({ follower: user1._id, following: user2._id });
  
    // Increase follow counts (Must match database state)
    await User.findByIdAndUpdate(user1._id, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(user2._id, { $inc: { followerCount: 1 } });
  
    // Generate JWT tokens
    user1Token = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    user2Token = jwt.sign({ id: user2._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    user3Token = jwt.sign({ id: user3._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
});
  

/**
 * ✅ Test: User unfollows another user successfully
 */
it("✅ Should allow a user to unfollow another user", async () => {
  await Follower.create({ follower: user2._id, following: user1._id });
  const response = await request(app)
    .post(`/api/users/${user2._id}/unfollow`)
    .set("Authorization", `Bearer ${user1Token}`);
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Successfully unfollowed user");

  // Verify user1 is no longer following user2
  const updatedUser1 = await User.findById(user1._id);
  expect(updatedUser1.followingCount).toBe(0);

});

/**
 * ❌ Test: User tries to unfollow themselves
 */
it("❌ Should not allow a user to unfollow themselves", async () => {
  const response = await request(app)
    .post(`/api/users/${user1._id}/unfollow`)
    .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "You cannot unfollow yourself");
});

/**
 * ❌ Test: User tries to unfollow someone they aren't following
 */
it("❌ Should not allow a user to unfollow someone they aren't following", async () => {
  const response = await request(app)
    .post(`/api/users/${user3._id}/unfollow`) // User1 is not following User3
    .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "You are not following this user");
});

/**
 * ❌ Test: Trying to unfollow a non-existent user
 */
it("❌ Should return 404 if the target user does not exist", async () => {
  const nonExistentUserId = new mongoose.Types.ObjectId();
  const response = await request(app)
    .post(`/api/users/${nonExistentUserId}/unfollow`)
    .set("Authorization", `Bearer ${user1Token}`);

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty("message", "User not found");
});

/**
 * @afterAll Cleanup database and close connections
 */
afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
  await mongoServer.stop();
});
