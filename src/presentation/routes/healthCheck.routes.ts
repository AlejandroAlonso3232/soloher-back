import { Router } from "express";

export const healtCheckRouter = Router();

// Health check route
healtCheckRouter.get("/", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
