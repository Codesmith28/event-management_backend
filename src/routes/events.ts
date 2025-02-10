import express from "express";
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  bookSeat,
  bookEvent,
  unbookEvent,
  removeAttendee,
} from "../controllers/eventController";
import { auth } from "../middleware/auth";

const router = express.Router();

router.get("/", getEvents);
router.get("/:id", getEvent);
router.post("/", auth, createEvent);
router.put("/:id", auth, updateEvent);
router.delete("/:id", auth, deleteEvent);
router.post("/:id/book", auth, bookEvent);
router.delete("/:id/book", auth, unbookEvent);
router.delete("/:id/attendees/:userId", auth, removeAttendee);

export default router;
