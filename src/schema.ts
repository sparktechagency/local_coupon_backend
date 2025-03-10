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
      default: null,
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    companyName: {
      type: String,
      default: null,
    },
    companyAddress: {
      type: String,
      default: null,
    },
    hoursOfOperation: {
      type: Array,
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
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    subscriptionExpiry: {
      type: Date,
      default: null,
    },
    downloadedCoupons: {
      type: [Schema.Types.ObjectId],
      ref: "Coupon",
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

const Payment = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentMethod: {
      type: String,
    },
  },
  { timestamps: true }
);

const Subscription = new Schema({
  name: {
    type: String,
    required: true,
  },
  priceInCents: {
    type: Number,
    required: true,
  },
  durationInMonths: {
    type: Number,
    required: true,
  },
  info: {
    type: [String],
  },
});

const FAQs = new Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
});

const Terms = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Privacy = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Categories = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  icon_url: {
    type: String,
    required: true,
  },
});

const Coupon = new Schema({
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Categories",
    required: true,
  },
  photo_url: {
    type: String,
    required: true,
  },
  discount_percentage: {
    type: Number,
  },
  promo_title: {
    type: String,
  },
  regular_amount: {
    type: Number,
  },
  discount_amount: {
    type: Number,
  },
  mxn_amount: {
    type: Number,
  },
  more_details: {
    type: String,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  add_to_carousel: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const Visit = new Schema({
  visitor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coupon: {
    type: Schema.Types.ObjectId,
    ref: "Coupon",
    required: true,
  },
  lastVisitedAt: {
    type: Date,
    default: Date.now,
  },
});

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
};
