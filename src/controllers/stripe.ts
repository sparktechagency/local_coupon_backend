import { Request, Response } from "express";

const create_checkout_session = async (req: Request, res: Response) => {
  const { productId } = req.body;
};

const stripe_webhook = async (req: Request, res: Response) => {
  const { event } = req.body;
};

export { create_checkout_session, stripe_webhook };
