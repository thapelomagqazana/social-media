const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../../app');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const { generateToken } = require('../../utils/token');

let mongo, user, userId, anotherUserId, userToken, admin, adminToken, anotherUser;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(
      mongo.getUri(),
  ); 
  // Clean DB
  await User.deleteMany();
  await Profile.deleteMany();

  // Create Regular User
  user = await User.create({
    name: 'Regular User',
    email: 'user@example.com',
    password: 'Pass123!',
    role: 'user',
  });
  userId = user._id;
  await Profile.create({
    user: userId,
    username: 'regular_user',
    bio: 'Initial bio',
    profilePicture: 'https://example.com/user.jpg',
  });
  userToken = generateToken(userId);

  // Create Admin
  admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin',
  });
  adminToken = generateToken(admin._id);

  // Create Another Regular User
  anotherUser = await User.create({
    name: 'Another User',
    email: 'other@example.com',
    password: 'Other123!',
    role: 'user',
  });
  anotherUserId = anotherUser._id;
  await Profile.create({
    user: anotherUserId,
    username: 'other_user',
    bio: 'Another bio',
    profilePicture: 'https://example.com/other.jpg',
  });
});

afterAll(async () => {
  await User.deleteMany();
  await Profile.deleteMany();
  await mongoose.connection.close();
  await mongo.stop();
});

describe('✅ Positive /api/profile/:userId PUT Tests', () => {
    // P01
    it('P01: should update profile with valid token and valid fields', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          username: 'updated_user',
          bio: 'Updated bio info',
          profilePicture: 'https://example.com/image.jpg',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.profile.username).toBe('updated_user');
      expect(res.body.profile.bio).toBe('Updated bio info');
      expect(res.body.profile.profilePicture).toMatch(/^https:\/\/example\.com\/image\.jpg$/);
    });

    it('P06: should update admin\'s profile with valid token and valid fields', async () => {
        const res = await request(app)
          .put(`/api/profile/${admin._id}`)
          .set('Cookie', [`token=${adminToken}`])
          .send({
            username: 'updated_admin',
            bio: 'Updated bio info',
            profilePicture: 'https://example.com/image.jpg',
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.profile.username).toBe('updated_admin');
        expect(res.body.profile.bio).toBe('Updated bio info');
        expect(res.body.profile.profilePicture).toMatch(/^https:\/\/example\.com\/image\.jpg$/);
    });
  
    // P02
    it('P02: should allow authenticated user to update their own profile', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          bio: 'This is my updated bio!',
        });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.bio).toBe('This is my updated bio!');
    });
  
    // P03
    it("P03: should allow admin to update another user's profile", async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${adminToken}`])
        .send({
          bio: 'Admin updated this bio.',
        });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.bio).toBe('Admin updated this bio.');
    });
  
    // P04
    it('P04: should allow partial updates, retaining other fields', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          bio: 'Partially updated bio only',
        });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.bio).toBe('Partially updated bio only');
      expect(res.body.profile.username).toBeDefined(); // unchanged field
    });
  
    // P05
    it('P05: should update profile picture URL if valid', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          profilePicture: 'https://cdn.example.com/avatar.png',
        });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.profilePicture).toBe('https://cdn.example.com/avatar.png');
    });

    it('P06: should accept valid JSON array for interests', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({ interests: JSON.stringify(['Node.js', 'Dev']) });
  
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.profile.interests)).toBe(true);
    });
});

describe('❌ Negative /api/profile/:userId PUT Tests', () => {
    // N01
    it('N01: should return 401 if auth token is missing', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .send({ bio: 'Unauthorized update' });
  
      expect(res.statusCode).toBe(401);
    });
  
    // N02
    it('N02: should return 401 if token is invalid or expired', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', ['token=invalid.jwt.token'])
        .send({ bio: 'Bad token test' });
  
      expect(res.statusCode).toBe(401);
    });
  
    // N03
    it('N03: should return 400 for invalid userId format', async () => {
      const res = await request(app)
        .put(`/api/profile/invalid-id`)
        .set('Cookie', [`token=${userToken}`])
        .send({ bio: 'Invalid ID format' });

      expect([400, 500]).toContain(res.statusCode);
    });
  
    // N04
    it.skip('N04: should return 404 for valid but non-existent userId', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/profile/${nonExistentId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({ bio: 'Ghost user update' });

      expect(res.statusCode).toBe(404);
    });
  
    // N05
    it("N05: should return 403 if user tries to update someone else's profile", async () => {
      const res = await request(app)
        .put(`/api/profile/${anotherUserId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({ bio: 'Unauthorized update attempt' });
  
      expect(res.statusCode).toBe(403);
    });
  
    // N06
    it.skip('N06: should return 400 if fields have invalid types', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          username: 123, // invalid type
          bio: ['should', 'not', 'be', 'array'],
        });
  
      expect(res.statusCode).toBe(400);
    });
  
    // N07
    it('N07: should return 400 if no body is sent', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send();
  
      expect(res.statusCode).toBe(400);
    });
  
    // N08
    it('N08: should not allow updates to restricted fields like password or roles', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          password: 'Hacked123!',
          role: 'admin',
        });
  
      expect([400, 403]).toContain(res.statusCode);
    });
});

