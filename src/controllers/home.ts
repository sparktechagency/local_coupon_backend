import { AccessTokenPayload } from "@utils/jwt";
import { Request, Response } from "express";
import { Categories, Coupon, DownloadedCoupon, Visit } from "@db";

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}
const home = async (req: AuthenticatedRequest, res: Response) => {
  const { query, category, location } = req.query || {};
  let categories;
  if (!category) {
    categories = await Categories.find({}, { __v: 0 });
  }

  const couponsFromDB = await Coupon.find({
    ...(query && { "createdBy.companyName": new RegExp(query as string, "i") }),
    ...(category && { category }),
    ...(location && { "createdBy.location": location }),
  }).populate({
    path: "createdBy",
    select: "name companyName",
  });

  // Sort coupons by a simple recommendation score
  couponsFromDB.sort((a, b) => {
    const scoreA = (a.redeemCount || 0) + (a.shareCount || 0);
    const scoreB = (b.redeemCount || 0) + (b.shareCount || 0);
    return scoreB - scoreA;
  });

  const carousel = couponsFromDB.filter((coupon) => coupon.add_to_carousel);
  const coupons = couponsFromDB.filter((coupon) => !coupon.add_to_carousel);

  res.json({ categories, carousel, coupons });
};

const analytics = async (req: AuthenticatedRequest, res: Response) => {
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
    total_downloads,
    total_shares,
    click_to_explore,
    expired_coupons,
    profile_visits,
    value,
  });
};

export { home, analytics };
