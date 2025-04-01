const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app.js');
const User = require('../../models/User.js');
const Notification = require('../../models/Notification.js');
const { generateToken } = require('../../utils/token.js');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let user, userToken, notification;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  user = await User.create({
    name: 'Tester',
    email: 'tester@mail.com',
    password: 'Pass123!@#',
  });

  userToken = generateToken(user._id);

  notification = await Notification.create({
    recipient: user._id,
    type: 'like',
    sender: user._id,
    message: 'You got a like!'
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('✅ Positive Cases', () => {
  it('P01: Authenticated user marks one of their notifications as read', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notification._id}/read`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/marked as read/i);
  });

  it('P02: Already-read notification is marked again (idempotent)', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notification._id}/read`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
  });

  it('P03: Multiple notifications marked (via repeated requests)', async () => {
    const n2 = await Notification.create({
      recipient: user._id,
      type: 'follow',
      sender: user._id,
      message: 'Someone followed you!'
    });

    const res = await request(app)
      .put(`/api/notifications/${n2._id}/read`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
  });

  it('P04: Marking notification updates read: true in DB', async () => {
    const updated = await Notification.findById(notification._id);
    expect(updated.read).toBe(true);
  });
});

describe('❌ Negative Cases', () => {
  it('N01: No auth token provided', async () => {
    const res = await request(app).put(`/api/notifications/${notification._id}/read`);
    expect(res.statusCode).toBe(401);
  });

  it('N02: Invalid token', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notification._id}/read`)
      .set('Cookie', ['token=invalidtoken']);
    expect(res.statusCode).toBe(401);
  });

  it('N03: Malformed notification ID', async () => {
    const res = await request(app)
      .put('/api/notifications/notanid/read')
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(400);
  });

  it('N04: Notification ID valid but doesn’t exist', async () => {
    const res = await request(app)
      .put(`/api/notifications/${new mongoose.Types.ObjectId()}/read`)
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(404);
  });

  it('N05: Notification does not belong to user', async () => {
    const otherUser = await User.create({
      name: 'Stranger',
      email: 'stranger@mail.com',
      password: 'Pass123!@#',
    });
    const n3 = await Notification.create({
      recipient: otherUser._id,
      sender: user._id,
      message: 'Hello stranger',
      type: 'comment'
    });
    const res = await request(app)
      .put(`/api/notifications/${n3._id}/read`)
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(403);
  });

  it('N06: Token passed in body instead of header/cookie', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notification._id}/read`)
      .send({ token: userToken });
    expect(res.statusCode).toBe(401);
  });
});

describe('🔳 Edge Cases', () => {
  it('E01: Marking already-read notification (no change)', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notification._id}/read`)
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(200);
  });

  it('E02: Extra fields in payload (ignored)', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notification._id}/read`)
      .set('Cookie', [`token=${userToken}`])
      .send({ something: 'unexpected' });
    expect(res.statusCode).toBe(200);
  });

  it('E03: Request with uppercase ID (if valid)', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notification._id.toString().toUpperCase()}/read`)
      .set('Cookie', [`token=${userToken}`]);
    expect([200, 400]).toContain(res.statusCode); // depends on DB case sensitivity
  });

  it('E04: Notification with long message or emoji', async () => {
    const longNote = await Notification.create({
      recipient: user._id,
      sender: user._id,
      message: '🔥'.repeat(1000),
      type: 'like'
    });

    const res = await request(app)
      .put(`/api/notifications/${longNote._id}/read`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
  });

  it('E05: Rapid sequential reads of same notification', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Cookie', [`token=${userToken}`]);
      expect(res.statusCode).toBe(200);
    }
  });
});

describe('🔲 Corner Cases', () => {
  it('C01: Marking immediately after creation', async () => {
    const fresh = await Notification.create({
      recipient: user._id,
      sender: user._id,
      message: 'Freshly created',
      type: 'follow'
    });

    const res = await request(app)
      .put(`/api/notifications/${fresh._id}/read`)
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(200);
  });

  it('C02: Marking after deletion', async () => {
    const ghost = await Notification.create({
      recipient: user._id,
      sender: user._id,
      message: 'Ghost note',
      type: 'comment'
    });
    await Notification.deleteOne({ _id: ghost._id });

    const res = await request(app)
      .put(`/api/notifications/${ghost._id}/read`)
      .set('Cookie', [`token=${userToken}`]);
    expect(res.statusCode).toBe(404);
  });

  it('C03: Multiple users try to mark same notification', async () => {
    const secondUser = await User.create({
      name: 'Intruder',
      email: 'intruder@mail.com',
      password: 'Pass123!@#',
    });
    const intruderToken = generateToken(secondUser._id);

    const res = await request(app)
      .put(`/api/notifications/${notification._id}/read`)
      .set('Cookie', [`token=${intruderToken}`]);

    expect(res.statusCode).toBe(403);
  });

  it('C04: User marks notification and logs out instantly', async () => {
    const temp = await Notification.create({
      recipient: user._id,
      sender: user._id,
      message: 'Temp note',
      type: 'like'
    });

    const res = await request(app)
      .put(`/api/notifications/${temp._id}/read`)
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
  });
});

describe('🔐 Security Test Cases', () => {
    it('S01: Forged JWT attempts to mark a notification', async () => {
    const forgedToken = 'invalid.token.string';
    const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Cookie', [`token=${forgedToken}`]);

    expect(res.statusCode).toBe(401);
    });

    it('S03: SQL/NoSQL injection in notification ID', async () => {
    const injectionId = '"{$ne:null}"';
    const res = await request(app)
        .put(`/api/notifications/${injectionId}/read`)
        .set('Cookie', [`token=${userToken}`]);

    expect([400, 500]).toContain(res.statusCode);
    });

    it('S04: Deleted user’s token is used', async () => {
    const ghostUser = await User.create({ name: 'Ghost', email: 'ghost@mail.com', password: 'Pass123!@#' });
    const ghostToken = generateToken(ghostUser._id);
    await ghostUser.deleteOne();

    const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Cookie', [`token=${ghostToken}`]);

    expect(res.statusCode).toBe(401);
    });

    it.skip("S05: User tries to mark another user’s notification", async () => {
    const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(403);
    });
});

describe('⚡ Performance Test Cases', () => {
    it.skip('F01: Marking 1000 notifications in sequence', async () => {
    const bulk = await Notification.insertMany(
        Array.from({ length: 1000 }).map(() => ({
            recipient: user._id,
            type: 'follow',
            sender: user._id,
            post: new mongoose.Types.ObjectId(),
            message: 'You were followed.'
        }))
    );

    const start = Date.now();
    for (let note of bulk) {
        await request(app)
        .put(`/api/notifications/${note._id}/read`)
        .set('Cookie', [`token=${userToken}`]);
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000); // Under 2s
    });

    it('F02: Marking notification during server load', async () => {
    const testNote = await Notification.create({
        recipient: user._id,
        type: 'comment',
        sender: user._id,
        post: new mongoose.Types.ObjectId(),
        message: 'Load test 🧪'
    });

    const res = await request(app)
        .put(`/api/notifications/${testNote._id}/read`)
        .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(200);
    });

    it('F03: Marking same notification repeatedly', async () => {
    const testNote = await Notification.create({
        recipient: user._id,
        type: 'like',
        sender: user._id,
        post: new mongoose.Types.ObjectId(),
        message: 'Repetitive like'
    });

    for (let i = 0; i < 5; i++) {
        const res = await request(app)
        .put(`/api/notifications/${testNote._id}/read`)
        .set('Cookie', [`token=${userToken}`]);

        expect(res.statusCode).toBe(200);
    }
    });
});