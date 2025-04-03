const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Follow = require("../../models/Follow");
const mongoose = require('mongoose');
const { generateToken } = require('../../utils/token');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('GET /api/users/:userId/followers', () => {
  let user, userId, token, follower1, follower2, mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
    }); 
    userId = user._id.toString();
    token = generateToken(userId);
    
    follower1 = await User.create({
        name: 'Follower 1',
        email: 'follower1@example.com',
        password: 'Password123!',
    });
    follower2 = await User.create({
        name: 'Follower 2',
        email: 'follower2@example.com',
        password: 'Password123!',
    });
    await Follow.create({ follower: follower1._id, following: user._id });
    await Follow.create({ follower: follower2._id, following: user._id });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('1.1 returns list of followers', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.followers.length).toBeGreaterThanOrEqual(2);
  });

  it('1.2 user with no followers', async () => {
    const newUser = await User.create({
        name: 'Test User1',
        email: 'test1@example.com',
        password: 'Password123!',
    }); 
    const res = await request(app)
      .get(`/api/users/${newUser._id}/followers`)
      .set('Cookie', `token=${generateToken(newUser._id)}`);
    expect(res.body.followers).toEqual([]);
  });

  it('1.3 self-view followers', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('1.4 others view public followers', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers`)
      .set('Cookie', `token=${generateToken(follower1._id)}`);
    expect(res.statusCode).toBe(200);
  });

  it('1.5 followers include name/email', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers`)
      .set('Cookie', `token=${token}`);
    expect(res.body.followers[0]).toHaveProperty('name');
    expect(res.body.followers[0]).toHaveProperty('email');
  });

  it('1.6 default pagination page=1, limit=10', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers`)
      .set('Cookie', `token=${token}`);
    expect(res.body.page).toBe(1);
    expect(res.body.followers.length).toBeLessThanOrEqual(10);
  });

  it('1.7 custom pagination works', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers?page=1&limit=1`)
      .set('Cookie', `token=${token}`);
    expect(res.body.followers.length).toBe(1);
  });

  it('2.1 invalid userId returns 400', async () => {
    const res = await request(app)
      .get('/api/users/invalidId/followers')
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('2.2 non-existent user returns 404', async () => {
    const res = await request(app)
      .get(`/api/users/${new mongoose.Types.ObjectId()}/followers`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('2.3 missing token returns 401', async () => {
    const res = await request(app).get(`/api/users/${user._id}/followers`);
    expect(res.statusCode).toBe(401);
  });

  it('2.4 tampered token returns 401', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers`)
      .set('Cookie', 'token=invalid.jwt.token');
    expect(res.statusCode).toBe(401);
  });

  it('3.1 page=0 fallback to page=1 or empty', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers?page=0`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('3.2 limit=0 returns empty or default', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers?limit=0`)
      .set('Cookie', `token=${token}`);
    expect(Array.isArray(res.body.followers)).toBe(true);
  });

  it('3.3 very large limit caps or returns all', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers?limit=9999`)
      .set('Cookie', `token=${token}`);
    expect(res.body.followers.length).toBeGreaterThan(0);
  });

  it('5.1 JWT tampering returns 401', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/followers`)
      .set('Cookie', 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid');
    expect(res.statusCode).toBe(401);
  });

  it('5.2 MongoDB injection attempt in userId returns 400', async () => {
    const res = await request(app)
      .get('/api/users/{$gt:null}/followers')
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });
});
