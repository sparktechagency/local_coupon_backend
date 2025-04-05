import { Request, Response } from "express";
import res from "@utils/response_handler";
import { Coupon } from "src/db";

const get_dashboard = (req: Request, response: Response) => {
  res.setRes(response);

  res.status(420).json({ message: "this is under construction 🚧" });
};

const get_recent_transactions = async (req: Request, response: Response) => {
  res.setRes(response);

  try {
    const transactions = await Coupon.find().sort({ updatedAt: -1 });
    res.json({
      message: "Recent transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export { get_dashboard, get_recent_transactions };
