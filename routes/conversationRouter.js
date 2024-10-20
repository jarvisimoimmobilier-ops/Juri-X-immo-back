import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { sendMessage } from "../controllers/conversationController.js";

const router = express.Router();

router.route("/send").post(authenticateUser, sendMessage);

export default router;
