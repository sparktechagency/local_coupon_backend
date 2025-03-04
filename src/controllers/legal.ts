import { Request, Response } from "express";

const get_faqs = async (req: Request, res: Response) => {
  res.send("get_faqs");
};
const get_terms = async (req: Request, res: Response) => {};
const get_privacy = async (req: Request, res: Response) => {};
const update_faqs = async (req: Request, res: Response) => {};
const update_terms = async (req: Request, res: Response) => {};
const update_privacy = async (req: Request, res: Response) => {};

export {
  get_faqs,
  get_terms,
  get_privacy,
  update_faqs,
  update_terms,
  update_privacy,
};
