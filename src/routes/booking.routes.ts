import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  getHostBookings,
  updateBookingStatus,
} from "../controllers/booking.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/", createBooking);
router.get("/my-bookings", getMyBookings);
router.get("/host-bookings", getHostBookings);
router.patch("/:id/status", updateBookingStatus);

export default router;
