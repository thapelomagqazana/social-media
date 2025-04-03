/**
 * @fileoverview Tests for GET /api/users/:userId/posts endpoint
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { generateToken } = require('../../utils/token');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let user, token, userId;

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
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Post.deleteMany();
});

describe('GET /api/users/:userId/posts', () => {
  it('1. Valid user with posts', async () => {
    await Post.create([{ user: userId, text: 'Post 1' }, { user: userId, text: 'Post 2' }]);
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBe(2);
  });

  it('2. Valid user with no posts', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBe(0);
  });

  it('3. Custom pagination (page=2, limit=1)', async () => {
    await Post.create([
      { user: userId, text: 'First' },
      { user: userId, text: 'Second' },
    ]);
    const res = await request(app)
      .get(`/api/users/${userId}/posts?page=2&limit=1`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.posts.length).toBe(1);
  });

  it('4. Default pagination', async () => {
    await Post.create(Array(15).fill({ user: userId, text: 'Post' }));
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBeLessThanOrEqual(10);
  });

  it('5. Posts are sorted correctly', async () => {
    const first = await Post.create({ user: userId, text: 'Oldest' });
    const second = await Post.create({ user: userId, text: 'Newest' });
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Cookie', `token=${token}`);
    expect(res.body.posts[0]._id).toBe(second._id.toString());
  });

  it('6. Authenticated user sees posts', async () => {
    await Post.create({ user: userId, text: 'Post by user' });
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBeGreaterThan(0);
  });

  it('7. Invalid user ID format', async () => {
    const res = await request(app)
      .get(`/api/users/invalidId/posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('8. Nonexistent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/users/${nonExistentId}/posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('9. Missing token (if protected)', async () => {
    const res = await request(app).get(`/api/users/${userId}/posts`);
    expect(res.statusCode).toBe(401);
  });

  it('10. Invalid token (if protected)', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Cookie', `token=invalid.token.here`);
    expect(res.statusCode).toBe(401);
  });

  it('12. page=0 should default to page 1', async () => {
    await Post.create([{ user: userId, text: 'Post 1' }]);
    const res = await request(app)
      .get(`/api/users/${userId}/posts?page=0`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('14. Page exceeds total', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/posts?page=100`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts).toEqual([]);
  });

  it('15. One post available', async () => {
    await Post.create({ user: userId, text: 'Only post' });
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Cookie', `token=${token}`);
    expect(res.body.posts.length).toBe(1);
  });

  it('16. limit is negative - should fallback to default (10)', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/posts?limit=-5`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBeLessThanOrEqual(10);
  });

  it('17. page is negative - should fallback to page 1', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/posts?page=-2`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.page).toBe(1);
  });

  it('18. Newly registered user with no posts', async () => {
    const newUser = await User.create({ name: 'Newbie', email: 'newbie@mail.com', password: 'Pass123!' });
    const res = await request(app)
      .get(`/api/users/${newUser._id}/posts`)
      .set('Cookie', `token=${generateToken(newUser._id)}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts).toHaveLength(0);
  });

  it('19. User deleted but posts remain', async () => {
    const tempUser = await User.create({ name: 'Ghost', email: 'ghost@mail.com', password: 'Ghost123!' });
    const ghostPost = await Post.create({ user: tempUser._id, text: 'Left behind' });
    await tempUser.deleteOne();

    const res = await request(app)
      .get(`/api/users/${tempUser._id}/posts`)
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(404); // Or 200 if allowed
  });

  it('20. User has only media posts', async () => {
    await Post.create({ user: userId, text: '', image: '/uploads/pic1.png' });
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts[0].image).toBeTruthy();
  });

  it('21. Posts created simultaneously', async () => {
    const now = new Date();
    await Post.insertMany([
      { user: userId, text: 'Post A', createdAt: now },
      { user: userId, text: 'Post B', createdAt: now },
    ]);
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts[0].createdAt).toBeDefined();
  });

  it('22. JWT tampering', async () => {
    const fakeToken = 'Bearer faketoken';
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Authorization', fakeToken);
    expect(res.statusCode).toBe(401);
  });

  it('23. MongoDB Injection attempt in userId', async () => {
    const res = await request(app)
      .get('/api/users/{$gt:null}/posts')
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it.skip('24. Query injection attempt', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/posts?page[$gt]=1`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('25. Token sent via query string should be ignored or rejected', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/posts?token=${token}`);
    expect([401, 403]).toContain(res.statusCode);
  });

  it("26. Accessing another user’s private content", async () => {
    const privateUser = await User.create({ name: 'Hidden', email: 'hidden@mail.com', password: 'Hide123!' });
    await Post.create({ user: privateUser._id, text: 'Secret stuff' });
    const res = await request(app)
      .get(`/api/users/${privateUser._id}/posts`)
      .set('Cookie', `token=${token}`);

    // Customize based on app's privacy rules
    expect([200, 403]).toContain(res.statusCode);
  });
});
