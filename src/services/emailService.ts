import nodemailer from "nodemailer";
import { config } from "dotenv";
config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: EmailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: `"Verification Mail" <${process.env.SMTP_MAIL}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent: %s", info.messageId);
  } catch (error) {
    console.error("SMTP Email sending failed:", error);
  }
};
