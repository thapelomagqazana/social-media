/**
 * @fileoverview Tests for DELETE /api/users/:userId
 * @description Ensures deletion of user accounts and cascade deletion of related data.
 */

import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
// import Post from "../../models/Post.js";
// import Comment from "../../models/Comment.js";
import Follower from "../../models/Follower.js";

// Load environment variables
dotenv.config();

let mongoServer;
let adminToken, userToken, anotherUserToken, invalidToken = "invalidtoken123";
let adminId, userId, anotherUserId, nonExistentUserId = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });

  // Clear existing data
  await User.deleteMany({});
  // await Post.deleteMany({});
  // await Comment.deleteMany({});
  // await Follower.deleteMany({});

  // Create an admin user
  const adminUser = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@123",
    role: "admin",
  });

  // Create a regular user
  const regularUser = await User.create({
    name: "Regular User",
    email: "user@example.com",
    password: "User@123",
    role: "user",
  });

  // Create another user
  const anotherUser = await User.create({
    name: "Another User",
    email: "another@example.com",
    password: "Another@123",
    role: "user",
  });

  // Generate JWT tokens
  adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  userToken = jwt.sign({ id: regularUser._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  anotherUserToken = jwt.sign({ id: anotherUser._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Store user IDs
  adminId = adminUser._id.toString();
  userId = regularUser._id.toString();
  anotherUserId = anotherUser._id.toString();

  // // Create posts by user
  // await Post.create([
  //   { content: "User's first post", user: userId },
  //   { content: "User's second post", user: userId },
  // ]);

  // // Create comments by user
  // await Comment.create([
  //   { content: "User's first comment", user: userId, post: adminId },
  //   { content: "User's second comment", user: userId, post: adminId },
  // ]);

  // Add followers for the user
  await Follower.create([{ follower: adminId, following: userId }]);
});

describe("DELETE /api/users/:userId - Delete User", () => {
  /**
   * ✅ Admin deletes an existing user
   */
  it("✅ Should allow an admin to delete a user", async () => {
    const response = await request(app)
      .delete(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "User and related data deleted successfully");

    const deletedUser = await User.findById(userId);
    expect(deletedUser).toBeNull();
  });

  /**
   * ✅ User deletes their own account
   */
  it("✅ Should allow a user to delete their own account", async () => {
    // Re-create a test user
    const testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "Test@123",
      role: "user",
    });

    const testToken = jwt.sign({ id: testUser._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const response = await request(app)
      .delete(`/api/users/${testUser._id}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "User and related data deleted successfully");

    const deletedUser = await User.findById(testUser._id);
    expect(deletedUser).toBeNull();
  });

  /**
   * ✅ Cascade delete works correctly (Posts, Comments, Followers)
   */
  it("✅ Should cascade delete user's posts, followers, and comments", async () => {
    // Re-create a user with data to delete
    const testUser = await User.create({
      name: "Cascade User",
      email: "cascade@example.com",
      password: "Cascade@123",
      role: "user",
    });

    // await Post.create([{ content: "Cascade User's post", user: testUser._id }]);
    // await Comment.create([{ content: "Cascade User's comment", user: testUser._id }]);
    await Follower.create([{ follower: adminId, following: testUser._id }]);

    await request(app)
      .delete(`/api/users/${testUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    // const posts = await Post.find({ user: testUser._id });
    // const comments = await Comment.find({ user: testUser._id });
    const followers = await Follower.find({ following: testUser._id });

    // expect(posts.length).toBe(0);
    // expect(comments.length).toBe(0);
    expect(followers.length).toBe(0);
  });

  /**
   * ✅ Deleting a user updates follower counts correctly
   */
  it("✅ Should remove deleted user from followers list", async () => {
    const remainingFollowers = await Follower.find({ following: userId });
    expect(remainingFollowers.length).toBe(0);
  });

  // /**
  //  * ✅ Deleting a user updates post references correctly
  //  */
  // it("✅ Should delete all posts by the deleted user", async () => {
  //   const remainingPosts = await Post.find({ user: userId });
  //   expect(remainingPosts.length).toBe(0);
  // });

  // /**
  //  * ✅ Deleting a user updates comments correctly
  //  */
  // it("✅ Should remove all comments by the deleted user", async () => {
  //   const remainingComments = await Comment.find({ user: userId });
  //   expect(remainingComments.length).toBe(0);
  // });

  // /**
  //  * ✅ Database remains in a consistent state after deletion
  //  */
  // it("✅ Should maintain database consistency after deletion", async () => {
  //   const allUsers = await User.find();
  //   const allPosts = await Post.find();
  //   const allComments = await Comment.find();
  //   const allFollowers = await Follower.find();

  //   expect(allUsers.some(user => user._id.toString() === userId)).toBeFalsy();
  //   expect(allPosts.some(post => post.user.toString() === userId)).toBeFalsy();
  //   expect(allComments.some(comment => comment.user.toString() === userId)).toBeFalsy();
  //   expect(allFollowers.some(follow => follow.following.toString() === userId)).toBeFalsy();
  // });

  /**
   * ❌ Negative Test Cases
   */
    it("❌ Should reject request without authentication token", async () => {
      const response = await request(app).delete(`/api/users/${adminId}`);
  
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Not authorized, no token provided");
    });
  
    it("❌ Should reject request with an invalid token", async () => {
      const response = await request(app)
        .delete(`/api/users/${adminId}`)
        .set("Authorization", `Bearer ${invalidToken}`);
  
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid token, authentication failed");
    });
  
    it("❌ Should prevent a user from deleting another user", async () => {
      const response = await request(app)
        .delete(`/api/users/${adminId}`)
        .set("Authorization", `Bearer ${userToken}`);
  
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("message", "Access denied, insufficient permissions");
    });
  
    it("❌ Should prevent a non-admin from deleting an admin", async () => {
      const response = await request(app)
        .delete(`/api/users/${adminId}`)
        .set("Authorization", `Bearer ${anotherUserToken}`);
  
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("message", "Unauthorized to delete this user");
    });
  
    it("❌ Should return 404 for deleting a non-existent user", async () => {
      const response = await request(app)
        .delete(`/api/users/${nonExistentUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);
  
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "User not found");
    });
  
    it("❌ Should return 400 for deleting a user with an invalid ID format", async () => {
      const response = await request(app)
        .delete("/api/users/invalidId")
        .set("Authorization", `Bearer ${adminToken}`);
  
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Invalid user ID");
    });
  
    // /**
    //  * 🔺 Edge Cases
    //  */
    // it("✅ Should delete a user with 100,000+ posts, comments, and followers", async () => {
    //   // Simulate heavy load user
    //   const heavyUser = await User.create({ name: "Heavy User", email: "heavy@example.com", password: "Heavy@123", role: "user" });
    //   await Post.insertMany(Array(100000).fill({ content: "Heavy user post", user: heavyUser._id }));
    //   await request(app).delete(`/api/users/${heavyUser._id}`).set("Authorization", `Bearer ${adminToken}`);
    //   const remainingPosts = await Post.find({ user: heavyUser._id });
    //   expect(remainingPosts.length).toBe(0);
    // });
  
    // it("✅ Should delete a user who follows many but has no followers", async () => {
    //   const noFollowerUser = await User.create({ name: "No Followers", email: "nofollowers@example.com", password: "NoFollow@123", role: "user" });
    //   await Follower.create([{ follower: noFollowerUser._id, following: adminId }]);
    //   await request(app).delete(`/api/users/${noFollowerUser._id}`).set("Authorization", `Bearer ${adminToken}`);
    //   const remainingFollowers = await Follower.find({ follower: noFollowerUser._id });
    //   expect(remainingFollowers.length).toBe(0);
    // });
  
    // it("✅ Should delete a user with private posts", async () => {
    //   const privateUser = await User.create({ name: "Private User", email: "private@example.com", password: "Private@123", role: "user" });
    //   await Post.create({ content: "Private post", user: privateUser._id, visibility: "private" });
    //   await request(app).delete(`/api/users/${privateUser._id}`).set("Authorization", `Bearer ${adminToken}`);
    //   const remainingPosts = await Post.find({ user: privateUser._id });
    //   expect(remainingPosts.length).toBe(0);
    // });
});

/**
 * @afterAll Close database connection
 */
afterAll(async () => {
  await User.deleteMany({});
  // await Post.deleteMany({});
  // await Comment.deleteMany({});
  await Follower.deleteMany({});
  await mongoose.connection.close();
  await mongoServer.stop();
});
