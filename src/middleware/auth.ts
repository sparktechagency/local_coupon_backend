import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@utils/jwt";
import { User } from "src/db";

interface AccessTokenPayload {
  email: string;
  role: string;
  purpose: string;
}

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

const authorize = (allowedRoles: Array<"user" | "business" | "admin">) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      if (!decoded) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      if (
        !allowedRoles.includes(decoded.role as "user" | "business" | "admin")
      ) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      req.user = decoded;
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    next();
  };
};

export default authorize;
