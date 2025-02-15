import { config } from "dotenv";
import { sign, verify } from "jsonwebtoken";

config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "";

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT secrets are not set");
}

const generatePasswordResetToken = (email: string) => {
  return sign({ email, purpose: "passwordReset" }, ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
};

interface PasswordResetPayload {
  email: string;
  purpose: string;
}

const verifyPasswordResetToken = (token: string) => {
  const decoded = verify(token, ACCESS_TOKEN_SECRET) as PasswordResetPayload;
  if (decoded.purpose !== "passwordReset") {
    throw new Error("Invalid token");
  }
  return decoded;
};

const generateAccessToken = (email: string, role: string) => {
  return sign({ email, role, purpose: "accessToken" }, ACCESS_TOKEN_SECRET, {
    expiresIn: "2m",
  });
};

const generateRefreshToken = (
  email: string,
  role: string,
  remember_me: boolean
) => {
  return sign(
    { email, role, purpose: "refreshToken", remember_me },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: remember_me ? "30d" : "1d",
    }
  );
};

export {
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateAccessToken,
  generateRefreshToken,
};
