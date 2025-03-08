import { Request, Response } from "express";

const get_coupons = (req: Request, res: Response) => {};

const add_coupon = (req: Request, res: Response) => {
    res.json({ message: [req.body, req.file] })
};

const update_coupon = (req: Request, res: Response) => {};

const delete_coupon = (req: Request, res: Response) => {};

export { get_coupons, add_coupon, update_coupon, delete_coupon };
