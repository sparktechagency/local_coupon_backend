import { Request, Response } from "express";
import { User } from "src/db";
import { sendOTP, verifyOTP } from "@services/otpService";
import validateRequiredFields from "@utils/validateFields";
import { plainPasswordToHash, comparePassword } from "@utils/passwordHashing";
import checkUserExists from "@utils/checkUserExists";
import {
  generateAccessToken,
  generatePasswordResetToken,
  generateRefreshToken,
  verifyPasswordResetToken,
} from "@utils/jwt";

const signup = async (req: Request, res: Response) => {
  const { name, email, phone, password } = req?.body || {};

  const error = validateRequiredFields({ name, email, phone, password });
  if (error) {
    res.status(400).json({ message: error });
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

  const passwordHash = await plainPasswordToHash(password);
  await User.create({ name, email, phone, passwordHash });
  await sendOTP(email, "signup");

  res.status(200).json({ message: "OTP sent to email" });
};

const verify_otp = async (req: Request, res: Response) => {
  const { email, otp } = req?.body || {};

  const error = validateRequiredFields({ email, otp });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  try {
    const otpDoc = await verifyOTP(email, otp);
    if (otpDoc.type === "signup") {
      await User.updateOne({ email }, { $set: { emailVerified: true } });
      res.status(200).json({ message: "Email verified successfully" });
      return;
    }
    if (otpDoc.type === "forgotPassword") {
      const passwordResetToken = generatePasswordResetToken(email);
      res.status(200).json({
        message: "Password reset token generated",
        passwordResetToken,
      });
      return;
    }
    res.status(400).json({ message: "Invalid OTP" });
    return;
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
    return;
  }
};

const forgot_password = async (req: Request, res: Response) => {
  const { email } = req?.body || {};

  const error = validateRequiredFields({ email });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const emailError = await checkUserExists("email", email);
  if (!emailError) {
    res.status(400).json({ message: "User not found" });
    return;
  }

  await sendOTP(email, "forgotPassword");
  res.status(200).json({ message: "OTP sent to email" });
};

const reset_password = async (req: Request, res: Response) => {
  const { email, password, token } = req?.body || {};

  const error = validateRequiredFields({ email, password, token });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  try {
    verifyPasswordResetToken(token);
    const passwordHash = await plainPasswordToHash(password);
    await User.updateOne({ email }, { $set: { passwordHash } });
    res.status(200).json({ message: "Password reset successfully" });
    return;
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
    return;
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password, remember_me } = req?.body || {};

  const error = validateRequiredFields({ email, password });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400).json({ message: "User not found" });
    return;
  }

  const isPasswordCorrect = await comparePassword(password, user.passwordHash);
  if (!isPasswordCorrect) {
    res.status(400).json({ message: "Invalid password" });
    return;
  }

  const accessToken = generateAccessToken(user.email, user.role);
  const refreshToken = generateRefreshToken(user.email, user.role, remember_me);

  res
    .status(200)
    .json({ message: "Login successful", accessToken, refreshToken });
};

export { signup, verify_otp, forgot_password, reset_password, login };
