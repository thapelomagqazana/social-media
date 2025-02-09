import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import redisClient from "../../config/redisClient.js";

let mongoServer, adminToken, userToken, otherUserToken, userId, otherUserId, avatarUserId;
let invalidToken = "invalidToken123";

/**
 * @beforeAll - Setup in-memory MongoDB & users
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });

  await User.deleteMany({});

  // Create test users
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "Test@123",
  });

  const admin = await User.create({
    name: "Test Admin",
    email: "testadmin@example.com",
    password: "Test@123",
    role: "admin"
  });

  const otherUser = await User.create({
    name: "Other User",
    email: "other@example.com",
    password: "Other@123",
  });

  const avatarUser = await User.create({
    name: "Avatar User",
    email: "avatar@example.com",
    password: "Avatar@123",
    avatar: "https://example.com/avatar.png",
  });

  userId = user._id;
  otherUserId = otherUser._id;
  avatarUserId = avatarUser._id;

  // Generate JWT tokens
  adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
  userToken = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  otherUserToken = jwt.sign({ id: otherUser._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Flush Redis before testing
  await redisClient.flushall();
});

/**
 * ✅ Positive Test Cases
 */
describe("GET /api/users/:userId - Retrieve User Details", () => {
  it("✅ Retrieve an existing user", async () => {
    const response = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("name", "Test User");
  });

  it("✅ Retrieve own profile", async () => {
    const response = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("email", "test@example.com");
  });

  it("✅ Retrieve another user's profile (if allowed)", async () => {
    const response = await request(app)
      .get(`/api/users/${otherUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("email", "other@example.com");
  });

  it("✅ Cached response retrieval (first fetch from DB, second from cache)", async () => {
    // First request - should fetch from DB
    await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`);

    // Second request - should fetch from cache
    const response = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("name", "Test User");
  });

  it("✅ User profile with avatar", async () => {
    const response = await request(app)
      .get(`/api/users/${avatarUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("avatar", "https://example.com/avatar.png");
  });
});

/**
 * ❌ Negative Test Cases
 */
describe("GET /api/users/:userId - Negative Cases", () => {
  it("❌ Should fail when no authentication token is provided", async () => {
    const response = await request(app).get(`/api/users/${userId}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Not authorized, no token provided");
  });

  it("❌ Should fail when using an invalid token", async () => {
    const response = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", "Bearer invalidtoken");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token, authentication failed");
  });

  it("❌ Should return 404 when user does not exist", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/users/${nonExistentUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "User not found");
  });

  /**
   * ❌ Negative Test Cases (Invalid Inputs)
   */
  it("❌ Should fail when no authentication token is provided", async () => {
    const response = await request(app).get(`/api/users/${userId}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Not authorized, no token provided");
  });

  it("❌ Should fail when using an invalid authentication token", async () => {
    const response = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${invalidToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token, authentication failed");
  });


  it("❌ Should reject SQL injection attempt in user ID", async () => {
    const response = await request(app)
      .get(`/api/users/' OR 1=1 --`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid user ID format");
  });

  // it("❌ Should reject XSS attack attempt in user ID", async () => {
  //   const response = await request(app)
  //     .get(`/api/users/<script>alert(1)</script>`)
  //     .set("Authorization", `Bearer ${adminToken}`);

  //   expect(response.status).toBe(400);
  //   expect(response.body).toHaveProperty("message", "Invalid user ID format");
  // });

  it("❌ Should return 403 when a non-admin tries to access another user's profile (if restricted)", async () => {
    const response = await request(app)
      .get(`/api/users/${otherUserId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Access denied");
  });

  it("❌ Should fail when user ID format is invalid", async () => {
    const response = await request(app)
      .get("/api/users/123abc")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid user ID format");
  });
});

/**
 * 🔹 Edge & Corner Test Cases
 */
describe("GET /api/users/:userId - Edge & Corner Cases", () => {
  
  it("🔹 Should return user details even if some optional fields are missing", async () => {
    await User.findByIdAndUpdate(userId, { avatar: null });
  
    const response = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`);
  
    expect(response.status).toBe(200);
  });
  
  // it("🔹 Should handle large-scale user retrieval requests efficiently", async () => {
  //   for (let i = 0; i < 1000; i++) {
  //     await User.create({
  //       name: `User ${i}`,
  //       email: `user${i}@example.com`,
  //       password: "Password@123",
  //     });
  //   }

  //   const response = await request(app)
  //     .get(`/api/users/${userId}`)
  //     .set("Authorization", `Bearer ${adminToken}`);

  //   expect(response.status).toBe(200);
  // });

  // it("🔹 Should remain responsive under high server load (1000+ requests)", async () => {
  //   const requests = [];
  //   for (let i = 0; i < 1000; i++) {
  //     requests.push(
  //       request(app)
  //         .get(`/api/users/${userId}`)
  //         .set("Authorization", `Bearer ${adminToken}`)
  //     );
  //   }

  //   const responses = await Promise.all(requests);
  //   responses.forEach(response => {
  //     expect(response.status).toBe(200);
  //   });
  // });
});

/**
 * @afterAll - Close database connection
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
