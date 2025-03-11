import mongoose, { model } from "mongoose";
import {
  User as UserSchema,
  OTP as OTPSchema,
  Payment as PaymentSchema,
  Subscription as SubscriptionSchema,
  FAQs as FAQsSchema,
  Terms as TermsSchema,
  Privacy as PrivacySchema,
  Categories as CategoriesSchema,
  Coupon as CouponSchema,
  Visit as VisitSchema,
  DownloadedCoupon as DownloadedCouponSchema,
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
const Categories = model("Categories", CategoriesSchema);
const Coupon = model("Coupon", CouponSchema);
const Visit = model("Visit", VisitSchema);
const DownloadedCoupon = model("DownloadedCoupon", DownloadedCouponSchema);

export {
  User,
  OTP,
  Payment,
  Subscription,
  FAQs,
  Terms,
  Privacy,
  Categories,
  Coupon,
  Visit,
  DownloadedCoupon,
  startDB,
};
