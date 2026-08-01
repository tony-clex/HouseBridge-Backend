import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { getMe, login, logout, register, resetPassword } from "./auth.controller";

const router = Router();

// Public routes
router.post("/register", register as any);
router.post("/login", login as any);
router.post("/reset-password", resetPassword as any);

// Protected routes (require valid JWT)
router.post("/logout", authenticate as any, logout as any);
router.get("/me", authenticate as any, getMe as any);

export default router;
