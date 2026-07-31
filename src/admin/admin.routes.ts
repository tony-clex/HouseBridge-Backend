import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import {
  getAllVerifications,
  getVerificationById,
  reviewVerification,
} from "./admin.verifications.controller";

const router = Router();

router.use(authenticate as any, authorize("Admin") as any);

router.get("/verifications", getAllVerifications as any);
router.get("/verifications/:id", getVerificationById as any);
router.patch("/verifications/:id", reviewVerification as any);

export default router;
