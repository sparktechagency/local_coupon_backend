import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { OTP } from "@db"; // Adjust this path based on your project structure

dotenv.config();


sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
console.log("🔧 OTP Service Initialized", process.env.SENDGRID_API_KEY);

const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) => {
  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_EMAIL || "",
      name: "Local Coupon",
    },
    subject,
    text,
    html:
      html ||
      `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7; color: #333;">
        <h2>Your OTP Code</h2>
        <p style="font-size: 18px;">${text}</p>
        <br/>
        <p style="font-size: 14px;">If you did not request this, please ignore this email.</p>
        <p style="font-size: 14px;">– Local Coupon Team</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent to", to);
  } catch (error: any) {
    console.error("❌ Failed to send email:", error);
    if (error.response) {
      console.error("SendGrid Response Error:", error.response.body);
    }
    throw new Error("Email sending failed");
  }
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
const sendOTP = async (
  email: string,
  type: "signup" | "login" | "forgotPassword"
) => {
  const otp = generateOtp();
  await OTP.create({ otp: `${email}:${otp}`, type });

  const subject = "Your OTP Code";
  const text = `Your OTP for ${type} is: ${otp}`;

  await sendEmail({ to: email, subject, text });

  return otp;
};


const verifyOTP = async (email: string, otp: string) => {
  const otpDoc = await OTP.findOne({ otp: `${email}:${otp}` });

  if (!otpDoc) {
    throw new Error("Invalid or expired OTP");
  }

  await OTP.deleteOne({ _id: otpDoc._id });

  return otpDoc;
};

export { sendOTP, verifyOTP };
