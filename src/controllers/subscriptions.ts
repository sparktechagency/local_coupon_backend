import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";
import { Subscription } from "@db";
import createResponseHandler from "@utils/response_handler";
import { AccessTokenPayload } from "@utils/jwt";

const add_subscription = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { name, priceInCents, durationInMonths, info, type } = req.body;
  const error = validateRequiredFields({
    name,
    priceInCents,
    durationInMonths,
  });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  if (type !== "user" && type !== "business") {
    res.status(400).json({ message: "Invalid type" });
    return;
  }
  if (priceInCents < 0 || durationInMonths < 0) {
    res.status(400).json({ message: "Price and duration must be positive" });
    return;
  }
  const existingSubscription = await Subscription.findOne({ name });
  if (existingSubscription) {
    res.status(400).json({ message: `${name} plan already exists` });
    return;
  }

  await Subscription.create({
    name,
    priceInCents,
    durationInMonths,
    info,
    type,
  });
  res.status(200).json({ message: `${name} plan created successfully` });
};

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

const get_subscriptions = async (
  req: AuthenticatedRequest,
  response: Response
) => {
  const res = createResponseHandler(response);
  const subscriptions = await Subscription.find(
    { ...(req.user?.role !== "admin" && { type: req.user?.role }) },
    { __v: 0 }
  );
  res.json({
    message: "Subscriptions fetched successfully",
    data: subscriptions,
  });
};
const update_subscription = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { id, name, priceInCents, durationInMonths, info, type } =
    req.body || {};
  const error = validateRequiredFields({ id });

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  if (type !== "user" && type !== "business") {
    res.status(400).json({ message: "Invalid type" });
    return;
  }
  try {
    await Subscription.findByIdAndUpdate(id, {
      ...(name && { name }),
      ...(priceInCents && { priceInCents }),
      ...(durationInMonths && { durationInMonths }),
      ...(info && { info }),
      ...(type && { type }),
    });

    res.json({ message: "Subscription updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const delete_subscription = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);

  const { id } = req.body || {};

  const error = validateRequiredFields({ id });

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const subscription = await Subscription.findById(id);

  if (!subscription) {
    res.status(400).json({ message: "Invalid subscription id" });
    return;
  }

  try {
    await subscription.deleteOne();
    res.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  add_subscription,
  get_subscriptions,
  update_subscription,
  delete_subscription,
};
