import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./authenticate";

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: This route requires one of the following roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};
