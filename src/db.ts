import mongoose, { model } from "mongoose";
import {
  User as UserSchema,
  OTP as OTPSchema,
  Payment as PaymentSchema,
  Subscription as SubscriptionSchema,
  FAQs as FAQsSchema,
  Terms as TermsSchema,
  Privacy as PrivacySchema,
} from "src/schema";

const startDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || "");
  console.log("Connected to MongoDB");
};

const User = model("User", UserSchema);
const OTP = model("OTP", OTPSchema);
const Payment = model("Payment", PaymentSchema);
const Subscription = model("Subscription", SubscriptionSchema);
const FAQs = model("FAQs", FAQsSchema);
const Terms = model("Terms", TermsSchema);
const Privacy = model("Privacy", PrivacySchema);

export { User, OTP, Payment, Subscription, FAQs, Terms, Privacy, startDB };
