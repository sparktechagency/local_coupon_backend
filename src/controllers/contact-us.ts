import { sendEmail } from "@services/emailService";
import createResponseHandler from "@utils/response_handler";
import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";

const contact_us = (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { name, email, subject, message } = req.body || {};

  const error = validateRequiredFields({ name, email, subject });

  if (error) {
    res.status(400).json({ message: error });
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
