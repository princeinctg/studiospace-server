"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIREBASE_PROJECT_ID = void 0;
exports.initializeFirebaseAdmin = initializeFirebaseAdmin;
exports.verifyFirebaseIdToken = verifyFirebaseIdToken;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
exports.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "studiospace-9a467";
let firebaseAdminApp = null;
/**
 * Initializes Firebase Admin SDK using the most secure method available:
 * 1. FIREBASE_SERVICE_ACCOUNT (full JSON string in environment)
 * 2. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 * 3. Default Application Credentials / Project ID validation
 */
function initializeFirebaseAdmin() {
    if (firebaseAdminApp) {
        return firebaseAdminApp;
    }
    const existingApps = (0, app_1.getApps)();
    if (existingApps.length > 0 && existingApps[0]) {
        firebaseAdminApp = existingApps[0];
        return firebaseAdminApp;
    }
    // 1. Full JSON Service Account (e.g. Render Secret or environment variable)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            firebaseAdminApp = (0, app_1.initializeApp)({
                credential: (0, app_1.cert)(serviceAccount),
                projectId: serviceAccount.project_id || exports.FIREBASE_PROJECT_ID,
            });
            console.log(`[Firebase Admin] Initialized with Service Account JSON for project: ${exports.FIREBASE_PROJECT_ID}`);
            return firebaseAdminApp;
        }
        catch (err) {
            console.warn("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON, falling back:", err);
        }
    }
    // 2. Individual credentials (CLIENT_EMAIL and PRIVATE_KEY)
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
            firebaseAdminApp = (0, app_1.initializeApp)({
                credential: (0, app_1.cert)({
                    projectId: exports.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey,
                }),
                projectId: exports.FIREBASE_PROJECT_ID,
            });
            console.log(`[Firebase Admin] Initialized with Cert fields for project: ${exports.FIREBASE_PROJECT_ID}`);
            return firebaseAdminApp;
        }
        catch (err) {
            console.warn("[Firebase Admin] Failed to initialize with cert fields, falling back:", err);
        }
    }
    // 3. Project ID based initialization (Google public key validation)
    firebaseAdminApp = (0, app_1.initializeApp)({
        projectId: exports.FIREBASE_PROJECT_ID,
    });
    console.log(`[Firebase Admin] Initialized with Project ID: ${exports.FIREBASE_PROJECT_ID}`);
    return firebaseAdminApp;
}
/**
 * Strictly verifies a Firebase ID Token using Firebase Admin SDK.
 * Never trusts user identity or email supplied directly by the frontend.
 * Rejects expired, invalid, or malformed tokens with an explicit error.
 */
async function verifyFirebaseIdToken(token) {
    if (!token || typeof token !== "string" || !token.trim()) {
        throw new Error("Missing or empty Firebase ID token");
    }
    const app = initializeFirebaseAdmin();
    const auth = (0, auth_1.getAuth)(app);
    // verifyIdToken checks signature against Google public keys, verifies expiration, and project aud/iss
    const decodedToken = await auth.verifyIdToken(token.trim(), true);
    if (!decodedToken.email) {
        throw new Error("Verified Firebase user has no email address associated");
    }
    return {
        uid: decodedToken.uid,
        email: decodedToken.email.toLowerCase().trim(),
        name: decodedToken.name || decodedToken.displayName || "Google User",
        picture: decodedToken.picture || "",
        emailVerified: Boolean(decodedToken.email_verified),
        provider: decodedToken.firebase?.sign_in_provider || "google.com",
    };
}
