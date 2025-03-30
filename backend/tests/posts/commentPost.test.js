import request from 'supertest';
import app from '../../app.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { generateToken } from '../../utils/token.js';

let userToken, userId, postId;
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
  const user = await User.create({ name: 'Poster', email: 'poster@mail.com', password: 'Pass123!' });
  userId = user._id;
  userToken = generateToken(userId);

  const post = await createPostWithToken(userToken);
  postId = post.postId;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ POST /api/posts/:postId/comment - Positive Tests', () => {
  it('P01: Authenticated user adds a comment', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: 'This is a test comment' });

    expect(res.statusCode).toBe(201);
    expect(res.body.comment.text).toBe('This is a test comment');
  });

  it('P02: Comment includes emojis and punctuation', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: 'Awesome! 😎🔥🚀' });

    expect(res.statusCode).toBe(201);
    expect(res.body.comment.text).toMatch(/😎/);
  });

  it('P03: Multiple users add comments', async () => {
    const user2 = await User.create({ name: 'Poster1', email: 'poster1@mail.com', password: 'Pass123!' });
    const userToken2 = generateToken(user2._id);
    const res1 = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: 'User 1 here!' });

    const res2 = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken2}`])
      .send({ text: 'User 2 checking in!' });

    expect(res1.statusCode).toBe(201);
    expect(res2.statusCode).toBe(201);
  });

  it('P04: Comment with line breaks (multiline)', async () => {
    const multiline = 'Line one.\nLine two.\nLine three.';
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: multiline });

    expect(res.statusCode).toBe(201);
    expect(res.body.comment.text).toContain('Line two');
  });

  it('P05: Comment on post with existing comments', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: 'Another comment for the post' });

    expect(res.statusCode).toBe(201);
  });
});

describe('❌ POST /api/posts/:postId/comment - Negative Tests', () => {
  it('N01: Unauthenticated user attempts to comment', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .send({ text: 'Should not work' });

    expect(res.statusCode).toBe(401);
  });

  it('N02: Comment is missing (empty body)', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({});

    expect(res.statusCode).toBe(400);
  });

  it('N03: Comment is only whitespace', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: '   ' });

    expect(res.statusCode).toBe(400);
  });

  it('N04: postId is invalid ObjectId', async () => {
    const res = await request(app)
      .post(`/api/posts/invalidObjectId/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: 'Invalid ID format' });

    expect(res.statusCode).toBe(400);
  });

  it('N05: postId is valid but doesn’t exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/posts/${fakeId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: 'Nonexistent post' });

    expect(res.statusCode).toBe(404);
  });

  it('N06: Token passed in body instead of header/cookie', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .send({ text: 'Bad token location', token: userToken });

    expect(res.statusCode).toBe(401);
  });

  it('N07: Malformed or expired token', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', ['token=malformed.token.string'])
      .send({ text: 'Bad token' });

    expect(res.statusCode).toBe(401);
  });
});

describe('🔳 POST /api/posts/:postId/comment - Edge Tests', () => {
  it('E01: Max length comment (1000 chars)', async () => {
    const longText = 'x'.repeat(1000);
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: longText });

    expect(res.statusCode).toBe(201);
  });

  it('E02: Comment with only special characters', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: '!!!@@@###$$$' });

    expect([201, 400]).toContain(res.statusCode);
  });

  it('E03: Extremely rapid commenting (rate limit)', async () => {
    const requests = Array.from({ length: 5 }, (_, i) =>
      request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Cookie', [`token=${userToken}`])
        .send({ text: `Rapid comment ${i}` })
    );
    const results = await Promise.all(requests);
    results.forEach((res) => {
      expect([201, 429]).toContain(res.statusCode);
    });
  });

  it.skip('E04: Comment with markdown/HTML', async () => {
    const text = '<b>Bold</b> and *italic*';
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text });

    expect(res.statusCode).toBe(201);
    expect(res.body.comment.text).toContain('&lt;b&gt;');
  });
});

describe('🔲 POST /api/posts/:postId/comment - Corner Tests', () => {
  it('C01: User comments immediately after registering', async () => {
    const newUser = await User.create({ name: 'Poster3', email: 'poster3@mail.com', password: 'Pass123!' });
    const newUserToken = generateToken(newUser._id);
    const res = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Cookie', [`token=${newUserToken}`])
      .send({ text: 'Fresh user comment' });

    expect(res.statusCode).toBe(201);
  });

  it.skip('C02: Commenting while post is being deleted', async () => {
    const { _id: tempPostId } = await createPostWithToken(userToken);
    const commentReq = request(app)
      .post(`/api/posts/${tempPostId}/comment`)
      .set('Cookie', [`token=${userToken}`])
      .send({ text: 'Attempt during delete' });

    await request(app)
      .delete(`/api/posts/${tempPostId}`)
      .set('Cookie', [`token=${userToken}`]);

    const res = await commentReq;
    expect([404, 409]).toContain(res.statusCode);
  });

  it.skip('C03: Simultaneous comments by 100 users', async () => {
    const users = await Promise.all(
      Array.from({ length: 5 }, () => User.create({ name: 'Poster5', email: 'poster5@mail.com', password: 'Pass123!' }))
    );

    const requests = users.map((u, i) =>{
            const userToken_1 = generateToken(u._id);
            request(app)
            .post(`/api/posts/${postId}/comment`)
            .set('Cookie', [`token=${userToken_1}`])
            .send({ text: `Comment ${i}` })
        }

    );

    const results = await Promise.all(requests);
    results.forEach((res) => {
      expect(res.statusCode).toBe(201);
    });
  });
});
