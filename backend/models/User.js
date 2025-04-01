/**
 * @fileoverview User Model for MongoDB
 * @module models/User
 * @description Defines the user schema, handles password encryption, and provides authentication methods.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * @constant userSchema
 * @description Defines the structure of the User document in MongoDB.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [255, "Name must be at most 255 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email address'
      ],
      maxlength: [255, "Email must be at most 255 characters long"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d@$!%*?&^#()_+\-=]{8,}$/.test(value);
        },
        message:
          "Password must have at least one uppercase letter, one lowercase letter, one number, and one special character.",
      },
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/**
 * @middleware Pre-save Hook
 * @description Automatically hashes the password before saving a user document.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * @method matchPassword
 * @description Compares entered password with the stored hashed password.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
