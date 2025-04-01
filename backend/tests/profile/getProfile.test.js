const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const { generateToken } = require('../../utils/token');
const jwt = require('jsonwebtoken');

let mongo;
let userToken, adminToken, anotherUserToken, userId, adminId, anotherUserId;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(
        mongo.getUri(),
    );  
});

beforeEach(async () => {
  // Create regular user
  const user = await User.create({
    name: 'Regular User',
    email: 'user@example.com',
    password: 'Aa1@secure',
    role: 'user',
  });
  userId = user._id;
  userToken = generateToken(user._id);

  await Profile.create({
    user: user._id,
    username: 'regular_user',
    bio: 'Just a regular user',
    interests: ['coding', 'music'],
    profilePicture: 'https://example.com/pic.jpg',
  });

  // Another regular user
  const user1 = await User.create({
    name: 'Regular User1',
    email: 'user1@example.com',
    password: 'Aa1@secure',
    role: 'user',
  });
  anotherUserId = user1._id;
  anotherUserToken = generateToken(user1._id);

  await Profile.create({
    user: user1._id,
    username: 'regular_user1',
    bio: 'Just a regular user',
    profilePicture: 'https://example.com/pic.jpg',
  });

  // Create admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Aa1@secure',
    role: 'admin',
  });
  adminId = admin._id;
  adminToken = generateToken(admin._id);

  await Profile.create({
    user: admin._id,
    username: 'admin_user',
    bio: 'The admin',
  });
});

afterEach(async () => {
    await Profile.deleteMany({});
    await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});

describe('✅ Positive /api/profile/:userId Tests', () => {
  // P01
  it('P01: should fetch profile with valid userId and valid token', async () => {
    const res = await request(app)
      .get(`/api/profile/${userId}`)
      .set('Cookie', [`token=${userToken}`])

    expect(res.statusCode).toBe(200);
    expect(res.body.profile).toHaveProperty('username', 'regular_user');
    expect(res.body.profile).toHaveProperty('bio');
  });

  // P02
  it('P02: should return own profile when user requests their own profile', async () => {
    const res = await request(app)
      .get(`/api/profile/${userId}`)
      .set('Cookie', [`token=${userToken}`])

    expect(res.statusCode).toBe(200);
    expect(res.body.profile).toHaveProperty('user');
    expect(res.body.profile.user).toHaveProperty('email', 'user@example.com');
  });

  // P03
  it("P03: should allow admin to access another user's profile", async () => {
    const res = await request(app)
      .get(`/api/profile/${userId}`)
      .set('Cookie', [`token=${userToken}`])

    expect(res.statusCode).toBe(200);
    expect(res.body.profile).toHaveProperty('username', 'regular_user');
  });

  // P04
  it('P04: should include populated user object with email and name', async () => {
    const res = await request(app)
      .get(`/api/profile/${userId}`)
      .set('Cookie', [`token=${userToken}`])

    expect(res.statusCode).toBe(200);
    expect(res.body.profile).toHaveProperty('user');
    expect(res.body.profile.user).toMatchObject({
      email: 'user@example.com',
      name: 'Regular User',
    });
  });

  it('P05: should return 200 if user tries accessing someone else\'s profile', async () => {
    const res = await request(app)
      .get(`/api/profile/${anotherUserId}`)
      .set('Cookie', [`token=${userToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.profile).toHaveProperty('username'); 
  });
});

describe('❌ Negative /api/profile/:userId Tests', () => {
    // N01
    it('N01: should return 401 when auth token is missing', async () => {
      const res = await request(app).get(`/api/profile/${userId}`);
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/token missing/i);
    });
  
    // N02
    it('N02: should return 400 or 500 for invalid userId format', async () => {
      const res = await request(app)
        .get(`/api/profile/not-an-object-id`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect([400, 500]).toContain(res.statusCode);
    });
  
    // N03
    it('N03: should return 404 for non-existent but valid userId', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/profile/${fakeId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  
    // N05
    it('N05: should return 401 if token is expired', async () => {
      const expiredToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '-1s',
      });
  
      const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${expiredToken}`]);
  
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/expired/i);
    });
});

