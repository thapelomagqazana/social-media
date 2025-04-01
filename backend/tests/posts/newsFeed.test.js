const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { generateToken } = require('../../utils/token');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let user, followedUser, userToken;
let followedUsers = [], followedPosts = [];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  user = await User.create({
    name: 'News Reader',
    email: 'reader@mail.com',
    password: 'Pass123!@#',
  });

  userToken = generateToken(user._id);

  followedUser = await User.create({
    name: 'Followed User',
    email: 'followed@mail.com',
    password: 'Pass123!@#',
  });

  user.following.push(followedUser._id);
  await user.save({ validateBeforeSave: false });

  await Post.create({ user: user._id, text: 'My own post' });
  await Post.create({ user: followedUser._id, text: 'Post from followed 👋' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Positive Cases', () => {
  it('P01: Authenticated user gets newsfeed', async () => {
    const res = await request(app)
      .get('/api/posts/newsfeed')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);
  });

  it('P02: Posts include those authored by self', async () => {
    const res = await request(app)
      .get('/api/posts/newsfeed')
      .set('Cookie', [`token=${userToken}`]);

    const hasSelf = res.body.posts.some(
      (p) => p.user._id === user._id.toString()
    );
    expect(hasSelf).toBe(true);
  });

  it('P03: Posts are sorted in descending order by time', async () => {
    const res = await request(app)
      .get('/api/posts/newsfeed')
      .set('Cookie', [`token=${userToken}`]);

    const posts = res.body.posts;
    for (let i = 1; i < posts.length; i++) {
      expect(new Date(posts[i - 1].createdAt) >= new Date(posts[i].createdAt)).toBe(true);
    }
  });

  it('P04: Each post includes author details', async () => {
    const res = await request(app)
      .get('/api/posts/newsfeed')
      .set('Cookie', [`token=${userToken}`]);

    for (const post of res.body.posts) {
      expect(post.user).toHaveProperty('name');
      expect(post.user).toHaveProperty('email');
    }
  });
});

describe('❌ Negative Cases', () => {
  it('N01: No auth token provided', async () => {
    const res = await request(app).get('/api/posts/newsfeed');
    expect(res.statusCode).toBe(401);
  });

  it('N02: Expired or invalid token', async () => {
    const res = await request(app)
      .get('/api/posts/newsfeed')
      .set('Cookie', ['token=invalidtoken']);
    expect(res.statusCode).toBe(401);
  });

  it('N03: Token sent in body instead of header/cookie', async () => {
    const res = await request(app)
      .get('/api/posts/newsfeed')
      .send({ token: userToken });
    expect(res.statusCode).toBe(401);
  });

  it('N04: Token user does not exist anymore', async () => {
    const ghostToken = generateToken(new mongoose.Types.ObjectId());
    const res = await request(app)
      .get('/api/posts/newsfeed')
      .set('Cookie', [`token=${ghostToken}`]);
    expect(res.statusCode).toBe(401);
  });

  it('N05: Malformed following list', async () => {
    user.following = [new mongoose.Types.ObjectId('000000000000000000000000')];
    await user.save({ validateBeforeSave: false });
  
    const res = await request(app)
      .get('/api/posts/newsfeed')
      .set('Cookie', [`token=${userToken}`]);
  
    expect(res.statusCode).toBe(200); // empty feed is OK
  });
});

