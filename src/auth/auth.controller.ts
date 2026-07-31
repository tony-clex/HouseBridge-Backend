import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { supabase } from "../utils/supabase";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["Student", "Landlord"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be Student or Landlord" });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: "User creation failed" });
    }

    const { data: userData, error: userError } = await supabase
      .from("Users")
      .insert([
        {
          id: authData.user.id,
          fullName,
          email,
          phone,
          role,
        },
      ])
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    return res.status(201).json({
      message: "User registered successfully",
      user: userData,
      session: authData.session,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const { data: profile } = await supabase
      .from("Users")
      .select("id, fullName, email, phone, role, createdAt")
      .eq("id", data.user.id)
      .single();

    return res.status(200).json({
      message: "Login successful",
      user: profile,
      session: data.session,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: "Password reset email sent. Please check your inbox.",
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: profile, error } = await supabase
      .from("Users")
      .select("id, fullName, email, phone, role, createdAt")
      .eq("id", req.user!.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    return res.status(200).json({ user: profile });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
