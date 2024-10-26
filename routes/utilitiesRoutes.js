import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  uploadProfilePicture,
  getUser,
  updateUserProfile,
} from "../controllers/UtilsController.js";

const router = express.Router();

router
  .route("/uploadProfilePicture")
  .post(authenticateUser, uploadProfilePicture);
router.route("/user").get(authenticateUser, getUser);
router.route("/user").patch(authenticateUser, updateUserProfile);

export default router;
