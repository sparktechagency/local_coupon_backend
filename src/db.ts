import mongoose, { model } from "mongoose";
import {
  User as UserSchema,
  OTP as OTPSchema,
  Payment as PaymentSchema,
} from "src/schema";

const startDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || "");
  console.log("Connected to MongoDB");
};

const User = model("User", UserSchema);
const OTP = model("OTP", OTPSchema);
const Payment = model("Payment", PaymentSchema);

export { User, OTP, Payment, startDB };
