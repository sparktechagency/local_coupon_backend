import { config } from "dotenv";
import nodemailer from "nodemailer";

config();

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: EmailOptions) => {
  try {
    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FOR_NODEMAILER,
        pass: process.env.PASSWORD_FOR_NODEMAILER,
      },
    });

    // Email options: from, to, subject, and HTML body
    const mailOptions = {
      from: process.env.EMAIL_FOR_NODEMAILER,
      to,
      subject,
      html,
    };

    // Send the email using Nodemailer
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};
