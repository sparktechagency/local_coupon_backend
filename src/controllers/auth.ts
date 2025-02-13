import { Request, Response } from "express";
import { User } from "src/db";
import { sendOTP } from "@services/otpService";
import validateRequiredFields from "@utils/validateFields";
import plainPasswordToHash from "@utils/plainPasswordToHash";
import checkUserExists from "@utils/checkUserExists";

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

export { signup };
