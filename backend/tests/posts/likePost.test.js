const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { generateToken } = require('../../utils/token');

let userToken, adminToken, otherUserToken;
let userId, adminId, postId;
let mongoServer;

const createPostWithToken = async (token, overrides = {}) => {
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${token}`])
      .field('text', overrides.text || 'Hello test!');
  
    return {
      postId: res.body.post._id.toString(),
      post: res.body.post,
      user: res.body.user,
    };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const user = await User.create({ name: 'User1', email: 'user1@mail.com', password: 'Pass123!' });
  userId = user._id;
  userToken = generateToken(userId);

  const admin = await User.create({ name: 'Admin', email: 'admin@mail.com', password: 'Pass123!', role: 'admin' });
  adminId = admin._id;
  adminToken = generateToken(adminId);

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

describe('✅ PUT /api/posts/:postId/like - Positive Tests', () => {
    it('P01: Authenticated user likes a post', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}/like`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    it('P02: Authenticated user unlikes a previously liked post', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}/like`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    it('P03: User can like the post again after unliking', async () => {
      await request(app).put(`/api/posts/${postId}/like`).set('Cookie', [`token=${userToken}`]);
      const res = await request(app)
        .put(`/api/posts/${postId}/like`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    it('P04: Multiple users like a post (independently tracked)', async () => {
      await request(app).put(`/api/posts/${postId}/like`).set('Cookie', [`token=${userToken}`]);
      const res = await request(app)
        .put(`/api/posts/${postId}/like`)
        .set('Cookie', [`token=${otherUserToken}`]);
      
      expect(res.statusCode).toBe(200);
    });
});

describe('❌ PUT /api/posts/:postId/like - Negative Tests', () => {
    it('N01: Unauthenticated user attempts to like', async () => {
        const res = await request(app).put(`/api/posts/${postId}/like`);
        expect(res.statusCode).toBe(401);
    });

    it('N02: Token in body instead of header/cookie', async () => {
        const res = await request(app)
            .put(`/api/posts/${postId}/like`)
            .send({ token: userToken });
        expect(res.statusCode).toBe(401);
    });

    it('N03: Malformed token', async () => {
        const res = await request(app)
            .put(`/api/posts/${postId}/like`)
            .set('Cookie', [`token=badtoken123`]);
        expect(res.statusCode).toBe(401);
    });

    it('N04: Valid ObjectId but non-existent post', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/posts/${fakeId}/like`)
            .set('Cookie', [`token=${userToken}`]);
        expect(res.statusCode).toBe(404);
    });

    it('N05: Invalid postId format', async () => {
        const res = await request(app)
            .put(`/api/posts/invalid123/like`)
            .set('Cookie', [`token=${userToken}`]);
        expect(res.statusCode).toBe(400);
    });

    it('N06: Like deleted post', async () => {
        const { postId: tempPostId } = await createPostWithToken(userToken);
        await request(app).delete(`/api/posts/${tempPostId}`).set('Cookie', [`token=${userToken}`]);
        const res = await request(app).put(`/api/posts/${tempPostId}/like`).set('Cookie', [`token=${userToken}`]);
        expect(res.statusCode).toBe(404);
    });
});

describe('🔳 Edge /api/posts/:postId/like Tests', () => {
    it.skip('E01: User likes same post 100 times (toggle)', async () => {
        for (let i = 0; i < 100; i++) {
            await request(app).put(`/api/posts/${postId}/like`).set('Cookie', [`token=${userToken}`]);
        }
        const final = await request(app).get(`/api/posts/${postId}`).set('Cookie', [`token=${userToken}`]);
        expect(Array.isArray(final.body.post.likes)).toBe(true);
    });

    it('E02: Works with max-length content post', async () => {
        const longPost = await createPostWithToken(userToken, 'x'.repeat(5000));
        const res = await request(app).put(`/api/posts/${longPost.postId}/like`).set('Cookie', [`token=${userToken}`]);
        expect(res.statusCode).toBe(200);
    });

    it.skip('E03: Rapid like/unlike (no race condition)', async () => {
        const promises = Array.from({ length: 20 }, () =>
            request(app).put(`/api/posts/${postId}/like`).set('Cookie', [`token=${userToken}`])
        );
        await Promise.all(promises);
        const res = await request(app).get(`/api/posts/${postId}`).set('Cookie', [`token=${userToken}`]);
        expect(Array.isArray(res.body.post.likes)).toBe(true);
    });
});

describe('🔲 Corner /api/posts/:postId/like Tests', () => {
    it('C01: User unlikes post they never liked', async () => {
        const res = await request(app).put(`/api/posts/${postId}/like`).set('Cookie', [`token=${otherUserToken}`]);
        expect(res.statusCode).toBe(200);
    });

    it('C02: Post deleted while being liked', async () => {
        const { postId: tempId } = await createPostWithToken(userToken);
        await request(app).delete(`/api/posts/${tempId}`).set('Cookie', [`token=${userToken}`]);
        const res = await request(app).put(`/api/posts/${tempId}/like`).set('Cookie', [`token=${userToken}`]);
        expect([404, 409]).toContain(res.statusCode);
    });

});