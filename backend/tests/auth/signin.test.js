/**
 * @fileoverview Tests for user authentication endpoint (/auth/signin)
 * @description Ensures login functionality works correctly, including validation and security cases.
 */

import request from "supertest";
import app from "../../app.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/User.js"; // Import User model

// Load environment variables
dotenv.config();

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.syncIndexes(); // Ensure unique indexes exist
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany();
});

// Helper to create a user for signin tests
const createTestUser = async () => {
  await request(app).post('/auth/signup').send({
    name: 'Test User',
    email: 'test.user@example.com',
    password: 'Aa1@secure',
  });
};

describe('✅ Positive /auth/signin tests', () => {
  beforeEach(async () => {
    await createTestUser();
  });

  // P01
  it('P01: should login with correct email and password', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'test.user@example.com',
      password: 'Aa1@secure',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('test.user@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  // P02
  it('P02: should login with email in different casing', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'TEST.USER@EXAMPLE.COM',
      password: 'Aa1@secure',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('test.user@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  // P03
  it('P03: should login with trimmed email', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: '  test.user@example.com  ',
      password: 'Aa1@secure',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('test.user@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  // P04
  it('P04: should allow login multiple times and return new token each time', async () => {
    const res1 = await request(app).post('/auth/signin').send({
      email: 'test.user@example.com',
      password: 'Aa1@secure',
    });

    const res2 = await request(app).post('/auth/signin').send({
      email: 'test.user@example.com',
      password: 'Aa1@secure',
    });

    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
    expect(res1.headers['set-cookie']).toBeDefined();
    expect(res2.headers['set-cookie']).toBeDefined();
    expect(res1.headers['set-cookie'][0]).not.toEqual(res2.headers['set-cookie'][0]);
  });
});

describe('❌ Negative /auth/signin tests', () => {
  beforeEach(async () => await createTestUser());

  // N01
  it('N01: should fail with empty request body', async () => {
    const res = await request(app).post('/auth/signin').send({});
    expect(res.statusCode).toBe(400);
  });

  // N02
  it('N02: should fail if email is missing', async () => {
    const res = await request(app).post('/auth/signin').send({
      password: 'Aa1@secure',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  // N03
  it('N03: should fail if password is missing', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'test.user@example.com',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/password/i);
  });

  // N04
  it('N04: should fail with incorrect email', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'wrong.email@example.com',
      password: 'Aa1@secure',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  // N05
  it('N05: should fail with incorrect password', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'test.user@example.com',
      password: 'Wrong@123',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  // N06
  it('N06: should fail with invalid email format', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'invalid-email',
      password: 'Aa1@secure',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
  });
});

describe('🔳 Edge /auth/signin tests', () => {
  beforeEach(async () => await createTestUser());

  // E01
  it('E01: should login with very long but valid email and password', async () => {
    const longEmail = 'a'.repeat(240) + '@mail.com';
    const longPassword = 'Aa1@' + 'x'.repeat(100);
    await User.create({
      name: 'EdgeCase',
      email: longEmail,
      password: longPassword,
    });

    const res = await request(app).post('/auth/signin').send({
      email: longEmail,
      password: longPassword,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  // E02
  it('E02: should login with very short but valid password', async () => {
    await User.create({
      name: 'EdgeMinPwd',
      email: 'minpwd@example.com',
      password: 'Aa1@aaaa',
    });

    const res = await request(app).post('/auth/signin').send({
      email: 'minpwd@example.com',
      password: 'Aa1@aaaa',
    });

    expect(res.statusCode).toBe(200);
  });

  // E03
  it('E03: should login with special characters in email/password', async () => {
    const email = 'minpwd@example.com';
    const password = 'We!rd@123';

    await User.create({
      name: 'SpecialCharUser',
      email,
      password,
    });

    const res = await request(app).post('/auth/signin').send({ email, password });
    expect(res.statusCode).toBe(200);
  });

  // E04
  it('E04: should accept case-insensitive email and case-sensitive password', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'TEST.USER@EXAMPLE.COM',
      password: 'Aa1@secure',
    });

    expect(res.statusCode).toBe(200);
  });
});

describe('🔲 Corner /auth/signin tests', () => {
  beforeEach(async () => await createTestUser());

  // C01
  it('C01: should allow two concurrent login attempts with unique tokens', async () => {
    const [res1, res2] = await Promise.all([
      request(app).post('/auth/signin').send({
        email: 'test.user@example.com',
        password: 'Aa1@secure',
      }),
      request(app).post('/auth/signin').send({
        email: 'test.user@example.com',
        password: 'Aa1@secure',
      }),
    ]);

    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
    expect(res1.headers['set-cookie']).toBeDefined();
    expect(res2.headers['set-cookie']).toBeDefined();
    expect(res1.headers['set-cookie'][0]).not.toEqual(res2.headers['set-cookie'][0]);
  });

  // C02
  it('C02: should login immediately after signup', async () => {
    const newUser = {
      name: 'FreshUser',
      email: 'fresh.user@example.com',
      password: 'Aa1@fresh',
    };

    await request(app).post('/auth/signup').send(newUser);

    const res = await request(app).post('/auth/signin').send({
      email: newUser.email,
      password: newUser.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  // C03
  it('C03: should fail login if user is deleted right before login', async () => {
    await User.create({
      name: 'ToDelete',
      email: 'delete.me@example.com',
      password: 'Aa1@byeBye',
    });

    // simulate delay and deletion
    await User.deleteOne({ email: 'delete.me@example.com' });

    const res = await request(app).post('/auth/signin').send({
      email: 'delete.me@example.com',
      password: 'Aa1@byeBye',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });
});

describe('🔐 Security /auth/signin tests', () => {
  beforeEach(async () => await createTestUser());

  // S01
  it('S01: should fail with SQL injection payload in email/password', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: "' OR 1=1 --",
      password: "' OR ''='",
    });

    expect([400, 401]).toContain(res.statusCode);
    expect(res.body.message).not.toMatch(/mongo|cast|syntax/i);
  });

  // S02
  it('S02: should fail with script injection in email field', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: '<script>alert(1)</script>',
      password: 'anyPassword123!',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
  });

  // S03 (Simulated brute-force rate-limit check – skip for unit tests)
  it.skip('S03: should simulate brute-force login attempts (rate-limit check)', async () => {
    for (let i = 0; i < 20; i++) {
      await request(app).post('/auth/signin').send({
        email: 'test.user@example.com',
        password: 'WrongPass@' + i,
      });
    }
    // Should be handled via middleware like express-rate-limit or fail2ban
    // This is just a placeholder for your API gateway or security layer test
  });

  // S04
  it('S04: should not return password in response', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'test.user@example.com',
      password: 'Aa1@secure',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.password).toBeUndefined();
  });

  // S05
  it('S05: should set secure cookie with HttpOnly, SameSite=Strict', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'test.user@example.com',
      password: 'Aa1@secure',
    });

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=Strict/);
  });
});

describe('♻️ Reliability /auth/signin tests', () => {
  beforeEach(async () => await createTestUser());

  // R01
  it('R01: should allow login after 2 failed attempts', async () => {
    await request(app).post('/auth/signin').send({
      email: 'test.user@example.com',
      password: 'Wrong@1',
    });

    await request(app).post('/auth/signin').send({
      email: 'test.user@example.com',
      password: 'Wrong@2',
    });

    const res = await request(app).post('/auth/signin').send({
      email: 'test.user@example.com',
      password: 'Aa1@secure',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  // R02
  it.skip('R02: should allow login after simulated server restart', async () => {
    // You would restart your server manually or mock token validation here
    // Simulate token-based re-authentication with an existing cookie
    expect(true).toBe(true); // placeholder for e2e suite or persistent storage test
  });

  // R03
  it('R03: should return 400 for corrupted request body', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .set('Content-Type', 'application/json')
      .send('This is not JSON'); // invalid body

    expect([400, 415]).toContain(res.statusCode);
  });
});


describe('⚡ Performance /auth/signin tests', () => {
  beforeEach(async () => await createTestUser());

  // PF01
  it.skip(
    'PF01: should allow 100 valid logins under 9 seconds',
    async () => {
      const start = Date.now();
      const promises = [];
  
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app).post('/auth/signin').send({
            email: 'test.user@example.com',
            password: 'Aa1@secure',
          })
        );
      }
  
      const responses = await Promise.all(promises);
      const elapsed = Date.now() - start;
  
      const all200 = responses.every((res) => res.statusCode === 200);
      expect(all200).toBe(true);
      expect(elapsed).toBeLessThan(9000); // performance validation
    },
    12000
  );  

  // PF02
  it('PF02: should handle 100 invalid attempts with consistent performance', async () => {
    const start = Date.now();
    const promises = [];

    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app).post('/auth/signin').send({
          email: 'fake.user@example.com',
          password: 'WrongPass@' + i,
        })
      );
    }

    const responses = await Promise.all(promises);
    const elapsed = Date.now() - start;

    const all401 = responses.every((res) => res.statusCode === 401 || res.statusCode === 400);
    expect(all401).toBe(true);
    expect(elapsed).toBeLessThan(5000);
  });
});

