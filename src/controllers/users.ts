import { Request, Response } from "express";
import { User } from "@db";
import { isObjectIdOrHexString } from "mongoose";
import createResponseHandler from "@utils/response_handler";

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
    role: type,
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
  if (!users) {
    res.status(404).json({ message: "No users found" });
    return;
  }
  if (users.length === 0) {
    res.status(404).json({ message: "No users found" });
    return;
  }
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
    data: users,
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

export { get_users, toggle_ban };
