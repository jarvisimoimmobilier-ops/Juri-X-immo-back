import express from "express";
import { generatePostImage } from "../controllers/gptController.js";
const router = express.Router();


router.route("/generate-picture").post(generatePostImage);

export default router;
