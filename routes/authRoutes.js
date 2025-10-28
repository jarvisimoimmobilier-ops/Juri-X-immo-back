import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  register,
  login,
  getUserByCustomerId,
  updateUserData,
} from "../controllers/authController.js";
const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.get("/user/customer/:customerId", getUserByCustomerId); // Add this route
router.put("/user", authenticateUser, updateUserData); // Add this route for user update

export default router;
