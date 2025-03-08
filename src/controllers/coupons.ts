import uploadService from "@services/uploadService";
import { AccessTokenPayload } from "@utils/jwt";
import validateCoupon from "@utils/validateCoupon";
import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";
import { Coupon } from "src/db";
interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

const get_coupons = (req: Request, res: Response) => {};

const add_coupon = async (req: AuthenticatedRequest, res: Response) => {
  const {
    category_id,
    discount_percentage,
    promo_title,
    regular_amount,
    discount_amount,
    mxn_amount,
    more_details,
    start,
    end,
    add_to_carousel,
  } = req.body || {};
  const photo = req.file;

  const error = validateRequiredFields({ category_id, start, end, photo });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const couponError = validateCoupon({
    discount_percentage,
    promo_title,
    regular_amount,
    discount_amount,
    mxn_amount,
  });

  if (couponError) {
    res.status(400).json({ message: couponError });
    return;
  }

  let photo_url;

  try {
    photo_url = await uploadService(photo, "image");
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal Server Error. Upload Service failed" });
    return;
  }

  const [startDay, startMonth, startYear] = start.split("/").map(Number);
  const startDate = new Date(startYear, startMonth - 1, startDay);
  const [endDay, endMonth, endYear] = end.split("/").map(Number);
  const endDate = new Date(endYear, endMonth - 1, endDay);

  try {
    const payload = {
      createdBy: req.user?.id,
      category: category_id,
      promo_title,
      more_details,
      start: startDate,
      end: endDate,
      add_to_carousel,
      photo_url,
    } as any;

    if (discount_percentage) {
      payload.discount_percentage = Number(discount_percentage);
    }
    if (regular_amount) {
      payload.regular_amount = Number(regular_amount);
    }
    if (discount_amount) {
      payload.discount_amount = Number(discount_amount);
    }
    if (mxn_amount) {
      payload.mxn_amount = Number(mxn_amount);
    }

    await Coupon.create(payload);
    res.json({ message: "Coupon added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const update_coupon = (req: Request, res: Response) => {};

const delete_coupon = (req: Request, res: Response) => {};

export { get_coupons, add_coupon, update_coupon, delete_coupon };
