const http = require("http");

const API = "http://localhost:5000/api";
const CLIENT = "http://localhost:3000";

function req(options, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(options.url || options);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    if (body) {
      opts.headers["Content-Type"] = "application/json";
      opts.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const request = http.request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        let data = null;
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
        });
      });
    });

    request.on("error", reject);
    if (body) request.write(body);
    request.end();
  });
}

const testResults = [];

function record(name, category, passed, details = "") {
  testResults.push({ name, category, passed, details });
  const symbol = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${symbol}] [${category}] ${name}${details ? ` -> ${details}` : ""}`);
}

async function runMasterTestSuite() {
  console.log("==========================================================");
  console.log("  STUDIOSPACE MASTER ASSIGNMENT VERIFICATION SUITE");
  console.log("==========================================================\n");

  // SECTION 1: AUTHENTICATION & SECURITY
  console.log("--- 1. Authentication & Security ---");
  const rand = Date.now().toString(36);

  // 1a: Registration
  const regRes = await req(
    { url: `${API}/auth/register`, method: "POST" },
    JSON.stringify({
      name: "Marcus Aurelius",
      email: `marcus_${rand}@studiospace.com`,
      password: "ImperialPassword123!",
      role: "guest",
    })
  );
  record("User Registration (POST /api/auth/register)", "Auth", regRes.statusCode === 201 && regRes.data?.token);

  // 1b: Login Success
  const loginRes = await req(
    { url: `${API}/auth/login`, method: "POST" },
    JSON.stringify({
      email: `marcus_${rand}@studiospace.com`,
      password: "ImperialPassword123!",
    })
  );
  const marcusToken = loginRes.data?.token;
  record("User Login (POST /api/auth/login)", "Auth", loginRes.statusCode === 200 && !!marcusToken);

  // 1c: Login Failure with invalid password
  const badLoginRes = await req(
    { url: `${API}/auth/login`, method: "POST" },
    JSON.stringify({
      email: `marcus_${rand}@studiospace.com`,
      password: "WrongPassword!",
    })
  );
  record("Unauthorized Rejection on Bad Password", "Auth", badLoginRes.statusCode === 401);

  // 1d: Token Verification (/api/auth/me)
  const meRes = await req({
    url: `${API}/auth/me`,
    method: "GET",
    headers: { Authorization: `Bearer ${marcusToken}` },
  });
  record("Session Identity Verification (GET /api/auth/me)", "Auth", meRes.statusCode === 200 && meRes.data?.user?.email === `marcus_${rand}@studiospace.com`);

  // 1e: Unauthenticated Protection
  const unauthRes = await req({ url: `${API}/auth/me`, method: "GET" });
  record("Unauthenticated Route Protection (401)", "Security", unauthRes.statusCode === 401);

  // 1f: Host Alex Vance Login
  const hostLogin = await req(
    { url: `${API}/auth/login`, method: "POST" },
    JSON.stringify({ email: "host@studiospace.com", password: "HostPassword123!" })
  );
  const hostToken = hostLogin.data?.token;
  record("Host Alex Vance Authentication", "Auth", hostLogin.statusCode === 200 && !!hostToken);

  // 1g: Guest Sarah Jenkins Login
  const guestLogin = await req(
    { url: `${API}/auth/login`, method: "POST" },
    JSON.stringify({ email: "guest@studiospace.com", password: "GuestPassword123!" })
  );
  const guestToken = guestLogin.data?.token;
  record("Guest Sarah Jenkins Authentication", "Auth", guestLogin.statusCode === 200 && !!guestToken);

  // SECTION 2: STUDIO EXPLORATION & FILTERS
  console.log("\n--- 2. Studio Exploration & Filtering ---");

  // 2a: All studios directory
  const allStudiosRes = await req({ url: `${API}/studios`, method: "GET" });
  record("Studio Directory (GET /api/studios)", "Explore", allStudiosRes.statusCode === 200 && allStudiosRes.data?.studios?.length >= 4);

  // 2b: Featured studios
  const featRes = await req({ url: `${API}/studios/featured`, method: "GET" });
  record("Featured Studios (GET /api/studios/featured)", "Explore", featRes.statusCode === 200 && featRes.data?.studios?.length >= 3);

  // 2c: Category filtering
  const catRes = await req({ url: `${API}/studios?category=photography`, method: "GET" });
  const allPhoto = catRes.data?.studios?.every((s) => s.category === "photography");
  record("Category Filtering (?category=photography)", "Explore", catRes.statusCode === 200 && allPhoto && catRes.data?.studios?.length > 0);

  // 2d: Price range filtering
  const priceRes = await req({ url: `${API}/studios?minPrice=100&maxPrice=150`, method: "GET" });
  const validRange = priceRes.data?.studios?.every((s) => s.pricePerHour >= 100 && s.pricePerHour <= 150);
  record("Price Range Filtering (?minPrice=100&maxPrice=150)", "Explore", priceRes.statusCode === 200 && validRange);

  // 2e: Keyword search
  const searchRes = await req({ url: `${API}/studios?search=Daylight`, method: "GET" });
  record("Search Query (?search=Daylight)", "Explore", searchRes.statusCode === 200 && searchRes.data?.studios?.some((s) => s.title.includes("Daylight")));

  // 2f: Single studio detail
  const detailRes = await req({ url: `${API}/studios/studio-daylight-loft`, method: "GET" });
  record("Studio Details by ID (GET /api/studios/:id)", "Explore", detailRes.statusCode === 200 && detailRes.data?.studio?.title === "The Industrial Daylight Loft");

  // 2g: Studio 404
  const studio404Res = await req({ url: `${API}/studios/non-existent-studio-xyz`, method: "GET" });
  record("Studio Not Found Rejection (404)", "Explore", studio404Res.statusCode === 404);

  // SECTION 3: STUDIO CRUD & VALIDATION
  console.log("\n--- 3. Studio CRUD & Validation Constraints ---");

  // 3a: Meaningless Title Validation ("hnjfjkfbf")
  const badTitleRes = await req(
    {
      url: `${API}/studios/studio-daylight-loft`,
      method: "PUT",
      headers: { Authorization: `Bearer ${hostToken}` },
    },
    JSON.stringify({ title: "hnjfjkfbf" })
  );
  record("Meaningless Title Rejection ('hnjfjkfbf' -> 400)", "Validation", badTitleRes.statusCode === 400);

  // 3b: Hourly Rate Ceiling ($125,000)
  const badRateRes = await req(
    {
      url: `${API}/studios/studio-daylight-loft`,
      method: "PUT",
      headers: { Authorization: `Bearer ${hostToken}` },
    },
    JSON.stringify({ pricePerHour: 125000 })
  );
  record("Hourly Rate Ceiling Rejection ($125,000 -> 400)", "Validation", badRateRes.statusCode === 400);

  // 3c: Host Creates Studio
  const createStudioRes = await req(
    {
      url: `${API}/studios`,
      method: "POST",
      headers: { Authorization: `Bearer ${hostToken}` },
    },
    JSON.stringify({
      title: "Hudson River Daylight Atelier",
      description: "State-of-the-art studio featuring riverfront daylight, 16ft acoustic ceilings, and motorized grid.",
      category: "photography",
      amenities: ["Natural Daylight", "Motorized Grid", "Client Lounge"],
      pricePerHour: 175,
      location: {
        address: "750 11th Ave, 5th Floor",
        city: "New York",
        country: "United States",
      },
      images: [
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85",
      ],
      capacity: 20,
      squareFeet: 2100,
    })
  );
  const createdStudioId = createStudioRes.data?.studio?.id || createStudioRes.data?.studio?._id;
  record("Studio Creation (POST /api/studios)", "CRUD", createStudioRes.statusCode === 201 && !!createdStudioId);

  // 3d: Non-Owner Forbidden on Edit
  const nonOwnerEditRes = await req(
    {
      url: `${API}/studios/${createdStudioId}`,
      method: "PUT",
      headers: { Authorization: `Bearer ${guestToken}` },
    },
    JSON.stringify({ title: "Unauthorized Title Change Attempt" })
  );
  record("Studio Ownership Authorization (Guest cannot edit Host studio -> 403)", "Security", nonOwnerEditRes.statusCode === 403);

  // 3e: Host Updates Own Studio
  const ownerEditRes = await req(
    {
      url: `${API}/studios/${createdStudioId}`,
      method: "PUT",
      headers: { Authorization: `Bearer ${hostToken}` },
    },
    JSON.stringify({ pricePerHour: 185 })
  );
  record("Host Successfully Updates Studio (PUT /api/studios/:id)", "CRUD", ownerEditRes.statusCode === 200 && ownerEditRes.data?.studio?.pricePerHour === 185);

  // 3f: Host Deletes Own Studio
  const deleteStudioRes = await req({
    url: `${API}/studios/${createdStudioId}`,
    method: "DELETE",
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  record("Host Deletes Studio (DELETE /api/studios/:id)", "CRUD", deleteStudioRes.statusCode === 200);

  // SECTION 4: BOOKING ENGINE & DOUBLE-BOOKING CONFLICT PREVENTION
  console.log("\n--- 4. Booking Engine & Conflict Prevention ---");

  const targetDate = new Date(Date.now() + 86400000 * (20 + Math.floor(Math.random() * 100)))
    .toISOString()
    .split("T")[0];

  // 4a: Create First Booking
  const bkg1Res = await req(
    {
      url: `${API}/bookings`,
      method: "POST",
      headers: { Authorization: `Bearer ${guestToken}` },
    },
    JSON.stringify({
      studioId: "studio-daylight-loft",
      date: targetDate,
      startTime: "10:00",
      endTime: "14:00",
      guestCount: 3,
      notes: "Editorial campaign",
    })
  );
  const bkg1 = bkg1Res.data?.booking;
  const bkg1Id = bkg1?.id || bkg1?._id;
  record(
    "Booking Creation with Exact Math ($125 x 4h = $500)",
    "Booking",
    bkg1Res.statusCode === 201 && bkg1?.totalPrice === 500 && bkg1?.durationHours === 4
  );

  // 4b: Double-Booking Conflict Rejection (11:00 to 13:00 overlaps 10:00 to 14:00)
  const conflictRes = await req(
    {
      url: `${API}/bookings`,
      method: "POST",
      headers: { Authorization: `Bearer ${guestToken}` },
    },
    JSON.stringify({
      studioId: "studio-daylight-loft",
      date: targetDate,
      startTime: "11:00",
      endTime: "13:00",
      guestCount: 2,
    })
  );
  record(
    "Double-Booking Prevention (Overlapping slot rejected with 409 Conflict)",
    "Booking",
    conflictRes.statusCode === 409 && conflictRes.data?.error?.includes("Double-booking conflict")
  );

  // 4c: Non-Overlapping Slot Allowed (15:00 to 18:00)
  const nonOverlapRes = await req(
    {
      url: `${API}/bookings`,
      method: "POST",
      headers: { Authorization: `Bearer ${guestToken}` },
    },
    JSON.stringify({
      studioId: "studio-daylight-loft",
      date: targetDate,
      startTime: "15:00",
      endTime: "18:00",
      guestCount: 2,
    })
  );
  record("Non-Overlapping Slot Allowed (15:00 - 18:00)", "Booking", nonOverlapRes.statusCode === 201);

  // 4d: Cancel Booking
  const cancelRes = await req(
    {
      url: `${API}/bookings/${bkg1Id}/status`,
      method: "PATCH",
      headers: { Authorization: `Bearer ${guestToken}` },
    },
    JSON.stringify({
      status: "cancelled",
      cancellationReason: "Automated full-suite cancellation test",
    })
  );
  record("Booking Cancellation (PATCH /api/bookings/:id/status)", "Booking", cancelRes.statusCode === 200 && cancelRes.data?.booking?.status === "cancelled");

  // 4e: Booking Persistence & Accurate Separate Payment Status
  const myBkgRes = await req({
    url: `${API}/bookings/my-bookings`,
    method: "GET",
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  const foundBkg = myBkgRes.data?.bookings?.find((b) => b.id === bkg1Id || b._id === bkg1Id);
  record(
    "Booking Status Persistence Across Refresh (Status=cancelled, Payment=paid)",
    "Booking",
    foundBkg?.status === "cancelled" && foundBkg?.paymentStatus === "paid"
  );

  // SECTION 5: BOOKMARK / WISHLIST SYSTEM
  console.log("\n--- 5. Bookmark / Wishlist System ---");

  // 5a: Add Bookmark
  const bmAdd = await req({
    url: `${API}/bookmarks/studio-chroma-stage`,
    method: "POST",
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  record("Add Studio Bookmark (POST /api/bookmarks/:id)", "Bookmark", bmAdd.statusCode === 200 && bmAdd.data?.studioIds?.includes("studio-chroma-stage"));

  // 5b: Refresh Persistence
  const bmGet = await req({
    url: `${API}/bookmarks`,
    method: "GET",
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  record("Bookmark Refresh Persistence (GET /api/bookmarks)", "Bookmark", bmGet.statusCode === 200 && bmGet.data?.studioIds?.includes("studio-chroma-stage"));

  // 5c: User Data Isolation
  const hostBmGet = await req({
    url: `${API}/bookmarks`,
    method: "GET",
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  const isolated = !hostBmGet.data?.studioIds?.includes("studio-chroma-stage");
  record("User-Specific Bookmark Isolation (Host does not inherit Guest bookmarks)", "Bookmark", hostBmGet.statusCode === 200 && isolated);

  // 5d: Remove Bookmark
  const bmRem = await req({
    url: `${API}/bookmarks/studio-chroma-stage`,
    method: "DELETE",
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  record("Remove Studio Bookmark (DELETE /api/bookmarks/:id)", "Bookmark", bmRem.statusCode === 200 && !bmRem.data?.studioIds?.includes("studio-chroma-stage"));

  // SECTION 6: CLIENT FRONTEND ROUTES
  console.log("\n--- 6. Client Frontend Route Verification ---");

  const routes = [
    { path: "/", name: "Homepage" },
    { path: "/explore", name: "Explore Studios" },
    { path: "/studio/the-industrial-daylight-loft", name: "Studio Details Page" },
    { path: "/dashboard", name: "Dashboard Overview" },
    { path: "/dashboard/my-bookings", name: "My Bookings Portal" },
    { path: "/dashboard/my-listings", name: "My Listings Portal" },
    { path: "/studio/add", name: "Add Studio Form" },
    { path: "/login", name: "Login Page" },
    { path: "/register", name: "Registration Page" },
    { path: "/invalid-route-for-404-check", name: "Custom 404 Route" },
  ];

  for (const r of routes) {
    const pageRes = await req({ url: `${CLIENT}${r.path}`, method: "GET" });
    const is404Expected = r.path.includes("404");
    const ok = is404Expected ? pageRes.statusCode === 404 : pageRes.statusCode === 200;
    record(`Frontend Route: ${r.name} (${r.path})`, "Frontend", ok, `HTTP ${pageRes.statusCode}`);
  }

  // SUMMARY
  console.log("\n==========================================================");
  const total = testResults.length;
  const passed = testResults.filter((t) => t.passed).length;
  const failed = testResults.filter((t) => !t.passed).length;

  console.log(` TOTAL TESTS: ${total}`);
  console.log(` PASSED:      ${passed}`);
  console.log(` FAILED:      ${failed}`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
