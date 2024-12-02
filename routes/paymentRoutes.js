import express from "express";
import { checkoutController } from "../controllers/checkoutController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// router.post('/checkout', checkoutController);
router.route("/checkout").post(authenticateUser, checkoutController);

export default router;
