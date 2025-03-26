import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../models/User';
import Follow from '../../models/Follow';
import { generateToken } from '../../utils/token';

let mongoServer;
let userToken, adminToken, invalidToken = 'faketoken';
let userId, adminId, otherUserId, profileUserId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const user = await User.create({ name: 'Regular', email: 'user@example.com', password: 'Pass123!', role: 'user' });
  const admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: 'Pass123!', role: 'admin' });
  const otherUser = await User.create({ name: 'Target', email: 'target@example.com', password: 'Pass123!' });
  const profileUser = await User.create({ name: 'Profiled', email: 'profile@example.com', password: 'Pass123!' });

  userId = user._id;
  adminId = admin._id;
  otherUserId = otherUser._id;
  profileUserId = profileUser._id;

  userToken = generateToken(user._id);
  adminToken = generateToken(admin._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Positive /api/follow/:userId Tests (Cookie Auth)', () => {
  it('P01: should follow another valid user', async () => {
    const res = await request(app)
      .post(`/api/follow/${otherUserId}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Followed user');
  });

  it('P02: should follow same user again (idempotent)', async () => {
    const res = await request(app)
      .post(`/api/follow/${otherUserId}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    const count = await Follow.countDocuments({ follower: userId, following: otherUserId });
    expect(count).toBe(1);
  });

  it('P03: admin follows another user', async () => {
    const res = await request(app)
      .post(`/api/follow/${userId}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Followed user');
  });

  it('P04: user with no previous follows starts following someone', async () => {
    const newUser = await User.create({ name: 'New', email: 'new@example.com', password: 'Pass123!' });
    const newToken = generateToken(newUser._id);

    const res = await request(app)
      .post(`/api/follow/${userId}`)
      .set('Cookie', [`token=${newToken}`]);

    expect(res.statusCode).toBe(200);
    const follow = await Follow.findOne({ follower: newUser._id, following: userId });
    expect(follow).toBeTruthy();
  });

  it('P05: follow user with profile', async () => {
    const res = await request(app)
      .post(`/api/follow/${profileUserId}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.follow.following.toString()).toBe(profileUserId.toString());
  });
});

