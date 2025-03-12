import { AccessTokenPayload } from "@utils/jwt";
import { Request, Response } from "express";
import { Coupon, DownloadedCoupon, Visit } from "src/db";

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}
const home = async (req: AuthenticatedRequest, res: Response) => {};

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
