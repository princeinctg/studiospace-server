import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ENV } from "../config/env";
import { User } from "../models/User";
import { Studio } from "../models/Studio";

const demoUsers = [
  {
    name: "Imdatul Hoque",
    email: "host@studiospace.com",
    password: "HostPassword123!",
    role: "host",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    phone: "+1 (555) 328-9921",
    bio: "Commercial director and studio curator based in Brooklyn, NY. Passionate about providing film and photography creators with top-tier gear.",
  },
  {
    name: "Imrita Aksa",
    email: "guest@studiospace.com",
    password: "GuestPassword123!",
    role: "guest",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    phone: "+1 (555) 742-1109",
    bio: "Fashion photographer & podcast creator exploring modern minimalist studio environments.",
  },
];

const demoStudios = [
  {
    title: "The Industrial Daylight Loft",
    slug: "the-industrial-daylight-loft",
    description: "Expansive 2,400 sq.ft loft flooded with north-facing natural daylight through 14-foot factory arched windows. Features original exposed brick walls, matte concrete floors, full blackout curtains, Profoto D2 lighting packs, and an infinity cyclorama wall.",
    category: "photography",
    amenities: ["Natural Daylight", "Infinity Cyc Wall", "Profoto Lighting", "Blackout Curtains", "Hair & Makeup Station", "High-Speed WiFi", "Client Lounge"],
    pricePerHour: 350,
    defaultBookingDuration: 8,
    location: {
      address: "420 DUMBO Waterfront Ave",
      city: "Brooklyn",
      country: "United States",
      postalCode: "11201",
      coordinates: { lat: 40.7033, lng: -73.9881 },
    },
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1200&q=85",
    ],
    rating: 4.96,
    reviewCount: 48,
    capacity: 25,
    squareFeet: 2400,
    isAvailable: true,
    featured: true,
    tags: ["Daylight", "Fashion", "Editorial", "Cyc Wall"],
  },
  {
    title: "Aura Sound & Dolby Atmos Suite",
    slug: "aura-sound-dolby-atmos-suite",
    description: "State-of-the-art acoustically isolated recording and spatial mixing facility. Equipped with SSL Duality delta console, Genelec 7.1.4 Dolby Atmos monitoring, pristine vintage microphone collection (Neumann U87, Telefunken U47), and private vocal isolation booth.",
    category: "recording",
    amenities: ["Dolby Atmos 7.1.4", "SSL Console", "Neumann Mics", "Vocal Booth", "Acoustic Treatment", "Kitchenette", "Private Parking"],
    pricePerHour: 275,
    defaultBookingDuration: 10,
    location: {
      address: "880 Sunset Blvd, Suite 400",
      city: "Los Angeles",
      country: "United States",
      postalCode: "90069",
      coordinates: { lat: 34.0900, lng: -118.3853 },
    },
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85",
    ],
    rating: 4.98,
    reviewCount: 36,
    capacity: 8,
    squareFeet: 1200,
    isAvailable: true,
    featured: true,
    tags: ["Recording", "Music Production", "Dolby Atmos", "SSL"],
  },
  {
    title: "Apex Virtual Film & LED Soundstage",
    slug: "apex-virtual-film-led-soundstage",
    description: "Next-generation 5,000 sq.ft cinematic production soundstage with a 180-degree curved LED volume wall running Unreal Engine 5. Fully soundproofed STC-65 rating, 22-foot lighting grid with motorized trusses, drive-in loading bay, and production control suites.",
    category: "film",
    amenities: ["Unreal Engine LED Wall", "Soundproofed STC-65", "Motorized Lighting Grid", "Drive-in Elephant Door", "Green Room", "Production Offices"],
    pricePerHour: 650,
    defaultBookingDuration: 12,
    location: {
      address: "1420 Film Center Dr",
      city: "Atlanta",
      country: "United States",
      postalCode: "30318",
      coordinates: { lat: 33.7490, lng: -84.3880 },
    },
    images: [
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=85",
    ],
    rating: 4.92,
    reviewCount: 22,
    capacity: 50,
    squareFeet: 5000,
    isAvailable: true,
    featured: true,
    tags: ["Film Stage", "Virtual Production", "Commercial", "Cinema"],
  },
  {
    title: "Velvet Frequency Broadcast Podcast Studio",
    slug: "velvet-frequency-podcast-studio",
    description: "Boutique 4-camera 4K podcast lounge designed for visual dialogue. Features Shure SM7B dynamic mics, Blackmagic Studio 4K cameras with motorized teleprompter, Rodecaster Pro II, custom acoustic walnut slat walls, and warm ambient neon illumination.",
    category: "podcast",
    amenities: ["4K Multi-Cam Switcher", "Shure SM7B Microphones", "Custom Lighting Presets", "Soundproofed", "Live Streaming Rack", "Teleprompter"],
    pricePerHour: 200,
    defaultBookingDuration: 8,
    location: {
      address: "310 West Loop South",
      city: "Chicago",
      country: "United States",
      postalCode: "60607",
      coordinates: { lat: 41.8781, lng: -87.6298 },
    },
    images: [
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=85",
    ],
    rating: 4.95,
    reviewCount: 64,
    capacity: 6,
    squareFeet: 600,
    isAvailable: true,
    featured: true,
    tags: ["Podcast", "Talk Show", "Livestream", "4K Video"],
  },
  {
    title: "The Manhattan Creative Photography Studio",
    slug: "manhattan-creative-photography-studio",
    description: "A premium daylight photography studio featuring professional lighting, versatile backdrops and a spacious creative shooting environment.",
    category: "photography",
    amenities: ["Professional Lighting", "Versatile Backdrops", "Spacious Creative Shooting Environment", "Natural Daylight", "VIP Styling Suite", "Client Lounge"],
    pricePerHour: 400,
    defaultBookingDuration: 8,
    location: {
      address: "Manhattan",
      city: "Manhattan",
      country: "United States",
      postalCode: "10001",
      coordinates: { lat: 40.7512, lng: -74.0028 },
    },
    images: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    ],
    rating: 5.0,
    reviewCount: 28,
    capacity: 20,
    squareFeet: 2000,
    isAvailable: true,
    featured: true,
    tags: ["Photography", "Daylight", "Manhattan", "Creative"],
  },
  {
    title: "Obsidian Mastering & Recording House",
    slug: "obsidian-mastering-recording-house",
    description: "Northward-designed custom-floated mastering and tracking suite equipped with ATC SCM110ASL monitoring and Shadow Hills mastering compressor.",
    category: "recording",
    amenities: ["ATC SCM110 Monitoring", "Analog Mastering Rack", "Shadow Hills Compressor", "Custom Acoustic Float", "Private Lounge"],
    pricePerHour: 380,
    defaultBookingDuration: 8,
    location: {
      address: "2200 NW 2nd Ave",
      city: "Miami",
      country: "United States",
      postalCode: "33127",
      coordinates: { lat: 25.7984, lng: -80.1989 },
    },
    images: [
      "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1520523839898-5071282543e2?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85",
    ],
    rating: 4.9,
    reviewCount: 38,
    capacity: 15,
    squareFeet: 1800,
    isAvailable: true,
    featured: true,
    tags: ["Recording", "Mastering", "Dolby Atmos", "Analog"],
  },
  {
    title: "Infinity Virtual Production Arena",
    slug: "infinity-virtual-production-arena",
    description: "Monumental 6,500 sq.ft stage with 270-degree LED volume wall driven by Unreal Engine 5 nDisplay and drive-in semi loading access.",
    category: "film",
    amenities: ["270-deg LED Volume", "Unreal Engine 5 nDisplay", "OptiTrack Mocap", "Drive-in Loading Bay", "Dual Control Suites"],
    pricePerHour: 850,
    defaultBookingDuration: 12,
    location: {
      address: "3700 S Las Vegas Blvd",
      city: "Las Vegas",
      country: "United States",
      postalCode: "89109",
      coordinates: { lat: 36.1085, lng: -115.1742 },
    },
    images: [
      "https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=85",
    ],
    rating: 5.0,
    reviewCount: 57,
    capacity: 60,
    squareFeet: 6500,
    isAvailable: true,
    featured: true,
    tags: ["Film Production", "Virtual Stage", "Cinema", "LED Volume"],
  },
  {
    title: "The Executive Podcast & Broadcast Lounge",
    slug: "the-executive-podcast-broadcast-lounge",
    description: "Panoramic skyline-view broadcast lounge featuring 5x Sony FX6 cinema cameras, sound-damped walnut slat architecture, and 10Gbps fiber uplink.",
    category: "podcast",
    amenities: ["5x Sony FX6 Cameras", "10Gbps Fiber Uplink", "Sound-Damped Lounge", "Shure SM7B Microphones"],
    pricePerHour: 250,
    defaultBookingDuration: 8,
    location: {
      address: "450 Mission St",
      city: "San Francisco",
      country: "United States",
      postalCode: "94105",
      coordinates: { lat: 37.7901, lng: -122.3995 },
    },
    images: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1606920669741-c8ba74262a94?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1589186161289-9eb8898086df?auto=format&fit=crop&w=1200&q=85",
    ],
    rating: 4.9,
    reviewCount: 45,
    capacity: 10,
    squareFeet: 1100,
    isAvailable: true,
    featured: true,
    tags: ["Podcast", "Broadcast", "Live Streaming", "Executive"],
  },
  {
    title: "Prism Movement & Dance Hall",
    slug: "prism-movement-dance-hall",
    description: "Sunlit 3,000 sq.ft professional movement and rehearsal hall featuring sprung Harlequin maple dance flooring, wall-to-wall 8-foot mirrors, Martin Audio sound system, adjustable ballet barres, and temperature-controlled HVAC.",
    category: "dance",
    amenities: ["Sprung Harlequin Floor", "Wall Mirrors", "Ballet Barres", "Martin Audio Sound", "Changing Rooms", "High Ceilings"],
    pricePerHour: 85,
    location: {
      address: "185 S 2nd St",
      city: "San Francisco",
      country: "United States",
      postalCode: "94105",
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    images: [
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=1200&q=85",
    ],
    rating: 4.89,
    reviewCount: 29,
    capacity: 35,
    squareFeet: 3000,
    isAvailable: true,
    featured: false,
    tags: ["Dance", "Choreography", "Rehearsal", "Audition"],
  },
  {
    title: "Atelier Raw Concrete & Ceramic Arts",
    slug: "atelier-raw-concrete-art-studio",
    description: "Bright artistic workshop with northern skylights, industrial washbasins, ceramic pottery wheels, heavy-duty easels, and expansive resin display tables for visual artists, sculptors, and brand popups.",
    category: "art",
    amenities: ["Skylights", "Pottery Wheels", "Slop Sinks", "Heavy-Duty Easels", "Ventilation", "Display Shelving"],
    pricePerHour: 75,
    location: {
      address: "2100 Wynwood Arts Blvd",
      city: "Miami",
      country: "United States",
      postalCode: "33127",
      coordinates: { lat: 25.7617, lng: -80.1918 },
    },
    images: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85",
    ],
    rating: 4.87,
    reviewCount: 19,
    capacity: 20,
    squareFeet: 1500,
    isAvailable: true,
    featured: false,
    tags: ["Art", "Sculpture", "Painting", "Workshop"],
  },
];

