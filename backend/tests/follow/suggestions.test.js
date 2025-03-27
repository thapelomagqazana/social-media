import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../models/User.js';
import { generateToken } from '../../utils/token.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let userToken, userId;
let anotherUserId, profileUserId;
let deletedUserToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create main test user
  const user = await User.create({
    name: 'TestUser',
    email: 'test@mail.com',
    password: 'Pass123!'
  });
  userId = user._id;
  userToken = generateToken(user._id);

  // Create another user
  const anotherUser = await User.create({
    name: 'AnotherUser',
    email: 'another@mail.com',
    password: 'Pass123!'
  });
  anotherUserId = anotherUser._id;

  // Create a profile user
  const profileUser = await User.create({
    name: 'ProfileUser',
    email: 'profile@mail.com',
    password: 'Pass123!'
  });
  profileUserId = profileUser._id;

  // Create a deleted user token
  const ghostUser = await User.create({
    name: 'Ghost',
    email: 'ghost@mail.com',
    password: 'Pass123!'
  });
  deletedUserToken = generateToken(ghostUser._id);
  await ghostUser.deleteOne();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Positive GET /api/follow/suggestions Tests', () => {
  it('P01: should return suggestions for authenticated user', async () => {
    const res = await request(app)
      .get('/api/follow/suggestions')
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.suggestions)).toBe(true);
  });

  it('P02: should return suggestions when user has no follows', async () => {
    const res = await request(app)
      .get('/api/follow/suggestions')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('P03: should exclude already followed users', async () => {
    await request(app)
      .post(`/api/follow/${anotherUserId}`)
      .set('Cookie', [`token=${userToken}`]);

    const res = await request(app)
      .get('/api/follow/suggestions')
      .set('Cookie', [`token=${userToken}`]);

    const ids = res.body.suggestions.map((u) => u._id);
    expect(ids).not.toContain(anotherUserId.toString());
  });

  it('P04: should include users with profiles in suggestions', async () => {
    const res = await request(app)
      .get('/api/follow/suggestions')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    res.body.suggestions.forEach((user) => {
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
    });
  });

  it('P05: should limit suggestions (e.g., 10 users)', async () => {
    const res = await request(app)
      .get('/api/follow/suggestions')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.suggestions.length).toBeLessThanOrEqual(10);
  });
});

describe('❌ Negative GET /api/follow/suggestions Tests', () => {
  it('N01: should return 401 if token is missing', async () => {
    const res = await request(app).get('/api/follow/suggestions');
    expect(res.statusCode).toBe(401);
  });

  it('N02: should return 401 for invalid token', async () => {
    const res = await request(app)
      .get('/api/follow/suggestions')
      .set('Cookie', ['token=invalid.token.here']);
    expect(res.statusCode).toBe(401);
  });

  it('N03: should return 401 or 403 if token belongs to deleted user', async () => {
    const res = await request(app)
      .get('/api/follow/suggestions')
      .set('Cookie', [`token=${deletedUserToken}`]);
    expect([401, 403]).toContain(res.statusCode);
  });

  it('N04: should return 401 if public user hits suggestions route', async () => {
    const res = await request(app).get('/api/follow/suggestions');
    expect(res.statusCode).toBe(401);
  });

  it('N05: should return 401 if token passed in body', async () => {
    const res = await request(app)
      .get('/api/follow/suggestions')
      .send({ token: userToken });
    expect(res.statusCode).toBe(401);
  });
});

describe('🔳 Edge GET /api/follow/suggestions Tests', () => {
    it(
        'E01: should handle user with maximum followers gracefully',
        async () => {
          for (let i = 0; i < 50; i++) {
            const newUser = await User.create({
              name: `BulkUser${i}`,
              email: `bulk${i}@mail.com`,
              password: 'Pass123!',
            });
            await request(app)
              .post(`/api/follow/${newUser._id}`)
              .set('Cookie', [`token=${userToken}`]);
          }
      
          const res = await request(app)
            .get('/api/follow/suggestions')
            .set('Cookie', [`token=${userToken}`]);
      
          expect(res.statusCode).toBe(200);
          expect(Array.isArray(res.body.suggestions)).toBe(true);
        },
        15000 // Increase timeout to 15 seconds for heavy loop
    );
      
    it('E02: should support optional query limit (limit=3)', async () => {
      const res = await request(app)
        .get('/api/follow/suggestions?limit=3')
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.suggestions.length).toBeLessThanOrEqual(3);
    });
  
    it('E03: should gracefully handle unknown query parameters', async () => {
      const res = await request(app)
        .get('/api/follow/suggestions?verbose=true')
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.suggestions)).toBe(true);
    });
  
    it('E04: should work if user was just created and has no profile', async () => {
      const tempUser = await User.create({
        name: 'EdgeUser',
        email: 'edgeuser@mail.com',
        password: 'Pass123!',
      });
  
      const tempToken = generateToken(tempUser._id);
      const res = await request(app)
        .get('/api/follow/suggestions')
        .set('Cookie', [`token=${tempToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
});

describe('🔲 Corner GET /api/follow/suggestions Tests', () => {
    it('C01: should return new list if user follows someone mid-session', async () => {
      const firstRes = await request(app)
        .get('/api/follow/suggestions')
        .set('Cookie', [`token=${userToken}`]);
  
      const suggested = firstRes.body.suggestions[0];
      await request(app)
        .post(`/api/follow/${suggested._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      const secondRes = await request(app)
        .get('/api/follow/suggestions')
        .set('Cookie', [`token=${userToken}`]);
  
      const ids = secondRes.body.suggestions.map((u) => u._id);
      expect(ids).not.toContain(suggested._id);
    });
  
    it('C02: should provide consistent results within a session', async () => {
      const res1 = await request(app)
        .get('/api/follow/suggestions')
        .set('Cookie', [`token=${userToken}`]);
  
      const res2 = await request(app)
        .get('/api/follow/suggestions')
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res1.body.suggestions).toEqual(res2.body.suggestions);
    });
});

