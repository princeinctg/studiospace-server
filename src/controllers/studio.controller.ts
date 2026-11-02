import { Request, Response } from "express";
import mongoose from "mongoose";
import { Studio } from "../models/Studio";
import { createStudioSchema, updateStudioSchema } from "../validators/studio.validator";
import { AuthenticatedRequest } from "../middleware/auth";
import { store } from "../store/dataStore";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-")
    .concat("-", Math.random().toString(36).substring(2, 6));
}

export async function getAllStudios(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      category,
      city,
      minPrice,
      maxPrice,
      sort,
      page = "1",
      limit = "12",
    } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query: any = { isAvailable: true };

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
        if (minPrice) query.pricePerHour.$gte = Number(minPrice);
        if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
      }

      let sortCriteria: any = { createdAt: -1 };
      if (sort === "price_asc") sortCriteria = { pricePerHour: 1 };
      if (sort === "price_desc") sortCriteria = { pricePerHour: -1 };
      if (sort === "rating") sortCriteria = { rating: -1 };

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const [studios, total] = await Promise.all([
        Studio.find(query)
          .populate("host", "name email avatar")
          .sort(sortCriteria)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Studio.countDocuments(query),
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
    const studios = store.getAllStudios({
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
  } catch (error: any) {
    console.error("Get All Studios Error:", error);
    res.status(500).json({ error: "Failed to fetch studio listings" });
  }
}

export async function getFeaturedStudios(req: Request, res: Response): Promise<void> {
  try {
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const limitNum = limitParam && !isNaN(limitParam) ? Math.min(50, Math.max(1, limitParam)) : 8;

    if (mongoose.connection.readyState === 1) {
      const featured = await Studio.find({ isAvailable: true, featured: true })
        .populate("host", "name email avatar")
        .limit(limitNum)
        .lean();

      if (featured.length < 3) {
        const topRated = await Studio.find({ isAvailable: true })
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

    const featured = store.getFeaturedStudios(limitNum);
    res.status(200).json({ studios: featured });
  } catch (error: any) {
    console.error("Get Featured Studios Error:", error);
    res.status(500).json({ error: "Failed to fetch featured studios" });
  }
}

export async function getStudioById(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);

    if (mongoose.connection.readyState === 1) {
      const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
      const studio = await Studio.findOne(query).populate(
        "host",
        "name email avatar bio phone createdAt"
      );

      if (!studio) {
        res.status(404).json({ error: "Studio not found" });
        return;
      }

      res.status(200).json({ studio });
      return;
    }

    const studio = store.getStudioById(id);
    if (!studio) {
      res.status(404).json({ error: "Studio not found" });
      return;
    }

    res.status(200).json({ studio });
  } catch (error: any) {
    console.error("Get Studio By ID Error:", error);
    res.status(500).json({ error: "Failed to fetch studio details" });
  }
}

export async function getMyListings(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (mongoose.connection.readyState === 1) {
      const studios = await Studio.find({ host: req.user.userId })
        .sort({ createdAt: -1 })
        .lean();
      res.status(200).json({ studios });
      return;
    }

    const studios = store.getStudiosByHost(req.user.userId);
    res.status(200).json({ studios });
  } catch (error: any) {
    console.error("Get My Listings Error:", error);
    res.status(500).json({ error: "Failed to fetch host listings" });
  }
}

export async function createStudio(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = createStudioSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const studioImages =
      parsed.data.images && parsed.data.images.length > 0
        ? parsed.data.images
        : parsed.data.imageUrl
        ? [parsed.data.imageUrl]
        : [
            "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85",
          ];

    if (mongoose.connection.readyState === 1) {
      const slug = slugify(parsed.data.title);
      const studio = await Studio.create({
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

    const hostUser = store.findUserById(req.user.userId) || {
      id: req.user.userId,
      name: parsed.data.hostName || "Host User",
      email: parsed.data.hostEmail || req.user.email,
    };

    const studio = store.createStudio(
      { ...parsed.data, images: studioImages },
      hostUser as any
    );
    res.status(201).json({
      message: "Studio listed successfully",
      studio,
    });
  } catch (error: any) {
    console.error("Create Studio Error:", error);
    res.status(500).json({ error: "Failed to create studio listing" });
  }
}

export async function updateStudio(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = updateStudioSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const id = String(req.params.id);

    if (mongoose.connection.readyState === 1) {
      const studio = await Studio.findById(id);
      if (!studio) {
        res.status(404).json({ error: "Studio not found" });
        return;
      }

      if (
        studio.host.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        res.status(403).json({
          error: "Forbidden: You do not own this studio listing.",
        });
        return;
      }

      Object.assign(studio, parsed.data);
      await studio.save();

      res.status(200).json({
        message: "Studio listing updated successfully",
        studio,
      });
      return;
    }

    const studio = store.getStudioById(id);
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

    const updated = store.updateStudio(id, parsed.data);
    res.status(200).json({
      message: "Studio listing updated successfully",
      studio: updated,
    });
  } catch (error: any) {
    console.error("Update Studio Error:", error);
    res.status(500).json({ error: "Failed to update studio listing" });
  }
}

export async function deleteStudio(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = String(req.params.id);

    if (mongoose.connection.readyState === 1) {
      const studio = await Studio.findById(id);
      if (!studio) {
        res.status(404).json({ error: "Studio not found" });
        return;
      }

      if (
        studio.host.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        res.status(403).json({
          error: "Forbidden: You do not have permission to delete this studio.",
        });
        return;
      }

      await Studio.findByIdAndDelete(id);

      res.status(200).json({
        message: "Studio deleted successfully",
        deletedId: id,
      });
      return;
    }

    const studio = store.getStudioById(id);
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

    store.deleteStudio(id);
    res.status(200).json({
      message: "Studio deleted successfully",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("Delete Studio Error:", error);
    res.status(500).json({ error: "Failed to delete studio listing" });
  }
}
