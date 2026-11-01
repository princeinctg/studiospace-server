import { Router } from "express";
import {
  getAllStudios,
  getFeaturedStudios,
  getStudioById,
  getMyListings,
  createStudio,
  updateStudio,
  deleteStudio,
} from "../controllers/studio.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/", getAllStudios);
router.get("/featured", getFeaturedStudios);
router.get("/my-listings", authenticate, getMyListings);
router.get("/:id", getStudioById);

// Protected routes (Host/Admin)
router.post("/", authenticate, createStudio);
router.put("/:id", authenticate, updateStudio);
router.delete("/:id", authenticate, deleteStudio);

export default router;
