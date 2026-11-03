"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStudios = getAllStudios;
exports.getFeaturedStudios = getFeaturedStudios;
exports.getStudioById = getStudioById;
exports.getMyListings = getMyListings;
exports.createStudio = createStudio;
exports.updateStudio = updateStudio;
exports.deleteStudio = deleteStudio;
const mongoose_1 = __importDefault(require("mongoose"));
const Studio_1 = require("../models/Studio");
const studio_validator_1 = require("../validators/studio.validator");
const dataStore_1 = require("../store/dataStore");
function slugify(text) {
    const clean = text
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .trim()
        .replace(/ +/g, "-");
    return (clean || "studio").concat("-", Math.random().toString(36).substring(2, 6));
}
async function getAllStudios(req, res) {
    try {
        const { search, category, city, minPrice, maxPrice, sort, page = "1", limit = "12", } = req.query;
        if (mongoose_1.default.connection.readyState === 1) {
            const query = { isAvailable: true };
            if (search && typeof search === "string" && search.trim() !== "") {
                const regex = new RegExp(search.trim(), "i");
                query.$or = [
                    { title: regex },
                    { description: regex },
                    { "location.city": regex },
                    { tags: { $in: [regex] } },
                ];
            }
            if (category && typeof category === "string" && category !== "all") {
                query.category = category;
            }
            if (city && typeof city === "string" && city.trim() !== "") {
                query["location.city"] = new RegExp(city.trim(), "i");
            }
            if (minPrice || maxPrice) {
                query.pricePerHour = {};
                if (minPrice)
                    query.pricePerHour.$gte = Number(minPrice);
                if (maxPrice)
                    query.pricePerHour.$lte = Number(maxPrice);
            }
            let sortCriteria = { createdAt: -1 };
            if (sort === "price_asc")
                sortCriteria = { pricePerHour: 1 };
            if (sort === "price_desc")
                sortCriteria = { pricePerHour: -1 };
            if (sort === "rating")
                sortCriteria = { rating: -1 };
            const pageNum = Math.max(1, parseInt(page, 10));
            const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
            const skip = (pageNum - 1) * limitNum;
            const [studios, total] = await Promise.all([
                Studio_1.Studio.find(query)
                    .populate("host", "name email avatar")
                    .sort(sortCriteria)
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Studio_1.Studio.countDocuments(query),
            ]);
            res.status(200).json({
                studios,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            });
            return;
        }
        // Local DataStore
        const studios = dataStore_1.store.getAllStudios({
            search: search ? String(search) : undefined,
            category: category ? String(category) : undefined,
            city: city ? String(city) : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            sort: sort ? String(sort) : undefined,
        });
        res.status(200).json({
            studios,
            pagination: {
                page: 1,
                limit: studios.length,
                total: studios.length,
                totalPages: 1,
            },
        });
    }
    catch (error) {
        console.error("Get All Studios Error:", error);
        res.status(500).json({ error: "Failed to fetch studio listings" });
    }
}
async function getFeaturedStudios(req, res) {
    try {
        const limitParam = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const limitNum = limitParam && !isNaN(limitParam) ? Math.min(50, Math.max(1, limitParam)) : 50;
        if (mongoose_1.default.connection.readyState === 1) {
            const featured = await Studio_1.Studio.find({ isAvailable: true, featured: true })
                .populate("host", "name email avatar")
                .limit(limitNum)
                .lean();
            if (featured.length < 3) {
                const topRated = await Studio_1.Studio.find({ isAvailable: true })
                    .populate("host", "name email avatar")
                    .sort({ rating: -1 })
                    .limit(limitNum)
                    .lean();
                res.status(200).json({ studios: topRated });
                return;
            }
            res.status(200).json({ studios: featured });
            return;
        }
        const featured = dataStore_1.store.getFeaturedStudios(limitNum);
        res.status(200).json({ studios: featured });
    }
    catch (error) {
        console.error("Get Featured Studios Error:", error);
        res.status(500).json({ error: "Failed to fetch featured studios" });
    }
}
async function getStudioById(req, res) {
    try {
        const id = String(req.params.id);
        if (mongoose_1.default.connection.readyState === 1) {
            const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
            const studio = await Studio_1.Studio.findOne(query).populate("host", "name email avatar bio phone createdAt");
            if (!studio) {
                res.status(404).json({ error: "Studio not found" });
                return;
            }
            res.status(200).json({ studio });
            return;
        }
        const studio = dataStore_1.store.getStudioById(id);
        if (!studio) {
            res.status(404).json({ error: "Studio not found" });
            return;
        }
        res.status(200).json({ studio });
    }
    catch (error) {
        console.error("Get Studio By ID Error:", error);
        res.status(500).json({ error: "Failed to fetch studio details" });
    }
}
async function getMyListings(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (mongoose_1.default.connection.readyState === 1) {
            const studios = await Studio_1.Studio.find({ host: req.user.userId })
                .sort({ createdAt: -1 })
                .lean();
            res.status(200).json({ studios });
            return;
        }
        const studios = dataStore_1.store.getStudiosByHost(req.user.userId);
        res.status(200).json({ studios });
    }
    catch (error) {
        console.error("Get My Listings Error:", error);
        res.status(500).json({ error: "Failed to fetch host listings" });
    }
}
async function createStudio(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const parsed = studio_validator_1.createStudioSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Validation failed",
                details: parsed.error.issues.map((i) => i.message),
            });
            return;
        }
        const studioImages = parsed.data.images && parsed.data.images.length > 0
            ? parsed.data.images
            : parsed.data.imageUrl
                ? [parsed.data.imageUrl]
                : [
                    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85",
                ];
        if (mongoose_1.default.connection.readyState === 1) {
            const slug = slugify(parsed.data.title);
            const studio = await Studio_1.Studio.create({
                ...parsed.data,
                images: studioImages,
                slug,
                host: req.user.userId,
            });
            res.status(201).json({
                message: "Studio listed successfully",
                studio,
            });
            return;
        }
        const hostUser = dataStore_1.store.findUserById(req.user.userId) || {
            id: req.user.userId,
            name: parsed.data.hostName || "Host User",
            email: parsed.data.hostEmail || req.user.email,
        };
        const studio = dataStore_1.store.createStudio({ ...parsed.data, images: studioImages }, hostUser);
        res.status(201).json({
            message: "Studio listed successfully",
            studio,
        });
    }
    catch (error) {
        console.error("Create Studio Error:", error);
        res.status(500).json({ error: "Failed to create studio listing" });
    }
}
async function updateStudio(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const parsed = studio_validator_1.updateStudioSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Validation failed",
                details: parsed.error.issues.map((i) => i.message),
            });
            return;
        }
        const id = String(req.params.id);
        if (mongoose_1.default.connection.readyState === 1) {
            const isObjectId = mongoose_1.default.Types.ObjectId.isValid(id);
            const studio = await (isObjectId ? Studio_1.Studio.findById(id) : Studio_1.Studio.findOne({ slug: id }));
            if (!studio) {
                res.status(404).json({ error: "Studio not found" });
                return;
            }
            if (studio.host.toString() !== req.user.userId &&
                req.user.role !== "admin") {
                res.status(403).json({
                    error: "Forbidden: You do not own this studio listing.",
                });
                return;
            }
            const updateData = { ...parsed.data };
            if (updateData.price && !updateData.pricePerHour) {
                updateData.pricePerHour = updateData.price;
                delete updateData.price;
            }
            if (updateData.area && !updateData.squareFeet) {
                updateData.squareFeet = updateData.area;
                delete updateData.area;
            }
            if (updateData.defaultBookingHours && !updateData.defaultBookingDuration) {
                updateData.defaultBookingDuration = updateData.defaultBookingHours;
                delete updateData.defaultBookingHours;
            }
            if (updateData.image) {
                if (!updateData.images || updateData.images.length === 0) {
                    updateData.images = [updateData.image];
                }
                delete updateData.image;
            }
            const updatedStudio = await Studio_1.Studio.findByIdAndUpdate(studio._id, { $set: updateData }, { new: true, runValidators: true }).populate("host", "name email avatar");
            res.status(200).json({
                message: "Studio listing updated successfully",
                studio: updatedStudio || studio,
            });
            return;
        }
        const studio = dataStore_1.store.getStudioById(id);
        if (!studio) {
            res.status(404).json({ error: "Studio not found" });
            return;
        }
        const hostId = studio.host?.id || studio.host?._id || studio.host;
        if (hostId !== req.user.userId && req.user.role !== "admin") {
            res.status(403).json({
                error: "Forbidden: You do not own this studio listing.",
            });
            return;
        }
        const updated = dataStore_1.store.updateStudio(id, parsed.data);
        res.status(200).json({
            message: "Studio listing updated successfully",
            studio: updated,
        });
    }
    catch (error) {
        console.error("Update Studio Error:", error);
        res.status(500).json({ error: "Failed to update studio listing" });
    }
}
async function deleteStudio(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const id = String(req.params.id);
        if (mongoose_1.default.connection.readyState === 1) {
            const isObjectId = mongoose_1.default.Types.ObjectId.isValid(id);
            const studio = await (isObjectId ? Studio_1.Studio.findById(id) : Studio_1.Studio.findOne({ slug: id }));
            if (!studio) {
                res.status(404).json({ error: "Studio not found" });
                return;
            }
            if (studio.host.toString() !== req.user.userId &&
                req.user.role !== "admin") {
                res.status(403).json({
                    error: "Forbidden: You do not have permission to delete this studio.",
                });
                return;
            }
            await Studio_1.Studio.findByIdAndDelete(studio._id);
            res.status(200).json({
                message: "Studio deleted successfully",
                deletedId: studio._id.toString(),
            });
            return;
        }
        const studio = dataStore_1.store.getStudioById(id);
        if (!studio) {
            res.status(404).json({ error: "Studio not found" });
            return;
        }
        const hostId = studio.host?.id || studio.host?._id || studio.host;
        if (hostId !== req.user.userId && req.user.role !== "admin") {
            res.status(403).json({
                error: "Forbidden: You do not have permission to delete this studio.",
            });
            return;
        }
        dataStore_1.store.deleteStudio(id);
        res.status(200).json({
            message: "Studio deleted successfully",
            deletedId: id,
        });
    }
    catch (error) {
        console.error("Delete Studio Error:", error);
        res.status(500).json({ error: "Failed to delete studio listing" });
    }
}
