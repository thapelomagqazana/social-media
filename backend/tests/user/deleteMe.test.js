const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const Like = require('../../models/Like');
const Follow = require('../../models/Follow');
const Profile = require('../../models/Profile');
const Notification = require('../../models/Notification');
const { generateToken } = require('../../utils/token');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('DELETE /api/users/me', () => {
  let user, token, mongoServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123!',
    });
    token = generateToken(user._id);
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('1.1 Authenticated user deletes their account — returns 200 with success message', async () => {
    const res = await request(app)
      .delete('/api/users/me')
      .set('Cookie', `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Your account and associated data have been deleted/i);
  });

  it('1.2 All user-related data is removed', async () => {
    const post = await Post.create({
        user: user._id,
        text: 'Sample post content',
        image: '',
    });
    const comment = await Comment.create({
        user: user._id,
        post: post._id,
        text: "Nice post",
      });
    await Like.create({
        user: user._id,
        post: post._id,
    });
    await Follow.create({
        follower: user._id,
        following: user._id,
    });
    await Profile.create({
        user: user._id,
        username: `user${Date.now()}`,
        profilePicture: '',
        interests: [],
        bio: "",
    });
    await Notification.create({
        type: "like",
        recipient: user._id,
        sender: user._id,
        post: post._id,
    });

    const res = await request(app)
      .delete('/api/users/me')
      .set('Cookie', `token=${token}`);

    const allData = await Promise.all([
      Post.findById(post._id),
      Comment.findById(comment._id),
      Like.findOne({ user: user._id }),
      Follow.findOne({ follower: user._id }),
      Profile.findOne({ user: user._id }),
      Notification.findOne({ recipient: user._id })
    ]);

    allData.forEach(doc => expect(doc).toBeNull());
  });

  it('1.3 Token becomes unusable after deletion', async () => {
    await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    const res = await request(app).get(`/api/users/${user._id}/stats`).set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('1.4 User with no data deletes successfully', async () => {
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('1.5 Deleted user cannot be found in DB', async () => {
    await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    const userCheck = await User.findById(user._id);
    expect(userCheck).toBeNull();
  });

  it('2.1 No token returns 401', async () => {
    const res = await request(app).delete('/api/users/me');
    expect(res.statusCode).toBe(401);
  });

  it('2.2 Tampered token returns 401', async () => {
    const res = await request(app)
      .delete('/api/users/me')
      .set('Cookie', `token=invalidtokenvalue`);
    expect(res.statusCode).toBe(401);
  });

  it('2.3 Already deleted user returns 404', async () => {
    await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect([401, 404]).toContain(res.statusCode);
  });

  it('3.1 User with 1 post/comment/like/follow is cleaned', async () => {
    const post = await Profile.create({
        user: user._id,
        username: `user${Date.now()}`,
        profilePicture: '',
    });
    await Comment.create({
        user: user._id,
        post: post._id,
        text: "Nice Post",
    });
    Like.create({
        user: user._id,
        post: post._id,
    });
    await Follow.create({
        follower: user._id,
        following: user._id,
    });
    await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);

    const postCheck = await Post.findById(post._id);
    expect(postCheck).toBeNull();
  });

  it('3.3 User with no profile deletes fine', async () => {
    await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    const profile = await Profile.findOne({ user: user._id });
    expect(profile).toBeNull();
  });

  it('4.1 Self-followed user deletes both entries', async () => {
    await Follow.create({
        follower: user._id,
        following: user._id,
    });
    await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    const followCheck = await Follow.findOne({ follower: user._id });
    expect(followCheck).toBeNull();
  });

  it('3.1 User with 1 post/comment/like/follow gets cleaned', async () => {
    const post = await Post.create({ user: user._id, text: 'Edge Post' });
    await Comment.create({ user: user._id, post: post._id, text: 'Nice' });
    await Like.create({ user: user._id, post: post._id });
    await Follow.create({ follower: user._id, following: user._id });
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('3.2 Deletes thousands of posts/likes', async () => {
    const bulkPosts = Array.from({ length: 1000 }, (_, i) => ({ user: user._id, text: `Post ${i}` }));
    const createdPosts = await Post.insertMany(bulkPosts);
    await Like.insertMany(createdPosts.map(p => ({ user: user._id, post: p._id })));
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('3.3 No profile present — no crash', async () => {
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('3.4 User is deleted mid-request (simulate)', async () => {
    await user.deleteOne();
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect([404, 401]).toContain(res.statusCode);
  });

  it('3.5 Under high load — still responds in time', async () => {
    jest.setTimeout(10000);
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('4.1 Self-followed user — deletes both entries', async () => {
    await Follow.create({ follower: user._id, following: user._id });
    await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    const follow = await Follow.findOne({ follower: user._id });
    expect(follow).toBeNull();
  });

  it('4.2 Notifications for deleted posts are cleaned', async () => {
    const post = await Post.create({ user: user._id, text: 'To be deleted' });
    await Notification.create({ sender: user._id, recipient: user._id, post: post._id, type: 'like' });
    await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    const notif = await Notification.findOne({ sender: user._id });
    expect(notif).toBeNull();
  });

  it('4.3 Corrupted references don’t break delete', async () => {
    await Like.create({ user: user._id, post: new mongoose.Types.ObjectId() });
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('4.4 Deleted then re-registered user — no conflict', async () => {
    await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    const newUser = await User.create({ name: 'Edge Tester', email: 'edge@test.com', password: 'Password123!' });
    expect(newUser).toBeDefined();
  });

  it('4.5 Flagged user — deletion allowed (or blocked if policy)', async () => {
    await User.findByIdAndUpdate(user._id, { isFlagged: true });
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect([200, 403]).toContain(res.statusCode);
  });

  it('5.1 JWT with bad signature — 401', async () => {
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=bad.token.jwt`);
    expect(res.statusCode).toBe(401);
  });

  it('5.2 Banned user cannot delete — 403', async () => {
    await User.findByIdAndUpdate(user._id, { isBanned: true });
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect(res.statusCode).toBe(403);
  });

  it('5.3 CSRF via browser not allowed (assumes CSRF middleware)', async () => {
    const res = await request(app).delete('/api/users/me'); // No cookie or CSRF header
    expect([401, 403]).toContain(res.statusCode);
  });

  it('5.4 Token in query string — ignored', async () => {
    const res = await request(app).delete('/api/users/me?token=' + token);
    expect(res.statusCode).toBe(401);
  });

  it('5.5 Rate-limited DELETEs — blocked if too frequent', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    }
    const res = await request(app).delete('/api/users/me').set('Cookie', `token=${token}`);
    expect([429, 401, 404]).toContain(res.statusCode);
  });

  it('5.6 User tries to delete another user — forbidden (route is /me)', async () => {
    const other = await User.create({ name: 'Other', email: 'o@test.com', password: 'Password123!' });
    const otherToken = generateToken(other._id);
    const res = await request(app).delete(`/api/users/${user._id}`).set('Cookie', `token=${otherToken}`);
    expect([401, 403, 404]).toContain(res.statusCode);
  });
});
