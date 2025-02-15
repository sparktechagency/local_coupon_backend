import { Request, Response } from "express";
import { AccessTokenPayload } from "@utils/jwt";
import { User } from "src/db";
import parseDate from "@utils/parseDate";
import uploadService from "@services/uploadService";
import { comparePassword, plainPasswordToHash } from "@utils/passwordHashing";
import validateRequiredFields from "@utils/validateFields";

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

const get_profile = async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user || user.isDeleted) {
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
  if (!user || user.isDeleted) {
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

const update_picture = async (req: AuthenticatedRequest, res: Response) => {
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
  const uploadedPicture = await uploadService(picture, "image");
  if (!uploadedPicture) {
    res.status(400).json({ message: "Failed to upload picture" });
    return;
  }
  user.picture = uploadedPicture;
  await user.save();
  res.status(200).json({ message: "Picture updated successfully" });
};

const delete_profile = async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user || user.isDeleted) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  user.isDeleted = true;
  await user.save();
  res.status(200).json({ message: "Profile deleted successfully" });
};

const change_password = async (req: AuthenticatedRequest, res: Response) => {
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

export {
  get_profile,
  update_profile,
  update_picture,
  delete_profile,
  change_password,
};
