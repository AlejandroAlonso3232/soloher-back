import { Router } from "express";
import { healtCheckRouter } from "./healthCheck.routes";
import userRouter from "./user.routes";
import girlRouter from './girl.route'
import postRouter from './post.route'

const router = Router();

// Health check route
router.use("/", healtCheckRouter);
// User routes
router.use("/api/v1/user", userRouter);
// Girl routes
router.use("/api/v1/girl", girlRouter);
// Post routes
router.use("/api/v1/post", postRouter);

export default router;
