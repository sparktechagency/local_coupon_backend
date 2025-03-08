import { sendEmail } from "@services/emailService";
import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";

const contact_us = (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body || {};

  const error = validateRequiredFields({ name, email, subject });

  if (error) {
    res.status(400).json({ error });
    return;
  }

  // Send email to the admin
  sendEmail({
    to: (process.env.ADMIN_EMAIL as string) || "",
    subject: `New message from ${name} - ${email} - ${subject}`,
    text: message,
  });

  res.status(200).json({ message: "Message sent successfully" });
};

export { contact_us };
