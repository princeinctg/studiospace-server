const fs = require("fs");
const path = require("path");

const storePath = path.resolve(__dirname, "../.data/studiospace-store.json");
const data = JSON.parse(fs.readFileSync(storePath, "utf8"));

const initialHost = data.users.find((u) => u.id === "host-alex-vance") || data.users[0];

const standardStudios = [
  {
    id: "studio-daylight-loft",
    _id: "studio-daylight-loft",
    title: "The Industrial Daylight Loft",
    slug: "the-industrial-daylight-loft",
    description: "Expansive 2,400 sq.ft loft flooded with north-facing natural daylight through 14-foot factory arched windows. Features original exposed brick walls, matte concrete floors, and infinity cyclorama.",
    category: "photography",
    amenities: ["Natural Daylight", "Infinity Cyc Wall", "Profoto Lighting", "Blackout Curtains", "Hair & Makeup Station", "High-Speed WiFi", "Client Lounge"],
    pricePerHour: 125,
    location: {
      address: "420 DUMBO Waterfront Ave",
      city: "Brooklyn",
      country: "United States",
      postalCode: "11201",
    },
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1200&q=85",
    ],
    host: initialHost,
    rating: 4.96,
    reviewCount: 48,
    capacity: 25,
    squareFeet: 2400,
    isAvailable: true,
    featured: true,
    tags: ["Daylight", "Fashion", "Editorial"],
    rules: ["No smoking inside the studio", "Overtime billed at 1.5x regular hourly rate"],
    createdAt: "2026-11-01T07:09:54.172Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "studio-aura-sound",
    _id: "studio-aura-sound",
    title: "Aura Sound & Dolby Atmos Suite",
    slug: "aura-sound-dolby-atmos-suite",
    description: "State-of-the-art acoustically isolated recording facility with SSL Duality delta console, Genelec 7.1.4 Dolby Atmos monitoring, and vintage microphone collection.",
    category: "recording",
    amenities: ["Dolby Atmos 7.1.4", "SSL Console", "Neumann Mics", "Vocal Booth", "Acoustic Treatment", "Kitchenette"],
    pricePerHour: 160,
    location: {
      address: "880 Sunset Blvd, Suite 400",
      city: "Los Angeles",
      country: "United States",
      postalCode: "90069",
    },
    images: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85",
    ],
    host: initialHost,
    rating: 4.98,
    reviewCount: 36,
    capacity: 8,
    squareFeet: 1200,
    isAvailable: true,
    featured: true,
    tags: ["Recording", "Music Production", "Dolby Atmos"],
    rules: ["No food near consoles"],
    createdAt: "2026-11-01T07:09:54.172Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "studio-chroma-stage",
    _id: "studio-chroma-stage",
    title: "Chroma Cinema Stage & Virtual Production",
    slug: "chroma-cinema-stage-virtual-production",
    description: "Full-service soundstage featuring a 40ft curved green screen, ceiling lighting grid with DMX control, and 3-phase 400A Cam-Lok power.",
    category: "film",
    amenities: ["Curved Green Screen", "DMX Lighting Grid", "400A Cam-Lok Power", "Drive-in Elephant Door", "Hair & Makeup Rooms"],
    pricePerHour: 250,
    location: {
      address: "1200 S Flower St",
      city: "Los Angeles",
      country: "United States",
      postalCode: "90015",
    },
    images: [
      "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=85",
    ],
    host: initialHost,
    rating: 4.92,
    reviewCount: 29,
    capacity: 50,
    squareFeet: 4500,
    isAvailable: true,
    featured: true,
    tags: ["Soundstage", "Virtual Production", "Commercials"],
    rules: ["Certified rigger required for overhead grid adjustments"],
    createdAt: "2026-11-01T07:09:54.172Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "studio-pod-lounge",
    _id: "studio-pod-lounge",
    title: "Apex Broadcast & Podcast Studio",
    slug: "apex-broadcast-podcast-studio",
    description: "Bespoke broadcast lounge for video podcasts and live streams. Equipped with 4x Shure SM7B microphones, Sony FX3 cinema cameras, and acoustic timber paneling.",
    category: "podcast",
    amenities: ["Shure SM7B (x4)", "Sony FX3 4K (x3)", "Blackmagic ATEM Mini", "Acoustic Paneling", "Custom LED Lighting"],
    pricePerHour: 95,
    location: {
      address: "310 West Loop South",
      city: "Chicago",
      country: "United States",
      postalCode: "60607",
    },
    images: [
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=1200&q=85",
    ],
    host: initialHost,
    rating: 4.95,
    reviewCount: 64,
    capacity: 6,
    squareFeet: 600,
    isAvailable: true,
    featured: true,
    tags: ["Podcast", "Talk Show", "Livestream"],
    rules: ["No open liquids on podcast desk"],
    createdAt: "2026-11-01T07:09:54.172Z",
    updatedAt: new Date().toISOString(),
  },
];

data.studios = standardStudios;

// Reconcile and clean up identified test records
const cleanedBookings = [];
for (const b of data.bookings) {
  // If it's the test record with the $500,000 corrupted rate and "hnjfjkfjbf" title:
  if (b.id === "bkg_mvxj94xszxzg") {
    console.log(`[Reconcile] Identified test record ${b.id} with title "hnjfjkfjbf" and $500,000 totalPrice. Cleaning up to legitimate restored studio rate.`);
    b.studio = standardStudios[0]; // The Industrial Daylight Loft ($125/hr)
    b.totalPrice = Math.round(b.durationHours * standardStudios[0].pricePerHour); // 4 * 125 = 500
    cleanedBookings.push(b);
  } else if (b.id === "bkg_mvxjead3ef9r") {
    console.log(`[Reconcile] Identified redundant test record ${b.id} created during title mutation test. Cleaning up.`);
    // Omit duplicate test record
  } else {
    // Keep legitimate record completely unchanged
    cleanedBookings.push(b);
  }
}

data.bookings = cleanedBookings;

fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf8");
console.log("[Reconcile] DataStore successfully reconciled and verified.");
