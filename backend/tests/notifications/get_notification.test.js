const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app.js');
const User = require('../../models/User.js');
const Notification = require('../../models/Notification.js');
const { generateToken } = require('../../utils/token.js');
const { MongoMemoryServer } = require('mongodb-memory-server');


let mongoServer;
let user, followedUser, userToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  user = await User.create({
    name: 'Test User',
    email: 'test@mail.com',
    password: 'Pass123!@#',
  });

  followedUser = await User.create({
    name: 'Follow User',
    email: 'followUser@mail.com',
    password: 'Pass123!@#',
  });

  userToken = generateToken(user._id);

  await Notification.insertMany([
    { recipient: user._id, type: 'like', sender: user._id, post: new mongoose.Types.ObjectId(), read: false },
    { recipient: user._id, type: 'comment', sender: user._id, post: new mongoose.Types.ObjectId(), read: true },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Positive Test Cases', () => {
  it('P01: Authenticated user fetches their notifications', async () => {
    const res = await request(app).get('/api/notifications').set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  it('P02: Response includes unread and read notifications', async () => {
    const res = await request(app).get('/api/notifications').set('Cookie', [`token=${userToken}`]);
    const types = res.body.notifications.map(n => n.read);
    expect(types).toContain(true);
    expect(types).toContain(false);
  });

  it('P03: Notifications are sorted by time (latest first)', async () => {
    const res = await request(app).get('/api/notifications').set('Cookie', [`token=${userToken}`]);
    const notifs = res.body.notifications;
    for (let i = 1; i < notifs.length; i++) {
      expect(new Date(notifs[i - 1].createdAt) >= new Date(notifs[i].createdAt)).toBe(true);
    }
  });

  it('P04: Each notification contains required fields', async () => {
    const res = await request(app).get('/api/notifications').set('Cookie', [`token=${userToken}`]);
    const notif = res.body.notifications[0];
    expect(notif).toHaveProperty('type');
    expect(notif).toHaveProperty('sender');
    expect(notif).toHaveProperty('post');
    expect(notif).toHaveProperty('read');
  });
});

describe('❌ Negative Test Cases', () => {
  it('N01: No auth token provided', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.statusCode).toBe(401);
  });

  it('N02: Invalid or expired token', async () => {
    const res = await request(app).get('/api/notifications').set('Cookie', ['token=invalidtoken']);
    expect(res.statusCode).toBe(401);
  });

  it('N03: Token in body instead of header/cookie', async () => {
    const res = await request(app).get('/api/notifications').send({ token: userToken });
    expect(res.statusCode).toBe(401);
  });

  it('N04: Token for deleted user', async () => {
    const ghostId = new mongoose.Types.ObjectId();
    const ghostToken = generateToken(ghostId);
    const res = await request(app).get('/api/notifications').set('Cookie', [`token=${ghostToken}`]);
    expect(res.statusCode).toBe(401);
  });
});

describe('🔳 Edge & 🔲 Corner Test Cases', () => {
  it('E01: User has 0 notifications', async () => {
    const newUser = await User.create({ name: 'Zero', email: 'zero@mail.com', password: 'Pass123!@#' });
    const token = generateToken(newUser._id);
    const res = await request(app).get('/api/notifications').set('Cookie', [`token=${token}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body.notifications.length).toBe(0);
  });

  it('E03: Notifications include emojis or HTML content', async () => {
    await Notification.create({
      recipient: user._id,
      type: 'comment',
      sender: user._id,
      post: new mongoose.Types.ObjectId(),
      message: '🔥🔥🔥 <script>alert(1)</script>',
    });

    const res = await request(app).get('/api/notifications').set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(200);
  });

  it('C01: User fetches notifications right after signup', async () => {
    const fresh = await User.create({ name: 'Newbie', email: 'fresh@mail.com', password: 'Pass123!@#' });
    const token = generateToken(fresh._id);
    const res = await request(app).get('/api/notifications').set('Cookie', [`token=${token}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body.notifications.length).toBe(0);
  });
});

describe('🔐 Security Cases', () => {
    it('S01: Forged JWT attempts to fetch notifications', async () => {
    const res = await request(app)
        .get('/api/notifications')
        .set('Cookie', ['token=forged.jwt.token']);

    expect(res.statusCode).toBe(401);
    });

    it('S03: SQL/NoSQL injection payload in query string', async () => {
    const res = await request(app)
        .get('/api/notifications?q[$gt]=') // No actual `q` param used but simulating
        .set('Cookie', [`token=${userToken}`]);

    expect([400, 200]).toContain(res.statusCode); // Depending on route handling
    });

    it('S04: Deleted user’s token used for access', async () => {
    const ghost = await User.create({
        name: 'Ghost',
        email: 'ghost@mail.com',
        password: 'Pass123!@#',
    });

    const ghostToken = generateToken(ghost._id);
    await ghost.deleteOne();

    const res = await request(app)
        .get('/api/notifications')
        .set('Cookie', [`token=${ghostToken}`]);

    expect(res.statusCode).toBe(401);
    });

    it('S05: Accessing notifications via user ID path fails', async () => {
    const res = await request(app)
        .get(`/api/notifications/${user._id}`)
        .set('Cookie', [`token=${userToken}`]);

    expect([403, 404]).toContain(res.statusCode);
    });
});


  