export async function runSeed(): Promise<void> {
  console.log("[Seed] Connecting to MongoDB...");
  await mongoose.connect(ENV.MONGODB_URI);

  console.log("[Seed] Ensuring demo users exist (idempotent)...");
  const createdUsers = [];
  for (const u of demoUsers) {
    let user = await User.findOne({ email: u.email.toLowerCase().trim() });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      user = await User.create({
        ...u,
        email: u.email.toLowerCase().trim(),
        password: hashedPassword,
      });
      console.log(`[Seed] Created User: ${user.name} (${user.email})`);
    } else {
      console.log(`[Seed] User already exists: ${user.name} (${user.email})`);
    }
    createdUsers.push(user);
  }

  const hostUser = createdUsers.find((u) => u.role === "host") || createdUsers[0];

  console.log("[Seed] Ensuring default 8 studios exist (idempotent, preserving user studios)...");
  for (const s of demoStudios) {
    let studio = await Studio.findOne({ slug: s.slug });
    if (!studio) {
      studio = await Studio.create({
        ...s,
        host: hostUser._id,
      });
      console.log(`[Seed] Created Studio: ${studio.title} ($${studio.pricePerHour}/hr)`);
    } else {
      console.log(`[Seed] Studio already exists: ${studio.title}`);
    }
  }

  console.log("[Seed] Idempotent seeding complete!");
  await mongoose.disconnect();
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Seed] Error running seed script:", err);
      process.exit(1);
    });
}
