const fs = require("fs");
const path = require("path");

const storePath = path.resolve(__dirname, "../.data/studiospace-store.json");
const data = JSON.parse(fs.readFileSync(storePath, "utf8"));

console.log("=== USERS ===");
data.users.forEach((u) => console.log(`- ${u.id}: ${u.name} (${u.role})`));

console.log("\n=== STUDIOS ===");
data.studios.forEach((s) => console.log(`- ${s.id}: "${s.title}" | $${s.pricePerHour}/hr | address: ${s.location?.address}`));

console.log("\n=== BOOKINGS ===");
data.bookings.forEach((b) => console.log(`- ${b.id}: studio "${b.studio?.title}" | $${b.studio?.pricePerHour}/hr x ${b.durationHours}h = $${b.totalPrice} | status: ${b.status} | payment: ${b.paymentStatus}`));
