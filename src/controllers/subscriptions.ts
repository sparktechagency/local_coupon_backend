import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";
import { Subscription } from "src/db";

const add_subscription = async (req: Request, res: Response) => {
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

export { add_subscription };
