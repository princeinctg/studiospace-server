/**
 * MongoDB URI Sanitizer & Masker
 * Bulletproof connection string sanitizer for MongoDB Atlas & local development.
 * Automatically handles:
 * - Surrounding quotes: single, double, backticks
 * - Leading/trailing whitespace and newlines
 * - Env var assignment prefixes (e.g. MONGODB_URI=mongodb+srv://...)
 * - Loose scheme typos (e.g. mongodb+srv: //)
 * - Inferred schemes for .mongodb.net clusters
 * - Auto-URL-encoding of reserved/special characters in passwords (#, @, %, etc.)
 * - Ensuring database name is explicitly "studiospace"
 * - Safe credential masking for production logging
 * - Guaranteeing URI begins with mongodb:// or mongodb+srv://
 */

export function sanitizeMongoUri(rawUri: string | undefined | null): string {
  const DEFAULT_URI = "mongodb://127.0.0.1:27017/studiospace";

  if (!rawUri || typeof rawUri !== "string") {
    return DEFAULT_URI;
  }

  // 1. Trim whitespace, tabs, and newlines
  let uri = rawUri.trim();

  // Check for empty, placeholder, or invalid inputs
  const stripped = uri.replace(/^["'`]+|["'`]+$/g, "").trim();
  if (
    !stripped ||
    stripped === "undefined" ||
    stripped === "null" ||
    stripped === "mongodb://" ||
    stripped === "mongodb+srv://"
  ) {
    return DEFAULT_URI;
  }

  // 2. Extract full mongodb:// or mongodb+srv:// protocol if embedded inside text or assignments
  // (e.g. "MONGODB_URI=mongodb+srv://...", "const uri = 'mongodb+srv://...'")
  const schemeMatch = uri.match(/(mongodb(?:\+srv)?:\/\/[^\s"'`]+)/i);
  if (schemeMatch) {
    uri = schemeMatch[1];
  } else {
    // 3. Check for loose scheme variations like "mongodb+srv: //" or "mongodb+srv:/"
    const looseSchemeMatch = uri.match(/(mongodb(?:\+srv)?:\s*\/+)([^\s"'`]+)/i);
    if (looseSchemeMatch) {
      const scheme = looseSchemeMatch[1].toLowerCase().includes("+srv") ? "mongodb+srv://" : "mongodb://";
      uri = scheme + looseSchemeMatch[2];
    } else if (uri.toLowerCase().includes(".mongodb.net")) {
      // 4. Inferred Atlas cluster without protocol, or preceded by https:// or assignment
      const atlasMatch = uri.match(/(?:[a-zA-Z0-9_\-\.\:\%]+@)?[a-zA-Z0-9\-\.]+\.mongodb\.net[^\s"'`;]*/i);
      if (atlasMatch) {
        uri = "mongodb+srv://" + atlasMatch[0];
      }
    }
  }

  // 5. Clean up any wrapping/trailing quotes, semicolons, brackets, parentheses
  uri = uri.replace(/^["'`]+/, "").replace(/["'`;\)\],]+$/, "").trim();

  // 6. Strip any escaped quotes remaining
  uri = uri.replace(/\\"/g, "").replace(/\\'/g, "").trim();

  // 7. Handle MongoDB Cloud Web Console URL mistakenly pasted
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    if (uri.toLowerCase().includes("cloud.mongodb.com")) {
      console.warn("[MongoDB Atlas Warning] Detected MongoDB Cloud Web Console URL instead of database connection string. Expected: mongodb+srv://...");
      return DEFAULT_URI;
    }
    uri = "mongodb://" + uri.replace(/^[^a-zA-Z0-9]+/, "");
  }

  // 8. Safely URL-encode credentials if username/password contains unescaped special characters
  const protoMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
  if (protoMatch) {
    const proto = protoMatch[1];
    const body = protoMatch[2];
    const lastAt = body.lastIndexOf("@");
    if (lastAt !== -1) {
      const userinfo = body.substring(0, lastAt);
      const hostAndRest = body.substring(lastAt + 1);
      const colonIdx = userinfo.indexOf(":");
      if (colonIdx !== -1) {
        const rawUser = userinfo.substring(0, colonIdx);
        const rawPass = userinfo.substring(colonIdx + 1);

        if (rawPass.includes("<password>") || rawPass.includes("<db_password>")) {
          console.warn("[MongoDB Atlas Warning] The placeholder '<password>' in MONGODB_URI was not replaced with your real database user password!");
        }

        try {
          const safeUser = encodeURIComponent(decodeURIComponent(rawUser));
          const safePass = encodeURIComponent(decodeURIComponent(rawPass));
          uri = `${proto}${safeUser}:${safePass}@${hostAndRest}`;
        } catch {
          const safeUser = encodeURIComponent(rawUser);
          const safePass = encodeURIComponent(rawPass);
          uri = `${proto}${safeUser}:${safePass}@${hostAndRest}`;
        }
      }
    }
  }

  // 9. Ensure Atlas cluster targets the "studiospace" database
  if (uri.includes(".mongodb.net")) {
    if (/\.mongodb\.net\/(?:test)?(?:\?|$)/i.test(uri)) {
      uri = uri.replace(/\.mongodb\.net\/(?:test)?(\?.*)?$/i, (_m, query) => ".mongodb.net/studiospace" + (query || ""));
    } else if (/\.mongodb\.net$/i.test(uri)) {
      uri = uri + "/studiospace";
    }
  }

  // 10. Strict scheme and host guarantee
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    uri = "mongodb://" + uri.replace(/^[^a-zA-Z0-9]+/, "");
  }

  const withoutProto = uri.replace(/^mongodb(?:\+srv)?:\/\//i, "");
  if (!withoutProto || withoutProto.startsWith("/") || withoutProto.startsWith("?")) {
    return DEFAULT_URI;
  }

  return uri.trim();
}

/**
 * Mask sensitive credentials in MongoDB URI for safe logging
 */
export function maskMongoUri(uri: string): string {
  if (!uri || typeof uri !== "string") return "";
  return uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
}
