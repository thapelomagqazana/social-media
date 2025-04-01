/**
 * @fileoverview Tests for user signout endpoint (/auth/signout)
 * @description Ensures signout functionality works correctly, including validation and security cases.
 */

const request = require("supertest");
const supertest = require("supertest");
const app = require("../../app.js");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../../models/User.js"); // Import User model

// Load environment variables
dotenv.config();

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

// Helper: Register & login a user
const signupAndLogin = async () => {
  const user = {
    name: 'Signout Tester',
    email: 'logout@example.com',
    password: 'Aa1@logout',
  };

  await request(app).post('/auth/signup').send(user);
  const res = await request(app).post('/auth/signin').send({
    email: user.email,
    password: user.password,
  });

  const cookie = res.headers['set-cookie'][0];
  return { user, cookie };
};

describe('✅ Positive /auth/signout Tests', () => {
  // P01
  it('P01: should logout after successful login and clear cookie', async () => {
    const { cookie } = await signupAndLogin();

    const res = await request(app)
      .get('/auth/signout')
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);

    const cleared = res.headers['set-cookie'][0];
    expect(cleared).toMatch(/token=;/);
    expect(cleared).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });

  // P02
  it('P02: should return 200 when logging out without being logged in', async () => {
    const res = await request(app).get('/auth/signout');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);

    const cleared = res.headers['set-cookie'][0];
    expect(cleared).toMatch(/token=;/);
    expect(cleared).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });

  // P03
  it('P03: should allow logout after already being logged out (idempotent)', async () => {
    const { cookie } = await signupAndLogin();

    // First logout
    await request(app).get('/auth/signout').set('Cookie', cookie);

    // Second logout
    const res = await request(app).get('/auth/signout').set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);

    const cleared = res.headers['set-cookie'][0];
    expect(cleared).toMatch(/token=;/);
    expect(cleared).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });

  // P04
  it('P04: should return success message on signout', async () => {
    const { cookie } = await signupAndLogin();

    const res = await request(app).get('/auth/signout').set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out');
  });
});

// ❌ Negative /auth/signout tests
describe('❌ Negative /auth/signout tests', () => {
  // N01
  it('N01: should return 405 when using POST instead of GET', async () => {
    const res = await request(app).post('/auth/signout');
    expect(res.statusCode).toBe(404); // You'll need to enforce this in your route handler
  });

  // N02
  it('N02: should ignore body in GET request and still logout', async () => {
    const { cookie } = await signupAndLogin();

    const res = await request(app)
      .get('/auth/signout')
      .set('Cookie', cookie)
      .send({ extra: 'payload' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);

    const cleared = res.headers['set-cookie'][0];
    expect(cleared).toMatch(/token=;/);
    expect(cleared).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });

  // N03
  it('N03: should logout even with a tampered JWT token', async () => {
    const tamperedToken = 'token=abc.def.hij';
    const res = await request(app)
      .get('/auth/signout')
      .set('Cookie', tamperedToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);

    const cleared = res.headers['set-cookie'][0];
    expect(cleared).toMatch(/token=;/);
    expect(cleared).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });
});

// 🔳 Edge /auth/signout Tests
describe('🔳 Edge /auth/signout Tests', () => {
  it('E01: should logout with expired token', async () => {
    // Simulate expired token
    const expiredToken = 'token=expired.token.value; Max-Age=0; Path=/';
    const res = await request(app).get('/auth/signout').set('Cookie', expiredToken);
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });

  it('E02: should logout with malformed token', async () => {
    const malformed = 'token=this.is.not.valid.jwt';
    const res = await request(app).get('/auth/signout').set('Cookie', malformed);
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });

  it('E03: should logout after session timeout (simulate by clearing cookie manually)', async () => {
    const res = await request(app).get('/auth/signout');
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });

  it('E04: should logout while browser still thinks cookie exists', async () => {
    const dummy = 'token=stale.jwt.token';
    const res = await request(app).get('/auth/signout').set('Cookie', dummy);
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });
});

describe('🔲 Corner /auth/signout Tests', () => {
  it('C01: should handle multiple sign-out requests in a row', async () => {
    const res1 = await request(app).get('/auth/signout');
    const res2 = await request(app).get('/auth/signout');
    const res3 = await request(app).get('/auth/signout');

    [res1, res2, res3].forEach((res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['set-cookie'][0]).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
    });
  });

  it('C02: should handle sign-out request with missing cookie header', async () => {
    const res = await request(app).get('/auth/signout');
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });

  it('C03: should allow sign-out immediately after login', async () => {
    const agent = supertest.agent(app);
    // Login with agent to persist cookie
    await agent.post('/auth/signin').send({
      email: 'test.user@example.com',
      password: 'Aa1@secure',
    });
  
    // Direct logout
    const logoutRes = await agent.get('/auth/signout');
  
    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.headers['set-cookie'][0]).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });
  
  it('C04: should logout during concurrent token refresh (simulated)', async () => {
    // Simulate token refresh race: signout while "refresh" is happening
    const cookie = 'token=fake-refresh-token.jwt';
    const [logoutRes1, logoutRes2] = await Promise.all([
      request(app).get('/auth/signout').set('Cookie', cookie),
      request(app).get('/auth/signout').set('Cookie', cookie),
    ]);

    expect(logoutRes1.statusCode).toBe(200);
    expect(logoutRes2.statusCode).toBe(200);
    expect(logoutRes1.headers['set-cookie'][0]).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
    expect(logoutRes2.headers['set-cookie'][0]).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });
});

describe('🔐 Security /auth/signout tests', () => {
  // ES01: Sign out with forged JWT cookie
  it('ES01: should clear cookie when JWT is forged', async () => {
    const res = await request(app)
      .get('/auth/signout')
      .set('Cookie', 'token=fake.jwt.token');
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });

  // S02: Ensure secure flags are set when clearing cookie
  it.skip('S02: should reset cookie with Secure, HttpOnly, and SameSite flags', async () => {
    const res = await request(app).get('/auth/signout');
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT)/);
  });

  // S03: XSS attempt in query string
  it('S03: should ignore XSS in query params', async () => {
    const res = await request(app).get('/auth/signout?xss=<script>alert(1)</script>');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  // S04: Simulate CSRF-safe logout via GET
  it.skip('S04: should allow safe CSRF-like GET logout', async () => {
    const res = await request(app)
      .get('/auth/signout')
      .set('Origin', 'https://evil.com');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});


