import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  getHostBookings,
  updateBookingStatus,
  updateBooking,
} from "../controllers/booking.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/", createBooking);
router.get("/my-bookings", getMyBookings);
router.get("/host-bookings", getHostBookings);
router.put("/:id", updateBooking);
router.patch("/:id", updateBooking);
router.patch("/:id/status", updateBookingStatus);
router.patch("/:id/cancel", updateBookingStatus);

export default router;