describe('🔳 GET /api/posts/newsfeed - Edge Cases', () => {
    it('E01: User follows 1000+ users', async () => {
        const bulkUsers = await User.insertMany(
            Array.from({ length: 1000 }).map((_, i) => ({
                name: `BulkUser${i}`,
                email: `bulk${i}@mail.com`,
                password: 'Pass123!@#',
            }))
        );

        user.following = bulkUsers.map(u => u._id);
        await user.save({ validateBeforeSave: false });

        const res = await request(app)
            .get('/api/posts/newsfeed')
            .set('Cookie', [`token=${userToken}`]);

        expect(res.statusCode).toBe(200);
    });

    it('E02: User has no followers', async () => {
        const lonely = await User.create({ name: 'Lonely', email: 'lonely@mail.com', password: 'Pass123!@#' });
        await lonely.save({ validateBeforeSave: false });
        const lonelyToken = generateToken(lonely._id);

        const res = await request(app)
            .get('/api/posts/newsfeed')
            .set('Cookie', [`token=${lonelyToken}`]);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.posts)).toBe(true);
    });

    it('E03: User follows users with no posts', async () => {
        const silentUser = await User.create({ name: 'Silent', email: 'silent@mail.com', password: 'Pass123!@#' });
        user.following = [silentUser._id];
        await user.save({ validateBeforeSave: false });

        const res = await request(app)
            .get('/api/posts/newsfeed')
            .set('Cookie', [`token=${userToken}`]);

        expect(res.statusCode).toBe(200);
    });

    it('E04: Followed user deleted their posts', async () => {
        await Post.deleteMany({ user: followedUser._id });

        const res = await request(app)
            .get('/api/posts/newsfeed')
            .set('Cookie', [`token=${userToken}`]);

        expect(res.statusCode).toBe(200);
        const hasDeletedPosts = res.body.posts.some(p => p.user._id === followedUser._id.toString());
        expect(hasDeletedPosts).toBe(false);
    });

    it('E05: Posts include emojis, markdown, special characters', async () => {
        await Post.create({
            user: user._id,
            text: 'Here is some **markdown** and 🎉🚀🔥!'
        });

        const res = await request(app)
            .get('/api/posts/newsfeed')
            .set('Cookie', [`token=${userToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.posts[0].text).toMatch(/🎉|🚀|🔥|\*\*/);
    });
});

describe('🔲 GET /api/posts/newsfeed - Corner Cases', () => {
    it('C01: New user requests feed right after registration', async () => {
      const freshUser = await User.create({
        name: 'Newbie',
        email: 'newbie@mail.com',
        password:  'Pass123!@#',
      });
      const token = generateToken(freshUser._id);
  
      const res = await request(app)
        .get('/api/posts/newsfeed')
        .set('Cookie', [`token=${token}`]);
  
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.posts)).toBe(true);
    });
  
    it('C02: Followed user posts and deletes before feed loads', async () => {
      const tempPost = await Post.create({
        user: followedUser._id,
        text: 'Short-lived post',
      });
      await Post.findByIdAndDelete(tempPost._id);
  
      const res = await request(app)
        .get('/api/posts/newsfeed')
        .set('Cookie', [`token=${userToken}`]);
  
      expect(res.statusCode).toBe(200);
    });
  
    it('C03: Simultaneous requests by 1000 users (mocked)', async () => {
      const tokens = Array.from({ length: 100 }).map(() => generateToken(user._id));
  
      const allResponses = await Promise.all(
        tokens.map(token =>
          request(app)
            .get('/api/posts/newsfeed')
            .set('Cookie', [`token=${token}`])
        )
      );
  
      allResponses.forEach(res => {
        expect(res.statusCode).toBe(200);
      });
    });
  
    it('C04: User’s own post shown even if no followers', async () => {
      user.following = [];
      await user.save({ validateBeforeSave: false });
  
      const res = await request(app)
        .get('/api/posts/newsfeed')
        .set('Cookie', [`token=${userToken}`]);
  
      const includesOwnPost = res.body.posts.some(p => p.user._id === user._id.toString());
      expect(includesOwnPost).toBe(true);
    });
});

describe('🛡️ GET /api/posts/newsfeed - Security Tests', () => {
    it('S01: Forged JWT returns 401 or 403', async () => {
      const forged = 'eyJhbGciOiJIUzI1NiIsInR5...forged';
      const res = await request(app)
        .get('/api/posts/newsfeed')
        .set('Cookie', [`token=${forged}`]);
  
      expect([401, 403]).toContain(res.statusCode);
    });
  
    it('S02: SQL injection in token (if not handled)', async () => {
      const token = "' OR '1'='1";
      const res = await request(app)
        .get('/api/posts/newsfeed')
        .set('Cookie', [`token=${token}`]);
  
      expect(res.statusCode).toBe(401);
    });
});
  
  
  