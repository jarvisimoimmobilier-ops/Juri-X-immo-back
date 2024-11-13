import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  uploadProfilePicture,
  deleteProfilePicture,
  getUser,
  updateUserProfile,
  updatePassword,
} from "../controllers/UtilsController.js";

const router = express.Router();

router
  .route("/user/uploadProfilePicture")
  .post(authenticateUser, uploadProfilePicture);
router
  .route("/user/deleteProfilePicture")
  .delete(authenticateUser, deleteProfilePicture);
router.route("/user").get(authenticateUser, getUser);
router.route("/user").patch(authenticateUser, updateUserProfile);
router.route("/user/password").patch(authenticateUser, updatePassword);

export default router;
