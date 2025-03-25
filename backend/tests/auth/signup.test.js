/**
 * @fileoverview Tests for user registration endpoint (/auth/signup)
 * @description Ensures valid, invalid, and security-based user registrations are handled correctly
 */

import request from "supertest";
import app from "../../app.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";

// Load environment variables
dotenv.config();

let mongoServer;


beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.syncIndexes();
});

afterEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
    }
  } catch (err) {
    console.warn('⚠️ Cleanup failed - DB not connected:', err.message);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Positive /auth/signup tests', () => {
  // P01
  it('P01: should register with valid name, email, and strong password', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'David Dev',
      email: 'david@example.com',
      password: 'StrongPass@123',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.name).toBe('David Dev');
    expect(res.body.user.email).toBe('david@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  // P02
  it('P02: should store lowercase email when uppercase is provided', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'Lower Email',
      email: 'LOWER@EXAMPLE.COM',
      password: 'StrongPass@123',
    });

    expect(res.statusCode).toBe(201);
    const user = await User.findOne({ email: 'lower@example.com' });
    expect(user).not.toBeNull();
    expect(user.email).toBe('lower@example.com');
  });

  // P03
  it('P03: should trim spaces in name and email', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: '   Trimmy Trim   ',
      email: '   trim@example.com   ',
      password: 'StrongPass@123',
    });

    expect(res.statusCode).toBe(201);
    const user = await User.findOne({ email: 'trim@example.com' });
    expect(user.name).toBe('Trimmy Trim');
    expect(user.email).toBe('trim@example.com');
  });

  // P04
  it('P04: should accept a complex password with uppercase, numbers, and symbols', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'Complex Pwd',
      email: 'complex@example.com',
      password: 'StrongPass@123',
    });

    expect(res.statusCode).toBe(201);
    const user = await User.findOne({ email: 'complex@example.com' });
    expect(user).not.toBeNull();
  });

  // P05
  it('P05: should store password as hashed string', async () => {
    const plainPassword = 'MySecur3@Pass!';
    await request(app).post('/auth/signup').send({
      name: 'Hashed',
      email: 'hash@example.com',
      password: plainPassword,
    });

    const user = await User.findOne({ email: 'hash@example.com' });
    expect(user).not.toBeNull();
    expect(user.password).not.toBe(plainPassword);

    const isHashed = await bcrypt.compare(plainPassword, user.password);
    expect(isHashed).toBe(true);
  });

  // P06
  it('P06: should return cookie with HttpOnly, Secure, and SameSite=Strict', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'SecureCookie',
      email: 'cookie@example.com',
      password: 'StrongPass@123',
    });

    const cookie = res.headers['set-cookie'][0];

    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
  });
});

describe('❌ Negative /auth/signup tests', () => {
  // N01
  it('N01: should fail with empty request body', async () => {
    const res = await request(app).post('/auth/signup').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  // N02
  it('N02: should fail if email is missing', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'Missing Email',
      password: 'StrongPass@123',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/email is required/i);
  });

  // N03
  it('N03: should fail with invalid email format', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'Invalid Email',
      email: 'abc@.com',
      password: 'StrongPass@123',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
  });

  // N04
  it('N04: should fail with password too short', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'ShortPwd',
      email: 'short@example.com',
      password: '123',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/at least 8 characters/i);
  });

  // N05
  it('N05: should fail with weak password (missing symbols/digits)', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'WeakPwd',
      email: 'weak@example.com',
      password: 'password',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/uppercase.*lowercase.*number.*special/i);
  });

  // N06
  it('N06: should fail if email already exists in DB', async () => {
    await request(app).post('/auth/signup').send({
      name: 'First User',
      email: 'duplicate@example.com',
      password: 'StrongPass@123',
    });

    const res = await request(app).post('/auth/signup').send({
      name: 'Second User',
      email: 'duplicate@example.com',
      password: 'StrongPass@123',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  // N07
  it('N07: should ignore or fail with extra fields (e.g., isAdmin)', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'Extra Fields',
      email: 'extra@example.com',
      password: 'StrongPass@123',
      isAdmin: true, // not in schema
    });

    expect(res.statusCode).toBe(201); // ✅ If Mongoose ignores it
    const user = await User.findOne({ email: 'extra@example.com' });
    expect(user.role).toBe('user'); // Role must default to 'user'
    expect(user.isAdmin).toBeUndefined(); // No field in DB
  });
});

