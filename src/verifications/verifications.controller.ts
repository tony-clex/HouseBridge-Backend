import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { supabase } from "../utils/supabase";

export const submitVerification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const landlordId = req.user!.id;
    const { documentUrl } = req.body;

    if (!documentUrl) {
      return res.status(400).json({ error: "documentUrl is required" });
    }

    const { data: existing } = await supabase
      .from("LandlordVerifications")
      .select("id, status")
      .eq("landlordId", landlordId)
      .single();

    if (existing) {
      if (existing.status === "Verified") {
        return res.status(400).json({ error: "Your identity is already verified" });
      }

      if (existing.status === "Pending") {
        return res.status(400).json({
          error:
            "Your verification is already pending review. Please wait for the administrator to review it.",
        });
      }

      const { data: updated, error: updateError } = await supabase
        .from("LandlordVerifications")
        .update({
          documentUrl,
          status: "Pending",
          rejectionReason: null,
          reviewedAt: null,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      return res.status(200).json({
        message: "Verification document resubmitted successfully. Awaiting admin review.",
        verification: updated,
      });
    }

    const { data: verification, error } = await supabase
      .from("LandlordVerifications")
      .insert([{ landlordId, documentUrl, status: "Pending" }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: "Verification document submitted successfully. Awaiting admin review.",
      verification,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyVerificationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const landlordId = req.user!.id;

    const { data: verification, error } = await supabase
      .from("LandlordVerifications")
      .select("id, status, rejectionReason, reviewedAt")
      .eq("landlordId", landlordId)
      .single();

    if (error || !verification) {
      return res.status(404).json({
        error: "No verification record found. Please submit your identity documents.",
      });
    }

    return res.status(200).json({ verification });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
