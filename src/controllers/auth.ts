import { Request, Response } from "express";
import { User } from "@db";
import { sendOTP, verifyOTP } from "@services/otpService";
import validateRequiredFields from "@utils/validateFields";
import { plainPasswordToHash, comparePassword } from "@utils/passwordHashing";
import checkUserExists from "@utils/checkUserExists";
import {
  AccessTokenPayload,
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
import { triggerNotification } from "@services/notificationService";
import createResponseHandler from "@utils/response_handler";

const signup = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { name, email, phone, password, role, invite_id } = req?.body || {};

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
  const newUser = await User.create({ name, email, phone, passwordHash, role });
  // await sendOTP(email, "signup");
  const otp = await sendOTP(email, "signup");

  if (invite_id) {
    const invite_id_decoded = atob(invite_id);
    const oldUser = await User.findById(invite_id_decoded);
    await oldUser?.updateOne({
      $push: { invitedUsers: newUser._id },
    });
    if (oldUser && oldUser.invitedUsers.length % 10 === 0) {
      if (!oldUser.isSubscribed) {
        await oldUser?.updateOne({
          isSubscribed: true,
        });
      }
      await oldUser?.updateOne({
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }
  }

  triggerNotification("SIGNUP", { email });

  res.status(200).json({ message: "OTP sent to email", data: { otp } });
};

const verify_otp = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { email, otp } = req?.body || {};

  const error = validateRequiredFields({ email, otp });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  try {
    const otpDoc = await verifyOTP(email, otp);

    if (otpDoc.type === "signup" || otpDoc.type === "login") {
      await User.updateOne({ email }, { $set: { emailVerified: true } });
      const user = await User.findOne({ email });

      if (!user) {
        res.status(500).json({ message: "Internal Server Error" });
        return;
      }

      const accessToken = generateAccessToken(
        user._id.toString(),
        user.email,
        user.role
      );
      const refreshToken = generateRefreshToken(user.email, user.role, false);

      res.status(200).json({
        message: "Email verified successfully",
        data: { accessToken, refreshToken, role: user.role },
      });
      return;
    }
    if (otpDoc.type === "forgotPassword") {
      const passwordResetToken = generatePasswordResetToken(email);
      res.status(200).json({
        message: "Password reset token generated",
        data: { passwordResetToken },
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

const forgot_password = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
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

  const otp = await sendOTP(email, "forgotPassword");
  // await sendOTP(email, "forgotPassword");
  res.status(200).json({ message: "OTP sent to email", data: { otp } });
};

const reset_password = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
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

const login = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
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

  if (user.isBanned) {
    res.status(400).json({ message: "This user was banned" });
    return;
  }

  if (!user.emailVerified) {
    res.status(400).json({ message: "Email not verified" });
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

  res.status(200).json({
    message: "Login successful",
    data: { accessToken, refreshToken, role: user.role },
  });
};

const refresh_token = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
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
      data: { accessToken },
    });
    return;
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
    return;
  }
};

const oAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const google_login = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
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
    .json({ message: "Login successful", data: { accessToken, refreshToken } });
};

const facebook_login = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
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

    res.status(200).json({
      message: "Login successful",
      data: { accessToken, refreshToken },
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
    return;
  }
};

const apple_login = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
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

    res.status(200).json({
      message: "Login successful",
      data: { accessToken, refreshToken },
    });
  } catch (error) {
    res.status(401).json({ message: "Apple authentication failed" });
    return;
  }
};

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

const switch_account = async (
  req: AuthenticatedRequest,
  response: Response
) => {
  const res = createResponseHandler(response);
  if (!req.user || !req.user.id || !req.user.email || !req.user.role) {
    res.status(400).json({ message: "Invalid user data" });
    return;
  }

  const user = await User.findById(req.user.id);

  if (user?.role !== "business") {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const accessToken = generateAccessToken(
    req.user.id,
    req.user.email,
    req.user.role === "business" ? "user" : "business"
  );
  res.json({
    data: { token: accessToken },
    message: "Account switched successfully",
  });
};

const resend_otp = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { type, email } = req.body;

  if (!type || !email) {
    res.status(400).json({ message: "type and email fields are required" });
    return;
  }

  const otp = await sendOTP(email, type);

  res.status(200).json({ message: "OTP resent successfully", data: { otp } });
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
  switch_account,
  resend_otp,
};