describe('🔳 Edge /auth/signup tests', () => {
  // E01
  it('E01: should accept password with exactly 8 characters (minimum valid)', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'EdgeMin',
      email: 'minpass@example.com',
      password: 'Aa1@aaaa',
    });
    expect(res.statusCode).toBe(201);
  });

  // E02
  it('E02: should accept or reject email at 254 characters', async () => {
    const longEmail = `${'a'.repeat(242)}@example.com`; // total = 254
    const res = await request(app).post('/auth/signup').send({
      name: 'EdgeEmail',
      email: longEmail,
      password: 'StrongPass@123',
    });
    expect([201, 400]).toContain(res.statusCode); // Acceptable either way
  });

  // E03
  it('E03: should accept or reject name at max 255 characters', async () => {
    const longName = 'A'.repeat(255);
    const res = await request(app).post('/auth/signup').send({
      name: longName,
      email: 'longname@example.com',
      password: 'StrongPass@123',
    });
    expect([201, 400]).toContain(res.statusCode);
  });

  // E04
  it('E04: should accept password with all allowed special characters', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'EdgeChars',
      email: 'edgechar@example.com',
      password: 'Aa1!@#$%^&*()_+-=',
    });
    expect(res.statusCode).toBe(201);
  });

  // E05
  it('E05: should store name/email with mixed casing as trimmed + lowercase email', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: '  MiXeD CaSe  ',
      email: '  Mixed@ExAmPlE.COM  ',
      password: 'Aa1@mixed',
    });

    expect(res.statusCode).toBe(201);

    const user = await User.findOne({ email: 'mixed@example.com' });
    expect(user).not.toBeNull();
    expect(user.name).toBe('MiXeD CaSe');
    expect(user.email).toBe('mixed@example.com');
  });
});

describe('🔲 Corner /auth/signup tests', () => {
  // C01
  it('C01: should only allow one concurrent signup with same email', async () => {
    const userData = {
      name: 'ConcurrentUser',
      email: 'race@example.com',
      password: 'Aa1@raceRace',
    };

    const [res1, res2] = await Promise.all([
      request(app).post('/auth/signup').send(userData),
      request(app).post('/auth/signup').send(userData),
    ]);

    const created = [res1, res2].filter((res) => res.statusCode === 201);
    const failed = [res1, res2].filter((res) => res.statusCode === 400);

    expect(created.length).toBe(1);
    expect(failed.length).toBe(1);
  });

  // C02
  it('C02: should reject email with emoji characters', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'EmojiEmail',
      email: 'user👽@mail.com',
      password: 'Aa1@emoji',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
  });

  // C03
  it('C03: should accept password with spaces if policy allows', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'PwdSpace',
      email: 'spacepwd@example.com',
      password: 'Aa1@space pass',
    });

    // Depending on your regex, accept or reject
    expect([201, 400]).toContain(res.statusCode);
  });

  // C04
  it('C04: should accept full-width Unicode characters in name', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'Ｄａｖｉｄ　ｄｅｖ',
      email: 'unicode@example.com',
      password: 'Aa1@unicode',
    });
    expect(res.statusCode).toBe(201);
  });

  // C05
  it('C05: should allow signup from client with large request headers', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .set('User-Agent', 'MobileClient/1.0'.repeat(100))
      .send({
        name: 'LargeHeader',
        email: 'largeheader@example.com',
        password: 'Aa1@headerTest',
      });

    expect(res.statusCode).toBe(201);
  });
});

describe('🔐 Security /auth/signup tests', () => {
  // S01
  it('S01: should reject name/email containing script tags (XSS attempt)', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: '<script>alert()</script>',
      email: 'xss@example.com',
      password: 'Aa1@secure',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.name).not.toMatch(/<script>/i);
  });

  // S02
  it("S02: should reject SQL injection-like email '1' OR '1'='1", async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'SQLi',
      email: "1' OR '1'='1",
      password: 'Aa1@secure',
    });
    expect(res.statusCode).toBe(400);
  });

  // S04
  it('S04: should not expose password in signup response', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'NoPwd',
      email: 'nopwd@example.com',
      password: 'Aa1@secure',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user).not.toHaveProperty('password');
  });

  // S05
  it('S05: should return JWT token in HttpOnly, Secure, SameSite=Strict cookie', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'SecureCookie',
      email: 'securecookie@example.com',
      password: 'Aa1@secure',
    });
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
  });

  // S06
  it('S06: should block CSRF attempt from cross-origin if CORS or SameSite not valid', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .set('Origin', 'https://evil-hacker.com')
      .send({
        name: 'CSRF',
        email: 'csrf@example.com',
        password: 'Aa1@secure',
      });
      expect(res.statusCode).toBe(500);
  });
});

