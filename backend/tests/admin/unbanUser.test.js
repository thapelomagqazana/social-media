const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app.js');
const User = require('../../models/User.js');
const { generateToken } = require('../../utils/token.js');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let admin, adminToken, userToken, bannedUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  admin = await User.create({
    name: 'Admin',
    email: 'admin@mail.com',
    password: 'Pass123!@#',
    role: 'admin'
  });
  adminToken = generateToken(admin._id);

  bannedUser = await User.create({
    name: 'Banned User',
    email: 'banned@mail.com',
    password: 'Pass123!@#',
    isBanned: true
  });

  const user = await User.create({
    name: 'Normal User',
    email: 'user@mail.com',
    password: 'Pass123!@#'
  });
  userToken = generateToken(user._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Positive Test Cases', () => {
  it('P01: Admin successfully unbans a user', async () => {
    const res = await request(app)
      .put(`/api/admin/unban/${bannedUser._id}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/unbanned/i);
  });

  it('P02: Admin unbans an already unbanned user (idempotent)', async () => {
    const res = await request(app)
      .put(`/api/admin/unban/${bannedUser._id}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
  });
});

describe('❌ Negative Test Cases', () => {
  it('N01: No auth token provided', async () => {
    const res = await request(app).put(`/api/admin/unban/${bannedUser._id}`);
    expect(res.statusCode).toBe(401);
  });

  it('N02: Invalid or expired token', async () => {
    const res = await request(app)
      .put(`/api/admin/unban/${bannedUser._id}`)
      .set('Cookie', ['token=invalidtoken']);
    expect(res.statusCode).toBe(401);
  });

  it('N04: Logged-in user is not admin', async () => {
    const res = await request(app)
      .put(`/api/admin/unban/${bannedUser._id}`)
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(403);
  });

  it('N05: Target user does not exist', async () => {
    const nonExistent = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/admin/unban/${nonExistent}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(404);
  });

  it('N06: Admin tries to unban themselves', async () => {
    const res = await request(app)
      .put(`/api/admin/unban/${admin._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect([400, 403]).toContain(res.statusCode);
  });

  it('N07: Malformed userId', async () => {
    const res = await request(app)
      .put(`/api/admin/unban/123abc`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(400);
  });
});

describe('🔐 Security & 🔲 Corner Tests', () => {
  it('S01: Forged JWT', async () => {
    const res = await request(app)
      .put(`/api/admin/unban/${bannedUser._id}`)
      .set('Cookie', [`token=forged.token.value`]);
    expect(res.statusCode).toBe(401);
  });

  it('S02: NoSQL Injection in userId', async () => {
    const res = await request(app)
      .put('/api/admin/unban/{$ne:null}')
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(400);
  });

  it.skip('S03: XSS in userId', async () => {
    const res = await request(app)
      .put('/api/admin/unban/<script>alert(1)</script>')
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(400);
  });
});
