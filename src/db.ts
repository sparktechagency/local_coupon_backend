import mongoose, { model } from "mongoose";
import { User as UserSchema, OTP as OTPSchema } from "src/schema";

const startDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || "");
  console.log("Connected to MongoDB");
};

const User = model("User", UserSchema);
const OTP = model("OTP", OTPSchema);

export { User, OTP, startDB };
