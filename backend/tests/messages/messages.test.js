import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import User from "../../models/User.js";
import Message from "../../models/Message.js";
import jwt from "jsonwebtoken";

let user1, user2, authToken, authToken2;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});
  await Message.deleteMany({});

  // Create users
  user1 = await User.create({ name: "John Doe", email: "john@example.com", password: "Password@123" });
  user2 = await User.create({ name: "Jane Smith", email: "jane@example.com", password: "Password@123" });

  // Simulating login and getting auth token
  authToken = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  authToken2 = jwt.sign({ id: user2._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Creating test messages
  await Message.create([
    { senderId: user1._id, receiverId: user2._id, content: "Hello, how are you?" },
    { senderId: user2._id, receiverId: user1._id, content: "I'm good, thanks!" },
    { senderId: user1._id, receiverId: user2._id, content: "😊🔥🚀" },
    { senderId: user2._id, receiverId: user1._id, content: "@#$%^&*()" },
    { senderId: user1._id, receiverId: user2._id, content: "こんにちは (Hello in Japanese)" },
    { senderId: user1._id, receiverId: user2._id, content: "A".repeat(500) },
  ]);
});

describe("GET /api/messages", () => {
  /** ✅ Positive Test Cases */
  it("✅ Should fetch messages between two users", async () => {
    const response = await request(app)
      .get(`/api/messages?receiverId=${user2._id}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("✅ Should fetch messages with pagination (first page, default limit)", async () => {
    const response = await request(app)
      .get(`/api/messages?receiverId=${user2._id}&page=1`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeLessThanOrEqual(20);
  });

  it("✅ Should fetch messages with pagination (custom limit: 10 messages)", async () => {
    const response = await request(app)
      .get(`/api/messages?&receiverId=${user2._id}&page=1&limit=10`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeLessThanOrEqual(10);
  });

//   it("✅ Should fetch most recent messages first", async () => {
//     const response = await request(app)
//       .get(`/api/messages?receiverId=${user2._id}`)
//       .set("Authorization", `Bearer ${authToken}`);
  
//     expect(response.status).toBe(200);
//     const messages = response.body;
  
//     for (let i = 1; i < messages.length; i++) {
//       expect(new Date(messages[i - 1].createdAt).getTime()).toBeGreaterThan(
//         new Date(messages[i].createdAt).getTime()
//       );
//     }
//   });
  

  it("✅ Should fetch messages with text & emojis", async () => {
    const response = await request(app)
      .get(`/api/messages?receiverId=${user2._id}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.some((msg) => msg.content.includes("😊🔥🚀"))).toBe(true);
  });

  it("✅ Should fetch messages with special characters", async () => {
    const response = await request(app)
      .get(`/api/messages?receiverId=${user2._id}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.some((msg) => msg.content.includes("@#$%^&*()"))).toBe(true);
  });

  it("✅ Should fetch messages in different languages", async () => {
    const response = await request(app)
      .get(`/api/messages?receiverId=${user2._id}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.some((msg) => msg.content.includes("こんにちは"))).toBe(true);
  });

  it("❌ Should return 404 for empty message list (new chat)", async () => {
    const response = await request(app)
      .get(`/api/messages?receiverId=${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No messages found");
  });

  it("❌ Should return 400 when receiverId is missing", async () => {
    const response = await request(app).get(`/api/messages`).set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Receiver ID is required");
  });

  it("❌ Should return 401 when authentication token is missing", async () => {
    const response = await request(app).get(`/api/messages?receiverId=${user2._id}`);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Not authorized, no token provided");
  });

//   it("❌ Should return 403 when unauthorized user tries to access messages", async () => {
//     const response = await request(app)
//       .get(`/api/messages?receiverId=${user2._id}`)
//       .set("Authorization", `Bearer ${authToken2}`);
//     console.log(response.body.message);
//     expect(response.status).toBe(403);
//     expect(response.body.message).toBe("You do not have permission to view these messages");
//   });

  it("🔹 Should fetch messages with sender and receiver reversed", async () => {
    const response = await request(app)
      .get(`/api/messages?receiverId=${user1._id}`)
      .set("Authorization", `Bearer ${authToken2}`);
    expect(response.status).toBe(200);
  });

//   it("🔺 Should return 500 if database connection is lost", async () => {
//     await mongoose.connection.close();
//     const response = await request(app)
//       .get(`/api/messages?senderId=${user1._id}&receiverId=${user2._id}`)
//       .set("Authorization", `Bearer ${authToken}`);
//     expect(response.status).toBe(500);
//     expect(response.body.message).toBe("Database connection lost");
//   });
});

afterAll(async () => {
  await mongoose.connection.close();
});
