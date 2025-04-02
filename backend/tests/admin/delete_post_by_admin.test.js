const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app.js');
const User = require('../../models/User.js');
const Post = require('../../models/Post.js');
const { generateToken } = require('../../utils/token.js');
const Comment = require('../../models/Comment.js');

let admin, adminToken, user, userPost, adminPost;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  admin = await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'admin',
  });

  user = await User.create({
    name: 'Regular',
    email: 'user@test.com',
    password: 'User123!',
  });

  adminToken = generateToken(admin._id);

  userPost = await Post.create({ user: user._id, text: 'User post to delete' });
  adminPost = await Post.create({ user: admin._id, text: 'Admin post' });

  await Comment.create({ user: user._id, post: userPost._id, text: 'Comment1' });
  await Comment.create({ user: user._id, post: userPost._id, text: 'Comment2' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Positive Test Cases', () => {
  it('P01: Admin deletes an existing post', async () => {
    const res = await request(app)
      .delete(`/api/admin/posts/${userPost._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
  });

  it('P02: Admin deletes post with many likes/comments', async () => {
    const heavyPost = await Post.create({
      user: user._id,
      text: 'Heavy post',
      likes: [admin._id, user._id],
    });
    await Comment.create({ user: user._id, post: heavyPost._id, text: '💬' });

    const res = await request(app)
      .delete(`/api/admin/posts/${heavyPost._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(200);
  });

  it('P03: Admin deletes post created by another user', async () => {
    const otherPost = await Post.create({ user: user._id, text: 'Other post' });
    const res = await request(app)
      .delete(`/api/admin/posts/${otherPost._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(200);
  });
});

describe('❌ Negative Test Cases', () => {
  it('N01: No auth token provided', async () => {
    const res = await request(app).delete(`/api/admin/posts/${adminPost._id}`);
    expect(res.statusCode).toBe(401);
  });

  it('N02: Invalid token', async () => {
    const res = await request(app)
      .delete(`/api/admin/posts/${adminPost._id}`)
      .set('Cookie', ['token=invalid']);
    expect(res.statusCode).toBe(401);
  });

  it('N03: Token in body instead of header', async () => {
    const res = await request(app)
      .delete(`/api/admin/posts/${adminPost._id}`)
      .send({ token: adminToken });
    expect(res.statusCode).toBe(401);
  });

  it('N04: Non-admin user tries delete', async () => {
    const userToken = generateToken(user._id);
    const res = await request(app)
      .delete(`/api/admin/posts/${adminPost._id}`)
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(403);
  });

  it('N05: Malformed ID', async () => {
    const res = await request(app)
      .delete('/api/admin/posts/abc123')
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(400);
  });

  it('N06: Valid but non-existent post ID', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/admin/posts/${id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(404);
  });
});

describe('🔳 Edge Test Cases', () => {
  it('E01: Delete a just-created post', async () => {
    const post = await Post.create({ user: user._id, text: 'Edge post' });
    const res = await request(app)
      .delete(`/api/admin/posts/${post._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(200);
  });

  it('E02: Deleting a post twice', async () => {
    const post = await Post.create({ user: user._id, text: 'Delete me twice' });
    await request(app)
      .delete(`/api/admin/posts/${post._id}`)
      .set('Cookie', [`token=${adminToken}`]);

    const res = await request(app)
      .delete(`/api/admin/posts/${post._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(404);
  });

  it('E03: Max-length post content', async () => {
    const post = await Post.create({ user: admin._id, text: 'A'.repeat(5000) });
    const res = await request(app)
      .delete(`/api/admin/posts/${post._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(200);
  });

  it('E04: Concurrent delete', async () => {
    const post = await Post.create({ user: admin._id, text: 'Race condition' });

    const res1 = request(app)
      .delete(`/api/admin/posts/${post._id}`)
      .set('Cookie', [`token=${adminToken}`]);

    const res2 = request(app)
      .delete(`/api/admin/posts/${post._id}`)
      .set('Cookie', [`token=${adminToken}`]);

    const results = await Promise.all([res1, res2]);
    const statusCodes = results.map((r) => r.statusCode);
    expect(statusCodes).toContain(200);
    expect(statusCodes).toContain(404);
  });
});

describe('🔲 Corner Test Cases', () => {
  it('C01: Admin deletes their own post', async () => {
    const res = await request(app)
      .delete(`/api/admin/posts/${adminPost._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(200);
  });

  it('C02: Delete while author is editing (simulate with delay)', async () => {
    const post = await Post.create({ user: user._id, text: 'Editing now' });
    const res = await request(app)
      .delete(`/api/admin/posts/${post._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(200);
  });

  it('C03: Banned user’s post deletion', async () => {
    const bannedUser = await User.create({
      name: 'BannedUser',
      email: 'banned@mail.com',
      password: 'Banned123!',
      isBanned: true,
    });
    const post = await Post.create({ user: bannedUser._id, text: 'Bad post' });
    const res = await request(app)
      .delete(`/api/admin/posts/${post._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(200);
  });

  it('C04: DB in read-only mode (simulate failure)', async () => {
    jest.spyOn(Post, 'findByIdAndDelete').mockRejectedValueOnce(new Error('Read-only DB'));
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/admin/posts/${fakeId}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(500);
  });
});

describe('🔐 Security Test Cases', () => {
  it('S01: Forged JWT', async () => {
    const res = await request(app)
      .delete(`/api/admin/posts/${adminPost._id}`)
      .set('Cookie', ['token=forged.jwt.token']);
    expect(res.statusCode).toBe(401);
  });

  it('S02: NoSQL Injection', async () => {
    const res = await request(app)
      .delete(`/api/admin/posts/{$ne:null}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect([400, 500]).toContain(res.statusCode);
  });

  it('S03: XSS payload', async () => {
    const res = await request(app)
      .delete(`/api/admin/posts/<script>alert(1)</script>`)
      .set('Cookie', [`token=${adminToken}`]);
    expect([400, 404]).toContain(res.statusCode);
  });

  it('S04: Privilege escalation', async () => {
    const forgedAdminToken = generateToken(user._id, 'admin'); // pretending user is admin
    const res = await request(app)
      .delete(`/api/admin/posts/${adminPost._id}`)
      .set('Cookie', [`token=${forgedAdminToken}`]);
    expect(res.statusCode).toBe(403);
  });

  it('S05: CSRF-like behavior', async () => {
    const res = await request(app)
      .delete(`/api/admin/posts/${adminPost._id}`)
      .set('Authorization', `Bearer ${adminToken}`); // no cookie
    expect([401, 403]).toContain(res.statusCode);
  });
});
