import express from "express";
import * as brandController from "../controllers/BrandController.js";

const router = express.Router();

router.post("/brands", brandController.create);
router.get("/brands", brandController.getAll);
router.get("/brands/:id", brandController.getById);
router.put("/brands/:id", brandController.update);
router.delete("/brands/:id", brandController.deleteBrand);

export default router;
