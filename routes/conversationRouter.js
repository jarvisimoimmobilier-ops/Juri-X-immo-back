import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  startConversation,
  sendMessage,
  getConvHistory,
  deleteConversation,
  getAllConversations,
  updateConversationName,
} from "../controllers/conversationController.js";

const router = express.Router();

router.route("/start").post(authenticateUser, startConversation);
router.route("/send").post(authenticateUser, sendMessage);
router.route("/:id").get(authenticateUser, getConvHistory);
router.route("/").post(authenticateUser, getAllConversations);
router.route("/:id").delete(authenticateUser, deleteConversation);
router.route("/:id").patch(authenticateUser, updateConversationName);

export default router;
