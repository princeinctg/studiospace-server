import { Router } from "express";
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
} from "../controllers/bookmark.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getBookmarks);
router.post("/:studioId", addBookmark);
router.delete("/:studioId", removeBookmark);

export default router;
