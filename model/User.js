import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDefaultImage } from "../utils/functions.js";

const { Schema } = mongoose;

// Auth user sub-schema
const authUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide email"],
    validate: {
      validator: validator.isEmail,
      message: "Please provide a valid email",
    },
    unique: true,
  },
  phone_number: {
    type: String,
    required: false,
    validate: {
      validator: function (value) {
        return /^\d{10}$/.test(value); // Modify regex based on requirements
      },
      message: "Please provide a valid contact number",
    },
  },
  password: {
    select: false,
    type: String,
    required: [true, "Please provide password"],
    minlength: 6,
  },
});

// App user sub-schema (to handle threads)
const appUserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    minlength: 5,
    maxlength: 50,
  },
  lastname: {
    type: String,
    minlength: 5,
    maxlength: 50,
  },
  title: {
    type: String,
    maxlength: 100,
  },
  image_link: {
    type: String,
    validate: {
      validator: function (value) {
        // Regular expression to check if the value is a valid URL
        const urlRegex =
          /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|bmp|svg|ico))$/i;
        return urlRegex.test(value);
      },
      message: "Please provide a valid image URL",
    },
    default: getDefaultImage(),
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, "Balance cannot be negative"],
  },
  threads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Thread" }], // Reference to Thread model
});

// Main User schema
const UserSchema = new mongoose.Schema({
  auth_user: authUserSchema, // Embed auth_user schema
  app_user: appUserSchema, // Embed app_user schema
});

// Middleware to hash the password before saving
UserSchema.pre("save", async function () {
  if (this.isModified("auth_user.password")) {
    // Only hash if password is modified
    const salt = await bcrypt.genSalt(10);
    this.auth_user.password = await bcrypt.hash(this.auth_user.password, salt); // Hashing auth_user.password
  }
});

// JWT creation method
UserSchema.methods.createJWT = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
};

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(
    candidatePassword,
    this.auth_user.password
  ); // Referencing auth_user.password
  return isMatch;
};

export default mongoose.model("User", UserSchema);
