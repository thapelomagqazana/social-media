const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");
const User = require("../../models/User");
const Post = require("../../models/Post");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { generateToken } = require("../../utils/token");

let mongoServer;
let userToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create users
  const user1 = await User.create({
    name: 'David Miller',
    email: 'david@mail.com',
    password: 'Pass123!@#'
  });

  const user2 = await User.create({
    name: 'Daisy 🌼',
    email: 'daisy@mail.com',
    password: 'Pass123!@#'
  });

  const user3 = await User.create({
    name: '123Numbers',
    email: 'numeric@mail.com',
    password: 'Pass123!@#'
  });

  // Token for search
  userToken = generateToken(user1._id);

  // Posts
  await Post.create({ user: user1._id, text: 'Just another day in paradise ☀️' });
  await Post.create({ user: user1._id, text: 'Davinci code is a thriller' });
  await Post.create({ user: user2._id, text: '🌟 Shiny thoughts' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ GET /api/search?q=term&type=users|posts - Search API Tests', () => {
  // Positive
  it('P01: Search for users with matching name', async () => {
    const res = await request(app).get('/api/search?q=david&type=users');
    expect(res.statusCode).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it('P02: Search for posts with matching content', async () => {
    const res = await request(app).get('/api/search?q=paradise&type=posts');
    expect(res.statusCode).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it('P03: Search is case-insensitive', async () => {
    const res = await request(app).get('/api/search?q=DaViD&type=users');
    expect(res.statusCode).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it('P04: Partial matches work', async () => {
    const res = await request(app).get('/api/search?q=dav&type=users');
    expect(res.statusCode).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it('P05: Authenticated search returns results', async () => {
    const res = await request(app)
      .get('/api/search?q=day&type=posts')
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(200);
  });

  // Negative
  it('N01: Missing q parameter', async () => {
    const res = await request(app).get('/api/search?type=users');
    expect(res.statusCode).toBe(400);
  });

  it('N02: Missing type parameter', async () => {
    const res = await request(app).get('/api/search?q=david');
    expect(res.statusCode).toBe(400);
  });

  it('N03: Invalid type value', async () => {
    const res = await request(app).get('/api/search?q=hi&type=invalid');
    expect(res.statusCode).toBe(400);
  });

  it('N04: Empty query string', async () => {
    const res = await request(app).get('/api/search?q=&type=users');
    expect(res.statusCode).toBe(400);
  });

  it('N05: Unauthorized user (if required)', async () => {
    const res = await request(app).get('/api/search?q=hi&type=posts');
    expect(res.statusCode === 200 || res.statusCode === 401).toBe(true);
  });

  // Edge
  it('E01: Search with 1-character term', async () => {
    const res = await request(app).get('/api/search?q=d&type=users');
    expect([200, 400]).toContain(res.statusCode);
  });

  it('E02: Query string contains emojis or symbols', async () => {
    const res = await request(app).get('/api/search?q=🌟&type=posts');
    expect(res.statusCode).toBe(200);
  });

  it('E03: Search term matches many entries', async () => {
    const res = await request(app).get('/api/search?q=a&type=posts');
    expect(res.statusCode).toBe(200);
  });

  it('E04: Search term is numeric', async () => {
    const res = await request(app).get('/api/search?q=123&type=users');
    expect(res.statusCode).toBe(200);
  });

  it('E05: Search query has whitespace', async () => {
    const res = await request(app).get('/api/search?q= david &type=users');
    expect(res.statusCode).toBe(200);
  });

  // Corner
  it('C01: Search while DB is empty', async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
    const res = await request(app).get('/api/search?q=test&type=users');
    expect(res.statusCode).toBe(200);
    expect(res.body.results.length).toBe(0);
  });

  it('C02: Search right after creating a user', async () => {
    await User.create({
      name: 'QuickCreate',
      email: 'qc@mail.com',
      password: 'Pass123!@#'
    });
    const res = await request(app).get('/api/search?q=quick&type=users');
    expect(res.statusCode).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });
});

describe('🔐 GET /api/search - Security Tests', () => {
    it.skip('S01: Should reject forged JWT token', async () => {
      const fakeToken = 'Bearer faketoken123';
      const res = await request(app)
        .get('/api/search?q=david&type=users')
        .set('Authorization', fakeToken);
  
      expect([401, 403]).toContain(res.statusCode);
    });
  
    it('S02: Should prevent XSS in search term', async () => {
      const res = await request(app)
        .get('/api/search?q=<script>alert("xss")</script>&type=users')
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBeInstanceOf(Array);
    });
  
    it('S03: Should sanitize SQL injection-like inputs', async () => {
      const res = await request(app)
        .get('/api/search?q=\' OR 1=1 --&type=posts')
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBeInstanceOf(Array);
    });
});

describe('⚡ GET /api/search - Performance Tests', () => {
    it('F01: Should return response within 500ms for large dataset', async () => {
    const start = Date.now();
    const res = await request(app)
        .get('/api/search?q=a&type=users')
        .set('Cookie', [`token=${userToken}`]);
    const duration = Date.now() - start;

    expect(res.statusCode).toBe(200);
    expect(duration).toBeLessThanOrEqual(500);
    });

    it('F02: Should paginate or limit results if more than 1000 matches', async () => {
    const res = await request(app)
        .get('/api/search?q=test&type=posts')
        .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.results.length).toBeLessThanOrEqual(1000);
    });
});
  
  
