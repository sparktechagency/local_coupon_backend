import Mailgun from "mailgun.js";
import formData from "form-data";
import { config } from "dotenv";

config();

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAIL_GUN_KEY!,
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: EmailOptions) => {
  try {
    const response = await mg.messages.create(process.env.MAIL_GUN_DOMAIN!, {
      from: "Verification Mail <noreply@mg.impactoapps.com>",
      to,
      subject,
      text,
      html,
    } as any); 
    console.log("Mail sent:", response);
  } catch (error) {
    console.error("Mail sending error:", error);
  }
};
