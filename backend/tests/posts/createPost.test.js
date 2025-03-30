import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../models/User.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Post from '../../models/Post.js';
import { generateToken } from '../../utils/token.js';
import path from 'path';
import fs from 'fs';

let mongoServer;
let userToken, userId;
let uploadPath, invalidPath;;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  uploadPath = path.join(__dirname, '..', '..', 'uploads', 'avatar.png');
  // Create a dummy file for upload
  fs.writeFileSync(uploadPath, 'dummy content');

  invalidPath = path.join(__dirname, 'invalid.txt');
  fs.writeFileSync(invalidPath, 'not an image');

  const user = await User.create({ name: 'Poster', email: 'poster@mail.com', password: 'Pass123!' });
  userId = user._id;
  userToken = generateToken(user._id);
});

afterAll(async () => {
  // Clean up the test file
  if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);
  if (fs.existsSync(invalidPath)) fs.unlinkSync(invalidPath);
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ POST /api/posts - Positive Tests', () => {
  it('P01: should create post with text only', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${userToken}`])
      .send({ text: 'Just a text post' });

    expect(res.statusCode).toBe(201);
    expect(res.body.post.text).toBe('Just a text post');
  });

  it('P02: should create post with image only', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${userToken}`])
      .attach('image', uploadPath);

    expect(res.statusCode).toBe(201);
    expect(res.body.post.image).toMatch(/\/uploads\/.*\.png$/);
  });

  it('P03: should create post with text and image', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${userToken}`])
      .field('text', 'Post with image')
      .attach('image', uploadPath);

    expect(res.statusCode).toBe(201);
    expect(res.body.post.text).toBe('Post with image');
    expect(res.body.post.image).toMatch(/\/uploads\/.*\.png$/);
  });
});

describe('❌ POST /api/posts - Negative Tests', () => {
  it('N01: should reject unauthenticated user', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ text: 'Unauthorized post' });

    expect(res.statusCode).toBe(401);
  });

  it('N02: should reject empty post (no text, no image)', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(400);
  });

  it.skip('N03: should reject invalid image format', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${userToken}`])
      .attach('image', invalidPath);
    
    expect([400, 415]).toContain(res.statusCode);
  });
});

describe('🔳 POST /api/posts - Edge Tests', () => {
  it('E01: should allow max-length text content (5000 chars)', async () => {
    const longText = 'a'.repeat(5000);
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${userToken}`])
      .send({ text: longText });

    expect(res.statusCode).toBe(201);
    expect(res.body.post.text.length).toBe(5000);
  });

  it('E02: should strip whitespace-only content', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${userToken}`])
      .send({ text: '   ' });

    expect(res.statusCode).toBe(400);
  });
});

describe('🔲 POST /api/posts - Corner Tests', () => {
  it('C01: should support creating post immediately after registration', async () => {
    const newUser = await User.create({ name: 'NewUser', email: 'new@mail.com', password: 'Pass123!' });
    const newToken = generateToken(newUser._id);

    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${newToken}`])
      .send({ text: 'New user post' });

    expect(res.statusCode).toBe(201);
  });

  it('C02: should handle multiple posts quickly in succession', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/posts')
        .set('Cookie', [`token=${userToken}`])
        .send({ text: `Burst post ${i}` });

      expect(res.statusCode).toBe(201);
    }
  });
});

describe('🔐 POST /api/posts - Security Tests', () => {
  it('S01: should sanitize script tags in content', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${userToken}`])
      .send({ text: '<script>alert("xss")</script>' });
    expect(res.statusCode).toBe(201);
    expect(res.body.post.text).not.toMatch(/<script>/i);
  });
});

describe('⚡ POST /api/posts - Performance Tests', () => {
  it(
    'P01: should handle 100 concurrent post creations in under 3s',
    async () => {
      const start = Date.now();

      await Promise.all(
        Array.from({ length: 100 }).map((_, i) =>
          request(app)
            .post('/api/posts')
            .set('Cookie', [`token=${userToken}`])
            .send({ text: `Performance test post ${i}` })
        )
      );

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(3000);
    },
    10000 // test timeout
  );
});

describe('♻️ POST /api/posts - Reliability Tests', () => {
  it('R01: should persist post in database', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`token=${userToken}`])
      .send({ text: 'Check DB persistence' });

    const postInDb = await Post.findById(res.body.post._id);
    expect(postInDb).not.toBeNull();
    expect(postInDb.text).toBe('Check DB persistence');
  });
});
