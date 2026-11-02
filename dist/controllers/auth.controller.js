"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
exports.googleAuth = googleAuth;
exports.logout = logout;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const auth_validator_1 = require("../validators/auth.validator");
const dataStore_1 = require("../store/dataStore");
async function register(req, res) {
    try {
        const parsed = auth_validator_1.registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Validation error",
                details: parsed.error.issues.map((i) => i.message),
            });
            return;
        }
        const { name, email, password, role, phone } = parsed.data;
        // Dual-Engine: If MongoDB connected, use Mongoose
        if (mongoose_1.default.connection.readyState === 1) {
            const existingUser = await User_1.User.findOne({ email });
            if (existingUser) {
                res.status(409).json({ error: "An account with this email already exists." });
                return;
            }
            const user = await User_1.User.create({
                name,
                email,
                password,
                role: role || "guest",
                phone: phone || "",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            });
            const token = (0, jwt_1.generateToken)({
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
        const existing = dataStore_1.store.findUserByEmail(email);
        if (existing) {
            res.status(409).json({ error: "An account with this email already exists." });
            return;
        }
        const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
        const user = dataStore_1.store.createUser({
            name,
            email,
            password: hashedPassword,
            role: role || "guest",
            phone: phone || "",
        });
        const token = (0, jwt_1.generateToken)({
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
    }
    catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Failed to register account" });
    }
}
async function login(req, res) {
    try {
        const parsed = auth_validator_1.loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Validation error",
                details: parsed.error.issues.map((i) => i.message),
            });
            return;
        }
        const { email, password } = parsed.data;
        // Dual-Engine: If MongoDB connected, use Mongoose
        if (mongoose_1.default.connection.readyState === 1) {
            const user = await User_1.User.findOne({ email }).select("+password");
            if (!user) {
                res.status(401).json({ error: "Invalid email or password." });
                return;
            }
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                res.status(401).json({ error: "Invalid email or password." });
                return;
            }
            const token = (0, jwt_1.generateToken)({
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
        const user = dataStore_1.store.findUserByEmail(email);
        if (!user || !user.password) {
            res.status(401).json({ error: "Invalid email or password." });
            return;
        }
        const isMatch = bcryptjs_1.default.compareSync(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: "Invalid email or password." });
            return;
        }
        const token = (0, jwt_1.generateToken)({
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
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Failed to process login" });
    }
}
async function getMe(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        // Dual-Engine: If MongoDB connected, use Mongoose
        if (mongoose_1.default.connection.readyState === 1) {
            const user = await User_1.User.findById(req.user.userId);
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
        const user = dataStore_1.store.findUserById(req.user.userId);
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
    }
    catch (error) {
        console.error("GetMe Error:", error);
        res.status(500).json({ error: "Failed to fetch user session" });
    }
}
async function googleAuth(req, res) {
    try {
        const { email, name, avatar, googleId } = req.body;
        if (!email || !name) {
            res.status(400).json({ error: "Email and name are required for Google Auth" });
            return;
        }
        if (mongoose_1.default.connection.readyState === 1) {
            let user = await User_1.User.findOne({ email });
            if (!user) {
                user = await User_1.User.create({
                    name,
                    email,
                    avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                    role: "guest",
                    googleId: googleId || "google_oauth_" + Date.now(),
                });
            }
            const token = (0, jwt_1.generateToken)({
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
        let user = dataStore_1.store.findUserByEmail(email);
        if (!user) {
            user = dataStore_1.store.createUser({
                name,
                email,
                avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                role: "guest",
            });
        }
        const token = (0, jwt_1.generateToken)({
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
    }
    catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: "Google authentication failed" });
    }
}
async function logout(_req, res) {
    res.status(200).json({ message: "Logged out successfully" });
}
