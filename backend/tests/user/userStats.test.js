const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Follow = require("../../models/Follow");
const { generateToken } = require('../../utils/token');
const { MongoMemoryServer } = require('mongodb-memory-server');

let user, token, otherUser, mongoServer, posts;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
  });
  token = generateToken(user._id);
  otherUser = await User.create({
    name: 'Test User11',
    email: 'test11@example.com',
    password: 'Password123!',
  });

  posts = [];

  for (let i = 0; i < 3; i++) {
    const post = new Post({
      user: user._id,
      text: `Test Post ${i + 1}`,
      image: '',
      createdAt: new Date(),
    });
    await post.save();
    posts.push(post);
  }
  await Follow.create({ follower: otherUser._id, following: user._id });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('GET /api/users/:userId/stats', () => {
  it('1.1 returns correct stats for active user', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/stats`)
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        postCount: 3,
        followersCount: 1,
        followingCount: 0,
      })
    );
  });

  it('1.2 returns all counts 0 for fresh user', async () => {
    const newUser = await User.create({
        name: 'Test User2',
        email: 'test2@example.com',
        password: 'Password123!',
    });
    const res = await request(app)
      .get(`/api/users/${newUser._id}/stats`)
      .set('Cookie', `token=${generateToken(newUser._id)}`);
    expect(res.body).toMatchObject({ postCount: 0, followersCount: 0, followingCount: 0 });
  });

  it("1.3 authenticated user views their stats", async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/stats`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it("1.4 other users can view stats", async () => {
    const res = await request(app)
      .get(`/api/users/${otherUser._id}/stats`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it("1.5 response shape is correct", async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/stats`)
      .set('Cookie', `token=${token}`);
    expect(res.body).toHaveProperty('postCount');
    expect(res.body).toHaveProperty('followersCount');
    expect(res.body).toHaveProperty('followingCount');
  });

  it("2.1 invalid userId returns 400", async () => {
    const res = await request(app).get(`/api/users/invalid123/stats`).set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it("2.2 nonexistent user returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/users/${fakeId}/stats`).set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(404);
  });

  it("2.3 missing token returns 401", async () => {
    const res = await request(app).get(`/api/users/${user._id}/stats`);
    expect(res.statusCode).toBe(401);
  });

  it("2.4 tampered token returns 401", async () => {
    const res = await request(app).get(`/api/users/${user._id}/stats`).set('Cookie', `token=abc.def.ghi`);
    expect(res.statusCode).toBe(401);
  });

  it("2.5 banned user stats access denied", async () => {
    const banned = await User.create({
        name: 'Test User21',
        email: 'test21@example.com',
        password: 'Password123!',
    });
    await User.findByIdAndUpdate(banned._id, { isBanned: true });
    const res = await request(app).get(`/api/users/${banned._id}/stats`).set('Cookie', `token=${generateToken(banned._id)}`);
    expect([401, 403]).toContain(res.statusCode);
  });

  it("5.1 jwt tampering returns 401", async () => {
    const res = await request(app).get(`/api/users/${user._id}/stats`).set('Cookie', `token=123.invalid.jwt`);
    expect(res.statusCode).toBe(401);
  });

  it("5.2 mongodb injection in userId", async () => {
    const res = await request(app).get(`/api/users/{$gt:null}/stats`).set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });
});
