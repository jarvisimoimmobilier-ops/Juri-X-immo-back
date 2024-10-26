import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  uploadProfilePicture,
  getUser,
} from "../controllers/UtilsController.js";

const router = express.Router();

router
  .route("/uploadProfilePicture")
  .post(authenticateUser, uploadProfilePicture);
router.route("/user").get(authenticateUser, getUser);

export default router;
