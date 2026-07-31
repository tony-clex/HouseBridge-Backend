import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { getMyVerificationStatus, submitVerification } from "./verifications.controller";

const router = Router();

router.post("/", authenticate as any, authorize("Landlord") as any, submitVerification as any);

router.get(
  "/status",
  authenticate as any,
  authorize("Landlord") as any,
  getMyVerificationStatus as any,
);

export default router;
