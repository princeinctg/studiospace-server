"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookmarks = getBookmarks;
exports.addBookmark = addBookmark;
exports.removeBookmark = removeBookmark;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const Studio_1 = require("../models/Studio");
const dataStore_1 = require("../store/dataStore");
async function getBookmarks(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (mongoose_1.default.connection.readyState === 1) {
            const user = await User_1.User.findById(req.user.userId).populate("bookmarks");
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }
            res.status(200).json({
                bookmarks: user.bookmarks || [],
                studioIds: (user.bookmarks || []).map((b) => b._id.toString()),
            });
            return;
        }
        const bookmarks = dataStore_1.store.getBookmarks(req.user.userId);
        const studioIds = dataStore_1.store.getBookmarkIds(req.user.userId);
        res.status(200).json({
            bookmarks,
            studioIds,
        });
    }
    catch (error) {
        console.error("Get Bookmarks Error:", error);
        res.status(500).json({ error: "Failed to fetch user bookmarks" });
    }
}
async function addBookmark(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const studioId = String(req.params.studioId);
        if (mongoose_1.default.connection.readyState === 1) {
            const isObjectId = mongoose_1.default.Types.ObjectId.isValid(studioId);
            const studio = await (isObjectId
                ? Studio_1.Studio.findById(studioId)
                : Studio_1.Studio.findOne({ $or: [{ slug: studioId }, { id: studioId }] }));
            if (!studio) {
                res.status(404).json({ error: "Studio not found" });
                return;
            }
            const user = await User_1.User.findById(req.user.userId);
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }
            if (!user.bookmarks)
                user.bookmarks = [];
            const targetIdStr = studio._id.toString();
            const alreadySaved = user.bookmarks.some((b) => b.toString() === targetIdStr);
            if (!alreadySaved) {
                user.bookmarks.push(studio._id);
                await user.save();
            }
            res.status(200).json({
                message: "Studio bookmarked successfully",
                studioIds: user.bookmarks.map((b) => b.toString()),
            });
            return;
        }
        const studio = dataStore_1.store.getStudioById(studioId);
        if (!studio) {
            res.status(404).json({ error: "Studio not found" });
            return;
        }
        const studioIds = dataStore_1.store.addBookmark(req.user.userId, studio.id || studio._id);
        res.status(200).json({
            message: "Studio bookmarked successfully",
            studioIds,
        });
    }
    catch (error) {
        console.error("Add Bookmark Error:", error);
        res.status(500).json({ error: "Failed to bookmark studio" });
    }
}
async function removeBookmark(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const studioId = String(req.params.studioId);
        if (mongoose_1.default.connection.readyState === 1) {
            const isObjectId = mongoose_1.default.Types.ObjectId.isValid(studioId);
            const studio = await (isObjectId
                ? Studio_1.Studio.findById(studioId)
                : Studio_1.Studio.findOne({ $or: [{ slug: studioId }, { id: studioId }] }));
            const user = await User_1.User.findById(req.user.userId);
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }
            if (user.bookmarks) {
                const targetIdStr = studio ? studio._id.toString() : studioId;
                user.bookmarks = user.bookmarks.filter((b) => b.toString() !== targetIdStr && b.toString() !== studioId);
                await user.save();
            }
            res.status(200).json({
                message: "Studio bookmark removed",
                studioIds: (user.bookmarks || []).map((b) => b.toString()),
            });
            return;
        }
        const studioIds = dataStore_1.store.removeBookmark(req.user.userId, studioId);
        res.status(200).json({
            message: "Studio bookmark removed",
            studioIds,
        });
    }
    catch (error) {
        console.error("Remove Bookmark Error:", error);
        res.status(500).json({ error: "Failed to remove bookmark" });
    }
}
