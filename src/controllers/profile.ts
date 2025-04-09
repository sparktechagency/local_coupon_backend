import { Request, Response } from "express";
import { AccessTokenPayload } from "@utils/jwt";
import { Categories, Coupon, User, Visit } from "@db";
import parseDate from "@utils/parseDate";
import uploadService from "@services/uploadService";
import { comparePassword, plainPasswordToHash } from "@utils/passwordHashing";
import validateRequiredFields from "@utils/validateFields";
import validateHoursOfOperation from "@utils/validateHoursOfOperation";
import createResponseHandler from "@utils/response_handler";

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

const get_profile = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
  const user = await User.findById(req.user?.id);
  if (!user || user.isDeleted) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (user.emailVerified === false) {
    res.status(403).json({
      message: "Please verify your email before viewing your profile",
    });
    return;
  }

  const {
    _id,
    email,
    name,
    picture,
    role,
    providers,
    dateOfBirth,
    gender,
    location,
    phone,
  } = user;

  const responsePayload: any = {
    _id,
    email,
    name,
    picture,
    role,
    providers,
    dateOfBirth,
    gender,
    location,
    phone,
  };

  // if (role === "business") {
  //   responsePayload.companyName = user.companyName;
  //   responsePayload.companyAddress = user.companyAddress;
  //   responsePayload.socials = user.socials;
  //   responsePayload.hoursOfOperation = user.hoursOfOperation;
  // }

  res
    .status(200)
    .json({ data: responsePayload, message: "Profile retrieved successfully" });
};