describe('🔳 Edge /api/profile/:userId PUT Tests', () => {
    // E01
    it('E01: should update profile with max-length bio and username', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          username: 'u'.repeat(30),
          bio: 'b'.repeat(200)
        });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.username).toBe('u'.repeat(30));
      expect(res.body.profile.bio).toBe('b'.repeat(200));
    });
  
    // E02
    it.skip('E02: should handle special characters in bio and username', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          username: '<script>alert(x)</script>',
          bio: '"onmouseover="alert(1)"'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.username).not.toMatch(/<script>/);
      expect(res.body.profile.bio).not.toMatch(/onmouseover/);
    });
  
    // E03
    it('E03: should remove optional fields with empty strings', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          profilePicture: '',
          bio: ''
        });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.profilePicture).toBe('');
      expect(res.body.profile.bio).toBe('');
    });
  
    // E04
    it('E04: should accept unusual but valid picture URL', async () => {
      const url = 'https://127.0.0.1/pic.jpg?ver=1#section';
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({ profilePicture: url });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.profilePicture).toBe(url);
    });
  
    // E05
    it('E05: should ignore extra unexpected fields', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({ username: 'safeUser', hackField: 'hackerAttempt' });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile).not.toHaveProperty('hackField');
    });
});

describe('🔲 Corner /api/profile/:userId PUT Tests', () => {
    // C01
    it('C01: should update profile immediately after creation', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({ bio: 'Fresh update' });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.bio).toBe('Fresh update');
    });
  
    // C02
    it('C02: should handle multiple updates in quick succession', async () => {
      await request(app).put(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`]).send({ bio: 'Bio 1' });
      const res = await request(app).put(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`]).send({ bio: 'Bio 2' });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.bio).toBe('Bio 2');
    });
  
    // C03
    it('C03: should allow concurrent updates, last write wins', async () => {
      const [res1, res2] = await Promise.all([
        request(app).put(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`]).send({ bio: 'From source A' }),
        request(app).put(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`]).send({ bio: 'From source B' }),
      ]);
  
      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
      const finalRes = await request(app).get(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`]);
      expect(['From source A', 'From source B']).toContain(finalRes.body.profile.bio);
    });
  
    // C04
    it('C04: should update profile without collision while user role changes (scoped)', async () => {
      const roleChange = User.findByIdAndUpdate(userId, { role: 'editor' });
      const profileUpdate = request(app).put(`/api/profile/${userId}`).set('Cookie', [`token=${userToken}`]).send({ bio: 'Scoped Update' });
  
      const [_, profileRes] = await Promise.all([roleChange, profileUpdate]);
  
      expect(profileRes.statusCode).toBe(200);
      expect(profileRes.body.profile.bio).toBe('Scoped Update');
    });
  
    // C05
    it('C05: should clear bio when set to blank but keep username', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({ username: 'blankbio', bio: '' });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.bio).toBe('');
      expect(res.body.profile.username).toBe('blankbio');
    });
});

describe('🔐 Security /api/profile/:userId PUT Tests', () => {
    // S01
    it.skip('S01: should handle SQL injection-like inputs safely', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({ username: "'; DROP TABLE profiles;--" });
  
      expect([200, 400]).toContain(res.statusCode);
      expect(res.body.profile.username).not.toMatch(/drop/i);
    });
  
    // S02
    it.skip('S02: should escape script injection in username/bio', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          username: '<script>alert(1)</script>',
          bio: '<img src=x onerror=alert(1)>'
        });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.username).not.toMatch(/<script>/);
      expect(res.body.bio).not.toMatch(/<img/);
    });
  
    // S03
    it('S03: should deny forged JWT trying to update another user', async () => {
      const res = await request(app)
        .put(`/api/profile/${anotherUserId}`)
        .set('Cookie', [`token="hello.world"`])
        .send({ bio: 'malicious update' });
  
      expect([401, 403]).toContain(res.statusCode);
    });
  
    // S04
    it('S04: should reject token in body instead of header', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .send({ token: userToken, bio: 'invalid token placement' });
  
      expect(res.statusCode).toBe(401);
    });
  
    // S05
    it('S05: should block updates to sensitive fields like password', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({ password: 'hackme123' });
  
      expect([400, 403]).toContain(res.statusCode);
    });

    it('S06: should sanitize potential XSS strings in interests', async () => {
      const res = await request(app)
        .put(`/api/profile/${userId}`)
        .set('Cookie', [`token=${userToken}`])
        .send({ interests: JSON.stringify(['<script>x</script>', 'safe']) });
  
      expect(res.statusCode).toBe(200);
      expect(res.body.profile.interests[0]).not.toMatch(/<script>/);
    });
});

describe('📸 Uploads PUT /api/profile/:userId Tests', () => {
  const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'avatar.png');
  let invalidPath;

  beforeAll(() => {
    // Create a dummy file for upload
    fs.writeFileSync(uploadPath, 'dummy content');
  });

  afterAll(() => {
    // Clean up the test file
    if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);
    if (fs.existsSync(invalidPath)) fs.unlinkSync(invalidPath);
  });

  it('U01: should upload a valid image file via req.file', async () => {
    const res = await request(app)
      .put(`/api/profile/${userId}`)
      .set('Cookie', [`token=${userToken}`])
      .attach('file', uploadPath); // assumes middleware sets `req.file`

    expect(res.statusCode).toBe(200);
    expect(res.body.profile).toHaveProperty('profilePicture');
    expect(res.body.profile.profilePicture).toMatch(/\/uploads\/.*\.png$/);
  });

  it('U02: should prioritize req.file over profilePicture in body', async () => {
    const res = await request(app)
      .put(`/api/profile/${userId}`)
      .set('Cookie', [`token=${userToken}`])
      .field('profilePicture', 'https://malicious.url/hack.jpg')
      .attach('file', uploadPath);

    expect(res.statusCode).toBe(200);
    expect(res.body.profile.profilePicture).not.toBe('https://malicious.url/hack.jpg');
    expect(res.body.profile.profilePicture).toMatch(/\/uploads\/.*\.png$/);
  });

  it.skip('U03: should return 400 when invalid file type uploaded (if filtered)', async () => {
    invalidPath = path.join(__dirname, 'invalid.txt');
    fs.writeFileSync(invalidPath, 'not an image');

    const res = await request(app)
      .put(`/api/profile/${userId}`)
      .set('Cookie', [`token=${userToken}`])
      .attach('file', invalidPath);

    expect([400, 415, 500]).toContain(res.statusCode);
    expect(res.body.message).toMatch(/only image files/i);


    fs.unlinkSync(invalidPath);
  });

  it('U04: should handle upload along with other fields', async () => {
    const res = await request(app)
      .put(`/api/profile/${userId}`)
      .set('Cookie', [`token=${userToken}`])
      .field('bio', 'Updated with picture')
      .attach('file', uploadPath);

    expect(res.statusCode).toBe(200);
    expect(res.body.profile.bio).toBe('Updated with picture');
    expect(res.body.profile.profilePicture).toMatch(/\/uploads\/.*\.png$/);
  });
});
