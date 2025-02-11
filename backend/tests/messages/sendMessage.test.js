/**
 * @fileoverview E2E Tests for /api/messages/send
 * @module tests/messages.test.js
 */

import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../../models/User.js";
import Message from "../../models/Message.js";
import jwt from "jsonwebtoken";

let sender, receiver, senderToken;
let mongoServer;

beforeAll(async () => {
    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {});
});

beforeEach(async () => {
  await Message.deleteMany({});
  await User.deleteMany({});

  // Create test users
  sender = await User.create({ name: "Sender", email: "sender@example.com", password: "Test@1234" });
  receiver = await User.create({ name: "Receiver", email: "receiver@example.com", password: "Test@1234" });

  senderToken = jwt.sign({ id: sender._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
});

describe("POST /api/messages/send", () => {
  it("✅ Should send a message successfully", async () => {
    const response = await request(app)
      .post("/api/messages/send")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({ receiverId: receiver._id.toString(), content: "Hello!" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "Message sent successfully");
    expect(response.body.data.content).toBe("Hello!");
  });

  it("✅ Should send a long message (within limits)", async () => {
    const longMessage = "A".repeat(500);
    const response = await request(app).post("/api/messages/send")      
    .set("Authorization", `Bearer ${senderToken}`)
    .send({ receiverId: receiver._id.toString(), content: longMessage });

    expect(response.status).toBe(201);
  });

  it("✅ Should send message with emojis", async () => {
    const response = await request(app).post("/api/messages/send")
    .set("Authorization", `Bearer ${senderToken}`)
    .send({ receiverId: receiver._id.toString(), content: "Hello 😊🔥🚀" });

    expect(response.status).toBe(201);
  });

  it("✅ Should send message with special characters", async () => {
    const response = await request(app).post("/api/messages/send")
    .set("Authorization", `Bearer ${senderToken}`)
    .send({ receiverId: receiver._id.toString(), content: "@#$%^&*()!" });

    expect(response.status).toBe(201);
  });

  it("✅ Should send message in different languages", async () => {
    const response = await request(app).post("/api/messages/send")
    .set("Authorization", `Bearer ${senderToken}`)
    .send({ receiverId: receiver._id.toString(), content: "مرحبا你好こんにちは" });

    expect(response.status).toBe(201);
  });

  it("❌ Should not send a longer message than 500 characters", async () => {
    const longMessage = "A".repeat(501);
    const response = await request(app).post("/api/messages/send")      
    .set("Authorization", `Bearer ${senderToken}`)
    .send({ receiverId: receiver._id.toString(), content: longMessage });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Message exceeds maximum length");
  });


  it("❌ Should fail when receiver is missing", async () => {
    const response = await request(app)
      .post("/api/messages/send")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({ content: "Hello!" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Receiver and content are required");
  });

  it("❌ Should fail when content is empty", async () => {
    const response = await request(app)
      .post("/api/messages/send")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({ receiverId: receiver._id.toString(), content: "  " });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Receiver and content are required");
  });

  it("❌ Should fail if receiver does not exist", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post("/api/messages/send")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({ receiverId: nonExistentUserId.toString(), content: "Hello!" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Receiver not found");
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Message.deleteMany({});
  await mongoose.connection.close();
  await mongoServer.stop();
});
