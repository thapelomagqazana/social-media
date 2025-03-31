/**
 * @fileoverview User Model for MongoDB
 * @module models/User
 * @description Defines the user schema, handles password encryption, and provides authentication methods.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
          // Regex for a strong password: at least one uppercase, one lowercase, one digit, and one special character
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d@$!%*?&^#()_+\-=]{8,}$/.test(
            value
          );
        },
        message:
          "Password must have at least one uppercase letter, one lowercase letter, one number, and one special character.",
      },
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
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
 * @param {Function} next - Express next function to continue request processing.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip hashing if password is not modified

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * @method matchPassword
 * @description Compares entered password with the stored hashed password.
 * @param {string} enteredPassword - The password provided by the user.
 * @returns {Promise<boolean>} Returns true if passwords match, false otherwise.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ email: 1 }, { unique: true });

// Export the User model
export default mongoose.model("User", userSchema);