const get_business_profile = async (
  req: AuthenticatedRequest,
  response: Response
) => {
  const res = createResponseHandler(response);
  const { id: business_profile_id, page, limit } = req.query;
  const profile = await User.findById(business_profile_id, {
    companyName: 1,
    companyAddress: 1,
    socials: 1,
    location: 1,
  });

  const filters = {
    createdBy: business_profile_id,
  };

  //pagination
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const skip = (pageNumber - 1) * limitNumber;
  const totalCoupons = await Coupon.countDocuments(filters);
  const totalPages = Math.ceil(totalCoupons / limitNumber);

  const coupons = await Coupon.find(filters, { __v: 0 })
    .populate({
      path: "createdBy",
      select: "name companyName",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const category_ids = coupons.map((coupon) => coupon.category);
  const categories = await Categories.find(
    { _id: { $in: category_ids } },
    { __v: 0 }
  );
  if (!profile || profile.isDeleted) {
    res.status(404).json({ message: "Profile not found" });
    return;
  }

  await Visit.create({ visitor: req.user?.id, business: profile._id });

  res.status(200).json({
    message: "Business profile retrieved successfully",
    data: {
      profile,
      categories,
      coupons,
      meta: {
        totalPages,
        currentPage: pageNumber,
        totalCoupons,
        limit: limitNumber,
      },
    },
  });
};

const get_last_visits = async (
  req: AuthenticatedRequest,
  response: Response
) => {
  const res = createResponseHandler(response);
  const { page, limit } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const skip = (pageNumber - 1) * limitNumber;
  const totalVisits = await Visit.countDocuments({
    visitor: req.user?.id,
  });
  const totalPages = Math.ceil(totalVisits / limitNumber);

  try {
    const visits = await Visit.find(
      { visitor: req.user?.id },
      { visitor: 0, __v: 0 }
    )
      .populate({
        path: "coupon",
        select: "-__v -add_to_carousel",
        populate: {
          path: "createdBy",
          select: "name companyName",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.json({
      message: "Last visits retrieved successfully",
      data: visits,
      meta: {
        totalPages,
        currentPage: pageNumber,
        totalVisits,
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const update_profile = async (
  req: AuthenticatedRequest,
  response: Response
) => {
  const res = createResponseHandler(response);
  const {
    name,
    dateOfBirth,
    gender,
    location,
    companyName,
    companyAddress,
    hoursOfOperation,
    phone,
    socials,
  } = req.body;
  const user = await User.findById(req.user?.id);
  if (!user || user.isDeleted) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (user.emailVerified === false) {
    res.status(403).json({
      message: "Please verify your email before updating your profile",
    });
    return;
  }

  if (companyName || companyAddress || socials || hoursOfOperation || phone) {
    if (user.role !== "business") {
      res
        .status(403)
        .json({ message: "Only business users can update company details" });
      return;
    }
    user.companyName = companyName || user.companyName;
    user.companyAddress = companyAddress || user.companyAddress;
    user.socials = socials || user.socials;
    user.phone = phone || user.phone;

    if (hoursOfOperation) {
      // Check if hoursOfOperation is an array and has 7 elements
      if (!Array.isArray(hoursOfOperation)) {
        res.status(400).json({
          message: "Hours of operation should be an array.",
        });
        return;
      }

      const notValid = validateHoursOfOperation(hoursOfOperation);

      if (notValid) {
        res.status(400).json(notValid);
        return;
      }

      user.hoursOfOperation = hoursOfOperation || user.hoursOfOperation;
    }
  }

  user.name = name || user.name;
  user.gender = gender || user.gender;
  user.location = location || user.location;
  if (dateOfBirth) {
    const parsedDate = parseDate(dateOfBirth);
    if (!parsedDate) {
      res.status(400).json({ message: "Invalid date of birth" });
      return;
    }
    user.dateOfBirth = parsedDate;
  }
  await user.save();

  res.status(200).json({ message: "Profile updated successfully" });
};

const update_picture = async (
  req: AuthenticatedRequest,
  response: Response
) => {
  const res = createResponseHandler(response);
  const picture = req.file;
  if (!picture) {
    res.status(400).json({ message: "No picture provided" });
    return;
  }
  const user = await User.findById(req.user?.id);
  if (!user || user.isDeleted) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (user.emailVerified === false) {
    res.status(403).json({
      message: "Please verify your email before updating your profile picture",
    });
    return;
  }

  const uploadedPicture = await uploadService(picture, "image");
  if (!uploadedPicture) {
    res.status(400).json({ message: "Failed to upload picture" });
    return;
  }
  user.picture = uploadedPicture;
  await user.save();
  res.status(200).json({ message: "Picture updated successfully" });
};

const delete_profile = async (
  req: AuthenticatedRequest,
  response: Response
) => {
  const res = createResponseHandler(response);
  const user = await User.findById(req.user?.id);
  if (!user || user.isDeleted) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  user.isDeleted = true;
  await user.save();
  res.status(200).json({ message: "Profile deleted successfully" });
};

const change_password = async (
  req: AuthenticatedRequest,
  response: Response
) => {
  const res = createResponseHandler(response);
  const { oldPassword, newPassword } = req.body;

  const error = validateRequiredFields({ oldPassword, newPassword });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  if (oldPassword === newPassword) {
    res
      .status(400)
      .json({ message: "New password cannot be the same as the old password" });
    return;
  }

  const user = await User.findById(req.user?.id);
  if (!user || user.isDeleted) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (!user.passwordHash) {
    user.passwordHash = await plainPasswordToHash(newPassword);
    await user.save();
    res.status(200).json({ message: "Password set successfully" });
    return;
  }

  const isPasswordCorrect = await comparePassword(
    oldPassword,
    user.passwordHash
  );
  if (!isPasswordCorrect) {
    res.status(400).json({ message: "Incorrect old password" });
    return;
  }
  user.passwordHash = await plainPasswordToHash(newPassword);
  await user.save();
  res.status(200).json({ message: "Password changed successfully" });
};

const invite = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
  if (!req.user?.id) {
    res.status(400).json({ message: "User ID is undefined" });
    return;
  }
  res.json({
    message: "Invite generated successfully",
    data: { invite_id: btoa(req.user?.id) },
  });
};

export {
  get_profile,
  get_business_profile,
  get_last_visits,
  update_profile,
  update_picture,
  delete_profile,
  change_password,
  invite,
};