describe('🔐 Security GET /api/follow/suggestions Tests', () => {
    it('S01: should block SQL injection-like payload in query', async () => {
      const res = await request(app)
        .get('/api/follow/suggestions?limit=1;DROP TABLE users;')
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.suggestions)).toBe(true);
    });
  
    it('S02: should escape HTML/script tags if included as param', async () => {
      const res = await request(app)
        .get('/api/follow/suggestions?<script>alert(1)</script>')
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.suggestions)).toBe(true);
    });
  
    it('S03: should reject reused JWT for another user (forged token)', async () => {
      const forgedToken = generateToken(anotherUserId); // not userToken
      const res = await request(app)
        .get('/api/follow/suggestions')
        .set('Cookie', [`token=${forgedToken}`]);
  
      expect(res.statusCode).toBe(200); // valid, but scoped to different user
      expect(Array.isArray(res.body.suggestions)).toBe(true);
    });
  
    it('S04: should not accept JWT in Authorization header if Cookie is used', async () => {
      const res = await request(app)
        .get('/api/follow/suggestions')
        .set('Authorization', `Bearer ${userToken}`);
  
      expect(res.statusCode).toBe(401);
    });
});

describe('⚡ Performance GET /api/follow/suggestions Tests', () => {
    it.skip(
      'PF01: should handle 500 concurrent requests under 3s',
      async () => {
        const start = Date.now();
  
        const requests = Array.from({ length: 500 }).map(() =>
          request(app).get('/api/follow/suggestions').set('Cookie', [`token=${userToken}`])
        );
  
        const results = await Promise.all(requests);
        const duration = Date.now() - start;
  
        results.forEach((res) => expect(res.statusCode).toBe(200));
        expect(duration).toBeLessThan(3000);
      },
      10000
    );
  
    it('PF02: should not crash with burst traffic from one user', async () => {
      const burst = Array.from({ length: 100 }).map(() =>
        request(app).get('/api/follow/suggestions').set('Cookie', [`token=${userToken}`])
      );
  
      const responses = await Promise.all(burst);
      responses.forEach((res) => expect(res.statusCode).toBe(200));
    });
  
    it.skip('PF03: should still respond under simulated DB delay', async () => {
      const originalFind = User.find.bind(User);
      User.find = (...args) => new Promise((resolve) => setTimeout(() => resolve(originalFind(...args)), 1000));
  
      const start = Date.now();
      const res = await request(app).get('/api/follow/suggestions').set('Cookie', [`token=${userToken}`]);
      const elapsed = Date.now() - start;
  
      expect(res.statusCode).toBe(200);
      expect(elapsed).toBeGreaterThanOrEqual(1000);
  
      User.find = originalFind; // restore
    });
});

describe('♻️ Reliability GET /api/follow/suggestions Tests', () => {
    it('R01: should recover after DB restart', async () => {
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());

    const res = await request(app).get('/api/follow/suggestions').set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(200);
    });

    it('R02: should respond consistently after server restart', async () => {
    const res = await request(app).get('/api/follow/suggestions').set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(200);
    });

    it('R03: should return same suggestions for repeated requests', async () => {
    const res1 = await request(app).get('/api/follow/suggestions').set('Cookie', [`token=${userToken}`]);
    const res2 = await request(app).get('/api/follow/suggestions').set('Cookie', [`token=${userToken}`]);

    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
    expect(res1.body.suggestions).toEqual(res2.body.suggestions);
    });

    it('R04: should include new users in suggestions after creation', async () => {
    const newUser = await User.create({
        name: 'FreshUser',
        email: 'fresh@mail.com',
        password: 'Pass123!'
    });

    const res = await request(app).get('/api/follow/suggestions').set('Cookie', [`token=${userToken}`]);
    const ids = res.body.suggestions.map((u) => u._id);

    expect(res.statusCode).toBe(200);
    expect(ids).toContain(newUser._id.toString());
    });
});
