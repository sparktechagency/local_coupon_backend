import { Request, Response } from "express";

const get_profile = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Profile" });
};

export { get_profile };
