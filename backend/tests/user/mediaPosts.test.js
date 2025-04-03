const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { generateToken } = require('../../utils/token');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('GET /api/users/:userId/media-posts', () => {
  let user, token, userId, mongoServer;
  let posts;

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

    posts = [];

    for (let i = 0; i < 5; i++) {
        const post = new Post({
            user: userId,
            text: `Media post #${i + 1}`,
            image: `/uploads/image-${i + 1}.jpg`,
        });
        await post.save();
        posts.push(post);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // ✅ Positive
  it('1.1 Valid user with media posts returns correct media posts', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts`)
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts.every(p => p.image)).toBe(true);
  });

  it('1.2 Valid user with mixed posts returns only media posts', async () => {
    // simulate some non-media posts
    const textOnlyPost = await request(app)
      .post('/api/posts')
      .set('Cookie', `token=${token}`)
      .send({ text: 'text only' });

    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts`)
      .set('Cookie', `token=${token}`);

    expect(res.body.posts.some(p => !p.image)).toBe(false);
  });

  it('1.3 Custom pagination: ?page=2&limit=5', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts?page=2&limit=5`)
      .set('Cookie', `token=${token}`);

    expect(res.body.page).toBe(2);
    expect(res.body.posts.length).toBeLessThanOrEqual(5);
  });

  it('1.4 Default pagination applies', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts`)
      .set('Cookie', `token=${token}`);

    expect(res.body.page).toBe(1);
    expect(res.body.posts.length).toBeLessThanOrEqual(10);
  });

  it('1.5 Posts are sorted by createdAt desc', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts`)
      .set('Cookie', `token=${token}`);

    const timestamps = res.body.posts.map(p => new Date(p.createdAt));
    const sorted = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sorted);
  });

  it('1.6 Authenticated user can view their own media posts', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts`)
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(200);
  });

  // ❌ Negative
  it('2.1 Invalid user ID format returns 400', async () => {
    const res = await request(app)
      .get(`/api/users/invalidId/media-posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('2.2 Valid ObjectId but nonexistent user returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/users/${fakeId}/media-posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('2.3 Missing token returns 401', async () => {
    const res = await request(app).get(`/api/users/${user._id}/media-posts`);
    expect(res.statusCode).toBe(401);
  });

  it('2.4 Expired or tampered token returns 401', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts`)
      .set('Cookie', `token=invalid.jwt.token`);
    expect(res.statusCode).toBe(401);
  });

  // ⚠️ Edge
  it('3.1 page=0 should fallback', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts?page=0`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('3.2 limit=0 should return empty array', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts?limit=0`)
      .set('Cookie', `token=${token}`);
    expect(res.body.posts.length).toBe(0);
  });

  it('3.3 Very large limit caps or returns all', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts?limit=9999`)
      .set('Cookie', `token=${token}`);
    expect(res.body.posts.length).toBeLessThanOrEqual(100); // assume capped at 100
  });

  it('3.4 Exceeds available pages returns empty', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts?page=999`)
      .set('Cookie', `token=${token}`);
    expect(res.body.posts.length).toBe(0);
  });

  // 🧊 Corner & 🔐 Security
  it('4.3 Posts with empty image "" are excluded', async () => {
    await request(app)
      .post('/api/posts')
      .set('Cookie', `token=${token}`)
      .send({ text: 'fake media', image: '' });

    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts`)
      .set('Cookie', `token=${token}`);

    expect(res.body.posts.every(p => p.image && p.image.trim())).toBe(true);
  });

  it('5.2 MongoDB injection in userId', async () => {
    const res = await request(app)
      .get(`/api/users/{$gt:null}/media-posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it.skip('5.3 Query injection in params', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts?page[$gt]=1`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('5.4 Token in query string is ignored', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/media-posts?token=${token}`);
    expect(res.statusCode).toBe(401);
  });
});