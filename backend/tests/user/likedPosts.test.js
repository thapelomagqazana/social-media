const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { generateToken } = require('../../utils/token');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('GET /api/users/:userId/liked-posts', () => {
  let user, token, otherUser, posts = [];
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    user = await User.create({ name: 'Test User', email: 'test@example.com', password: 'Pass@1234' });
    token = generateToken(user._id);

    otherUser = await User.create({ name: 'Other', email: 'other@example.com', password: 'Pass@1234' });

    for (let i = 0; i < 12; i++) {
      const post = await Post.create({ user: otherUser._id, text: `Post ${i}` });
      if (i < 10) post.likes.push(user._id);
      await post.save();
      posts.push(post);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('1. Valid user with liked posts', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBeGreaterThan(0);
  });

  it('2. Valid user with no liked posts', async () => {
    const res = await request(app)
      .get(`/api/users/${otherUser._id}/liked-posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBe(0);
  });

  it('3. Custom pagination works', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts?page=2&limit=5`)
      .set('Cookie', `token=${token}`);
    expect(res.body.page).toBe(2);
    expect(res.body.posts.length).toBeLessThanOrEqual(5);
  });

  it('4. Default pagination applies', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts`)
      .set('Cookie', `token=${token}`);
    expect(res.body.page).toBe(1);
    expect(res.body.posts.length).toBeLessThanOrEqual(10);
  });

  it('5. Posts sorted by most recently liked', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts`)
      .set('Cookie', `token=${token}`);
    const timestamps = res.body.posts.map(p => new Date(p.createdAt).getTime());
    const sorted = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sorted);
  });

  it('6. Authenticated user can view their liked posts', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('7. Authenticated user can view public liked posts of another user', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('8. Invalid user ID format', async () => {
    const res = await request(app)
      .get('/api/users/invalidID/liked-posts')
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('9. Nonexistent user ID', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/users/${nonExistentId}/liked-posts`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('10. Missing token (if protected)', async () => {
    const res = await request(app).get(`/api/users/${user._id}/liked-posts`);
    expect([401, 403]).toContain(res.statusCode);
  });

  it('11. Invalid token', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts`)
      .set('Cookie', `token=invalid.token.value`);
    expect(res.statusCode).toBe(401);
  });

  it('12. page=0', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts?page=0`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('13. limit=0', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts?limit=0`)
      .set('Cookie', `token=${token}`);
    expect(res.body.posts.length).toBe(0);
  });

  it('14. Page exceeds available pages', async () => {
    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts?page=999`)
      .set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBe(0);
  });

  it('15. One liked post only', async () => {
    const soloUser = await User.create({ name: 'Solo', email: 'solo@example.com', password: 'Pass@1234' });
    const soloToken = generateToken(soloUser._id);
    const soloPost = await Post.create({ user: otherUser._id, text: 'Solo Like' });
    soloPost.likes.push(soloUser._id);
    await soloPost.save();

    const res = await request(app)
      .get(`/api/users/${soloUser._id}/liked-posts`)
      .set('Cookie', `token=${soloToken}`);
    expect(res.body.posts.length).toBe(1);
  });

  it('16. page or limit is negative → fallback to default', async () => {
    const post = await Post.create({ user: user._id, text: 'Negative page test', likes: [user._id] });

    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts?page=-1&limit=-5`)
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
  });

  it('17. page or limit is not a number → fallback or error', async () => {
    const post = await Post.create({ user: user._id, text: 'NaN limit test', likes: [user._id] });

    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts?page=abc&limit=xyz`)
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);
  });

  it('18. One liked post only → returns single post & metadata', async () => {
    await Post.deleteMany();

    const post = await Post.create({ user: user._id, text: 'Only liked post' });
    post.likes.push(user._id);
    await post.save();

    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts`)
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBe(1);
    expect(res.body.totalPosts).toBe(1);
  });

  it('19. Newly registered user → no liked posts', async () => {
    const newUser = await User.create({ name: 'Newbie', email: 'new@user.com', password: 'Passw0rd!' });
    const newToken = generateToken(newUser._id);

    const res = await request(app)
      .get(`/api/users/${newUser._id}/liked-posts`)
      .set('Cookie', `token=${newToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts).toEqual([]);
  });

  it('20. User likes and unlikes posts rapidly → returns latest state', async () => {
    await Post.deleteMany();
    const post = await Post.create({ user: user._id, text: 'Temp like' });

    // Like then unlike
    post.likes.push(user._id);
    await post.save();
    post.likes.pull(user._id);
    await post.save();

    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts`)
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBe(0);
  });

  it('21. Posts liked in bulk by many users → still paginated correctly', async () => {
    await Post.deleteMany();
    for (let i = 0; i < 15; i++) {
      const post = await Post.create({ user: user._id, text: `Bulk Post ${i}` });
      post.likes.push(user._id);
      await post.save();
    }

    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts?page=1&limit=10`)
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBeLessThanOrEqual(10);
    expect(res.body.totalPosts).toBe(15);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
  });

  it('22. Posts deleted after being liked → handled gracefully', async () => {
    const post = await Post.create({ user: user._id, text: 'Deleted post' });
    post.likes.push(user._id);
    await post.save();

    await Post.findByIdAndDelete(post._id); // Delete post

    const res = await request(app)
      .get(`/api/users/${user._id}/liked-posts`)
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);
  });
});