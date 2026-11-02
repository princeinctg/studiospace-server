"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studio_controller_1 = require("../controllers/studio.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get("/", studio_controller_1.getAllStudios);
router.get("/featured", studio_controller_1.getFeaturedStudios);
router.get("/my-listings", auth_1.authenticate, studio_controller_1.getMyListings);
router.get("/:id", studio_controller_1.getStudioById);
// Protected routes (Host/Admin)
router.post("/", auth_1.authenticate, studio_controller_1.createStudio);
router.post("/create", auth_1.authenticate, studio_controller_1.createStudio);
router.put("/:id", auth_1.authenticate, studio_controller_1.updateStudio);
router.delete("/:id", auth_1.authenticate, studio_controller_1.deleteStudio);
exports.default = router;
