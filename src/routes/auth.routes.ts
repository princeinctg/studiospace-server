import { Router } from "express";
import {
  register,
  login,
  getMe,
  googleAuth,
  logout,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/me", authenticate, getMe);
router.post("/logout", logout);

export default router;
