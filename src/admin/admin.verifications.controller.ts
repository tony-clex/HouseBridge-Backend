import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { supabase } from "../utils/supabase";

export const getAllVerifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from("LandlordVerifications")
      .select(
        `id, documentUrl, status, rejectionReason, reviewedAt,
         landlordId,
         Users:landlordId (id, fullName, email, phone, createdAt)`,
      )
      .order("reviewedAt", { ascending: true });

    if (status) {
      query = query.eq("status", status as string);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ verifications: data });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const reviewVerification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    }

    if (action === "reject" && !rejectionReason) {
      return res.status(400).json({
        error: "rejectionReason is required when rejecting a verification",
      });
    }

    const { data: existing, error: findError } = await supabase
      .from("LandlordVerifications")
      .select("id, status, landlordId")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: "Verification record not found" });
    }

    if (existing.status !== "Pending") {
      return res.status(400).json({
        error: `Cannot review a verification with status '${existing.status}'. Only Pending verifications can be reviewed.`,
      });
    }

    const newStatus = action === "approve" ? "Verified" : "Rejected";

    const { data: updated, error: updateError } = await supabase
      .from("LandlordVerifications")
      .update({
        status: newStatus,
        rejectionReason: action === "reject" ? rejectionReason : null,
        reviewedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(200).json({
      message: `Landlord verification ${newStatus.toLowerCase()} successfully.`,
      verification: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getVerificationById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("LandlordVerifications")
      .select(
        `id, documentUrl, status, rejectionReason, reviewedAt,
         Users:landlordId (id, fullName, email, phone)`,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Verification record not found" });
    }

    return res.status(200).json({ verification: data });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
