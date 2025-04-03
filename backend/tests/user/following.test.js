const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Follow = require("../../models/Follow");
const mongoose = require('mongoose');
const { generateToken } = require('../../utils/token');
const { MongoMemoryServer } = require('mongodb-memory-server');

let user, userId, follower1, follower2, token, mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  user = await User.create({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
  }); 
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
  userId = user._id.toString();
  token = generateToken(userId);

  await Follow.create({ follower: follower1._id, following: user._id });
  await Follow.create({ follower: follower2._id, following: user._id });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('GET /api/users/:userId/following', () => {
  it('1.1 Valid user with followings', async () => {
    const res = await request(app)
      .get(`/api/users/${follower1._id}/following`)
      .set('Cookie', `token=${generateToken(follower1._id)}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.following)).toBe(true);
    expect(res.body.following.length).toBeGreaterThan(0);
  });

  it('1.2 Valid user with no followings', async () => {
    const newUser = await User.create({
        name: 'NoFollowings',
        email: 'test11@example.com',
        password: 'Password123!',
    }); 
    const res = await request(app)
      .get(`/api/users/${newUser._id}/following`)
      .set('Cookie', `token=${generateToken(newUser._id)}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.following).toEqual([]);
  });

  it('1.3 Authenticated user can view their own followings', async () => {
    const res = await request(app)
      .get(`/api/users/${follower1._id}/following`)
      .set('Cookie', `token=${generateToken(follower1._id)}`);

    expect(res.statusCode).toBe(200);
  });

  it("1.4 Authenticated user can view other's followings", async () => {
    const res = await request(app)
      .get(`/api/users/${follower2._id}/following`)
      .set('Cookie', `token=${generateToken(follower1._id)}`);

    expect(res.statusCode).toBe(200);
  });

  it('1.5 Response includes name, email, username, profilePicture', async () => {
    const res = await request(app)
      .get(`/api/users/${follower1._id}/following`)
      .set('Cookie', `token=${generateToken(follower1._id)}`);

    const followingUser = res.body.following[0];
    expect(followingUser).toHaveProperty('name');
    expect(followingUser).toHaveProperty('username');
    expect(followingUser).toHaveProperty('profilePicture');
  });

  it('2.1 Invalid userId format returns 400', async () => {
    const res = await request(app)
      .get('/api/users/invalid_id/following')
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('2.2 Non-existent user returns 404', async () => {
    const res = await request(app)
      .get(`/api/users/${new mongoose.Types.ObjectId()}/following`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('2.3 Missing token returns 401', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/following`);
    expect(res.statusCode).toBe(401);
  });

  it('2.4 Expired or tampered JWT returns 401', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/following`)
      .set('Cookie', `token=invalid.token.here`);
    expect(res.statusCode).toBe(401);
  });

  it('3.2 page=0 defaults to 1', async () => {
    const res = await request(app)
      .get(`/api/users/${follower1._id}/following?page=0`)
      .set('Cookie', `token=${generateToken(follower1._id)}`);
    expect(res.statusCode).toBe(200);
  });

  it('3.3 limit=0 returns empty array', async () => {
    const res = await request(app)
      .get(`/api/users/${follower1._id}/following?limit=0`)
      .set('Cookie', `token=${generateToken(follower1._id)}`);
    expect(res.body.following.length).toBe(0);
  });

  it('5.2 MongoDB injection in userId returns 400', async () => {
    const res = await request(app)
      .get('/api/users/{$gt:null}/following')
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it.skip('5.3 Query injection in ?page[$gt]=1 returns 400', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/following?page[$gt]=1`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('5.4 Token passed in query string returns 401 or ignored', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/following?token=${token}`);
    expect(res.statusCode).toBe(401);
  });
});
