import express from "express";
import * as UtilsController from "../controllers/UtilsController.js";

const router = express.Router();

router.post("/uploadImage", UtilsController.uploadImage);

export default router;
