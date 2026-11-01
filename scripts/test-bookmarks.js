const http = require("http");

const API_BASE = "http://localhost:5000/api";

function request(options, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(options.url || options);
    const reqOpts = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    if (body) {
      reqOpts.headers["Content-Type"] = "application/json";
      reqOpts.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = http.request(reqOpts, (res) => {
      let rawData = "";
      res.on("data", (chunk) => (rawData += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(rawData);
        } catch {
          parsed = rawData;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runBookmarkVerification() {
  console.log("==========================================================");
  console.log(" BOOKMARK RESTORATION & REGRESSION TEST SUITE");
  console.log("==========================================================\n");

  // Step 1: Login as Guest (Sarah Jenkins)
  console.log("--- 1. Authenticating as Guest (Sarah Jenkins) ---");
  const guestLogin = await request(
    { url: `${API_BASE}/auth/login`, method: "POST" },
    JSON.stringify({ email: "guest@studiospace.com", password: "GuestPassword123!" })
  );
  if (guestLogin.statusCode !== 200 || !guestLogin.data?.token) {
    throw new Error(`Guest login failed: ${JSON.stringify(guestLogin.data)}`);
  }
  const guestToken = guestLogin.data.token;
  console.log("✓ Guest authenticated. Token acquired.\n");

  // Step 2: Login as Host (Alex Vance)
  console.log("--- 2. Authenticating as Host (Alex Vance) ---");
  const hostLogin = await request(
    { url: `${API_BASE}/auth/login`, method: "POST" },
    JSON.stringify({ email: "host@studiospace.com", password: "HostPassword123!" })
  );
  if (hostLogin.statusCode !== 200 || !hostLogin.data?.token) {
    throw new Error(`Host login failed: ${JSON.stringify(hostLogin.data)}`);
  }
  const hostToken = hostLogin.data.token;
  console.log("✓ Host authenticated. Token acquired.\n");

  // Step 3: Test Bookmark Add for Sarah
  console.log("--- 3. Testing Bookmark Add Operation (Sarah saves 'studio-daylight-loft') ---");
  const addRes = await request({
    url: `${API_BASE}/bookmarks/studio-daylight-loft`,
    method: "POST",
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  console.log(`Add Bookmark Status: ${addRes.statusCode}`);
  console.log("Server Response:", addRes.data);
  if (addRes.statusCode === 200 && addRes.data?.studioIds?.includes("studio-daylight-loft")) {
    console.log("✓ PASS: Studio bookmarked successfully.\n");
  } else {
    throw new Error(`FAIL: Bookmark add failed: ${JSON.stringify(addRes.data)}`);
  }

  // Step 4: Test Refresh Persistence for Sarah
  console.log("--- 4. Testing Refresh Persistence (GET /api/bookmarks) ---");
  const getBookmarksRes = await request({
    url: `${API_BASE}/bookmarks`,
    method: "GET",
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  console.log(`Fetch Bookmarks Status: ${getBookmarksRes.statusCode}`);
  console.log("Sarah's Bookmarks:", getBookmarksRes.data?.studioIds);
  if (
    getBookmarksRes.statusCode === 200 &&
    getBookmarksRes.data?.studioIds?.includes("studio-daylight-loft")
  ) {
    console.log("✓ PASS: Bookmark persisted accurately across refresh/session.\n");
  } else {
    throw new Error(`FAIL: Bookmark persistence check failed.`);
  }

  // Step 5: Test User-Specific Data Isolation
  console.log("--- 5. Testing User-Specific Data Isolation (Alex Vance's Bookmarks) ---");
  const getHostBookmarksRes = await request({
    url: `${API_BASE}/bookmarks`,
    method: "GET",
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  console.log("Alex Vance's Bookmarks:", getHostBookmarksRes.data?.studioIds);
  const alexHasSarahBookmark = getHostBookmarksRes.data?.studioIds?.includes("studio-daylight-loft");
  if (!alexHasSarahBookmark) {
    console.log("✓ PASS: Bookmarks are strictly user-specific (Alex does not see Sarah's bookmarks).\n");
  } else {
    throw new Error("FAIL: Bookmarks leaked between different users.");
  }

  // Step 6: Test Bookmark Remove Operation
  console.log("--- 6. Testing Bookmark Remove Operation ---");
  const removeRes = await request({
    url: `${API_BASE}/bookmarks/studio-daylight-loft`,
    method: "DELETE",
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  console.log(`Remove Bookmark Status: ${removeRes.statusCode}`);
  console.log("Sarah's Updated Bookmarks:", removeRes.data?.studioIds);
  if (
    removeRes.statusCode === 200 &&
    !removeRes.data?.studioIds?.includes("studio-daylight-loft")
  ) {
    console.log("✓ PASS: Bookmark removed cleanly.\n");
  } else {
    throw new Error(`FAIL: Bookmark remove failed.`);
  }

  // Step 7: Regression Tests for All Features
  console.log("--- 7. Running Full Regression Test Suite ---");
  
  // 7a: Title validation regression
  const invalidTitleRes = await request(
    {
      url: `${API_BASE}/studios/studio-daylight-loft`,
      method: "PUT",
      headers: { Authorization: `Bearer ${hostToken}` },
    },
    JSON.stringify({ title: "hnjfjkfbf" })
  );
  if (invalidTitleRes.statusCode === 400) {
    console.log("✓ Regression PASS: Studio title validation intact (rejected 'hnjfjkfbf').");
  } else {
    throw new Error("Regression FAIL: Title validation broken.");
  }

  // 7b: Hourly rate ceiling regression
  const invalidPriceRes = await request(
    {
      url: `${API_BASE}/studios/studio-daylight-loft`,
      method: "PUT",
      headers: { Authorization: `Bearer ${hostToken}` },
    },
    JSON.stringify({ pricePerHour: 125000 })
  );
  if (invalidPriceRes.statusCode === 400) {
    console.log("✓ Regression PASS: Hourly rate ceiling intact (rejected $125,000/hr).");
  } else {
    throw new Error("Regression FAIL: Rate ceiling broken.");
  }

  // 7c: Studio directory fetch
  const allStudiosRes = await request({ url: `${API_BASE}/studios`, method: "GET" });
  if (allStudiosRes.statusCode === 200 && allStudiosRes.data?.studios?.length >= 4) {
    console.log(`✓ Regression PASS: All ${allStudiosRes.data.studios.length} studios accessible.`);
  } else {
    throw new Error("Regression FAIL: Studio directory inaccessible.");
  }

  // 7d: Bookings fetch
  const myBookingsRes = await request({
    url: `${API_BASE}/bookings/my-bookings`,
    method: "GET",
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  if (myBookingsRes.statusCode === 200 && Array.isArray(myBookingsRes.data?.bookings)) {
    console.log(`✓ Regression PASS: User bookings retrieved (${myBookingsRes.data.bookings.length} reservations).`);
  } else {
    throw new Error("Regression FAIL: Bookings fetch failed.");
  }

  console.log("\n==========================================================");
  console.log(" ALL BOOKMARK AND REGRESSION TESTS COMPLETED: 100% PASS");
  console.log("==========================================================");
}

runBookmarkVerification().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
