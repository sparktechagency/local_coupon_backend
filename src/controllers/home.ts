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

  let creatorIds = [];
  if (query) {
    const creators = await User.find(
      { companyName: new RegExp(query as string, "i") },
      { location: new RegExp(location as string, "i") },
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

  const couponsFromDB = await Coupon.find(filters)
    .populate({
      path: "createdBy",
      select: "name companyName location",
    })
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: -1 })
    .lean();

  // Sort coupons by a simple recommendation score
  couponsFromDB.sort((a, b) => {
    const scoreA = (a.redeemCount || 0) + (a.shareCount || 0);
    const scoreB = (b.redeemCount || 0) + (b.shareCount || 0);
    return scoreB - scoreA;
  });

  const carousel = couponsFromDB
    .filter((coupon) => coupon.add_to_carousel)
    .sort(() => Math.random() - 0.5)
    .slice(0, 20);
  const coupons = couponsFromDB.filter((coupon) => !coupon.add_to_carousel);

  res.json({
    data: {
      ...(!query && { categories }),
      ...(!query && { carousel }),
      coupons,
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
