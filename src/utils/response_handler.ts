import { Response } from "express";

type JsonParams = {
  message: string;
  data?: any;
  meta?: any;
};

const response_handler = (() => {
  let res: Response | null = null;
  let statusCode: number = 200;

  const getSuccessStatus = (code: number): boolean => code >= 200 && code < 300;

  return {
    setRes(response: Response) {
      res = response;
      return this;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json({ message, data, meta }: JsonParams) {
      if (!res) {
        throw new Error(
          "Response object not set. Call setRes(res) before using status().json()."
        );
      }

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
})();

export default response_handler;
