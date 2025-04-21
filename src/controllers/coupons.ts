import uploadService from "@services/uploadService";
import { AccessTokenPayload } from "@utils/jwt";
import validateCoupon from "@utils/validateCoupon";
import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";
import mongoose, { isObjectIdOrHexString } from "mongoose";
import { Categories, Coupon, DownloadedCoupon, User, Visit } from "@db";
import qr from "qrcode";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import createResponseHandler from "@utils/response_handler";

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

const get_coupons = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
  const { page, limit } = req.query;
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;

  if (req?.user?.role === "business") {
    const filters = { createdBy: req?.user?.id };

    const totalCoupons = await Coupon.countDocuments(filters);
    const totalPages = Math.ceil(totalCoupons / limitNumber);
    const skip = (pageNumber - 1) * limitNumber;

    const coupons = await Coupon.find(filters, {
      __v: 0,
      add_to_carousel: 0,
    })
      .populate({
        path: "createdBy",
        select: "name companyName",
      })
      .skip(skip)
      .limit(limitNumber);

    res.json({
      message: "Coupons fetched successfully",
      data: coupons,
      meta: {
        total: totalCoupons,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
      },
    });
  }
  if (req?.user?.role === "user") {
    const filters = {
      user: req.user.id,
    };

    const totalCoupons = await DownloadedCoupon.countDocuments(filters);
    const totalPages = Math.ceil(totalCoupons / limitNumber);
    const skip = (pageNumber - 1) * limitNumber;

    const downloadedCoupons = await DownloadedCoupon.find(filters, { __v: 0 })
      .populate({
        path: "coupon",
        select: "-__v -add_to_carousel",
        populate: {
          path: "createdBy",
          select: "name companyName",
        },
      })
      .sort({ redeemed: 1 })
      .skip(skip)
      .limit(limitNumber);

    res.json({
      message: "Downloaded coupons fetched successfully",
      data: downloadedCoupons,
      meta: {
        total: totalCoupons,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
      },
    });
  }
};

const get_coupon = async (req: AuthenticatedRequest, response: Response) => {
  const { id } = req.query || {};
  const res = createResponseHandler(response);
  const error = validateRequiredFields({ id });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  if (!isObjectIdOrHexString(id)) {
    res.status(400).json({ message: "Invalid Id" });
    return;
  }

  const coupon = await Coupon.findById(id, {
    __v: 0,
  });

  if (!coupon) {
    res.status(404).json({ message: "Coupon with this ID doesn't exist" });
    return;
  }

  res.json({
    message: "Coupon fetched successfully",
    data: coupon,
  });
};