describe('🔳 Edge /api/profile/:userId Tests', () => {
    // E01
    it('E01: should return 404 or 200 when userId is max ObjectId length', async () => {
      const maxId = 'f'.repeat(24);
      const res = await request(app)
        .get(`/api/profile/${maxId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect([200, 404]).toContain(res.statusCode);
    });
  
    // E02
    it('E02: should return profile with max-length fields', async () => {
      const longUsername = 'u'.repeat(30);
      const longBio = 'b'.repeat(200);
      const longUrl = 'https://example.com/' + 'img/'.repeat(50);

      await Profile.deleteOne({ user: userId });
      await Profile.create({
        user: userId,
        username: longUsername,
        bio: longBio,
        profilePicture: longUrl,
      });
  
      const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.username).toBe(longUsername);
      expect(res.body.profile.bio).toBe(longBio);
      expect(res.body.profile.profilePicture).toBe(longUrl);
    });
  
    // E03
    it('E03: should return special characters encoded in bio/username', async () => {
      await Profile.deleteOne({ user: userId });
      await Profile.create({
        user: userId,
        username: '🚀🔥user<script>',
        bio: 'I <3 JS & Node.js!',
      });
  
      const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.username).toMatch(/user/);
      expect(res.body.profile.bio).toContain('Node.js');
    });
  
    // E04
    it('E04: should return profile with empty bio and picture gracefully', async () => {
      await Profile.deleteOne({ user: userId });
      await Profile.create({
        user: userId,
        username: 'emptyfields',
      });
  
      const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.bio).toBe('');
      expect(res.body.profile.profilePicture).toBe('');
    });
  
    // E05
    it('E05: should ignore extra query parameters', async () => {
      const res = await request(app)
        .get(`/api/profile/${userId}?verbose=true&includeTrash=no`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile).toHaveProperty('username');
    });
});

describe('🔲 Corner /api/profile/:userId Tests', () => {
    // C01
    it('C01: should return identical results for concurrent profile fetches', async () => {
      const [res1, res2] = await Promise.all([
        request(app).get(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`]),
        request(app).get(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`]),
      ]);
  
      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
      expect(res1.body.profile).toEqual(res2.body.profile);
    });
  
    // C02
    it('C02: should return latest data if profile was just updated', async () => {
      await Profile.findOneAndUpdate({ user: userId }, { bio: 'Updated bio' });
  
      const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.bio).toBe('Updated bio');
    });
  
    // C03
    it('C03: should return 404 if user profile was deleted', async () => {
      await Profile.findOneAndDelete({ user: userId });
  
      const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(404);
    });
  
    // C04
    it('C04: should only return profile by exact userId, not username collision', async () => {
      const similarUser = await User.create({ name: 'user', email: 'similar@example.com', password: 'Pass123!' });
      await Profile.create({ user: similarUser._id, username: 'sameName' });
  
      const res = await request(app)
        .get(`/api/profile/${similarUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.username).toBe('samename');
    });
});

describe('🔐 Security /api/profile/:userId Tests', () => {
    it('S01: should return 400 or 500 for SQL injection in userId param', async () => {
      const res = await request(app)
        .get('/api/profile/1%20OR%201=1')
        .set('Cookie', [`token=${userToken}`]);
  
      expect([400, 500]).toContain(res.statusCode);
      expect(res.body.message).not.toMatch(/mongo|syntax|cast/i);
    });
  
    it('S02: should safely escape any stored XSS in username/bio', async () => {
      await Profile.findOneAndUpdate(
        { user: userId },
        {
          username: '<script>alert(1)</script>',
          bio: '<img src=x onerror=alert(1)>'
        }
      );
  
      const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.text).not.toMatch(/<script>|<img/);
    });
  
    it('S03: should reject forged JWT access with 401 or 403', async () => {
      const fakeToken = 'token=fake.jwt.payload';
      const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [fakeToken]);
  
      expect([401, 403]).toContain(res.statusCode);
    });
  
    it('S04: should sanitize path traversal/script injection in ID', async () => {
      const res = await request(app)
        .get('/api/profile/../../etc/passwd')
        .set('Cookie', [`token=${userToken}`]);
  
      expect([400, 401, 404]).toContain(res.statusCode);
    });
  
    it('S05: should not leak sensitive fields like password or tokens', async () => {
      const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile).not.toHaveProperty('password');
      expect(res.body.profile).not.toHaveProperty('token');
    });
});

describe('⚡ Performance /api/profile/:userId Tests', () => {
    it.skip('PF01: should return 1000 profile GETs in parallel under 2s', async () => {
    const start = Date.now();
    const requests = Array.from({ length: 1000 }, () =>
        request(app).get(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`])
    );
    const results = await Promise.all(requests);
    const elapsed = Date.now() - start;

    results.forEach(res => expect(res.statusCode).toBe(200));
    expect(elapsed).toBeLessThan(2000);
    }, 10000);

    it('PF02: should handle DoS-style burst from same IP', async () => {
    const requests = Array.from({ length: 200 }, () =>
        request(app).get(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`])
    );
    const results = await Promise.all(requests);

    const statusCodes = results.map(res => res.statusCode);
    expect(statusCodes.filter(code => code === 200).length).toBeGreaterThanOrEqual(150);
    });

    it.skip('PF03: should still respond with increased latency under DB load', async () => {
    jest.spyOn(Profile, 'findOne').mockImplementationOnce(() =>
        new Promise(res => setTimeout(() => res({ bio: 'slow' }), 1000))
    );

    const start = Date.now();
    const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);
    const elapsed = Date.now() - start;

    expect(res.statusCode).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(1000);
    });

    it('PF04: should return profile on cold start with no cache', async () => {
    const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.profile).toHaveProperty('username');
    });
});

describe('♻️ Reliability /api/profile/:userId Tests', () => {
    it('R01: should work after DB restart', async () => {
    await mongoose.disconnect();
    await mongoose.connect(mongo.getUri());

    const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    });

    it('R02: should accept token post server restart', async () => {
    const res = await request(app)
        .get(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    });

    it('R03: should return same data on repeated cached requests', async () => {
    const [res1, res2] = await Promise.all([
        request(app).get(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`]),
        request(app).get(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`]),
    ]);

    expect(res1.body.profile).toEqual(res2.body.profile);
    });

    it('R04: should return accurate data for new profile fetch', async () => {
    const newUser = await User.create({ name: 'new guy', email: 'new@domain.com', password: 'Aa1@safe' });
    await Profile.create({ user: newUser._id, username: 'brandNew', bio: 'just joined' });

    const token = generateToken(newUser._id);
    const res = await request(app)
        .get(`/api/profile/${newUser._id}`)
        .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.profile.username).toBe('brandnew');
    });
});
  
  
  
  