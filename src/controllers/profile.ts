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
  const user = await User.findById(req.user?.id)
    .select(
      "email name picture role providers dateOfBirth gender location countryDialCode phone isSubscribed remaining_downloads remaining_uploads companyName companyAddress socials company_picture last_visited"
    )
    .populate({ path: "last_visited", populate: "category" });
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

  res
    .status(200)
    .json({ data: user, message: "Profile retrieved successfully" });
};

const get_business_profile = async (
  req: AuthenticatedRequest,
  response: Response
) => {
  const res = createResponseHandler(response);
  const { id: business_profile_id, page, limit } = req.query;
  const profile = await User.findById(business_profile_id);

  const filters = {
    createdBy: business_profile_id,
  };

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

  const isProfileCompleted = profile.companyName && profile.companyAddress;
  console.log({ isProfileCompleted });

  res.status(200).json({
    message: "Business profile retrieved successfully",
    data: {
      profile,
      isProfileCompleted: isProfileCompleted ? true : false,
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

const update_profile = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
  const {
    name,
    dateOfBirth,
    gender,
    location,
    companyName,
    companyAddress,
    hoursOfOperation,
    countryDialCode,
    phone,
    socials,
    coordinates,
    businessName,
    businessPhone,
    street,
    exteriorNumber,
    interiorNumber,
    neighborhood,
    city,
    state,
    zipCode,
    socialMedia,
  } = req.body;

  const user = await User.findById(req.user?.id);
  if (!user || user.isDeleted) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.emailVerified === false) {
    return res.status(403).json({
      message: "Please verify your email before updating your profile",
    });
  }

  const files = (req.files as {
    picture?: Express.Multer.File[];
    company_picture?: Express.Multer.File[];
    id_proof?: Express.Multer.File[];
    verification_document?: Express.Multer.File[];
    businessLogo?: Express.Multer.File[];
  }) || {};

  // If user role is business → handle extra uploads
  if (req.user?.role === "business") {
    try {
      if (files.businessLogo?.length) {
        const businessLogo = await Promise.all(
          files.businessLogo.map((file) => uploadService(file, "image"))
        );
        // @ts-ignore
        user.businessLogo = businessLogo;
      }

      if (files.id_proof?.length) {
        const id_urls = await Promise.all(
          files.id_proof.map((file) => uploadService(file, "image"))
        );
        // @ts-ignore
        user.id_url = id_urls;
      }

      if (files.verification_document?.length) {
        const verification_urls = await Promise.all(
          files.verification_document.map((file) => uploadService(file, "image"))
        );
        // @ts-ignore
        user.verification_url = verification_urls;
      }
    } catch (err: any) {
      return res.status(500).json({ message: "File upload failed" });
    }
  }

  // Parse social media JSON if provided
  if (socialMedia) {
    try {
      user.socialMedia = JSON.parse(socialMedia);
    } catch (err) {
      return res.status(400).json({ message: "Invalid socialMedia JSON format" });
    }
  }

  // Company & contact details
  if (companyName || companyAddress || socials || hoursOfOperation) {
    user.companyName = companyName || user.companyName;
    user.companyAddress = companyAddress || user.companyAddress;
    user.socials = (socials && JSON.parse(socials)) || user.socials;
    user.countryDialCode = countryDialCode || user.countryDialCode;
    user.phone = phone || user.phone;

    if (hoursOfOperation) {
      const parsedHoursOfOperation = JSON.parse(hoursOfOperation);
      if (!Array.isArray(parsedHoursOfOperation)) {
        return res.status(400).json({
          message: "Hours of operation should be an array.",
        });
      }

      const notValid = validateHoursOfOperation(parsedHoursOfOperation);
      if (notValid) {
        return res.status(400).json(notValid);
      }

      user.hoursOfOperation = parsedHoursOfOperation;
    }
  }

  // Basic profile info
  user.name = name || user.name;
  user.gender = gender || user.gender;
  user.location = location || user.location;
  user.businessName = businessName || user.businessName;
  user.businessPhone = businessPhone || user.businessPhone;
  user.street = street || user.street;
  user.exteriorNumber = exteriorNumber || user.exteriorNumber;
  user.interiorNumber = interiorNumber || user.interiorNumber;
  user.neighborhood = neighborhood || user.neighborhood;
  user.city = city || user.city;
  user.state = state || user.state;
  user.zipCode = zipCode || user.zipCode;

  // Coordinates
  if (coordinates) {
    try {
      const parsedCoordinates = JSON.parse(coordinates);
      user.coordinates = {
        lat: parsedCoordinates.lat,
        lng: parsedCoordinates.lng,
      };
    } catch (err) {
      return res.status(400).json({ message: "Invalid coordinates JSON format" });
    }
  }

  // Date of birth
  if (dateOfBirth) {
    const parsedDate = parseDate(dateOfBirth);
    if (!parsedDate) {
      return res.status(400).json({ message: "Invalid date of birth" });
    }
    user.dateOfBirth = parsedDate;
  }

  // Profile picture
  if (files.picture?.[0]) {
    const uploadedPicture = await uploadService(files.picture[0], "image");
    if (!uploadedPicture) {
      return res.status(400).json({ message: "Failed to upload picture" });
    }
    user.picture = uploadedPicture;
  }

  // Company picture
  if (files.company_picture?.[0]) {
    const uploadedPicture = await uploadService(
      files.company_picture[0],
      "image"
    );
    if (!uploadedPicture) {
      return res.status(400).json({ message: "Failed to upload picture" });
    }
    user.company_picture = uploadedPicture;
  }

  await user.save();
  return res.status(200).json({ message: "Profile updated successfully" });
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
  delete_profile,
  change_password,
  invite,
};
