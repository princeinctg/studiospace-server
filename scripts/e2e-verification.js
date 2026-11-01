const http = require("http");
const fs = require("fs");
const path = require("path");

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

async function runVerification() {
  console.log("==========================================================");
  console.log(" STUDIOSPACE ROOT-CAUSE VERIFICATION & QA REPORT");
  console.log("==========================================================\n");

  // Step 1: Login as Host Alex Vance to test Studio Validation
  console.log("--- 1. Authenticating as Host (Alex Vance) ---");
  const hostLogin = await request(
    { url: `${API_BASE}/auth/login`, method: "POST" },
    JSON.stringify({ email: "host@studiospace.com", password: "HostPassword123!" })
  );
  if (hostLogin.statusCode !== 200 || !hostLogin.data?.token) {
    throw new Error(`Host login failed: ${JSON.stringify(hostLogin.data)}`);
  }
  const hostToken = hostLogin.data.token;
  console.log("✓ Host authenticated successfully. Token received.\n");

  // Step 2: Test Meaningless Title Validation ("hnjfjkfbf")
  console.log("--- 2. Testing Studio Title Validation against Gibberish ---");
  const invalidTitlePayload = {
    title: "hnjfjkfbf",
    description: "A large industrial loft with daylight and cyc wall setup.",
    category: "photography",
    pricePerHour: 125,
  };
  const testTitleRes = await request(
    {
      url: `${API_BASE}/studios/studio-daylight-loft`,
      method: "PUT",
      headers: { Authorization: `Bearer ${hostToken}` },
    },
    JSON.stringify(invalidTitlePayload)
  );
  console.log(`Server HTTP Status for title "hnjfjkfbf": ${testTitleRes.statusCode}`);
  console.log(`Server Error Response:`, testTitleRes.data);
  if (testTitleRes.statusCode === 400) {
    console.log("✓ PASS: Server strictly rejected meaningless title 'hnjfjkfbf'.\n");
  } else {
    throw new Error(`FAIL: Server did not reject invalid title. Status: ${testTitleRes.statusCode}`);
  }

  // Step 3: Test Hourly Rate Bounds Validation ($125,000)
  console.log("--- 3. Testing Studio Hourly Rate Ceiling ($125,000 vs Max $5,000) ---");
  const excessivePricePayload = {
    title: "The Industrial Daylight Loft",
    pricePerHour: 125000,
  };
  const testPriceRes = await request(
    {
      url: `${API_BASE}/studios/studio-daylight-loft`,
      method: "PUT",
      headers: { Authorization: `Bearer ${hostToken}` },
    },
    JSON.stringify(excessivePricePayload)
  );
  console.log(`Server HTTP Status for rate $125,000: ${testPriceRes.statusCode}`);
  console.log(`Server Error Response:`, testPriceRes.data);
  if (testPriceRes.statusCode === 400) {
    console.log("✓ PASS: Server strictly rejected excessive price $125,000/hr.\n");
  } else {
    throw new Error(`FAIL: Server did not reject invalid price. Status: ${testPriceRes.statusCode}`);
  }

  // Step 4: Login as Guest Sarah Jenkins
  console.log("--- 4. Authenticating as Guest (Sarah Jenkins) ---");
  const guestLogin = await request(
    { url: `${API_BASE}/auth/login`, method: "POST" },
    JSON.stringify({ email: "guest@studiospace.com", password: "GuestPassword123!" })
  );
  if (guestLogin.statusCode !== 200 || !guestLogin.data?.token) {
    throw new Error(`Guest login failed: ${JSON.stringify(guestLogin.data)}`);
  }
  const guestToken = guestLogin.data.token;
  console.log("✓ Guest authenticated successfully. Token received.\n");

  // Step 5: Test End-to-End Booking Creation & Calculation
  console.log("--- 5. Creating New Confirmed Studio Booking ---");
  const newBookingPayload = {
    studioId: "studio-daylight-loft",
    date: "2026-11-20",
    startTime: "10:00",
    endTime: "14:00", // 4 hours
    guestCount: 4,
    notes: "Verified production booking for QA verification",
  };
  const createBookingRes = await request(
    {
      url: `${API_BASE}/bookings`,
      method: "POST",
      headers: { Authorization: `Bearer ${guestToken}` },
    },
    JSON.stringify(newBookingPayload)
  );
  console.log(`Booking Creation Status: ${createBookingRes.statusCode}`);
  const createdBooking = createBookingRes.data.booking;
  console.log(`Created Booking ID: ${createdBooking?.id || createdBooking?._id}`);
  console.log(`Duration: ${createdBooking?.durationHours} hrs`);
  console.log(`Total Price: $${createdBooking?.totalPrice} ($${createdBooking?.studio?.pricePerHour}/hr x ${createdBooking?.durationHours}h)`);
  console.log(`Booking Status: ${createdBooking?.status}`);
  console.log(`Payment Status: ${createdBooking?.paymentStatus}`);

  if (createdBooking?.totalPrice === 500 && createdBooking?.durationHours === 4) {
    console.log("✓ PASS: Rate calculation mathematically exact ($125/hr x 4 hrs = $500).\n");
  } else {
    throw new Error(`FAIL: Unexpected booking calculation: ${JSON.stringify(createdBooking)}`);
  }

  // Step 6: Test End-to-End Booking Cancellation
  console.log("--- 6. Testing End-to-End Booking Cancellation ---");
  const bookingId = createdBooking.id || createdBooking._id;
  const cancelRes = await request(
    {
      url: `${API_BASE}/bookings/${bookingId}/status`,
      method: "PATCH",
      headers: { Authorization: `Bearer ${guestToken}` },
    },
    JSON.stringify({
      status: "cancelled",
      cancellationReason: "Cancelled via verified confirmation modal flow",
    })
  );
  console.log(`Cancel Request Status: ${cancelRes.statusCode}`);
  console.log(`Updated Booking Status: ${cancelRes.data?.booking?.status}`);
  console.log(`Payment Status remains: ${cancelRes.data?.booking?.paymentStatus}`);

  if (cancelRes.statusCode === 200 && cancelRes.data?.booking?.status === "cancelled") {
    console.log("✓ PASS: Booking status transitioned to 'cancelled' in database.\n");
  } else {
    throw new Error(`FAIL: Booking cancel failed: ${JSON.stringify(cancelRes.data)}`);
  }

  // Step 7: Persistence Verification across page refresh
  console.log("--- 7. Verifying Persistence upon Refresh (GET /bookings/my-bookings) ---");
  const myBookingsRes = await request({
    url: `${API_BASE}/bookings/my-bookings`,
    method: "GET",
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  const myBookings = myBookingsRes.data.bookings || [];
  const refreshedBooking = myBookings.find((b) => (b.id === bookingId || b._id === bookingId));
  console.log(`Refreshed Booking from Database:`);
  console.log(`- ID: ${refreshedBooking?.id || refreshedBooking?._id}`);
  console.log(`- Studio: "${refreshedBooking?.studio?.title}"`);
  console.log(`- Status: "${refreshedBooking?.status}" (Persisted)`);
  console.log(`- Payment Status: "${refreshedBooking?.paymentStatus}" (Accurate, not invented)`);
  console.log(`- Can Cancel Action Allowed: ${refreshedBooking?.status !== "cancelled" && refreshedBooking?.status !== "completed" ? "YES" : "NO (Hidden)"}`);

  if (refreshedBooking?.status === "cancelled") {
    console.log("✓ PASS: Cancellation status persisted accurately across refresh.\n");
  } else {
    throw new Error(`FAIL: Booking status did not persist.`);
  }

  // Step 8: Database Record Audit
  console.log("--- 8. Complete Database Store JSON Audit ---");
  const storePath = path.resolve(__dirname, "../.data/studiospace-store.json");
  const diskData = JSON.parse(fs.readFileSync(storePath, "utf8"));

  console.log(`Total Studios in DB: ${diskData.studios.length}`);
  diskData.studios.forEach((s) => {
    console.log(`  Studio [${s.id}]: "${s.title}" | $${s.pricePerHour}/hr | Category: ${s.category}`);
  });

  console.log(`\nTotal Bookings in DB: ${diskData.bookings.length}`);
  diskData.bookings.forEach((b, idx) => {
    console.log(`  Booking #${idx + 1} [${b.id}]:`);
    console.log(`    Studio: "${b.studio?.title}"`);
    console.log(`    Rate: $${b.studio?.pricePerHour}/hr | Duration: ${b.durationHours} hrs | Total: $${b.totalPrice}`);
    console.log(`    Booking Status: "${b.status}" | Payment Status: "${b.paymentStatus}"`);
    console.log(`    Cancellation Reason: "${b.cancellationReason || 'N/A'}"`);
  });

  console.log("\n==========================================================");
  console.log(" ALL 5 ROOT-CAUSE CRITERIA VERIFIED AND PASSED");
  console.log("==========================================================");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
