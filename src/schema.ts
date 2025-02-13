import { Schema } from "mongoose";

const User = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const OTP = new Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["signup", "login", "forgotPassword"],
      required: true,
    },
  },
  {
    timestamps: true,
    expires: 60 * 5, // 5 minutes
  }
);

export { User, OTP };
