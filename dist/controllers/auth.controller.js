"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
exports.googleRedirect = googleRedirect;
exports.googleCallback = googleCallback;
exports.googleAuth = googleAuth;
exports.logout = logout;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const auth_validator_1 = require("../validators/auth.validator");
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const dataStore_1 = require("../store/dataStore");
function setAuthCookies(res, token) {
    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? "none" : "lax"),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    };
    res.cookie("token", token, cookieOptions);
    res.cookie("studiospace_token", token, cookieOptions);
}
function clearAuthCookies(res) {
    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? "none" : "lax"),
        path: "/",
    };
    res.clearCookie("token", cookieOptions);
    res.clearCookie("studiospace_token", cookieOptions);
}
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
        const { name, email, password, role, phone, avatar } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();
        // Ensure database connection
        if (mongoose_1.default.connection.readyState !== 1) {
            await (0, database_1.connectDB)();
        }
        // Primary Production Engine: MongoDB Atlas
        if (mongoose_1.default.connection.readyState === 1) {
            const existingUser = await User_1.User.findOne({ email: normalizedEmail });
            if (existingUser) {
                res.status(409).json({ error: "An account with this email already exists." });
                return;
            }
            const user = await User_1.User.create({
                name: name.trim(),
                email: normalizedEmail,
                password, // Hashed by User model pre-save hook
                role: role || "guest",
                phone: phone || "",
                avatar: avatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            });
            const token = (0, jwt_1.generateToken)({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
            });
            setAuthCookies(res, token);
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
        // Fallback store when MongoDB Atlas is connecting or offline
        const existing = dataStore_1.store.findUserByEmail(normalizedEmail);
        if (existing) {
            res.status(409).json({ error: "An account with this email already exists." });
            return;
        }
        const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
        const user = dataStore_1.store.createUser({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role || "guest",
            phone: phone || "",
        });
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        setAuthCookies(res, token);
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
        res.status(500).json({ error: "Failed to register user account" });
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
        const normalizedEmail = email.toLowerCase().trim();
        if (mongoose_1.default.connection.readyState !== 1) {
            await (0, database_1.connectDB)();
        }
        // Primary Production Engine: MongoDB Atlas
        if (mongoose_1.default.connection.readyState === 1) {
            const user = await User_1.User.findOne({ email: normalizedEmail }).select("+password");
            if (!user) {
                res.status(401).json({ error: "Invalid email or password." });
                return;
            }
            if (!user.password) {
                res.status(401).json({ error: "This account was registered with Google. Please use Google Sign In." });
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
            setAuthCookies(res, token);
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
        // Fallback store when MongoDB Atlas is connecting or offline
        const user = dataStore_1.store.findUserByEmail(normalizedEmail);
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
        setAuthCookies(res, token);
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
        res.status(500).json({ error: "Failed to login user" });
    }
}
async function getMe(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            await (0, database_1.connectDB)();
        }
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
        // Local DataStore Engine (dev fallback only)
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
function resolveGoogleCallbackUrl(req) {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "studiospace-server-f9ek.onrender.com";
    const dynamicCallback = `${protocol}://${host}/api/auth/google/callback`;
    const configured = process.env.GOOGLE_CALLBACK_URL || env_1.ENV.GOOGLE_CALLBACK_URL;
    if (configured && !configured.includes("studiospace-server.onrender.com")) {
        return configured;
    }
    return dynamicCallback;
}
/**
 * Initiates Real Google OAuth 2.0 Authorization Code flow
 * Redirects user to Google Accounts consent screen
 */
function googleRedirect(req, res) {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const referer = req.headers.referer;
    let returnClientUrl = env_1.ENV.CLIENT_URL;
    if (req.query.returnTo && typeof req.query.returnTo === "string") {
        returnClientUrl = req.query.returnTo;
    }
    else if (referer) {
        try {
            const parsed = new URL(referer);
            returnClientUrl = parsed.origin;
        }
        catch { }
    }
    const callbackUri = resolveGoogleCallbackUrl(req);
    const options = {
        redirect_uri: callbackUri,
        client_id: env_1.ENV.GOOGLE_CLIENT_ID,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        state: returnClientUrl,
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };
    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
}
/**
 * Handles Real Google OAuth 2.0 callback
 * Exchanges authorization code for tokens, verifies profile, persists user in MongoDB Atlas
 */
async function googleCallback(req, res) {
    const code = req.query.code;
    const returnClient = req.query.state || env_1.ENV.CLIENT_URL;
    if (!code) {
        res.redirect(`${returnClient}/login?error=Google+authorization+code+missing`);
        return;
    }
    try {
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || env_1.ENV.GOOGLE_CLIENT_SECRET;
        if (!clientSecret) {
            console.error("[Google OAuth] Missing GOOGLE_CLIENT_SECRET in environment");
            res.redirect(`${returnClient}/login?error=Google+OAuth+credentials+not+configured`);
            return;
        }
        const callbackUri = resolveGoogleCallbackUrl(req);
        // Exchange code for tokens with Google
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: env_1.ENV.GOOGLE_CLIENT_ID,
                client_secret: clientSecret,
                redirect_uri: callbackUri,
                grant_type: "authorization_code",
            }),
        });
        const tokens = (await tokenRes.json());
        if (!tokens.access_token) {
            console.error("[Google OAuth] Token exchange failed:", tokens.error || "Unknown error");
            res.redirect(`${returnClient}/login?error=Google+authentication+failed`);
            return;
        }
        // Fetch user profile from Google UserInfo endpoint
        const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const googleUser = (await userRes.json());
        if (!googleUser.email) {
            res.redirect(`${returnClient}/login?error=Unable+to+retrieve+verified+Google+email`);
            return;
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            await (0, database_1.connectDB)();
        }
        const normalizedEmail = googleUser.email.toLowerCase().trim();
        let user = null;
        if (mongoose_1.default.connection.readyState === 1) {
            user = await User_1.User.findOne({
                $or: [{ googleId: googleUser.sub }, { email: normalizedEmail }],
            });
            if (user) {
                if (!user.googleId)
                    user.googleId = googleUser.sub;
                if (!user.avatar && googleUser.picture)
                    user.avatar = googleUser.picture;
                await user.save();
            }
            else {
                // Automatically create first-time Google user in MongoDB Atlas
                user = await User_1.User.create({
                    name: googleUser.name || "Google User",
                    email: normalizedEmail,
                    googleId: googleUser.sub,
                    avatar: googleUser.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                    role: "guest",
                });
            }
        }
        else {
            // Local fallback
            user = dataStore_1.store.findUserByEmail(normalizedEmail);
            if (!user) {
                user = dataStore_1.store.createUser({
                    name: googleUser.name || "Google User",
                    email: normalizedEmail,
                    avatar: googleUser.picture || "",
                    role: "guest",
                });
            }
        }
        const token = (0, jwt_1.generateToken)({
            userId: user._id ? user._id.toString() : user.id,
            email: user.email,
            role: user.role,
        });
        setAuthCookies(res, token);
        // Redirect to frontend dashboard with token
        res.redirect(`${returnClient}/dashboard?auth_token=${token}`);
    }
    catch (error) {
        console.error("[Google OAuth] Callback error:", error.message);
        res.redirect(`${returnClient}/login?error=Google+login+processing+failed`);
    }
}
/**
 * Handles JSON-based Google Authentication (for direct verified token / popup flow)
 */