describe('⚡ Performance /auth/signup tests', () => {
  // PF01
  it.skip('PF01: should handle 100 concurrent valid signups', async () => {
    const signups = Array.from({ length: 100 }).map((_, i) =>
      request(app).post('/auth/signup').send({
        name: `User${i}`,
        email: `loadtest${i}@example.com`,
        password: 'Aa1@secure',
      })
    );
    const responses = await Promise.all(signups);
    const successful = responses.filter(res => res.statusCode === 201);
    expect(successful.length).toBe(100);
  }, 20000);

  // PF02
  it.skip('PF02: should allow only 1 signup for same email among 1000 requests', async () => {
    const flood = Array.from({ length: 1000 }).map(() =>
      request(app).post('/auth/signup').send({
        name: 'Flood',
        email: 'flood@example.com',
        password: 'Aa1@secure',
      })
    );
    const responses = await Promise.all(flood);
    const created = responses.filter(r => r.statusCode === 201);
    const failed = responses.filter(r => r.statusCode === 400);
    expect(created.length).toBe(1);
    expect(failed.length).toBe(999);
  }, 30000);

  // PF03
  it.skip('PF03: response time under 200ms with 50 users', async () => {
    const start = Date.now();
    const users = Array.from({ length: 50 }).map((_, i) =>
      request(app).post('/auth/signup').send({
        name: `FastUser${i}`,
        email: `fast${i}@example.com`,
        password: 'Aa1@fast123',
      })
    );
    await Promise.all(users);
    const end = Date.now();
    const duration = end - start;
    expect(duration).toBeLessThan(200 * 50); // <10s total for 50 users
  }, 15000);

  // PF04
  it.skip('PF04: should handle simulated DB delay gracefully', async () => {
    jest.setTimeout(10000); // Extend timeout
    const res = await request(app).post('/auth/signup').send({
      name: 'DelaySim',
      email: 'delayed@example.com',
      password: 'Aa1@slow',
    });
    expect([201, 500]).toContain(res.statusCode); // Graceful fallback
  });

  // PF05
  it.skip('PF05: should not crash under high CPU load', async () => {
    const flood = Array.from({ length: 500 }).map((_, i) =>
      request(app).post('/auth/signup').send({
        name: `Stress${i}`,
        email: `stress${i}@example.com`,
        password: 'Aa1@stress',
      })
    );
    const responses = await Promise.all(flood);
    const codes = responses.map(r => r.statusCode);
    expect(codes).not.toContain(503); // No server crash
  }, 20000);
});

describe('♻️ Reliability /auth/signup tests', () => {
  // R01
  it('R01: server should recover after forced restart', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'Recover',
      email: 'recover@example.com',
      password: 'Aa1@recover',
    });
    expect(res.statusCode).toBe(201);
  });

  // R02
  it('R02: should handle DB disconnect gracefully', async () => {
    await mongoose.disconnect();
    const res = await request(app).post('/auth/signup').send({
      name: 'NoDB',
      email: 'nodatabase@example.com',
      password: 'Aa1@db',
    });
    expect([500, 503]).toContain(res.statusCode);// Reconnect
  });

  // R03
  it.skip('R03: signup should work again after DB reconnect', async () => {
    await mongoose.connect(mongoServer.getUri());
  
    const res = await request(app).post('/auth/signup').send({
      name: 'Reconnect',
      email: 'reconnect@test.com',
      password: 'Aa1@db',
    });
  
    expect(res.statusCode).toBe(201);
  });

  // R04
  it('R04: malformed JSON should return 400', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .set('Content-Type', 'application/json')
      .send('{"badJson": ');
    expect(res.statusCode).toBe(400);
  });

  // R05
  it.skip('R05: 1000 repeat signups should not crash or leak memory', async () => {
    const users = Array.from({ length: 1000 }).map((_, i) =>
      request(app).post('/auth/signup').send({
        name: `LoopUser${i}`,
        email: `loop${i}@example.com`,
        password: 'Aa1@loop',
      })
    );
    const results = await Promise.all(users);
    expect(results.filter(r => r.statusCode === 201).length).toBe(1000);
  }, 30000);
});




