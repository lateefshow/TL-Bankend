// authMiddleware.js

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: { _id: string; role: string };
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };

      // Corrected line: Assign the decoded 'id' to '_id'
      req.user = {
        _id: decoded.id,
        role: decoded.role,
      };

      return next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }

  return res.status(401).json({ message: "Access denied. No token provided" });
};

export const permitRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message:
          "Access denied, You do not have permission to perform this action",
      });
    }
    next();
  };
};
