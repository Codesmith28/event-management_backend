import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: any;
}

export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
    } catch (error) {
      // If token is invalid, assign default guest role
      req.user = { role: "guest", userId: null };
    }
  } else {
    // No token provided - assign default guest role
    req.user = { role: "guest", userId: null };
  }
  next();
};
