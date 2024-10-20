import express from "express";
import {
  register,
  login,
  googleAuth,
  getUserById,
  updateUserData,
} from "../controllers/authController.js";
const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/user").get(getUserById);
router.route("/update-user").put(updateUserData);
//Google auth
router.post("/google-login", googleAuth);

export default router;