const add_coupon = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
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
    carousel_image,
  } = req.body || {};

  const photo = (req.files as { [fieldname: string]: Express.Multer.File[] })
    ?.photo?.[0];
  const carouselImage = (
    req.files as { [fieldname: string]: Express.Multer.File[] }
  )?.carousel_image?.[0];

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

  const category = await Categories.findById(category_id);
  if (!category) {
    res.status(404).json({
      message: "Category with this ID doesn't exist",
    });
    return;
  }

  let photo_url;
  let carousel_photo_url;

  try {
    photo_url = await uploadService(photo, "image");
    carousel_photo_url = await uploadService(carouselImage, "image");
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
      carousel_photo_url,
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

const update_coupon = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
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

const delete_coupon = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
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

const download_coupon = async (
  req: AuthenticatedRequest,
  response: Response
) => {
  const res = createResponseHandler(response);
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

const get_qr_code = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
  const { id } = req.query || {};

  const downloadedCoupon = await DownloadedCoupon.findById(id);

  if (!downloadedCoupon) {
    res.status(400).json({ message: "The coupon is invalid" });
    return;
  }

  try {
    const payload = {
      downloadedCouponId: downloadedCoupon._id,
    };

    const token = sign(payload, process.env.ACCESS_TOKEN_SECRET || "secret", {
      expiresIn: "5m",
    });

    const verificationURL = `${process.env.BASE_URL}/coupons/redeem-coupon?token=${token}`;

    const qrCodeImage = await qr.toDataURL(verificationURL);

    // res.send(`<img src="${qrCodeImage}" alt="QR Code"/>`);
    res.json({
      message: "QR code generated successfully",
      data: verificationURL,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to generate QR code" });
  }
};

const redeem_coupon = async (req: Request, res: Response) => {
  const { token } = req.query;

  const pageTemplate = (title: string, message: string, isSuccess: boolean) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f9;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            color: ${isSuccess ? "#2e8b57" : "#ff4d4d"};
            text-align: center;
          }
          .container {
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            background-color: white;
            max-width: 400px;
            width: 100%;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            font-size: 16px;
            line-height: 1.5;
          }
          .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: ${isSuccess ? "#2e8b57" : "#ff4d4d"};
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: ${isSuccess ? "#2d7b4f" : "#e04646"};
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <p>${message}</p>
        </div>
      </body>
      </html>
    `;
  };

  if (typeof token !== "string") {
    res.send(pageTemplate("Error", "Invalid coupon ID", false));
    return;
  }

  let decode;

  try {
    decode = verify(token, process.env.ACCESS_TOKEN_SECRET || "");
  } catch (error) {
    console.log(error);
    res.send(pageTemplate("Error", "Invalid coupon ID", false));
    return;
  }

  const downloadedCoupon = await DownloadedCoupon.findById(
    (decode as JwtPayload & { downloadedCouponId: string }).downloadedCouponId
  );

  // Check if the coupon exists
  if (!downloadedCoupon) {
    res.status(404).send(pageTemplate("Error", "Coupon not found", false));
  }

  const coupon = await Coupon.findById(downloadedCoupon?.coupon._id);

  if (!coupon) {
    res.status(404).send(pageTemplate("Error", "Coupon not found", false));
    return;
  }

  // Check if the coupon has expired
  const currentDate = new Date();
  if (coupon.end < currentDate) {
    res
      .status(400)
      .send(pageTemplate("Expired", "This coupon has expired", false));
  }

  if (downloadedCoupon?.redeemed) {
    res
      .status(400)
      .send(
        pageTemplate(
          "Already Redeemed",
          "This coupon has already been redeemed",
          false
        )
      );
  }

  if (downloadedCoupon) {
    downloadedCoupon.redeemed = true;
    downloadedCoupon.redeemedAt = new Date();
    await downloadedCoupon.save();
  }

  coupon.redeemCount += 1;
  await coupon.save();

  res.send(pageTemplate("Success", "Coupon successfully redeemed!", true));
};

const share_coupon = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);

  const { couponId } = req.body || {};

  const error = validateRequiredFields({ couponId });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  if (!isObjectIdOrHexString(couponId)) {
    res.status(400).json({ message: "Invalid Id" });
    return;
  }

  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    res.status(404).json({ message: "Coupon not found" });
    return;
  }

  coupon.shareCount += 1;
  await coupon.save();
  res.json({
    message: "Coupon shared successfully",
    data: { business_id: coupon.createdBy._id },
  });
};

type TypeView = "week" | "month" | "year";

const analytics = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
  const type = req.query.type as TypeView;

  if (!["week", "month", "year"].includes(type)) {
    res.status(400).json({ message: "Invalid type parameter" });
    return;
  }

  const coupons = await Coupon.find({ createdBy: req?.user?.id });
  const downloadedCoupons = await DownloadedCoupon.find({
    coupon: { $in: coupons.map((c) => c._id) },
  });

  const groupedData: { [key: string]: number } = {};

  // Initialize the data structure with default values
  if (type === "week") {
    // Days of the week (with default 0 count)
    const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    daysOfWeek.forEach((day) => {
      groupedData[day] = 0;
    });
  } else if (type === "month") {
    // Weeks of the month (with default 0 count)
    const weeksOfMonth = ["week 1", "week 2", "week 3", "week 4", "week 5"];
    weeksOfMonth.forEach((week) => {
      groupedData[week] = 0;
    });
  } else if (type === "year") {
    // Months of the year (with default 0 count)
    const monthsOfYear = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    monthsOfYear.forEach((month) => {
      groupedData[month] = 0;
    });
  }

  // Process the downloaded coupons based on the selected type (week, month, or year)
  downloadedCoupons.forEach((downloadedCoupon) => {
    const redeemedAt = new Date(downloadedCoupon.createdAt);

    if (type === "week") {
      // Group by day of the week
      const dayOfWeek = redeemedAt
        .toLocaleString("en-US", { weekday: "short" })
        .toLowerCase(); // sun, mon, etc.
      groupedData[dayOfWeek] = (groupedData[dayOfWeek] || 0) + 1;
    } else if (type === "month") {
      // Group by week of the month
      const weekOfMonth = Math.ceil((redeemedAt.getDate() - 1) / 7) + 1; // Week 1, Week 2, etc.
      const weekKey = `week ${weekOfMonth}`;
      groupedData[weekKey] = (groupedData[weekKey] || 0) + 1;
    } else if (type === "year") {
      // Group by month of the year
      const monthOfYear = redeemedAt.toLocaleString("en-US", {
        month: "short",
      }); // Jan, Feb, etc.
      groupedData[monthOfYear] = (groupedData[monthOfYear] || 0) + 1;
    }
  });

  res.json({
    message: "Analytics fetched successfully",
    data: { groupedData, type },
  });
};

export {
  get_coupons,
  add_coupon,
  update_coupon,
  delete_coupon,
  download_coupon,
  get_qr_code,
  redeem_coupon,
  share_coupon,
  analytics,
  get_coupon,
};
