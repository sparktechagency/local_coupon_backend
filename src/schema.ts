import mongoose, { Schema } from "mongoose";

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
    company_picture: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
    },
    countryDialCode: {
      type: String,
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
    isBanned: {
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
    businessName: {
      type: String,
      default: null,
    },
    businessPhone: {
      type: String,
      default: null,
    },
    street: {
      type: String,
      default: null,
    },
    exteriorNumber: {
      type: String,
      default: null,
    },
    interiorNumber: {
      type: String,
      default: null,
    },
    neighborhood: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    zipCode: {
      type: String,
      default: null,
    },
    socialMedia: {
      type: Object,
      default: null,
    },
    businessLogo: {
      type: [String],
      default: null,
    },
    hoursOfOperation: {
      type: Array,
      default: [
        {
          day: "Monday",
          hours: "09:00 AM - 06:00 PM",
        },
        {
          day: "Tuesday",
          hours: "09:00 AM - 06:00 PM",
        },
        {
          day: "Wednesday",
          hours: "09:00 AM - 06:00 PM",
        },
        {
          day: "Thursday",
          hours: "09:00 AM - 06:00 PM",
        },
        {
          day: "Friday",
          hours: "09:00 AM - 06:00 PM",
        },
        {
          day: "Saturday",
          hours: "10:00 AM - 04:00 PM",
        },
        {
          day: "Sunday",
          hours: "Closed",
        },
      ],
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
    subscriptionPackage: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    invitedUsers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    coordinates: {
      lat: {
        type: Schema.Types.Decimal128,
      },
      lng: {
        type: Schema.Types.Decimal128,
      },
    },
    id_url: {
      type: [String],
    },
    verification_url: {
      type: [String],
    },
    remaining_downloads: {
      type: Number,
      default: 20,
    },
    remaining_uploads: {
      type: Number,
      default: 3,
    },
    last_visited: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Coupon",
      default: [],
    },
  },
  { timestamps: true }
);

const DownloadedCoupon = new Schema(
  {
    coupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    redeemed: {
      type: Boolean,
      required: true,
      default: false,
    },
    redeemedAt: {
      type: Date,
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
  type: {
    type: String,
    enum: ["user", "business"],
    default: "user",
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
  translations: [
    {
      language_code: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
  ],
  icon_url: {
    type: String,
    required: true,
  },
});

const Coupon = new Schema(
  {
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
    carousel_photo_url: {
      type: String,
    },
    discount_percentage: {
      type: Number,
    },
    promo_title: {
      type: String,
    },
    promo_title_fr: {
      type: String,
    },
    promo_title_sp: {
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
    redeemCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    exploreCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Visit = new Schema({
  visitor: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  coupon: {
    type: Schema.Types.ObjectId,
    ref: "Coupon",
  },
  business: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  lastVisitedAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

const Report = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coupon: {
    type: Schema.Types.ObjectId,
    ref: "Coupon",
  },
  profile: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  reason: {
    type: String,
    required: true,
  },
  details: {
    type: String,
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
  DownloadedCoupon,
  Notification,
  Report,
};
