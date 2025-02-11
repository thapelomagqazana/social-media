import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import Post from "../../models/Post.js";
import User from "../../models/User.js";

dotenv.config();

let user1, mongoServer;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});



beforeEach(async () => {
  // Ensure the database is clean before inserting new users & posts
  await User.deleteMany({});
  await Post.deleteMany({});

  // Create users
  user1 = await User.create({ name: "User One", email: "user1@example.com", password: "Test1234@", role: "user" });

  await Post.create([
    { user: user1._id, content: "AI is the future! #tech", hashtags: ["tech"] },
    { user: user1._id, content: "Technology updates #tech", hashtags: ["tech"] },
    { user: user1._id, content: "AI revolution #ai", hashtags: ["ai"] },
    { user: user1._id, content: "Blockchain in finance #web3", hashtags: ["web3"] },
    { user: user1._id, content: "Deep learning #machine_learning", hashtags: ["machine_learning"] },
    { user: user1._id, content: "Python 3 is amazing! #python3", hashtags: ["python3"] },
    { user: user1._id, content: "Rocket science is exciting! #🚀Launch", hashtags: ["🚀launch"] },
  ]);
});

describe("GET /api/posts/hashtag/:tag", () => {
  /** ✅ Positive Test Cases */
  it("✅ Should return multiple posts with the hashtag #tech", async () => {
    const response = await request(app).get("/api/posts/hashtag/tech");
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(1);
  });

  it("✅ Should return a single post with the hashtag #ai", async () => {
    const response = await request(app).get("/api/posts/hashtag/ai");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
  });

  it("✅ Should handle case insensitivity (fetch #Tech as #tech)", async () => {
    const response = await request(app).get("/api/posts/hashtag/Tech");
    expect(response.status).toBe(200);
  });

  it("✅ Should return posts with hashtag containing numbers (#web3)", async () => {
    const response = await request(app).get("/api/posts/hashtag/web3");
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("✅ Should return posts with hashtag containing underscores (#machine_learning)", async () => {
    const response = await request(app).get("/api/posts/hashtag/machine_learning");
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  /** ❌ Negative Test Cases */
  it("❌ Should return 404 for a non-existent hashtag", async () => {
    const response = await request(app).get("/api/posts/hashtag/unknownTag");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "No posts found with this hashtag");
  });

  it("❌ Should return 400 for hashtag containing spaces (#artificial intelligence)", async () => {
    const response = await request(app).get("/api/posts/hashtag/artificial intelligence");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid hashtag format");
  });

  it("❌ Should return 400 for hashtag containing special characters (#weird!@#$%^&*)", async () => {
    const response = await request(app).get("/api/posts/hashtag/weird!@#$%^&*");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid hashtag format");
  });

  it("❌ Should return 400 for hashtag with less than two characters (#a)", async () => {
    const response = await request(app).get("/api/posts/hashtag/a");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid hashtag");
  });

  // it("❌ Should return 404 if no hashtag parameter is provided", async () => {
  //   const response = await request(app).get("/api/posts/hashtag/");
  //   console.log(response.body.message);
  //   expect(response.status).toBe(400);
  // });

  /** 🔹 Edge Cases */
  it("🔹 Should return 400 for a very long hashtag (>255 characters)", async () => {
    const longHashtag = "a".repeat(256);
    const response = await request(app).get(`/api/posts/hashtag/${longHashtag}`);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Hashtag is too long");
  });

  it("🔹 Should return 200 for a hashtag in a different language (#テクノロジー)", async () => {
    await Post.create({ user: user1._id, content: "Japanese tech news #テクノロジー", hashtags: ["テクノロジー"] });
    const response = await request(app).get("/api/posts/hashtag/テクノロジー");
    expect(response.status).toBe(200);
  });

  it("🔹 Should return 200 for fetching hashtags that contain emoji (#🚀Launch)", async () => {
    const response = await request(app).get("/api/posts/hashtag/🚀Launch");
    expect(response.status).toBe(200);
  });

  it("🔹 Should return 200 for hashtags with mixed letters and numbers (#python3)", async () => {
    const response = await request(app).get("/api/posts/hashtag/python3");
    expect(response.status).toBe(200);
  });

  /** 🔺 Corner Cases */
  it("🔺 Should return 404 if database is empty", async () => {
    await Post.deleteMany({});
    const response = await request(app).get("/api/posts/hashtag/tech");
    expect(response.status).toBe(404);
  });

  it("🔺 Should handle multiple requests concurrently without issues", async () => {
    const responses = await Promise.all([
      request(app).get("/api/posts/hashtag/tech"),
      request(app).get("/api/posts/hashtag/web3"),
      request(app).get("/api/posts/hashtag/python3"),
    ]);
    responses.forEach((res) => expect(res.status).toBe(200));
  });

  // it("🔺 Should return 500 if database connection is lost", async () => {
  //   await mongoose.connection.close();
  //   const response = await request(app).get("/api/posts/hashtag/tech");
  //   console.log(response.body.message);
  //   expect(response.status).toBe(500);
  //   expect(response.body).toHaveProperty("message", "Database connection lost");
  // });
});

afterEach(async () => {
    await Post.deleteMany({});
    await User.deleteMany({});
});
  
afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});
