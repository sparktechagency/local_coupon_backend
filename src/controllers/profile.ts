import { Request, Response } from "express";
import { AccessTokenPayload } from "@utils/jwt";
import { User } from "src/db";
import parseDate from "@utils/parseDate";
interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

const get_profile = async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
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
  } = user;

  res.status(200).json({
    _id,
    email,
    name,
    picture,
    role,
    providers,
    dateOfBirth,
    gender,
    location,
  });
};

const update_profile = async (req: AuthenticatedRequest, res: Response) => {
  const { name, dateOfBirth, gender, location } = req.body;
  const user = await User.findById(req.user?.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  user.name = name;
  user.gender = gender;
  user.location = location;
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

export { get_profile, update_profile };
