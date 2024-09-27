import express from "express";
import * as CalendarController from "../controllers/CalendarController.js";

const router = express.Router();

router.post("/calendars", CalendarController.create);
router.get("/calendars", CalendarController.getAll);
router.get("/calendars/:id", CalendarController.getById);
router.put("/calendars/:id", CalendarController.update);
router.delete("/calendars/:id", CalendarController.deleteCalendar);

export default router;
