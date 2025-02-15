import { Schema } from "mongoose";

const User = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    picture: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    location: {
      type: String,
      default: null,
    },
    passwordHash: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "business", "admin"],
      default: "user",
    },
    companyName: {
      type: String,
      default: null,
    },
    companyAddress: {
      type: String,
      default: null,
    },
    socials: {
      type: Object,
      default: null,
    },
    providers: {
      facebook: { type: String, default: null },
      google: { type: String, default: null },
      apple: { type: String, default: null },
    },
  },
  { timestamps: true }
);

const OTP = new Schema({
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["signup", "login", "forgotPassword"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, // 5 minutes
  },
});

export { User, OTP };
