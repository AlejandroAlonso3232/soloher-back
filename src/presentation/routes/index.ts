import { Router } from "express";
import { healtCheckRouter } from "./healthCheck.routes";
import userRouter from "./user.routes";

const router = Router();

// Health check route
router.use("/", healtCheckRouter);
// User routes
router.use("/api/v1/user", userRouter);

export default router;
