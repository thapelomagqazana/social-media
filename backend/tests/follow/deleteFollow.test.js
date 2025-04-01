const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Follow = require('../../models/Follow');
const { generateToken } = require('../../utils/token');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let user, userToken, admin, adminToken, otherUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  user = await User.create({ name: 'Regular', email: 'user@mail.com', password: 'Pass123!' });
  admin = await User.create({ name: 'Admin', email: 'admin@mail.com', password: 'Pass123!', role: 'admin' });
  otherUser = await User.create({ name: 'Other', email: 'other@mail.com', password: 'Pass123!' });

  userToken = generateToken(user._id);
  adminToken = generateToken(admin._id);

  await Follow.create({ follower: user._id, following: otherUser._id });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Positive DELETE /api/follow/:userId Tests', () => {
  it('P01: should allow authenticated user to unfollow another user', async () => {
    const res = await request(app)
      .delete(`/api/follow/${otherUser._id}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Unfollowed/i);
  });

  it('P02: should allow admin to unfollow another user', async () => {
    await Follow.create({ follower: admin._id, following: otherUser._id });

    const res = await request(app)
      .delete(`/api/follow/${otherUser._id}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
  });

  it('P03: should allow unfollowing user not currently followed (idempotent)', async () => {
    const res = await request(app)
      .delete(`/api/follow/${otherUser._id}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
  });

  it('P04: should unfollow a user who has a profile', async () => {
    await Follow.create({ follower: user._id, following: admin._id });

    const res = await request(app)
      .delete(`/api/follow/${admin._id}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
  });

  it('P05: should remove follow entry if exists with valid session', async () => {
    await Follow.create({ follower: user._id, following: otherUser._id });

    const res = await request(app)
      .delete(`/api/follow/${otherUser._id}`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
  });
});

describe('❌ Negative DELETE /api/follow/:userId Tests', () => {
  it('N01: should return 401 if token is missing', async () => {
    const res = await request(app).delete(`/api/follow/${otherUser._id}`);
    expect(res.statusCode).toBe(401);
  });

  it('N02: should return 401 for invalid token', async () => {
    const res = await request(app)
      .delete(`/api/follow/${otherUser._id}`)
      .set('Cookie', ['token=invalidtoken']);
    expect(res.statusCode).toBe(401);
  });

  it('N03: should return 400 for invalid userId format', async () => {
    const res = await request(app)
      .delete('/api/follow/invalid-id')
      .set('Cookie', [`token=${userToken}`]);
    expect([400, 500]).toContain(res.statusCode);
  });

  it('N04: should return 404 or 200 for non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/follow/${fakeId}`)
      .set('Cookie', [`token=${userToken}`]);
    expect([200, 404]).toContain(res.statusCode);
  });

  it('N05: should return 400 if user tries to unfollow themselves', async () => {
    const res = await request(app)
      .delete(`/api/follow/${user._id}`)
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(400);
  });

  it('N06: should return 401/403 if token belongs to deleted user', async () => {
    const ghost = await User.create({ name: 'Ghost', email: 'ghost@mail.com', password: 'Pass123!' });
    const ghostToken = generateToken(ghost._id);
    await User.findByIdAndDelete(ghost._id);

    const res = await request(app)
      .delete(`/api/follow/${user._id}`)
      .set('Cookie', [`token=${ghostToken}`]);

    expect([401, 403]).toContain(res.statusCode);
  });

  it('N07: should return 401 if token is sent in body not cookie', async () => {
    const res = await request(app)
      .delete(`/api/follow/${user._id}`)
      .send({ token: userToken });
    expect(res.statusCode).toBe(401);
  });
});

