const User = require('../models/User');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Notification = require('../models/Notification');
const { generateToken } = require('./token');

// Create a new test user
const createTestUser = async (overrides = {}) => {
  const defaultData = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'Password123!',
  };
  const user = await User.create({ ...defaultData, ...overrides });
  return user;
};

// Generate JWT token for a user
const createToken = (userId) => {
  return generateToken(userId);
};

// Create a post for a user
const createPost = async (user, overrides = {}) => {
  return await Post.create({
    user: user._id,
    text: 'Sample post content',
    image: '',
    ...overrides,
  });
};

// Create a comment on a post
const createComment = async (user, post, text = 'Nice post!') => {
  return await Comment.create({
    user: user._id,
    post: post._id,
    text,
  });
};

// Create a like entry
const createLike = async (user, post) => {
  return await Like.create({
    user: user._id,
    post: post._id,
  });
};

// Follow another user
const followUser = async (follower, following) => {
  return await Follow.create({
    follower: follower._id,
    following: following._id,
  });
};

// Create a profile for a user
const createProfile = async (user, overrides = {}) => {
  return await Profile.create({
    user: user._id,
    username: `user${Date.now()}`,
    profilePicture: '',
    ...overrides,
  });
};

// Create a notification
const createNotification = async ({
  type = 'like',
  recipient,
  sender,
  post = null,
  comment = null,
}) => {
  return await Notification.create({
    type,
    recipient,
    sender,
    post,
    comment,
  });
};

module.exports = {
  createTestUser,
  createToken,
  createPost,
  createComment,
  createLike,
  followUser,
  createProfile,
  createNotification,
};
