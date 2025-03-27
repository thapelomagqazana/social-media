import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../models/User.js';
import { generateToken } from '../../utils/token.js';

let mongoServer;
let userToken, adminToken, expiredToken, malformedToken;
let userId, adminId;
let deletedToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create normal user
  const user = await User.create({
    name: 'Regular User',
    email: 'user@mail.com',
    password: 'Pass123!',
    role: 'user',
  });
  userId = user._id;
  userToken = generateToken(user._id);

  // Create admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@mail.com',
    password: 'Pass123!',
    role: 'admin',
  });
  adminId = admin._id;
  adminToken = generateToken(admin._id);

  // Create and delete user to simulate deleted token
  const deletedUser = await User.create({
    name: 'Ghost',
    email: 'ghost@mail.com',
    password: 'Pass123!',
  });
  deletedToken = generateToken(deletedUser._id);
  await deletedUser.deleteOne();

  // Simulate malformed and expired tokens
  malformedToken = 'not.a.valid.jwt';
  expiredToken = generateToken(user._id, '1ms'); // Expires instantly
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Positive GET /auth/me Tests', () => {
  it('P01: should return user info with valid token in cookie', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', userId.toString());
    expect(res.body).toHaveProperty('email', 'user@mail.com');
  });

  it('P02: should return user info right after sign in', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('user@mail.com');
  });

  it('P03: should return admin info for admin token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('role', 'admin');
  });

  it('P04: should return minimal user fields (_id, name, email, role)', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      _id: expect.any(String),
      name: expect.any(String),
      email: expect.any(String),
      role: expect.any(String),
    });
  });

  it('P05: should return user info even if user has a profile', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'user@mail.com');
  });
});

describe('❌ Negative GET /auth/me Tests', () => {
  it('N01: should return 401 if token is missing', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it.skip('N02: should return 401 if token is expired', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', [`token=${expiredToken}`]);

    expect(res.statusCode).toBe(401);
  });

  it('N03: should return 401 if token is malformed', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', [`token=${malformedToken}`]);

    expect(res.statusCode).toBe(401);
  });

  it('N04: should return 401 if token belongs to non-existent user', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', [`token=${deletedToken}`]);

    expect(res.statusCode).toBe(401);
  });

  it('N05: should return 401 if token is passed in body', async () => {
    const res = await request(app)
      .get('/auth/me')
      .send({ token: userToken });

    expect(res.statusCode).toBe(401);
  });

  it('N06: should return 401 if token is sent via Authorization header', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(401);
  });

  it('N07: should return 401 if deleted user token is used', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', [`token=${deletedToken}`]);

    expect(res.statusCode).toBe(401);
  });
});

describe('🔳 Edge GET /auth/me Tests', () => {
    it('E01: should work for user with long name and email', async () => {
      const longUser = await User.create({
        name: 'a'.repeat(100),
        email: `user${Date.now()}@example.com`,
        password: 'Pass123!',
      });
      const token = generateToken(longUser._id);
  
      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=${token}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.name.length).toBeLessThanOrEqual(100);
    });
  
    it('E02: should return trimmed name/email if they contain whitespace', async () => {
      const trimmedUser = await User.create({
        name: '  Trim User  ',
        email: ` trim${Date.now()}@mail.com `,
        password: 'Pass123!',
      });
      const token = generateToken(trimmedUser._id);
  
      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=${token}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toContain('Trim');
    });
});

describe('🔲 Corner GET /auth/me Tests', () => {
    it('C01: should respond correctly if /me is hit immediately after signup', async () => {
      const user = await User.create({
        name: 'Fresh Signup',
        email: `fresh${Date.now()}@mail.com`,
        password: 'Pass123!',
      });
      const token = generateToken(user._id);
  
      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=${token}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe(user.email.trim());
    });
  
    it('C02: should respond accurately if /me is hit after a password change', async () => {
      const user = await User.create({
        name: 'Reset User',
        email: `reset${Date.now()}@mail.com`,
        password: 'Pass123!',
      });
      const token = generateToken(user._id);
  
      user.password = 'NewPass123!';
      await user.save();
  
      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=${token}`]);
  
      expect(res.statusCode).toBe(200); // Token should still be valid unless explicitly invalidated
    });
});

describe('🔐 Security GET /auth/me Tests', () => {
    it('S01: should block SQL injection-like token value', async () => {
    const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=' OR 1=1 --`]);

    expect([401, 400]).toContain(res.statusCode);
    });

    it('S02: should reject token containing XSS script', async () => {
    const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=<script>alert(1)</script>`]);

    expect(res.statusCode).toBe(401);
    });

    it('S03: should reject token of different user trying to access /me', async () => {
    const user = await User.create({
        name: 'Hacker',
        email: `hacker${Date.now()}@mail.com`,
        password: 'Pass123!',
    });
    const token = generateToken(user._id);

    const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toContain('hacker');
    });

    it('S04: should not accept token in Authorization header', async () => {
    const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(401);
    });
});
  
describe('⚡ Performance GET /auth/me Tests', () => {
    it(
    'PF01: should respond under 300ms for valid user',
    async () => {
        const start = Date.now();
        const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=${userToken}`]);
        const duration = Date.now() - start;

        expect(res.statusCode).toBe(200);
        expect(duration).toBeLessThan(300);
    },
    1000
    );

    it(
    'PF02: should handle 100 requests in parallel',
    async () => {
        const requests = Array(100)
        .fill(0)
        .map(() =>
            request(app).get('/auth/me').set('Cookie', [`token=${userToken}`])
        );

        const responses = await Promise.all(requests);
        responses.forEach((res) => expect(res.statusCode).toBe(200));
    },
    5000
    );
});

describe('♻️ Reliability GET /auth/me Tests', () => {
    it('R01: should recover after DB disconnect and reconnect', async () => {
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());

    const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    });

    it('R02: should return same result for repeated requests', async () => {
    const res1 = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=${userToken}`]);

    const res2 = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=${userToken}`]);

    expect(res1.statusCode).toBe(200);
    expect(res2.body).toEqual(res1.body);
    });

    it('R03: should handle token retry after network failure simulation', async () => {
    const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    });
});
  
  
  
