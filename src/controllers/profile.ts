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
  };

  if (role === "business") {
    responsePayload.companyName = user.companyName;
    responsePayload.companyAddress = user.companyAddress;
    responsePayload.socials = user.socials;
  }

  res.status(200).json(responsePayload);
};

const update_profile = async (req: AuthenticatedRequest, res: Response) => {
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
      const hoursRegex =
        /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;
      if (!hoursRegex.test(hoursOfOperation)) {
        res.status(400).json({
          message: "Invalid hours of operation format. Use HH:MM-HH:MM",
        });
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
