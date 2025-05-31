import { Request, Response } from "express";
import { User } from "@db";
import { isObjectIdOrHexString } from "mongoose";
import createResponseHandler from "@utils/response_handler";
import uploadService from "@services/uploadService";
import { plainPasswordToHash } from "@utils/passwordHashing";
import parseDate from "@utils/parseDate";
import checkUserExists from "@utils/checkUserExists";

const get_users = async (req: Request, response: Response): Promise<void> => {
  const res = createResponseHandler(response);
  const {
    type,
    page: pageFromQuery,
    limit: limitFromQuery,
    premium,
    query,
  } = req.query || {};

  if (!type) {
    res.status(400).json({ message: "Invalid type" });
    return;
  }

  if (!["user", "business"].includes(String(type))) {
    res.status(400).json({ message: "Invalid type" });
    return;
  }

  const page = Number(pageFromQuery) || 1;
  const limit = Number(limitFromQuery) || 10;
  const skip = (page - 1) * limit;

  const filters = {
    ...(!premium && { role: type }),
    ...(premium && {
      isSubscribed: true,
    }),
    ...(query && {
      $or: [
        { email: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    }),
  };

  const users = await User.find(filters)
    .populate({
      path: "subscriptionPackage",
      select: "name priceInCents durationInMonths",
    })
    .skip(skip)
    .limit(limit)
    .select("-passwordHash -__v -providers -invitedUsers")
    .sort({ createdAt: -1 })
    .lean();

  const totalUsers = await User.countDocuments(filters);
  const totalPages = Math.ceil(totalUsers / limit);
  const pagination = {
    totalUsers,
    totalPages,
    currentPage: page,
    limit,
  };

  res.json({
    message: "Users fetched successfully",
    data: users || [],
    meta: pagination,
  });
};

const toggle_ban = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { user_id } = req.body || {};

  if (!user_id || !isObjectIdOrHexString(user_id)) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  const user = await User.findById(user_id);

  if (!user) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  if (user.isBanned) {
    user.isBanned = false;
  } else {
    user.isBanned = true;
  }

  try {
    await user.save();
    res.json({
      message: `User successfully ${!user.isBanned ? "unbanned" : "banned"}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const add_user = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);

  const {
    name,
    email,
    countryDialCode,
    phone,
    dateOfBirth,
    gender,
    location,
    password,
    role,
    isSubscribed,
    subscriptionExpiry,
    companyName,
    companyAddress,
    hoursOfOperation,
    socials,
    free_downloads,
    free_uploads,
  } = req.body || {};

  if (
    !name ||
    !email ||
    !countryDialCode ||
    !phone ||
    !dateOfBirth ||
    !gender ||
    !location ||
    !password ||
    !role ||
    !isSubscribed ||
    ["user", "business"].indexOf(role) === -1 ||
    ["true", "false"].indexOf(String(isSubscribed)) === -1 ||
    ["male", "female", "other"].indexOf(gender) === -1
  ) {
    res.status(400).json({ message: "Invalid request" });
    return;
  }

  const emailError = await checkUserExists("email", email);
  if (emailError) {
    res.status(400).json({ message: emailError });
    return;
  }

  const phoneError = await checkUserExists("phone", phone);
  if (phoneError) {
    res.status(400).json({ message: phoneError });
    return;
  }

  const picture =
    req.files && (req.files as any)["picture"]
      ? (req.files as any)["picture"]
      : {};
  const id_proof =
    req.files && (req.files as any)["id_proof"]
      ? (req.files as any)["id_proof"]
      : {};
  const verification_id =
    req.files && (req.files as any)["verification_id"]
      ? (req.files as any)["verification_id"]
      : {};

  if (!picture) {
    res.status(400).json({ message: "Invalid request" });
    return;
  }

  let picture_url;
  let id_url;
  let verification_url;

  try {
    picture_url = await uploadService(picture[0], "image");
    id_url = await uploadService(id_proof[0], "image");
    verification_url = await uploadService(verification_id[0], "image");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error. Upload failed." });
  }

  const passwordHash = await plainPasswordToHash(password);

  try {
    await User.create({
      name: name,
      email: email,
      emailVerified: true,
      countryDialCode,
      phone,
      dateOfBirth: parseDate(dateOfBirth),
      gender,
      location,
      passwordHash,
      role,
      isSubscribed,
      subscriptionExpiry,
      companyName,
      companyAddress,
      hoursOfOperation,
      socials,
      remaining_downloads: free_downloads,
      remaining_uploads: free_uploads,
      picture: picture_url,
      id_url,
      verification_url,
    });

    res.json({
      message: "User added successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const edit_user = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);

  const {
    name,
    email,
    countryDialCode,
    phone,
    dateOfBirth,
    gender,
    location,
    role,
    isSubscribed,
    subscriptionExpiry,
    companyName,
    companyAddress,
    hoursOfOperation,
    socials,
    free_downloads,
    free_uploads,
  } = req.body || {};

  if (
    !email ||
    (role && ["user", "business"].indexOf(role) === -1) ||
    (isSubscribed && ["true", "false"].indexOf(String(isSubscribed)) === -1) ||
    (gender && ["male", "female", "other"].indexOf(gender) === -1)
  ) {
    res.status(400).json({ message: "Invalid request" });
    return;
  }

  const emailError = await checkUserExists("email", email);
  if (!emailError) {
    res.status(400).json({ message: "Email doesn't exist" });
    return;
  }

  const picture =
    req.files && (req.files as any)["picture"]
      ? (req.files as any)["picture"]
      : {};
  const id_proof =
    req.files && (req.files as any)["id_proof"]
      ? (req.files as any)["id_proof"]
      : {};
  const verification_id =
    req.files && (req.files as any)["verification_id"]
      ? (req.files as any)["verification_id"]
      : {};

  let picture_url;
  let id_url;
  let verification_url;

  try {
    if (picture[0]) {
      picture_url = await uploadService(picture[0], "image");
    }
    if (id_proof[0]) {
      id_url = await uploadService(id_proof[0], "image");
    }
    if (verification_id[0]) {
      verification_url = await uploadService(verification_id[0], "image");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error. Upload failed." });
  }

  try {
    await User.findOneAndUpdate(
      { email },
      {
        ...(name && { name }),
        ...(countryDialCode && { countryDialCode }),
        ...(phone && { phone }),
        ...(dateOfBirth && { dateOfBirth: parseDate(dateOfBirth) }),
        ...(gender && { gender }),
        ...(location && { location }),
        ...(role && { role }),
        ...(isSubscribed && { isSubscribed }),
        ...(subscriptionExpiry && { subscriptionExpiry }),
        ...(companyName && { companyName }),
        ...(companyAddress && { companyAddress }),
        ...(hoursOfOperation && { hoursOfOperation }),
        ...(socials && { socials }),
        ...(free_downloads && { remaining_downloads: free_downloads }),
        ...(free_uploads && { remaining_uploads: free_uploads }),
        ...(picture_url && { picture: picture_url }),
        ...(id_url && { id_url }),
        ...(verification_url && { verification_url }),
      }
    );

    res.json({
      message: "User updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const delete_user = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { email } = req.query || {};

  if (!email || typeof email !== "string") {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const emailError = await checkUserExists("email", email);
  if (!emailError) {
    res.status(400).json({ message: "Email doesn't exist" });
    return;
  }

  try {
    await User.findOneAndDelete({ email });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const get_user = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "User ID is undefined" });
    return;
  }

  const user = await User.findById(id);
  if (!user || user.isDeleted) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ data: user, message: "User found successfully" });
};

export { get_users, toggle_ban, add_user, edit_user, delete_user, get_user };
