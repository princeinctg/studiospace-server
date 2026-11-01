const http = require("http");

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(typeof data === "string" ? data : JSON.stringify(data));
    req.end();
  });
}

async function runQA() {
  console.log("=== STARTING AUTOMATED QA TEST SUITE ===");

  // 1. Health check
  const health = await request({ host: "localhost", port: 5000, path: "/health", method: "GET" });
  console.log(`[TEST 1] Server Health: HTTP ${health.status}`, health.data.status === "ok" ? "PASS" : "FAIL");

  // 2. Login Host
  const login = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "host@studiospace.com", password: "HostPassword123!" }
  );
  console.log(`[TEST 2] Host Login: HTTP ${login.status}`, login.data.token ? "PASS" : "FAIL");
  const token = login.data.token;

  // 3. Security: Unauthorized access without token
  const unauth = await request({ host: "localhost", port: 5000, path: "/api/auth/me", method: "GET" });
  console.log(`[TEST 3] Security Auth Guard: HTTP ${unauth.status} (Expected 401)`, unauth.status === 401 ? "PASS" : "FAIL");

  // 4. Session Verification with Bearer token
  const me = await request({
    host: "localhost",
    port: 5000,
    path: "/api/auth/me",
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`[TEST 4] Session Verification: HTTP ${me.status}`, me.data?.user?.email === "host@studiospace.com" ? "PASS" : "FAIL");

  // 5. Featured Studios query
  const featured = await request({ host: "localhost", port: 5000, path: "/api/studios/featured", method: "GET" });
  console.log(`[TEST 5] Featured Studios: HTTP ${featured.status} (${featured.data?.studios?.length} returned)`, featured.status === 200 ? "PASS" : "FAIL");

  // 6. Category filtering query
  const filtered = await request({ host: "localhost", port: 5000, path: "/api/studios?category=recording", method: "GET" });
  console.log(`[TEST 6] Filtered Studios: HTTP ${filtered.status} (${filtered.data?.studios?.length} returned)`, filtered.status === 200 ? "PASS" : "FAIL");

  // 7. Single Studio Detail
  const detail = await request({ host: "localhost", port: 5000, path: "/api/studios/the-industrial-daylight-loft", method: "GET" });
  console.log(`[TEST 7] Studio Detail Lookup: HTTP ${detail.status} ("${detail.data?.studio?.title}")`, detail.status === 200 ? "PASS" : "FAIL");
  const targetStudioId = detail.data?.studio?.id || detail.data?.studio?._id;

  // 8. Create Valid Booking
  const bookingDate = new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0];
  const bkg1 = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/bookings",
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    },
    {
      studioId: targetStudioId,
      date: bookingDate,
      startTime: "11:00",
      endTime: "15:00",
      guestCount: 3,
      notes: "Commercial fashion shoot",
    }
  );
  console.log(`[TEST 8] Booking Creation: HTTP ${bkg1.status}`, bkg1.status === 201 ? "PASS" : "FAIL");
  const bookingId = bkg1.data?.booking?.id || bkg1.data?.booking?._id;

  // 9. MANDATORY DOUBLE-BOOKING CONFLICT PREVENTION TEST
  // Attempt to book overlapping time slot (12:00 - 16:00 overlaps with 11:00 - 15:00) on same studio & date
  const bkgConflict = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/bookings",
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    },
    {
      studioId: targetStudioId,
      date: bookingDate,
      startTime: "12:00",
      endTime: "16:00",
      guestCount: 2,
    }
  );
  console.log(
    `[TEST 9] Double-Booking Prevention: HTTP ${bkgConflict.status} (Expected 409 Conflict)`,
    bkgConflict.status === 409 ? "PASS" : "FAIL"
  );
  if (bkgConflict.status === 409) {
    console.log("       Conflict Message:", bkgConflict.data?.error);
  }

  // 10. Update / Cancel Booking Status
  if (bookingId) {
    const cancelRes = await request(
      {
        host: "localhost",
        port: 5000,
        path: `/api/bookings/${bookingId}/status`,
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      },
      {
        status: "cancelled",
        cancellationReason: "Automated QA verification test",
      }
    );
    console.log(`[TEST 10] Booking Cancellation: HTTP ${cancelRes.status}`, cancelRes.status === 200 ? "PASS" : "FAIL");
  }

  // 11. Create New Studio Listing (Host operation)
  const newStudioRes = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/studios",
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    },
    {
      title: "QA Automated Test Loft",
      description: "Automated testing loft with verified cyclorama and strobe packs for QA.",
      category: "photography",
      amenities: ["Natural Daylight", "Infinity Cyc Wall"],
      pricePerHour: 140,
      capacity: 15,
      squareFeet: 1600,
      location: { address: "100 QA Test Way", city: "Brooklyn", country: "United States" },
      images: ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80"],
    }
  );
  console.log(`[TEST 11] Create Studio Listing: HTTP ${newStudioRes.status}`, newStudioRes.status === 201 ? "PASS" : "FAIL");
  const createdStudioId = newStudioRes.data?.studio?.id || newStudioRes.data?.studio?._id;

  // 12. Delete Studio Listing (Host operation)
  if (createdStudioId) {
    const delRes = await request({
      host: "localhost",
      port: 5000,
      path: `/api/studios/${createdStudioId}`,
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`[TEST 12] Delete Studio Listing: HTTP ${delRes.status}`, delRes.status === 200 ? "PASS" : "FAIL");
  }

  console.log("=== ALL AUTOMATED QA TESTS COMPLETED ===");
}

runQA().catch((err) => {
  console.error("QA Runner Error:", err);
  process.exit(1);
});