async function googleAuth(req, res) {
    try {
        const { email, name, avatar, googleId, credential } = req.body;
        let userEmail = email;
        let userName = name;
        let userAvatar = avatar;
        let userGoogleId = googleId;
        // Verify Google ID token if provided
        if (credential) {
            try {
                const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
                if (verifyRes.ok) {
                    const payload = (await verifyRes.json());
                    userEmail = payload.email;
                    userName = payload.name;
                    userAvatar = payload.picture;
                    userGoogleId = payload.sub;
                }
            }
            catch {
                // Fallback to body
            }
        }
        if (!userEmail) {
            res.status(400).json({ error: "Email is required for Google Auth" });
            return;
        }
        const normalizedEmail = userEmail.toLowerCase().trim();
        if (mongoose_1.default.connection.readyState !== 1) {
            await (0, database_1.connectDB)();
        }
        if (mongoose_1.default.connection.readyState === 1) {
            let user = await User_1.User.findOne({
                $or: [{ googleId: userGoogleId }, { email: normalizedEmail }],
            });
            if (user) {
                if (!user.googleId && userGoogleId)
                    user.googleId = userGoogleId;
                if (!user.avatar && userAvatar)
                    user.avatar = userAvatar;
                await user.save();
            }
            else {
                user = await User_1.User.create({
                    name: userName || "Google User",
                    email: normalizedEmail,
                    avatar: userAvatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                    role: "guest",
                    googleId: userGoogleId || "google_oauth_" + Date.now(),
                });
            }
            const token = (0, jwt_1.generateToken)({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
            });
            setAuthCookies(res, token);
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
        // Local DataStore Engine (dev fallback only)
        let user = dataStore_1.store.findUserByEmail(normalizedEmail);
        if (!user) {
            user = dataStore_1.store.createUser({
                name: userName || "Google User",
                email: normalizedEmail,
                avatar: userAvatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                role: "guest",
            });
        }
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        setAuthCookies(res, token);
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
    clearAuthCookies(res);
    res.status(200).json({ message: "Logged out successfully" });
}
