import uploadService from "@services/uploadService";
import { AccessTokenPayload } from "@utils/jwt";
import validateCoupon from "@utils/validateCoupon";
import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Coupon, DownloadedCoupon, User, Visit } from "src/db";
import qr from "qrcode";

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

const get_coupons = async (req: AuthenticatedRequest, res: Response) => {
  if (req?.user?.role === "business") {
    const coupons = await Coupon.find(
      { createdBy: req?.user?.id },
      { __v: 0, add_to_carousel: 0 }
    );
    res.json(coupons);
  }
  if (req?.user?.role === "user") {
    const downloadedCoupons = await DownloadedCoupon.find(
      {
        user: req.user.id,
      },
      { __v: 0 }
    ).populate({
      path: "coupon",
      select: "-__v -add_to_carousel",
    });
    res.json(downloadedCoupons);
  }
};

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

const update_coupon = async (req: AuthenticatedRequest, res: Response) => {
  const {
    id,
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

  const error = validateRequiredFields({ id });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    res.status(404).json({
      message: "Coupon with this ID doesn't exist",
    });
    return;
  }

  const couponError = validateCoupon({
    discount_percentage: discount_percentage || coupon.discount_percentage,
    promo_title: promo_title || coupon.promo_title,
    regular_amount: regular_amount || coupon.regular_amount,
    discount_amount: discount_amount || coupon.discount_amount,
    mxn_amount: mxn_amount || coupon.mxn_amount,
  });

  if (couponError) {
    res.status(400).json({
      message: "This coupon type doesn't support the provided fields",
    });
    return;
  }

  let photo_url;

  if (photo) {
    try {
      photo_url = await uploadService(photo, "image");
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Internal Server Error. Upload Service failed" });
      return;
    }
  }

  let startDate, endDate;

  if (start) {
    const [startDay, startMonth, startYear] = start.split("/").map(Number);
    startDate = new Date(startYear, startMonth - 1, startDay);
  }

  if (end) {
    const [endDay, endMonth, endYear] = end.split("/").map(Number);
    endDate = new Date(endYear, endMonth - 1, endDay);
  }

  try {
    const payload = {
      ...(category_id && { category: category_id }),
      ...(promo_title && { promo_title }),
      ...(more_details && { more_details }),
      ...(startDate && { start: startDate }),
      ...(endDate && { end: endDate }),
      ...(add_to_carousel && { add_to_carousel }),
      ...(photo_url && { photo_url }),
      ...(discount_percentage && {
        discount_percentage: Number(discount_percentage),
      }),
      ...(regular_amount && { regular_amount: Number(regular_amount) }),
      ...(discount_amount && { discount_amount: Number(discount_amount) }),
      ...(mxn_amount && { mxn_amount: Number(mxn_amount) }),
    };

    await coupon.updateOne(payload);
    res.json({ message: "Coupon updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const delete_coupon = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.query.id) {
    res.status(400).json({ message: "Coupon ID is required" });
    return;
  }

  if (req.user?.role === "business") {
    const coupon = await Coupon.findById(
      new mongoose.Types.ObjectId(req?.query?.id as string)
    );

    if (!coupon) {
      res.status(404).json({
        message: "Coupon with this ID doesn't exist",
      });
      return;
    }

    try {
      await coupon.deleteOne();
      res.json({
        message: "Coupon successfully deleted",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }

  if (req.user?.role === "user") {
    const downloadedCoupon = await DownloadedCoupon.findOne({
      coupon: req.query.id,
      user: req.user.id,
    });
    if (!downloadedCoupon) {
      res
        .status(400)
        .json({ message: "Coupon ID not found in downloaded coupons" });
      return;
    }

    await downloadedCoupon.deleteOne();
    res.json({
      message: "Coupon successfully removed from downloaded coupons",
    });
  }
};

const download_coupon = async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req?.user?.id);
  const coupon = await Coupon.findById(req?.query?.id);

  if (!coupon) {
    res.status(404).json({ message: "Coupon with this ID doesn't exist" });
    return;
  }

  const downloadedCoupon = await DownloadedCoupon.findOne({
    user: user?._id,
    coupon: coupon._id,
  });

  if (downloadedCoupon) {
    res.status(400).json({
      message: "This coupon is already downloaded",
    });
    return;
  }

  try {
    await DownloadedCoupon.create({ coupon: coupon._id, user: user?._id });
    await Visit.create({ visitor: user?._id, coupon: coupon._id });
    res.json({ message: "Coupon downloaded successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const get_qr_code = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.query || {};

  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid ID" });
    return;
  }
  const qrCodeImage = await qr.toDataURL(id);
  res.send(`<img src="${qrCodeImage}" alt="QR Code"/>`);
};

export {
  get_coupons,
  add_coupon,
  update_coupon,
  delete_coupon,
  download_coupon,
  get_qr_code,
};
