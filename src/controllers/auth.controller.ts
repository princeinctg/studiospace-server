import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { generateToken } from "../utils/jwt";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { AuthenticatedRequest } from "../middleware/auth";
import { store } from "../store/dataStore";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation error",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const { name, email, password, role, phone } = parsed.data;

    // Dual-Engine: If MongoDB connected, use Mongoose
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ error: "An account with this email already exists." });
        return;
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || "guest",
        phone: phone || "",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      });

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
        },
      });
      return;
    }

    // Local DataStore Engine
    const existing = store.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = store.createUser({
      name,
      email,
      password: hashedPassword,
      role: (role as any) || "guest",
      phone: phone || "",
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Failed to register account" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation error",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const { email, password } = parsed.data;

    // Dual-Engine: If MongoDB connected, use Mongoose
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
        },
      });
      return;
    }

    // Local DataStore Engine
    const user = store.findUserByEmail(email);
    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Failed to process login" });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Dual-Engine: If MongoDB connected, use Mongoose
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      });
      return;
    }

    // Local DataStore Engine
    const user = store.findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("GetMe Error:", error);
    res.status(500).json({ error: "Failed to fetch user session" });
  }
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { email, name, avatar, googleId } = req.body;
    if (!email || !name) {
      res.status(400).json({ error: "Email and name are required for Google Auth" });
      return;
    }

    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name,
          email,
          avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          role: "guest",
          googleId: googleId || "google_oauth_" + Date.now(),
        });
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        message: "Google login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
      return;
    }

    // Local DataStore Engine
    let user = store.findUserByEmail(email);
    if (!user) {
      user = store.createUser({
        name,
        email,
        avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        role: "guest",
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: "Google login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: "Logged out successfully" });
}
