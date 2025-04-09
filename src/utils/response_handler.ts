import { Response } from "express";

type JsonParams = {
  message: string;
  data?: any;
  meta?: any;
};

const createResponseHandler = (res: Response) => {
  let statusCode = 200;

  const getSuccessStatus = (code: number): boolean => code >= 200 && code < 300;

  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json({ message, data, meta }: JsonParams) {
      if (res.headersSent) return;

      const payload = {
        statusCode,
        message,
        data: data || null,
        meta,
        success: getSuccessStatus(statusCode),
      };

      return res.status(statusCode).json(payload);
    },
  };
};

export default createResponseHandler;
