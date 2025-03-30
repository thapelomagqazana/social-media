import request from 'supertest';
import app from '../../app';
import mongoose from 'mongoose';
import User from '../../models/User';
import Post from '../../models/Post';
import Comment from '../../models/Comment';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { generateToken } from '../../utils/token';

let userToken, adminToken, otherUserToken;
let userId, adminId, postId;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const user = await User.create({ name: 'User1', email: 'user1@mail.com', password: 'Pass123!' });
  userId = user._id;
  userToken = generateToken(user._id);

  const admin = await User.create({ name: 'Admin', email: 'admin@mail.com', password: 'Pass123!', role: 'admin' });
  adminId = admin._id;
  adminToken = generateToken(admin._id);

  const otherUser = await User.create({ name: 'Other', email: 'other@mail.com', password: 'Pass123!' });
  otherUserToken = generateToken(otherUser._id);

  const post = await Post.create({ user: userId, text: 'Hello World' });
  postId = post._id;

  await Comment.create({ post: postId, user: userId, text: 'A comment' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ DELETE /api/posts/:postId - Positive', () => {
  it('P01: Authenticated user deletes their own post', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('P02: Admin deletes any user’s post', async () => {
    const post = await Post.create({ user: userId, text: 'Admin post' });
    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
  });

  it('P03: Deleting post also deletes comments', async () => {
    const post = await Post.create({ user: userId, text: 'Post with comments' });
    await Comment.create({ post: post._id, user: userId, text: 'A comment' });

    await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Cookie', [`token=${userToken}`]);

    const comments = await Comment.find({ post: post._id });
    expect(comments.length).toBe(0);
  });
});

describe('❌ DELETE /api/posts/:postId - Negative', () => {
  it('N01: Unauthenticated user tries to delete a post', async () => {
    const res = await request(app).delete(`/api/posts/${postId}`);
    expect(res.statusCode).toBe(401);
  });

  it('N02: Valid token but post doesn’t exist', async () => {
    const res = await request(app)
      .delete(`/api/posts/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(404);
  });

  it('N03: User tries to delete someone else’s post (not admin)', async () => {
    const post = await Post.create({ user: userId, text: 'Private post' });
    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Cookie', [`token=${otherUserToken}`]);

    expect(res.statusCode).toBe(403);
  });

  it('N04: Token passed in body instead of header/cookie', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .send({ token: userToken });

    expect(res.statusCode).toBe(401);
  });

  it('N05: Malformed token', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Cookie', [`token=malformed.token.here`]);

    expect(res.statusCode).toBe(401);
  });

  it('N06: Invalid postId format', async () => {
    const res = await request(app)
      .delete('/api/posts/invalid-id')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(400);
  });
});

describe('🔳 DELETE /api/posts/:postId - Edge', () => {
  it('E01: Deleting post with large number of comments/likes', async () => {
    const post = await Post.create({ user: userId, text: 'Edge Post' });
    for (let i = 0; i < 100; i++) {
      await Comment.create({ post: post._id, user: userId, text: `Comment ${i}` });
    }

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
  });

  it('E02: Deleting post immediately after creation', async () => {
    const post = await Post.create({ user: userId, text: 'New' });
    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
  });

  it('E03: Deleting same post twice', async () => {
    const post = await Post.create({ user: userId, text: 'Delete twice' });

    await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Cookie', [`token=${userToken}`]);

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(404);
  });
});

describe('🔲 DELETE /api/posts/:postId - Corner', () => {
  it('C01: User deletes post while liking it', async () => {
    const post = await Post.create({ user: userId, text: 'Race condition' });
    const likeReq = request(app)
      .post(`/api/posts/${post._id}/like`)
      .set('Cookie', [`token=${userToken}`]);

    const deleteReq = request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Cookie', [`token=${userToken}`]);

    const [likeRes, deleteRes] = await Promise.all([likeReq, deleteReq]);
    expect([200, 409]).toContain(deleteRes.statusCode);
  });

  it('C02: Post deleted while another user views it', async () => {
    const post = await Post.create({ user: userId, text: 'Simultaneous' });

    const deleteRes = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Cookie', [`token=${userToken}`]);

    const viewRes = await request(app)
      .get(`/api/posts/${post._id}`)
      .set('Cookie', [`token=${otherUserToken}`]);

    expect(deleteRes.statusCode).toBe(200);
    expect(viewRes.statusCode).toBe(404);
  });
});

describe('🔐 DELETE /api/posts/:postId - Security Tests', () => {
  it('S01: Forged JWT tries to delete a post', async () => {
    const forgedToken = 'Bearer faketoken.jwt.payload';
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', forgedToken);
    expect([401, 403]).toContain(res.statusCode);
  });

  it('S02: SQL injection payload in postId param', async () => {
    const res = await request(app)
      .delete('/api/posts/1;DROP TABLE posts')
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(400);
  });

  it('S03: XSS payload in postId param', async () => {
    const res = await request(app)
      .delete('/api/posts/<script>alert(1)</script>')
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(404);
  });
});
