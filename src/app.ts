import cors from "cors";
import express from "express";
import helmet from "helmet";
import adminRoutes from "./admin/admin.routes";
import authRoutes from "./auth/auth.routes";
import propertiesRoutes from "./properties/properties.routes";
import verificationRoutes from "./verifications/verifications.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/verifications", verificationRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/properties", propertiesRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "HouseBridge API is running" });
});

export default app;
