"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
function authenticate(req, res, next) {
    let token;
    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }
    else if (req.headers.cookie) {
        // 2. Fallback to HTTP-only cookie if provided
        const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split("=");
            acc[key] = value;
            return acc;
        }, {});
        token = cookies["token"] || cookies["studiospace_token"];
    }
    if (!token) {
        res.status(401).json({ error: "Authentication required. No token provided." });
        return;
    }
    const payload = (0, jwt_1.verifyToken)(token);
    if (!payload) {
        res.status(401).json({ error: "Invalid or expired session token." });
        return;
    }
    req.user = payload;
    next();
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: `Access denied. Requires one of roles: ${allowedRoles.join(", ")}`,
            });
            return;
        }
        next();
    };
}
