/**
 * MongoDB URI Sanitizer & Masker
 * Prevents "MongoParseError: Invalid scheme, expected connection string to start with mongodb:// or mongodb+srv://"
 * caused by quotes, leading/trailing whitespace, env var name prefixes, or missing scheme in environment variables.
 */

export function sanitizeMongoUri(rawUri: string | undefined | null): string {
  if (!rawUri || typeof rawUri !== "string") {
    return "mongodb://127.0.0.1:27017/studiospace";
  }

  // 1. Trim whitespace, tabs, and newlines
  let uri = rawUri.trim();

  // 2. Check if it contains a full mongodb:// or mongodb+srv:// protocol anywhere inside
  // (e.g. if the user pasted "MONGODB_URI=mongodb+srv://..." or "const uri = 'mongodb+srv://...'")
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

  // 7. Handle MongoDB Cloud Web Console URL or fallback
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    if (uri.toLowerCase().includes("cloud.mongodb.com")) {
      console.warn("[MongoDB Atlas Warning] Detected MongoDB Cloud Web Console URL instead of database connection string. Expected: mongodb+srv://...");
      return "mongodb://127.0.0.1:27017/studiospace";
    }
    uri = "mongodb://" + uri.replace(/^[^a-zA-Z0-9]+/, "");
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
