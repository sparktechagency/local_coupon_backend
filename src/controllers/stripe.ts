import { AccessTokenPayload } from "@utils/jwt";
import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";
import { Payment, User } from "src/db";
import Stripe from "stripe";

interface CreatePaymentRequest extends Request {
  user?: AccessTokenPayload;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const packages = [
  {
    id: "gold",
    name: "Impacto Gold",
    price: 900,
    duration: 1,
  },
  {
    id: "platinum",
    name: "Impacto Platinum",
    price: 4900,
    duration: 6,
  },
  {
    id: "diamond",
    name: "Impacto Diamond",
    price: 9900,
    duration: 12,
  },
];

const create_payment = async (req: CreatePaymentRequest, res: Response) => {
  const { packageId } = req.body || {};

  const error = validateRequiredFields({ packageId });
  if (error) {
    res.status(400).send(error);
    return;
  }

  const user = await User.findById(req.user?.id);

  if (!user) {
    res.status(404).send("User not found");
    return;
  }

  const selectedPackage = packages.find((p) => p.id === packageId);
  if (!selectedPackage) {
    res.status(400).send("Invalid package selected");
    return;
  }

  const session = await stripe.checkout.sessions.create({
    client_reference_id: user._id.toString(),
    metadata: {
      packageId,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: selectedPackage.name,
          },
          unit_amount: selectedPackage.price,
          recurring: {
            interval: "month",
            interval_count: selectedPackage.duration,
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: "http://localhost:3000/success.html",
    cancel_url: "http://localhost:3000/cancel.html",
  });

  res.status(200).send({ url: session.url });
};

const stripe_webhook = async (req: Request, res: Response) => {
  const webhook_secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(500).send("Missing Stripe signature");
    return;
  }
  if (!webhook_secret) {
    res.status(500).send("Missing Stripe webhook secret");
    return;
  }
  try {
    const event = Stripe.webhooks.constructEvent(req.body, sig, webhook_secret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.client_reference_id) {
        console.log("User ID missing");
        res.send();
        return;
      }

      await Payment.create({
        amount: (session.amount_total ?? 0) / 100,
        paymentId: session.id,
        paymentStatus: session.payment_status,
        userId: session.client_reference_id,
        paymentMethod: session.payment_method_types[0],
      });

      const packageId = packages.find(
        (p) => p.id === session.metadata?.packageId
      );
      if (!packageId) {
        console.log("Package ID missing");
        res.send();
        return;
      }

      await User.findByIdAndUpdate(session.client_reference_id, {
        isSubscribed: true,
        subscriptionExpiry: new Date(
          Date.now() + packageId?.duration * 30 * 24 * 60 * 60 * 1000
        ),
      });

      res.send();
    } else {
      console.log(`Unhandled event type ${event.type}`);
      res.send();
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(`Webhook Error: ${err}`);
    return;
  }
};

export { create_payment, stripe_webhook };
