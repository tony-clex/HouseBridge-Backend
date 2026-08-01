import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import {
  createProperty,
  deleteProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  uploadPropertyImages,
} from "./properties.controller";

const router = Router();

// Configure multer to use memory storage (we pass the buffer directly to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per image
});

// Public routes (anyone can view properties)
router.get("/", getProperties as any);
router.get("/:id", getPropertyById as any);

// Protected Landlord routes
router.post("/", authenticate as any, authorize("Landlord") as any, createProperty as any);

router.post(
  "/:id/images",
  authenticate as any,
  authorize("Landlord") as any,
  upload.array("images", 5), // allow up to 5 images per request
  uploadPropertyImages as any,
);

router.patch("/:id", authenticate as any, authorize("Landlord") as any, updateProperty as any);

router.delete(
  "/:id",
  authenticate as any,
  authorize("Landlord", "Admin") as any,
  deleteProperty as any,
);

export default router;
