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
  verifyRefreshToken,
} from "@utils/jwt";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { decode, JwtPayload } from "jsonwebtoken";
import checkSubscriptionStatus from "@utils/checkSubscriptionStatus";

const signup = async (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    password,
    role,
    companyName,
    companyAddress,
    socials,
  } = req?.body || {};

  const error = validateRequiredFields({ name, email, phone, password });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  if (role === "business") {
    const error = validateRequiredFields({
      companyName,
      companyAddress,
    });
    if (error) {
      res.status(400).json({ message: error });
      return;
    }
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
  if (role === "business") {
    await User.updateOne(
      { email },
      { $set: { companyName, companyAddress, socials } }
    );
  }
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
  if (emailError) {
    res.status(400).json({ message: emailError });
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
  if (!user || user.isDeleted) {
    res.status(400).json({ message: "User not found" });
    return;
  }

  if (!user.passwordHash) {
    res.status(400).json({ message: "Please login with social media" });
    return;
  }

  const isPasswordCorrect = await comparePassword(password, user.passwordHash);
  if (!isPasswordCorrect) {
    res.status(400).json({ message: "Invalid password" });
    return;
  }

  await checkSubscriptionStatus(user._id.toString());

  const accessToken = generateAccessToken(
    user._id.toString(),
    user.email,
    user.role
  );
  const refreshToken = generateRefreshToken(user.email, user.role, remember_me);

  res
    .status(200)
    .json({ message: "Login successful", accessToken, refreshToken });
};

const refresh_token = async (req: Request, res: Response) => {
  const refreshToken = req.headers.authorization?.split(" ")[1];

  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token not found" });
    return;
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findOne({ email: decoded.email });
    if (!user || user.isDeleted) {
      res.status(400).json({ message: "User not found" });
      return;
    }
    await checkSubscriptionStatus(user._id.toString());
    const accessToken = generateAccessToken(
      user._id.toString(),
      user.email,
      user.role
    );
    res.status(200).json({
      message: "Token refreshed",
      accessToken,
    });
    return;
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
    return;
  }
};

const oAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const google_login = async (req: Request, res: Response) => {
  const { token } = req?.body || {};

  const ticket = await oAuthClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    res.status(400).json({ message: "Invalid token" });
    return;
  }

  const email = payload?.email;
  const name = payload?.name;
  const picture = payload?.picture;

  let user = await User.findOne({ email });
  if (user && !user.isDeleted) {
    if (!user.emailVerified) {
      await User.updateOne({ email }, { $set: { emailVerified: true } });
    }

    if (!user.providers?.google) {
      await User.updateOne(
        { email },
        {
          $set: {
            providers: { ...user.providers, google: token },
            emailVerified: true,
          },
        }
      );
    }
  } else {
    user = await User.create({
      email,
      name,
      picture,
      providers: { google: token },
      emailVerified: true,
    });
  }

  const accessToken = generateAccessToken(
    user._id.toString(),
    user.email,
    user.role
  );
  const refreshToken = generateRefreshToken(user.email, user.role, true);

  res
    .status(200)
    .json({ message: "Login successful", accessToken, refreshToken });
};

const facebook_login = async (req: Request, res: Response) => {
  const { accessToken: fbAccessToken } = req?.body || {};

  if (!fbAccessToken) {
    res.status(400).json({ message: "Facebook access token not found" });
    return;
  }

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/me?fields=id,name,email,picture&access_token=${fbAccessToken}`
    );

    const { id, name, email, picture } = response.data;

    let user = await User.findOne({ email });

    if (user && !user.isDeleted) {
      if (!user.emailVerified) {
        await User.updateOne({ email }, { $set: { emailVerified: true } });
      }

      if (!user.providers?.facebook) {
        await User.updateOne(
          { email },
          { $set: { providers: { ...user.providers, facebook: id } } }
        );
      }
    } else {
      user = await User.create({
        email,
        name,
        picture: picture?.data?.url,
        providers: { facebook: id },
        emailVerified: true,
      });
    }

    const accessToken = generateAccessToken(
      user._id.toString(),
      user.email,
      user.role
    );
    const refreshToken = generateRefreshToken(user.email, user.role, true);

    res
      .status(200)
      .json({ message: "Login successful", accessToken, refreshToken });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
    return;
  }
};

const apple_login = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ message: "Apple token not found" });
    return;
  }

  try {
    const decoded = decode(token, { complete: true });

    if (!decoded) {
      res.status(400).json({ message: "Invalid Apple token" });
      return;
    }

    const { email, sub: appleId } = decoded.payload as JwtPayload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        providers: { apple: appleId },
      });
      await user.save();
    }

    const accessToken = generateAccessToken(
      user._id.toString(),
      user.email,
      user.role
    );
    const refreshToken = generateRefreshToken(user.email, user.role, true);

    res
      .status(200)
      .json({ message: "Login successful", accessToken, refreshToken });
  } catch (error) {
    res.status(401).json({ message: "Apple authentication failed" });
    return;
  }
};

export {
  signup,
  verify_otp,
  forgot_password,
  reset_password,
  login,
  refresh_token,
  google_login,
  facebook_login,
  apple_login,
};
