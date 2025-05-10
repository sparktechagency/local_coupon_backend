import { Coupon, Report, User } from "@db";
import { sendEmail } from "@services/emailService";
import { AccessTokenPayload } from "@utils/jwt";
import createResponseHandler from "@utils/response_handler";
import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";
import { isObjectIdOrHexString } from "mongoose";

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

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

const report = async (req: AuthenticatedRequest, response: Response) => {
  const res = createResponseHandler(response);
  const { id, reason, details } = req.body || {};

  const error = validateRequiredFields({ id, reason });

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  if (!isObjectIdOrHexString(id)) {
    res.status(400).json({ message: "Invalid ID format" });
    return;
  }

  const coupon = await Coupon.findById(id);

  const profile = await User.findById(id);

  if (!coupon && !profile) {
    res.status(404).json({ message: "Coupon or profile not found" });
    return;
  }

  await Report.create({
    user: req.user?.id,
    coupon: coupon ? coupon._id : null,
    profile: profile ? profile._id : null,
    reason,
    details,
  });

  res.status(200).json({ message: "Report sent successfully" });
};

const get_reports = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const reports = await Report.find()
    .skip(skip)
    .limit(Number(limit))
    .populate("user", "name email")
    .populate("coupon")
    .populate("profile", "name email")
    .sort({ createdAt: -1 });
  const totalReports = await Report.countDocuments();
  const totalPages = Math.ceil(totalReports / Number(limit));
  res.status(200).json({
    message: "Reports fetched successfully",
    data: reports,
    meta: {
      totalReports,
      totalPages,
      currentPage: Number(page),
      limit: Number(limit),
    },
  });
};

export { contact_us, report, get_reports };
