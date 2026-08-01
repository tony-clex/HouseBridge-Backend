import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { NextFunction, Request, Response } from "express";

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !authData.user) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }

  const { data: userProfile, error: profileError } = await supabaseAdmin
    .from("Users")
    .select("id, email, role")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !userProfile) {
    return res.status(401).json({ error: "Unauthorized: User profile not found" });
  }

  req.user = {
    id: userProfile.id,
    email: userProfile.email,
    role: userProfile.role,
  };

  next();
};
