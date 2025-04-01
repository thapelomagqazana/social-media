const request = require('supertest');
const app = require('../../app.js');
const mongoose = require('mongoose');
const User = require('../../models/User.js');
const { generateToken } = require('../../utils/token.js');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let adminUser, regularUser, adminToken, regularToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({
    name: 'Admin',
    email: 'admin@mail.com',
    password: 'Pass123!@#',
    role: 'admin'
  });

  regularUser = await User.create({
    name: 'Regular',
    email: 'user@mail.com',
    password: 'Pass123!@#',
    role: 'user'
  });

  adminToken = generateToken(adminUser._id);
  regularToken = generateToken(regularUser._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Admin Ban User - Positive Tests', () => {
  it('P01: Admin successfully bans a regular user', async () => {
    const res = await request(app)
      .put(`/api/admin/ban/${regularUser._id}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
    const updated = await User.findById(regularUser._id);
    expect(updated.isBanned).toBe(true);
  });

  it('P02: Admin bans a user who is already banned', async () => {
    const res = await request(app)
      .put(`/api/admin/ban/${regularUser._id}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/banned/i);
  });

  it('P03: Admin re-bans after unbanning', async () => {
    await User.findByIdAndUpdate(regularUser._id, { isBanned: false });

    const res = await request(app)
      .put(`/api/admin/ban/${regularUser._id}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
    const updated = await User.findById(regularUser._id);
    expect(updated.isBanned).toBe(true);
  });
});

describe('❌ Admin Ban User - Negative Tests', () => {
  it('N01: No auth token provided', async () => {
    const res = await request(app).put(`/api/admin/ban/${regularUser._id}`);
    expect(res.statusCode).toBe(401);
  });

  it('N02: Invalid or expired token', async () => {
    const res = await request(app)
      .put(`/api/admin/ban/${regularUser._id}`)
      .set('Cookie', [`token=invalidtoken`]);
    expect(res.statusCode).toBe(401);
  });

  it('N03: Token in body instead of header', async () => {
    const res = await request(app)
      .put(`/api/admin/ban/${regularUser._id}`)
      .send({ token: adminToken });
    expect(res.statusCode).toBe(401);
  });

  it('N04: Logged-in user is not admin', async () => {
    const res = await request(app)
      .put(`/api/admin/ban/${adminUser._id}`)
      .set('Cookie', [`token=${regularToken}`]);
    expect(res.statusCode).toBe(403);
  });

  it('N05: Target user does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/admin/ban/${fakeId}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(404);
  });

  it('N06: Admin tries to ban themselves', async () => {
    const res = await request(app)
      .put(`/api/admin/ban/${adminUser._id}`)
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(400);
  });

  it('N07: Malformed userId (not ObjectId)', async () => {
    const res = await request(app)
      .put('/api/admin/ban/invalidId')
      .set('Cookie', [`token=${adminToken}`]);
    expect(res.statusCode).toBe(400);
  });
});

describe('🔳 Edge & Corner Cases - PUT /api/admin/ban/:userId', () => {
    it.skip('E01: Admin bans 1000 users sequentially', async () => {
    const users = await User.insertMany(
        Array.from({ length: 1000 }).map((_, i) => ({
        name: `user${i}`,
        email: `user${i}@mail.com`,
        password: 'User123!@#'
        }))
    );

    for (const user of users) {
        const res = await request(app)
        .put(`/api/admin/ban/${user._id}`)
        .set('Cookie', [`token=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.isBanned).toBe(true);
    }
    });

    it('E02: Admin bans and unbans repeatedly', async () => {
    const user = await User.create({
        name: 'Flipper',
        email: 'flip@mail.com',
        password: 'Flip123!@#'
    });

    for (let i = 0; i < 3; i++) {
        const banRes = await request(app)
        .put(`/api/admin/ban/${user._id}`)
        .set('Cookie', [`token=${adminToken}`]);
        expect(banRes.statusCode).toBe(200);

        const unbanRes = await request(app)
        .put(`/api/admin/unban/${user._id}`)
        .set('Cookie', [`token=${adminToken}`]);
        expect(unbanRes.statusCode).toBe(200);
    }
    });

    it.skip('E03: Admin bans user with many followers/posts', async () => {
    const influencer = await User.create({
        name: 'Bigshot',
        email: 'big@mail.com',
        password: 'Big123!@#'
    });

    influencer.followers = Array.from({ length: 100 }).map(() => new mongoose.Types.ObjectId());
    await influencer.save();

    const res = await request(app)
        .put(`/api/admin/ban/${influencer._id}`)
        .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.isBanned).toBe(true);
    });

    it('C01: Ban a user during active session', async () => {
    const user = await User.create({
        name: 'SessionGuy',
        email: 'session@mail.com',
        password: 'Sess123!@#'
    });
    const token = generateToken(user._id);

    const res = await request(app)
        .put(`/api/admin/ban/${user._id}`)
        .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);

    const failRes = await request(app)
        .get('/api/posts/newsfeed')
        .set('Cookie', [`token=${token}`]);
    expect(failRes.statusCode).toBe(403);
    });

    it('C02: Banned user tries to login or interact afterward', async () => {
    const user = await User.create({
        name: 'BannedGuy',
        email: 'banned@mail.com',
        password: 'Ban123!@#',
        isBanned: true
    });

    const token = generateToken(user._id);

    const res = await request(app)
        .get('/api/posts/newsfeed')
        .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(403);
    });

    it('C03: Admin bans user who was just deleted', async () => {
    const ghost = await User.create({
        name: 'Ghosty',
        email: 'ghost@mail.com',
        password: 'Ghost123!@#'
    });
    await ghost.deleteOne();

    const res = await request(app)
        .put(`/api/admin/ban/${ghost._id}`)
        .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(404);
    });
});

describe('🔐 Security & Performance - PUT /api/admin/ban/:userId', () => {
    it('S01: Forged JWT used to ban user', async () => {
    const fakeToken = 'invalid.jwt.token';
    const randomId = new mongoose.Types.ObjectId();

    const res = await request(app)
        .put(`/api/admin/ban/${randomId}`)
        .set('Cookie', [`token=${fakeToken}`]);

    expect(res.statusCode).toBe(401);
    });

    it('S02: SQL/NoSQL injection in userId param', async () => {
    const res = await request(app)
        .put('/api/admin/ban/{$ne:null}')
        .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(400);
    });

    it.skip('S03: XSS payload in path param', async () => {
    const res = await request(app)
        .put('/api/admin/ban/<script>alert(1)</script>')
        .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(400);
    });

    it('S04: Deleted user’s token is used', async () => {
    const deleted = await User.create({ name: 'DeleteMe', email: 'd@mail.com', password: 'Del123!@#' });
    const deletedToken = generateToken(deleted._id);
    await deleted.deleteOne();

    const res = await request(app)
        .put(`/api/admin/ban/${new mongoose.Types.ObjectId()}`)
        .set('Cookie', [`token=${deletedToken}`]);

    expect(res.statusCode).toBe(401);
    });

    it('S05: Lower-privileged user tries to change role and ban', async () => {
    const user = await User.create({ name: 'LowGuy', email: 'low@mail.com', password: 'Low123!@#' });
    const token = generateToken(user._id);

    const res = await request(app)
        .put(`/api/admin/ban/${new mongoose.Types.ObjectId()}`)
        .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(403);
    });
});

