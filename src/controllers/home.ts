import { AccessTokenPayload } from "@utils/jwt";
import { Request, Response } from "express";
import { Categories, Coupon, DownloadedCoupon, User, Visit } from "@db";
import createResponseHandler from "@utils/response_handler";

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}
const home = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
  const { query, category, location, page, limit } = req.query || {};

  let categories;
  if (!category) {
    categories = await Categories.find({}, { __v: 0 });
  }

  const couponFilter: any = {};

  if (category) {
    const isExistCategory = await Categories.findById(category);
    if (!isExistCategory) {
      throw new Error("Category not exists!");
    }
    couponFilter.category = isExistCategory._id;
  }

  const userCoordinates = await User.findById(req?.user?.id, {
    coordinates: 1,
  });

  const { lat, lng } = userCoordinates?.coordinates || {};

  let creatorIds = [];
  if (query) {
    const creators = await User.find(
      {
        $or: [
          { companyName: new RegExp(query as string, "i") },
          { location: new RegExp(location as string, "i") },
        ],
      },
      { _id: 1 }
    );
    creatorIds = creators.map((creator: any) => creator._id);
  }

  const filters = {
    ...(query && { createdBy: { $in: creatorIds } }), // Filter by _id
    ...(category && { category }),
  };

  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const skip = (pageNumber - 1) * limitNumber;
  const totalCoupons = await Coupon.countDocuments(filters);
  const totalPages = Math.ceil(totalCoupons / limitNumber);

  const couponsFromDB = await Coupon.find(couponFilter)
    .populate({
      path: "createdBy",
      select: "name companyName location coordinates",
    })
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: -1 })
    .lean();

  const couponsWithDistance = couponsFromDB.map((coupon) => {
    const couponCoordinates = (coupon.createdBy as any)?.coordinates;

    const couponLat = couponCoordinates?.lat || 0;
    const couponLng = couponCoordinates?.lng || 0;
    const userLat = lat || 0;
    const userLng = lng || 0;

    const distance = calcDistance(userLat, userLng, couponLat, couponLng);
    return {
      ...coupon,
      distance,
    };
  });

  couponsWithDistance.sort((a, b) => a.distance - b.distance);

  // Sort coupons by a simple recommendation score
  couponsWithDistance.sort((a, b) => {
    const scoreA = (a.redeemCount || 0) + (a.shareCount || 0);
    const scoreB = (b.redeemCount || 0) + (b.shareCount || 0);
    return scoreB - scoreA;
  });

  const carousel = couponsWithDistance
    .filter((coupon) => coupon.add_to_carousel)
    .sort(() => Math.random() - 0.5)
    .slice(0, 20);

  // const coupons = couponsWithDistance.filter(
  //   (coupon) => !coupon.add_to_carousel
  // );

  res.json({
    data: {
      ...(!query && { categories }),
      ...(!query && { carousel }),
      coupons: couponsFromDB,
    },
    message: "Home fetched successfully",
    meta: {
      totalCoupons,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
    },
  });
};

const calcDistance = (
  userLat: any,
  userLng: any,
  couponLat: any,
  couponLng: any
): number => {
  // Convert latitudes and longitudes to numbers if they are strings
  const lat1 = typeof userLat === "string" ? parseFloat(userLat) : userLat;
  const lng1 = typeof userLng === "string" ? parseFloat(userLng) : userLng;
  const lat2 =
    typeof couponLat === "string" ? parseFloat(couponLat) : couponLat;
  const lng2 =
    typeof couponLng === "string" ? parseFloat(couponLng) : couponLng;

  // Validate that the coordinates are valid numbers
  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    throw new Error("Invalid latitude or longitude values");
  }

  // Convert degrees to radians
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

  const R = 6371; // Earth's radius in kilometers (use 3958.8 for miles)

  // Convert coordinates to radians
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Return the distance in kilometers
  return R * c;
};

const analytics = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
  const coupons = await Coupon.find({ createdBy: req.user?.id });
  const total_downloads = await DownloadedCoupon.countDocuments({
    coupon: { $in: coupons.map((c) => c._id) },
  });
  const total_shares = coupons.reduce(
    (sum, coupon) => sum + (coupon.shareCount || 0),
    0
  );
  const click_to_explore = await Visit.countDocuments({
    coupon: { $in: coupons.map((c) => c._id) },
  });
  const expired_coupons = await Coupon.countDocuments({
    createdBy: req.user?.id,
    end: { $lt: new Date() },
  });
  const profile_visits = await Visit.countDocuments({ business: req.user?.id });
  const value = coupons.reduce(
    (sum, coupon) => sum + (coupon.discount_amount || 0),
    0
  );

  res.json({
    data: {
      total_downloads,
      total_shares,
      click_to_explore,
      expired_coupons,
      profile_visits,
      value,
    },
    message: "Analytics fetched successfully",
  });
};

export { home, analytics };
