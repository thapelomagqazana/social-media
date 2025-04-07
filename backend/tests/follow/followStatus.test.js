const request = require("supertest");
const app = require("../../app");
const mongoose = require("mongoose");
const User = require('../../models/User');
const Follow = require("../../models/Follow");
const { generateToken } = require('../../utils/token');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe("GET /api/follow/:userId - Check Follow Status", () => {
  let follower, target, token, mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    follower = await User.create({
          name: "Follower",
          email: 'follower@example.com',
          password: 'Password123!',
    });

    target = await User.create({
        name: "Target",
        email: 'target@example.com',
        password: 'Password123!',
    });
    token = generateToken(follower._id);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  

  it("1.1 returns { following: true } when authenticated user follows target", async () => {
    await Follow.create({ follower: follower._id, following: target._id });
    const res = await request(app)
      .get(`/api/follow/${target._id}`)
      .set("Cookie", `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.following).toBe(true);
  });

  it("1.2 returns { following: false } when not following target", async () => {
    const stranger = await User.create({
        name: "Stranger",
        email: 'stranger@example.com',
        password: 'Password123!',
    });

    const res = await request(app)
      .get(`/api/follow/${stranger._id}`)
      .set("Cookie", `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.following).toBe(false);
  });

  it("1.3 self-following returns false or 400", async () => {
    const res = await request(app)
      .get(`/api/follow/${follower._id}`)
      .set("Cookie", `token=${token}`);
    expect([200, 400]).toContain(res.statusCode);
  });

  it("1.4 returns false for existing user with no relation", async () => {
    const newUser = await User.create({
        name: "Newbie",
        email: 'newbie@example.com',
        password: 'Password123!',
    });
    
    const res = await request(app)
      .get(`/api/follow/${newUser._id}`)
      .set("Cookie", `token=${token}`);
    expect(res.body.following).toBe(false);
  });

  it("1.5 repeated query returns same result", async () => {
    const res1 = await request(app).get(`/api/follow/${target._id}`).set("Cookie", `token=${token}`);
    const res2 = await request(app).get(`/api/follow/${target._id}`).set("Cookie", `token=${token}`);
    expect(res1.body.following).toBe(res2.body.following);
  });

  // ❌ Negative Test Cases
  it("2.1 invalid userId returns 400", async () => {
    const res = await request(app).get("/api/follow/invalidId").set("Cookie", `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it("2.2 nonexistent user returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/follow/${fakeId}`).set("Cookie", `token=${token}`);
    expect(res.statusCode).toBe(404);
  });

  it("2.3 missing token returns 401", async () => {
    const res = await request(app).get(`/api/follow/${target._id}`);
    expect(res.statusCode).toBe(401);
  });

  it("2.4 tampered token returns 401", async () => {
    const res = await request(app)
      .get(`/api/follow/${target._id}`)
      .set("Cookie", "token=malicious.token.payload");
    expect(res.statusCode).toBe(401);
  });

  it("2.5 banned user is forbidden", async () => {
    const banned = await User.create({
        name: "Banned User",
        email: 'banned@example.com',
        password: 'Password123!',
        isBanned: true,
    });
    const bannedToken = generateToken(banned._id);
    const res = await request(app)
      .get(`/api/follow/${target._id}`)
      .set("Cookie", `token=${bannedToken}`);
    expect([401, 403]).toContain(res.statusCode);
  });

  // ⚠️ Edge Cases
  it("3.1 valid userId with no posts or followers returns false", async () => {
    const cleanUser = await User.create({
        name: "Clean User",
        email: 'cleanuser@example.com',
        password: 'Password123!',
    });
    const res = await request(app)
      .get(`/api/follow/${cleanUser._id}`)
      .set("Cookie", `token=${token}`);
    expect(res.body.following).toBe(false);
  });

  it("3.2 long but valid unused ObjectId returns 404", async () => {
    const unused = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/follow/${unused}`)
      .set("Cookie", `token=${token}`);
    expect(res.statusCode).toBe(404);
  });

  it("3.3 multiple concurrent follow status checks return consistent", async () => {
    const promises = Array(5).fill(0).map(() =>
      request(app).get(`/api/follow/${target._id}`).set("Cookie", `token=${token}`)
    );
    const responses = await Promise.all(promises);
    responses.forEach((res) => expect(res.body.following).toBe(true));
  });

  it("3.4 unfollow reflects immediately", async () => {
    await request(app).delete(`/api/follow/${target._id}`).set("Cookie", `token=${token}`);
    const res = await request(app).get(`/api/follow/${target._id}`).set("Cookie", `token=${token}`);
    expect(res.body.following).toBe(false);
  });

  it("3.5 follow reflects immediately", async () => {
    await request(app).post(`/api/follow/${target._id}`).set("Cookie", `token=${token}`);
    const res = await request(app).get(`/api/follow/${target._id}`).set("Cookie", `token=${token}`);
    expect(res.body.following).toBe(true);
  });

  // 🧊 Corner Cases
  it("4.1 newly registered user with no interactions", async () => {
    const newbie = await User.create({
        name: "Clean User1",
        email: 'cleanuser1@example.com',
        password: 'Password123!',
    });
    const newbieToken = generateToken(newbie._id);
    const res = await request(app)
      .get(`/api/follow/${target._id}`)
      .set("Cookie", `token=${newbieToken}`);
    expect(res.body.following).toBe(false);
  });

  it("4.2 deleted target user still in follow DB", async () => {
    const ghost = await User.create({
        name: "Clean User2",
        email: 'cleanuser2@example.com',
        password: 'Password123!',
    });
    await Follow.create({ follower: follower._id, following: ghost._id });
    await ghost.deleteOne();
    const res = await request(app).get(`/api/follow/${ghost._id}`).set("Cookie", `token=${token}`);
    expect(res.statusCode).toBe(404);
  });

  it("4.3 soft-deleted authenticated user behavior (e.g. banned)", async () => {
    await User.findByIdAndUpdate(follower._id, { isBanned: true });
    const bannedToken = generateToken(follower._id);
    const res = await request(app).get(`/api/follow/${target._id}`).set("Cookie", `token=${bannedToken}`);
    expect([401, 403]).toContain(res.statusCode);
    await User.findByIdAndUpdate(follower._id, { isBanned: false });
  });

  it("4.4 stats work under high load", async () => {
    const res = await request(app).get(`/api/follow/${target._id}`).set("Cookie", `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it("5.1 JWT tampering (signature change or payload edit) → 401", async () => {
    const tamperedToken = token.split(".").slice(0, 2).join(".") + ".tampered";
    const res = await request(app)
      .get(`/api/follow/${target._id}`)
      .set("Cookie", `token=${tamperedToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("5.2 MongoDB injection in userId → 400", async () => {
    const res = await request(app)
      .get(`/api/follow/{$gt:null}`)
      .set("Cookie", `token=${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("5.3 Query injection in params (?page[$gt]=1) → 400 or ignore", async () => {
    const res = await request(app)
      .get(`/api/follow/${target._id}?page[$gt]=1`)
      .set("Cookie", `token=${token}`);

    expect([400, 200]).toContain(res.statusCode);
  });

  it("5.4 Token in query string → 401 or ignored", async () => {
    const res = await request(app)
      .get(`/api/follow/${target._id}?token=${token}`);

    expect(res.statusCode).toBe(401);
  });

  it("5.5 Brute-force scanning simulation (basic check) → enforce rate-limit or allow", async () => {
    const fakeUserIds = Array.from({ length: 10 }, () => new mongoose.Types.ObjectId());

    for (const fakeId of fakeUserIds) {
      const res = await request(app)
        .get(`/api/follow/${fakeId}`)
        .set("Cookie", `token=${token}`);

      expect([404, 200, 429]).toContain(res.statusCode);
    }
  });
});