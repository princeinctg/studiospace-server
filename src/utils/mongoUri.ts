/**
 * MongoDB URI Sanitizer & Masker
 * Prevents "MongoParseError: Invalid scheme, expected connection string to start with mongodb:// or mongodb+srv://"
 * caused by quotes, leading/trailing whitespace, or missing scheme in environment variables.
 */

export function sanitizeMongoUri(rawUri: string | undefined | null): string {
  if (!rawUri || typeof rawUri !== "string") {
    return "mongodb://127.0.0.1:27017/studiospace";
  }

  // 1. Trim all leading/trailing whitespace, newlines, and carriage returns
  let uri = rawUri.trim();

  // 2. Strip surrounding matching or unmatching quotes: single, double, backticks
  uri = uri.replace(/^["'`]+|["'`]+$/g, "").trim();

  // 3. Strip any escaped quotes like \" or \'
  uri = uri.replace(/\\"/g, "").replace(/\\'/g, "").trim();

  // 4. Handle common typo variations in scheme prefix
  if (uri.startsWith("mongodb+srv:")) {
    uri = uri.replace(/^mongodb\+srv:\s*\/*/, "mongodb+srv://");
  } else if (uri.startsWith("mongodb:")) {
    uri = uri.replace(/^mongodb:\s*\/*/, "mongodb://");
  } else if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    // If scheme is completely missing, infer scheme
    if (uri.includes(".mongodb.net")) {
      uri = "mongodb+srv://" + uri.replace(/^\/+/, "");
    } else {
      uri = "mongodb://" + uri.replace(/^\/+/, "");
    }
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