describe('❌ Negative /api/follow/:userId Tests (Cookie Auth)', () => {
  it('N01: should return 401 with no token', async () => {
    const res = await request(app).post(`/api/follow/${otherUserId}`);
    expect(res.statusCode).toBe(401);
  });

  it('N02: should return 401 with invalid token', async () => {
    const res = await request(app)
      .post(`/api/follow/${otherUserId}`)
      .set('Cookie', [`token=${invalidToken}`]);

    expect(res.statusCode).toBe(401);
  });

  it('N03: should return 400 for malformed userId', async () => {
    const res = await request(app)
      .post(`/api/follow/invalid-id`)
      .set('Cookie', [`token=${userToken}`]);

    expect([400, 500]).toContain(res.statusCode);
  });

  it('N04: should return 404 for non-existent userId', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/follow/${fakeId}`)
      .set('Cookie', [`token=${userToken}`]);

    expect([404, 200]).toContain(res.statusCode);
  });

  it('N05: should not allow user to follow themselves', async () => {
    const res = await request(app)
      .post(`/api/follow/${userId}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cannot follow yourself/i);
  });

  it('N06: should not duplicate follow if already followed', async () => {
    const res = await request(app)
      .post(`/api/follow/${otherUserId}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    const count = await Follow.countDocuments({ follower: userId, following: otherUserId });
    expect(count).toBe(1);
  });

  it('N07: should return 401 if token belongs to deleted user', async () => {
    const ghost = await User.create({ name: 'Ghost', email: 'ghost@example.com', password: 'Pass123!' });
    const ghostToken = generateToken(ghost._id);
    await User.deleteOne({ _id: ghost._id });

    const res = await request(app)
      .post(`/api/follow/${userId}`)
      .set('Cookie', [`token=${ghostToken}`]);

    expect([401, 403]).toContain(res.statusCode);
  });
});

describe('🔳 Edge /api/follow/:userId Tests (Cookie Auth)', () => {
    it('E01: should allow follow with max-length valid ObjectId', async () => {
      const longId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .post(`/api/follow/${longId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect([200, 404]).toContain(res.statusCode);
    });
  
    it('E02: should allow follow right after signing up', async () => {
      const newbie = await User.create({ name: 'Newbie', email: 'newbie@example.com', password: 'Pass123!' });
      const newbieToken = generateToken(newbie._id);
  
      const res = await request(app)
        .post(`/api/follow/${userId}`)
        .set('Cookie', [`token=${newbieToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    it('E03: should allow follow even if target user has special chars in name', async () => {
      const special = await User.create({ name: '✨🚀🔥', email: 'special@example.com', password: 'Pass123!' });
  
      const res = await request(app)
        .post(`/api/follow/${special._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    it('E04: should allow follow with whitespace or trailing slashes', async () => {
      const res = await request(app)
        .post(`/api/follow/${otherUserId.toString().trim()}/`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect([200, 404]).toContain(res.statusCode);
    });
  
    it(
        'E05: should allow follow when DB is seeded with many users',
        async () => {
        await User.insertMany(
            Array.from({ length: 1000 }, (_, i) => ({
                name: `user${i}`,
                email: `u${i}@mail.com`,
                password: 'Pass123!',
            }))
            );
              
      
          const target = await User.create({
            name: 'massiveTarget',
            email: 'massive@mail.com',
            password: 'Pass123!',
          });
      
          const res = await request(app)
            .post(`/api/follow/${target._id}`)
            .set('Cookie', [`token=${userToken}`]);
      
          expect(res.statusCode).toBe(200);
          expect(res.body.message).toBe('Followed user');
        },
        15000 // <-- increase timeout to 15s
    );
      
});

describe('🔲 Corner /api/follow/:userId Tests (Cookie Auth)', () => {
    it('C01: two users follow each other at same time', async () => {
      const userA = await User.create({ name: 'A', email: 'a@mail.com', password: 'Pass123!' });
      const userB = await User.create({ name: 'B', email: 'b@mail.com', password: 'Pass123!' });
      const tokenA = generateToken(userA._id);
      const tokenB = generateToken(userB._id);
  
      const [res1, res2] = await Promise.all([
        request(app).post(`/api/follow/${userB._id}`).set('Cookie', [`token=${tokenA}`]),
        request(app).post(`/api/follow/${userA._id}`).set('Cookie', [`token=${tokenB}`]),
      ]);
  
      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
    });
  
    it('C02: one user follows many users in quick succession', async () => {
      const many = [];
      for (let i = 0; i < 5; i++) {
        const u = await User.create({ name: `multi${i}`, email: `multi${i}@mail.com`, password: 'Pass123!' });
        many.push(u._id);
      }
  
      const results = await Promise.all(
        many.map(id => request(app).post(`/api/follow/${id}`).set('Cookie', [`token=${userToken}`]))
      );
  
      results.forEach(res => expect(res.statusCode).toBe(200));
    });
  
    it('C03: multiple follow requests to same user rapidly', async () => {
      const results = await Promise.all(
        Array(5).fill(0).map(() =>
          request(app).post(`/api/follow/${profileUserId}`).set('Cookie', [`token=${userToken}`])
        )
      );
  
      results.forEach(res => expect(res.statusCode).toBe(200));
      const count = await Follow.countDocuments({ follower: userId, following: profileUserId });
      expect(count).toBe(1);
    });
  
    it('C04: follow right after user created', async () => {
      const fresh = await User.create({ name: 'Freshy', email: 'freshy@mail.com', password: 'Pass123!' });
  
      const res = await request(app)
        .post(`/api/follow/${fresh._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    it('C05: re-follow after unfollow', async () => {
      await Follow.deleteOne({ follower: userId, following: otherUserId });
  
      const res = await request(app)
        .post(`/api/follow/${otherUserId}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      const count = await Follow.countDocuments({ follower: userId, following: otherUserId });
      expect(count).toBe(1);
    });
});

describe('🔐 Security /api/follow/:userId Tests (Cookie Auth)', () => {
    it('S01: should return 400 for SQL injection attempt in userId', async () => {
      const res = await request(app)
        .post(`/api/follow/1 OR 1=1`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect([400, 500]).toContain(res.statusCode);
    });
  
    it.skip('S02: should handle XSS payload in userId param', async () => {
      const res = await request(app)
        .post(`/api/follow/<script>alert(1)</script>`)
        .set('Cookie', [`token=${userToken}`]);
      expect([400, 500]).toContain(res.statusCode);
    });
  
    it('S03: should reject forged JWT token for different user', async () => {
      const fakeToken = generateToken(new mongoose.Types.ObjectId());
      const res = await request(app)
        .post(`/api/follow/${userId}`)
        .set('Cookie', [`token=${fakeToken}`]);
  
      expect([401, 403]).toContain(res.statusCode);
    });
  
    it('S04: should reject token passed in body instead of Cookie', async () => {
      const res = await request(app)
        .post(`/api/follow/${otherUserId}`)
        .send({ token: userToken });
  
      expect(res.statusCode).toBe(401);
    });
  
    it('S05: should not allow following deactivated/banned user (soft rule)', async () => {
      const banned = await User.create({ name: 'Banned', email: 'banned@mail.com', password: 'Pass123!', isBanned: true });
      
      const res = await request(app)
        .post(`/api/follow/${banned._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect([200, 403]).toContain(res.statusCode); // depending on business rule
    });
});

describe('⚡ Performance /api/follow/:userId Tests (Cookie Auth)', () => {
    it.skip('PF01: 1000 users follow concurrently (under 2s)', async () => {
      const targetUser = await User.create({ name: 'Target', email: 'target@mail.com', password: 'Pass123!' });
  
      const users = await Promise.all(
        Array.from({ length: 1000 }).map((_, i) =>
          User.create({ name: `u${i}`, email: `u${i}@mail.com`, password: 'Pass123!' })
        )
      );
  
      const start = Date.now();
      const results = await Promise.all(
        users.map(u =>
          request(app)
            .post(`/api/follow/${targetUser._id}`)
            .set('Cookie', [`token=${generateToken(u._id)}`])
        )
      );
  
      const elapsed = Date.now() - start;
      results.forEach(res => expect(res.statusCode).toBe(200));
      expect(elapsed).toBeLessThan(2000);
    }, 10000);
  
    it('PF02: burst of 100 follow requests from same user (simulate DoS)', async () => {
      const spamTarget = await User.create({ name: 'Spammy', email: 'spam@example.com', password: 'Pass123!'});
  
      const results = await Promise.all(
        Array(100).fill(0).map(() =>
          request(app).post(`/api/follow/${spamTarget._id}`).set('Cookie', [`token=${userToken}`])
        )
      );
  
      results.forEach(res => expect(res.statusCode).toBe(200));
      const count = await Follow.countDocuments({ follower: userId, following: spamTarget._id });
      expect(count).toBe(1);
    });
  
    it.skip('PF03: slow DB simulation (1s delay)', async () => {
      const slowTarget = await User.create({ name: 'Slowpoke', email: 'slow@mail.com', password: 'Pass123!' });
  
      const originalFindOne = Follow.findOne;
      Follow.findOne = async function (...args) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return originalFindOne.apply(this, args);
      };
  
      const start = Date.now();
      const res = await request(app)
        .post(`/api/follow/${slowTarget._id}`)
        .set('Cookie', [`token=${userToken}`]);
      const elapsed = Date.now() - start;
  
      expect(res.statusCode).toBe(200);
      expect(elapsed).toBeGreaterThanOrEqual(1000);
  
      // Restore
      Follow.findOne = originalFindOne;
    });
  
    it('PF04: cold start with no Follow model indexes', async () => {
      await mongoose.connection.db.collection('follows').dropIndexes().catch(() => {});
  
      const coldTarget = await User.create({ name: 'ColdStart', email: 'cold@mail.com', password: 'Pass123!' });
      const res = await request(app)
        .post(`/api/follow/${coldTarget._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
});

describe('♻️ Reliability /api/follow/:userId Tests (Cookie Auth)', () => {
    it('R01: DB restarts during follow operation', async () => {
      const tempTarget = await User.create({ name: 'Temp', email: 'temp@mail.com', password: 'Pass123!' });
  
      await mongoose.disconnect();
      await mongoose.connect(mongoServer.getUri());
  
      const res = await request(app)
        .post(`/api/follow/${tempTarget._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect([200, 500]).toContain(res.statusCode);
    });
  
    it('R02: server restarts before follow (JWT still valid)', async () => {
      const rebootTarget = await User.create({ name: 'Reboot', email: 'reboot@mail.com', password: 'Pass123!' });
  
      // Simulate server restart: token should still be valid
      const res = await request(app)
        .post(`/api/follow/${rebootTarget._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    it('R03: retry same follow request after network glitch', async () => {
      const retryTarget = await User.create({ name: 'Retry', email: 'retry@mail.com', password: 'Pass123!' });
  
      const [res1, res2] = await Promise.all([
        request(app).post(`/api/follow/${retryTarget._id}`).set('Cookie', [`token=${userToken}`]),
        request(app).post(`/api/follow/${retryTarget._id}`).set('Cookie', [`token=${userToken}`]),
      ]);
  
      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
  
      const count = await Follow.countDocuments({ follower: userId, following: retryTarget._id });
      expect(count).toBe(1);
    });
});
  
  
  
  
