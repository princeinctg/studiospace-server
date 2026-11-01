import { Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Studio } from "../models/Studio";
import { AuthenticatedRequest } from "../middleware/auth";
import { store } from "../store/dataStore";

export async function getBookmarks(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user.userId).populate("bookmarks");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({
        bookmarks: user.bookmarks || [],
        studioIds: (user.bookmarks || []).map((b: any) => b._id.toString()),
      });
      return;
    }

    const bookmarks = store.getBookmarks(req.user.userId);
    const studioIds = store.getBookmarkIds(req.user.userId);

    res.status(200).json({
      bookmarks,
      studioIds,
    });
  } catch (error: any) {
    console.error("Get Bookmarks Error:", error);
    res.status(500).json({ error: "Failed to fetch user bookmarks" });
  }
}

export async function addBookmark(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const studioId = String(req.params.studioId);

    if (mongoose.connection.readyState === 1) {
      const studio = await Studio.findById(studioId);
      if (!studio) {
        res.status(404).json({ error: "Studio not found" });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!user.bookmarks) user.bookmarks = [];
      const alreadySaved = user.bookmarks.some((b) => b.toString() === studioId);

      if (!alreadySaved) {
        user.bookmarks.push(studio._id as any);
        await user.save();
      }

      res.status(200).json({
        message: "Studio bookmarked successfully",
        studioIds: user.bookmarks.map((b) => b.toString()),
      });
      return;
    }

    const studio = store.getStudioById(studioId);
    if (!studio) {
      res.status(404).json({ error: "Studio not found" });
      return;
    }

    const studioIds = store.addBookmark(req.user.userId, studio.id || studio._id);

    res.status(200).json({
      message: "Studio bookmarked successfully",
      studioIds,
    });
  } catch (error: any) {
    console.error("Add Bookmark Error:", error);
    res.status(500).json({ error: "Failed to bookmark studio" });
  }
}

export async function removeBookmark(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const studioId = String(req.params.studioId);

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (user.bookmarks) {
        user.bookmarks = user.bookmarks.filter((b) => b.toString() !== studioId);
        await user.save();
      }

      res.status(200).json({
        message: "Studio bookmark removed",
        studioIds: (user.bookmarks || []).map((b) => b.toString()),
      });
      return;
    }

    const studioIds = store.removeBookmark(req.user.userId, studioId);

    res.status(200).json({
      message: "Studio bookmark removed",
      studioIds,
    });
  } catch (error: any) {
    console.error("Remove Bookmark Error:", error);
    res.status(500).json({ error: "Failed to remove bookmark" });
  }
}
