import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";
import { Subscription } from "@db";
import res from "@utils/response_handler";

const add_subscription = async (req: Request, response: Response) => {
  res.setRes(response);
  const { name, priceInCents, durationInMonths, info } = req.body;
  const error = validateRequiredFields({
    name,
    priceInCents,
    durationInMonths,
  });
  if (error) {
    res.status(400).json({ message: error });
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
  });
  res.status(200).json({ message: `${name} plan created successfully` });
};

const get_subscriptions = async (req: Request, response: Response) => {
  res.setRes(response);
  const subscriptions = await Subscription.find({}, { __v: 0 });
  res.json({
    message: "Subscriptions fetched successfully",
    data: subscriptions,
  });
};
const update_subscription = async (req: Request, response: Response) => {
  res.setRes(response);
  const { id, name, priceInCents, durationInMonths, info } = req.body || {};
  const error = validateRequiredFields({ id });

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  try {
    await Subscription.findByIdAndUpdate(id, {
      ...(name && { name }),
      ...(priceInCents && { priceInCents }),
      ...(durationInMonths && { durationInMonths }),
      ...(info && { info }),
    });

    res.json({ message: "Subscription updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const delete_subscription = async (req: Request, response: Response) => {
  res.setRes(response);

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