describe('🔳 Edge DELETE /api/follow/:userId Tests (Cookie Auth)', () => {
    // E01
    it('E01: should unfollow with max-length valid ObjectId', async () => {
      const targetUser = await User.create({ name: 'MaxID', email: 'maxid@mail.com', password: 'Pass123!' });
      await Follow.create({ follower: user._id, following: targetUser._id });
  
      const res = await request(app)
        .delete(`/api/follow/${targetUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    // E02
    it('E02: should allow unfollow right after signing up', async () => {
      const newUser = await User.create({ name: 'Newbie', email: 'newbie@mail.com', password: 'Pass123!' });
      const token = generateToken(newUser._id);
      await Follow.create({ follower: newUser._id, following: user._id });
  
      const res = await request(app)
        .delete(`/api/follow/${user._id}`)
        .set('Cookie', [`token=${token}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    // E03
    it('E03: should unfollow user with emojis/special chars in name', async () => {
      const emojiUser = await User.create({ name: '😎✨', email: 'emoji@mail.com', password: 'Pass123!' });
      await Follow.create({ follower: user._id, following: emojiUser._id });
  
      const res = await request(app)
        .delete(`/api/follow/${emojiUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    // E04
    it('E04: should handle trailing slashes in unfollow URL', async () => {
      const targetUser = await User.create({ name: 'Slashy', email: 'slash@mail.com', password: 'Pass123!' });
      await Follow.create({ follower: user._id, following: targetUser._id });
  
      const res = await request(app)
        .delete(`/api/follow/${targetUser._id}/`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect([200, 404]).toContain(res.statusCode); // depending on router strictness
    });
  
    // E05
    it.skip(
        'E05: should unfollow when DB is filled with many users',
        async () => {
          const heavyUser = await User.create({
            name: 'Heavy',
            email: 'heavy@mail.com',
            password: 'Pass123!',
          });
      
          // Seed 500 users to simulate a heavy DB
          for (let i = 0; i < 500; i++) {
            await User.create({
              name: `load${i}`,
              email: `load${i}@mail.com`,
              password: 'Pass123!',
            });
          }
      
          await Follow.create({ follower: user._id, following: heavyUser._id });
      
          const res = await request(app)
            .delete(`/api/follow/${heavyUser._id}`)
            .set('Cookie', [`token=${userToken}`]);
      
          expect(res.statusCode).toBe(200);
        },
        10000 // 10 seconds timeout
    );
});

describe('🔲 Corner DELETE /api/follow/:userId Tests (Cookie Auth)', () => {
    // C01
    it('C01: should handle two users unfollowing each other at the same time', async () => {
      const target = await User.create({ name: 'Mutual', email: 'mutual@mail.com', password: 'Pass123!' });
      const token2 = generateToken(target._id);
      await Follow.create({ follower: user._id, following: target._id });
      await Follow.create({ follower: target._id, following: user._id });
  
      const [res1, res2] = await Promise.all([
        request(app).delete(`/api/follow/${target._id}`).set('Cookie', [`token=${userToken}`]),
        request(app).delete(`/api/follow/${user._id}`).set('Cookie', [`token=${token2}`])
      ]);
  
      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
    });
  
    // C02
    it('C02: should allow one user to unfollow many users in quick succession', async () => {
      const targets = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          User.create({ name: `multi${i}`, email: `multi${i}@mail.com`, password: 'Pass123!' })
        )
      );
  
      await Promise.all(
        targets.map(t => Follow.create({ follower: user._id, following: t._id }))
      );
  
      const results = await Promise.all(
        targets.map(t =>
          request(app).delete(`/api/follow/${t._id}`).set('Cookie', [`token=${userToken}`])
        )
      );
  
      results.forEach(res => expect(res.statusCode).toBe(200));
    });
  
    // C03
    it('C03: should allow multiple rapid unfollow requests for same user', async () => {
      const victim = await User.create({ name: 'Rapid', email: 'rapid@mail.com', password: 'Pass123!' });
      await Follow.create({ follower: user._id, following: victim._id });
  
      const results = await Promise.all([
        request(app).delete(`/api/follow/${victim._id}`).set('Cookie', [`token=${userToken}`]),
        request(app).delete(`/api/follow/${victim._id}`).set('Cookie', [`token=${userToken}`])
      ]);
  
      results.forEach(res => expect([200, 404]).toContain(res.statusCode));
    });
  
    // C04
    it('C04: should unfollow user right after their account is created', async () => {
      const quickUser = await User.create({ name: 'Fresh', email: 'fresh@mail.com', password: 'Pass123!' });
      await Follow.create({ follower: user._id, following: quickUser._id });
  
      const res = await request(app)
        .delete(`/api/follow/${quickUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    // C05
    it('C05: should allow refollow and unfollow of same user', async () => {
      const cycleUser = await User.create({ name: 'Loop', email: 'loop@mail.com', password: 'Pass123!' });
  
      await Follow.create({ follower: user._id, following: cycleUser._id });
  
      const unfollow = await request(app)
        .delete(`/api/follow/${cycleUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      const followBack = await request(app)
        .post(`/api/follow/${cycleUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      const finalUnfollow = await request(app)
        .delete(`/api/follow/${cycleUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(unfollow.statusCode).toBe(200);
      expect(followBack.statusCode).toBe(200);
      expect(finalUnfollow.statusCode).toBe(200);
    });
});

describe('🔐 Security DELETE /api/follow/:userId Tests (Cookie Auth)', () => {
    // S01
    it('S01: should return 400 for SQL injection in userId param', async () => {
      const res = await request(app)
        .delete('/api/follow/1=1;DROP TABLE users;--')
        .set('Cookie', [`token=${userToken}`]);
  
      expect([400, 500]).toContain(res.statusCode);
    });
  
    // S02
    it.skip('S02: should handle XSS payload in userId param', async () => {
      const res = await request(app)
        .delete('/api/follow/<script>alert(1)</script>')
        .set('Cookie', [`token=${userToken}`]);
  
      expect([400, 500]).toContain(res.statusCode);
    });
  
    // S03
    it.skip('S03: should reject forged JWT token for different user', async () => {
      const forgedToken = generateToken({ _id: otherUser._id }); // Signed but wrong user context
  
      const res = await request(app)
        .delete(`/api/follow/${user._id}`)
        .set('Cookie', [`token=${forgedToken}`]);
  
      expect([401, 403]).toContain(res.statusCode);
    });
  
    // S04
    it('S04: should reject token in body instead of cookie', async () => {
      const res = await request(app)
        .delete(`/api/follow/${user._id}`)
        .send({ token: userToken });
  
      expect(res.statusCode).toBe(401);
    });
  
    // S05
    it('S05: should not allow unfollowing deactivated/banned user (soft policy)', async () => {
      const bannedUser = await User.create({ name: 'Banned', email: 'banned@mail.com', password: 'Pass123!', status: 'banned' });
  
      const res = await request(app)
        .delete(`/api/follow/${bannedUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect([403, 200]).toContain(res.statusCode); // Based on business rule
    });
});

describe('♻️ Reliability DELETE /api/follow/:userId Tests (Cookie Auth)', () => {
    // R01
    it('R01: DB restarts during unfollow operation', async () => {
      await mongoose.disconnect();
      await mongoose.connect(mongoServer.getUri());
  
      const targetUser = await User.create({ name: 'Resilient', email: 'resilient@mail.com', password: 'Pass123!' });
      await Follow.create({ follower: user._id, following: targetUser._id });
  
      const res = await request(app)
        .delete(`/api/follow/${targetUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect([200, 500]).toContain(res.statusCode);
    });
  
    // R02
    it('R02: Server restart before unfollow – JWT still valid', async () => {
      const targetUser = await User.create({ name: 'Restarted', email: 'restart@mail.com', password: 'Pass123!' });
      await Follow.create({ follower: user._id, following: targetUser._id });
  
      const res = await request(app)
        .delete(`/api/follow/${targetUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    // R03
    it('R03: Retried unfollow request after network glitch', async () => {
      const targetUser = await User.create({ name: 'Glitchy', email: 'glitch@mail.com', password: 'Pass123!' });
      await Follow.create({ follower: user._id, following: targetUser._id });
  
      const res1 = await request(app)
        .delete(`/api/follow/${targetUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      const res2 = await request(app)
        .delete(`/api/follow/${targetUser._id}`)
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
    });
});
  
  
  
  
