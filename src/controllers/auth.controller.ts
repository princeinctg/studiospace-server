import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { generateToken } from "../utils/jwt";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { AuthenticatedRequest } from "../middleware/auth";
import { connectDB } from "../config/database";
import { ENV } from "../config/env";
import { store } from "../store/dataStore";

function setAuthCookies(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
  res.cookie("token", token, cookieOptions);
  res.cookie("studiospace_token", token, cookieOptions);
}

function clearAuthCookies(res: Response) {
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    path: "/",
  };
  res.clearCookie("token", cookieOptions);
  res.clearCookie("studiospace_token", cookieOptions);
}

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

    const { name, email, password, role, phone, avatar } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Primary Production Engine: MongoDB Atlas
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        res.status(409).json({ error: "An account with this email already exists." });
        return;
      }

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password, // Hashed by User model pre-save hook
        role: role || "guest",
        phone: phone || "",
        avatar:
          avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      });

      const token = generateToken({
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
    const existing = store.findUserByEmail(normalizedEmail);
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = store.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: (role as any) || "guest",
      phone: phone || "",
    });

    const token = generateToken({
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
  } catch (error: any) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Failed to register user account" });
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
    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Primary Production Engine: MongoDB Atlas
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: normalizedEmail }).select("+password");
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

      const token = generateToken({
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
    const user = store.findUserByEmail(normalizedEmail);
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
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Failed to login user" });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

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

    // Local DataStore Engine (dev fallback only)
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

function resolveGoogleCallbackUrl(req: Request): string {
  const host = req.headers["x-forwarded-host"] || req.get("host") || "";
  if (typeof host === "string" && (host.includes("localhost") || host.includes("127.0.0.1"))) {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    return `${protocol}://${host}/api/auth/google/callback`;
  }

  // If callback request arrived directly at /api/auth/google/callback
  const urlPath = req.originalUrl || req.url || "";
  if (urlPath.includes("/api/auth/google/callback")) {
    return "https://studiospace-server-f9ek.onrender.com/api/auth/google/callback";
  }

  const configured = process.env.GOOGLE_CALLBACK_URL;
  // If explicitly configured with a custom non-default path, respect it
  if (configured && configured.trim() && configured.trim() !== "https://studiospace-server-f9ek.onrender.com/api/auth/google/callback") {
    return configured.trim();
  }

  // Verified Authorized Redirect URI matching current Google Cloud Console registration
  return "https://studiospace-server-f9ek.onrender.com/";
}

/**
 * Initiates Real Google OAuth 2.0 Authorization Code flow
 * Redirects user to Google Accounts consent screen
 */
export function googleRedirect(req: Request, res: Response): void {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  
  let stateParam = req.query.state as string;
  if (!stateParam) {
    const returnClientUrl = (req.query.returnTo as string) || req.headers.referer || ENV.CLIENT_URL;
    let cleanOrigin = ENV.CLIENT_URL;
    try {
      cleanOrigin = new URL(returnClientUrl).origin;
    } catch {}
    stateParam = JSON.stringify({
      returnTo: cleanOrigin,
      role: (req.query.role as string) || "guest",
      redirect: (req.query.redirect as string) || "/dashboard",
      from: req.query.from || "login",
    });
  }

  const callbackUri = resolveGoogleCallbackUrl(req);

  const options = {
    redirect_uri: callbackUri,
    client_id: ENV.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    state: stateParam,
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
export async function googleCallback(req: Request, res: Response): Promise<void> {
  const code = req.query.code as string;
  const rawState = req.query.state as string;

  let returnClient = ENV.CLIENT_URL;
  let userRole: "guest" | "host" = "guest";
  let redirectPath = "/dashboard";
  let fromPage = "login";

  if (rawState) {
    try {
      const parsed = JSON.parse(rawState);
      if (parsed.returnTo) returnClient = parsed.returnTo;
      if (parsed.role === "host" || parsed.role === "guest") userRole = parsed.role;
      if (parsed.redirect) redirectPath = parsed.redirect;
      if (parsed.from) fromPage = parsed.from;
    } catch {
      if (rawState.startsWith("http")) {
        try {
          const u = new URL(rawState);
          returnClient = u.origin;
          if (u.pathname && u.pathname !== "/") redirectPath = u.pathname;
        } catch {
          returnClient = rawState;
        }
      }
    }
  }

  if (!code) {
    res.redirect(`${returnClient}/${fromPage}?error=Google+authorization+code+missing`);
    return;
  }

  try {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ENV.GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      console.error("[Google OAuth] Missing GOOGLE_CLIENT_SECRET in environment");
      res.redirect(`${returnClient}/${fromPage}?error=Google+OAuth+credentials+not+configured`);
      return;
    }

    const callbackUri = resolveGoogleCallbackUrl(req);

    // Exchange code for tokens with Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: ENV.GOOGLE_CLIENT_ID,
        client_secret: clientSecret,
        redirect_uri: callbackUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = (await tokenRes.json()) as any;
    if (!tokens.access_token) {
      console.error("[Google OAuth] Token exchange failed:", tokens.error || "Unknown error");
      res.redirect(`${returnClient}/${fromPage}?error=Google+authentication+failed`);
      return;
    }

    // Fetch user profile from Google UserInfo endpoint
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = (await userRes.json()) as any;

    if (!googleUser.email) {
      res.redirect(`${returnClient}/${fromPage}?error=Unable+to+retrieve+verified+Google+email`);
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const normalizedEmail = googleUser.email.toLowerCase().trim();
    let user = null;

    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({
        $or: [{ googleId: googleUser.sub }, { email: normalizedEmail }],
      });

      if (user) {
        if (!user.googleId) user.googleId = googleUser.sub;
        if (!user.avatar && googleUser.picture) user.avatar = googleUser.picture;
        user.provider = "google";
        await user.save();
      } else {
        // Automatically create first-time Google user in MongoDB Atlas
        user = await User.create({
          name: googleUser.name || "Google User",
          email: normalizedEmail,
          googleId: googleUser.sub,
          avatar: googleUser.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          role: userRole,
          provider: "google",
        });
      }
    } else {
      // Local fallback
      user = store.findUserByEmail(normalizedEmail);
      if (user) {
        if (!user.googleId) user.googleId = googleUser.sub;
        if (!user.avatar && googleUser.picture) user.avatar = googleUser.picture;
        user.provider = "google";
      } else {
        user = store.createUser({
          name: googleUser.name || "Google User",
          email: normalizedEmail,
          avatar: googleUser.picture || "",
          googleId: googleUser.sub,
          role: userRole,
          provider: "google",
        });
      }
    }

    const token = generateToken({
      userId: user._id ? user._id.toString() : user.id,
      email: user.email,
      role: user.role,
    });

    setAuthCookies(res, token);

    // Redirect to frontend destination with token
    try {
      const cleanTarget = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
      const targetUrl = new URL(cleanTarget, returnClient);
      targetUrl.searchParams.set("auth_token", token);
      res.redirect(targetUrl.toString());
    } catch {
      const cleanBase = returnClient.replace(/\/+$/, "");
      res.redirect(`${cleanBase}/dashboard?auth_token=${token}`);
    }
  } catch (error: any) {
    console.error("[Google OAuth] Callback error:", error.message);
    res.redirect(`${returnClient}/${fromPage}?error=Google+login+processing+failed`);
  }
}

/**
 * Handles JSON-based Google Authentication (for direct verified token / popup flow)
 */
export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { email, name, avatar, googleId, credential, role } = req.body;
    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let userGoogleId = googleId;
    const assignedRole = role === "host" ? "host" : "guest";

    // Verify Google ID token if provided
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (verifyRes.ok) {
          const payload = (await verifyRes.json()) as any;
          userEmail = payload.email;
          userName = payload.name;
          userAvatar = payload.picture;
          userGoogleId = payload.sub;
        }
      } catch {
        // Fallback to body
      }
    }

    if (!userEmail) {
      res.status(400).json({ error: "Email is required for Google Auth" });
      return;
    }

    const normalizedEmail = userEmail.toLowerCase().trim();

    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({
        $or: [{ googleId: userGoogleId }, { email: normalizedEmail }],
      });

      if (user) {
        if (!user.googleId && userGoogleId) user.googleId = userGoogleId;
        if (!user.avatar && userAvatar) user.avatar = userAvatar;
        user.provider = "google";
        await user.save();
      } else {
        user = await User.create({
          name: userName || "Google User",
          email: normalizedEmail,
          avatar:
            userAvatar ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          role: assignedRole,
          provider: "google",
          googleId: userGoogleId || "google_oauth_" + Date.now(),
        });
      }

      const token = generateToken({
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
    let user = store.findUserByEmail(normalizedEmail);
    if (!user) {
      user = store.createUser({
        name: userName || "Google User",
        email: normalizedEmail,
        avatar:
          userAvatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        role: assignedRole,
        provider: "google",
        googleId: userGoogleId,
      });
    } else {
      user.provider = "google";
      if (userGoogleId && !user.googleId) user.googleId = userGoogleId;
      if (userAvatar && !user.avatar) user.avatar = userAvatar;
    }

    const token = generateToken({
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
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookies(res);
  res.status(200).json({ message: "Logged out successfully" });
}
