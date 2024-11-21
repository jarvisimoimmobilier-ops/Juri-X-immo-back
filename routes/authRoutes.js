import express from "express";
import {
  register,
  login,
  getUserByCustomerId,
} from "../controllers/authController.js";
const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.get("/user/customer/:customerId", getUserByCustomerId); // Add this route

export default router;
