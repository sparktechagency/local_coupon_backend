import { NextFunction, Request, Response } from "express";

const logger = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method;
  const url = req.originalUrl;
  const body =
    method === "POST" || method === "PUT" ? JSON.stringify(req.body) : null;

  console.log(`[${method}] ${url}${body ? ` body: ${body}` : ""}`);

  next();
};

export default logger;
