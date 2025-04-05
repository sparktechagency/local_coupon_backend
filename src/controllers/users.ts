import { Request, Response } from "express";
import res from "@utils/response_handler";
import { User } from "src/db";

const get_users = async (req: Request, response: Response): Promise<void> => {
  res.setRes(response);
  const { type, page: pageFromQuery, limit: limitFromQuery } = req.query || {};

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

  const users = await User.find({ role: type })
    .skip(skip)
    .limit(limit)
    .select("-password -__v")
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
  const totalUsers = await User.countDocuments({ role: type });
  const totalPages = Math.ceil(totalUsers / limit);
  const pagination = {
    totalUsers,
    totalPages,
    currentPage: page,
    limit,
  };

  res.json({ message: "hello", data: users, meta: pagination });
};

export { get_users };
