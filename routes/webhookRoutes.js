import express from "express";
import { handleWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Stripe Webhook Route
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

export default router;
