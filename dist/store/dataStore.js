"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DATA_DIR = process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path_1.default.join(os_1.default.tmpdir(), "studiospace-data")
    : path_1.default.join(process.cwd(), ".data");
const STORE_PATH = path_1.default.join(DATA_DIR, "studiospace-store.json");
class DataStore {
    db = { users: [], studios: [], bookings: [] };
    initialized = false;
    constructor() {
        this.init();
    }
    init() {
        if (this.initialized)
            return;
        try {
            if (!fs_1.default.existsSync(DATA_DIR)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
            }
        }
        catch (e) {
            console.warn("[DataStore] Warning: Could not create DATA_DIR, using memory-store:", e);
        }
        // Seed initial demo data
        const hostHash = bcryptjs_1.default.hashSync("HostPassword123!", 10);
        const guestHash = bcryptjs_1.default.hashSync("GuestPassword123!", 10);
        const initialHost = {
            id: "host-alex-vance",
            _id: "host-alex-vance",
            name: "Alex Vance (Host)",
            email: "host@studiospace.com",
            password: hostHash,
            role: "host",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
            phone: "+1 (555) 328-9921",
            bio: "Commercial director and studio curator based in Brooklyn, NY.",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const initialGuest = {
            id: "guest-sarah-jenkins",
            _id: "guest-sarah-jenkins",
            name: "Sarah Jenkins (Examiner / Guest)",
            email: "guest@studiospace.com",
            password: guestHash,
            role: "guest",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
            phone: "+1 (555) 742-1109",
            bio: "Fashion photographer & podcast creator exploring modern minimalist studio environments.",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const initialStudios = [
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
                createdAt: new Date().toISOString(),
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: "studio-apex-film",
                _id: "studio-apex-film",
                title: "Apex Virtual Film & LED Soundstage",
                slug: "apex-virtual-film-led-soundstage",
                description: "5,000 sq.ft cinematic production soundstage with a 180-degree curved LED volume wall running Unreal Engine 5. Fully soundproofed STC-65 rating.",
                category: "film",
                amenities: ["Unreal Engine LED Wall", "Soundproofed STC-65", "Motorized Lighting Grid", "Drive-in Elephant Door"],
                pricePerHour: 320,
                location: {
                    address: "1420 Film Center Dr",
                    city: "Atlanta",
                    country: "United States",
                    postalCode: "30318",
                },
                images: [
                    "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85",
                    "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=85",
                ],
                host: initialHost,
                rating: 4.92,
                reviewCount: 22,
                capacity: 50,
                squareFeet: 5000,
                isAvailable: true,
                featured: true,
                tags: ["Film Stage", "Virtual Production", "Cinema"],
                rules: ["Safety marshal required on stage"],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: "studio-velvet-podcast",
                _id: "studio-velvet-podcast",
                title: "Velvet Frequency Broadcast Podcast Studio",
                slug: "velvet-frequency-podcast-studio",
                description: "Boutique 4-camera 4K podcast lounge designed for visual dialogue. Shure SM7B dynamic mics and Blackmagic switchers.",
                category: "podcast",
                amenities: ["4K Multi-Cam Switcher", "Shure SM7B Microphones", "Custom Lighting Presets", "Soundproofed"],
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];
        if (fs_1.default.existsSync(STORE_PATH)) {
            try {
                const raw = fs_1.default.readFileSync(STORE_PATH, "utf-8");
                this.db = JSON.parse(raw);
                if (!this.db.studios || this.db.studios.length === 0) {
                    this.db.studios = initialStudios;
                    this.save();
                }
                this.initialized = true;
                return;
            }
            catch (e) {
                console.warn("[DataStore] Reinitializing store file:", e);
            }
        }
        this.db = {
            users: [initialHost, initialGuest],
            studios: initialStudios,
            bookings: [],
        };
        this.save();
        this.initialized = true;
    }
    save() {
        try {
            if (!fs_1.default.existsSync(DATA_DIR)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
            }
            fs_1.default.writeFileSync(STORE_PATH, JSON.stringify(this.db, null, 2), "utf-8");
        }
        catch (err) {
            console.warn("[DataStore] Save warning:", err);
        }
    }
    // User Operations
    findUserByEmail(email) {
        return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }
    findUserById(id) {
        return this.db.users.find((u) => u.id === id || u._id === id);
    }
    createUser(userData) {
        const id = "user_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const user = {
            id,
            _id: id,
            name: userData.name || "",
            email: userData.email || "",
            password: userData.password,
            role: userData.role || "guest",
            avatar: userData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            phone: userData.phone || "",
            bio: userData.bio || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.db.users.push(user);
        this.save();
        return user;
    }
    // Studio Operations
    getAllStudios(query) {
        let result = [...this.db.studios].filter((s) => s.isAvailable);
        if (query.category && query.category !== "all") {
            result = result.filter((s) => s.category === query.category);
        }
        if (query.city) {
            const c = query.city.toLowerCase();
            result = result.filter((s) => s.location.city.toLowerCase().includes(c));
        }
        if (query.minPrice !== undefined) {
            result = result.filter((s) => s.pricePerHour >= query.minPrice);
        }
        if (query.maxPrice !== undefined) {
            result = result.filter((s) => s.pricePerHour <= query.maxPrice);
        }
        if (query.search) {
            const q = query.search.toLowerCase();
            result = result.filter((s) => s.title.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.location.city.toLowerCase().includes(q) ||
                s.tags.some((t) => t.toLowerCase().includes(q)));
        }
        if (query.sort === "price_asc") {
            result.sort((a, b) => a.pricePerHour - b.pricePerHour);
        }
        else if (query.sort === "price_desc") {
            result.sort((a, b) => b.pricePerHour - a.pricePerHour);
        }
        else if (query.sort === "rating") {
            result.sort((a, b) => b.rating - a.rating);
        }
        else {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return result;
    }
    getFeaturedStudios() {
        const featured = this.db.studios.filter((s) => s.isAvailable && s.featured);
        return featured.length > 0 ? featured.slice(0, 6) : this.db.studios.slice(0, 6);
    }
    getStudioById(idOrSlug) {
        return this.db.studios.find((s) => s.id === idOrSlug || s._id === idOrSlug || s.slug === idOrSlug);
    }
    getStudiosByHost(hostId) {
        return this.db.studios.filter((s) => s.host === hostId || s.host?.id === hostId || s.host?._id === hostId);
    }
    createStudio(studioData, hostUser) {
        const id = "studio_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const slug = (studioData.title || "studio")
            .toLowerCase()
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-")
            .concat("-", Math.random().toString(36).substring(2, 6));
        const newStudio = {
            id,
            _id: id,
            title: studioData.title || "",
            slug,
            description: studioData.description || "",
            category: studioData.category || "photography",
            amenities: studioData.amenities || [],
            pricePerHour: studioData.pricePerHour || 100,
            location: studioData.location || { address: "", city: "Brooklyn", country: "USA" },
            images: studioData.images || [],
            host: {
                id: hostUser.id,
                _id: hostUser.id,
                name: hostUser.name,
                email: hostUser.email,
                avatar: hostUser.avatar,
            },
            rating: 5.0,
            reviewCount: 1,
            capacity: studioData.capacity || 15,
            squareFeet: studioData.squareFeet || 1200,
            isAvailable: true,
            featured: studioData.featured || false,
            tags: studioData.tags || [],
            rules: studioData.rules || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.db.studios.push(newStudio);
        this.save();
        return newStudio;
    }
    updateStudio(id, updates) {
        const idx = this.db.studios.findIndex((s) => s.id === id || s._id === id);
        if (idx === -1)
            return null;
        this.db.studios[idx] = {
            ...this.db.studios[idx],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.save();
        return this.db.studios[idx];
    }
    deleteStudio(id) {
        const initialLen = this.db.studios.length;
        this.db.studios = this.db.studios.filter((s) => s.id !== id && s._id !== id);
        if (this.db.studios.length !== initialLen) {
            this.save();
            return true;
        }
        return false;
    }
    // Booking Operations with Double-Booking Prevention
    checkConflict(studioId, date, startTime, endTime) {
        const toMinutes = (time) => {
            const [h, m] = time.split(":").map(Number);
            return h * 60 + m;
        };
        const targetDate = date.split("T")[0];
        const newStart = toMinutes(startTime);
        const newEnd = toMinutes(endTime);
        return this.db.bookings.some((b) => {
            const bDate = b.date.split("T")[0];
            const matchStudio = b.studio?.id === studioId || b.studio?._id === studioId || b.studio === studioId;
            if (!matchStudio || bDate !== targetDate || b.status === "cancelled") {
                return false;
            }
            const exStart = toMinutes(b.startTime);
            const exEnd = toMinutes(b.endTime);
            return newStart < exEnd && newEnd > exStart;
        });
    }
    createBooking(bookingData) {
        const id = "bkg_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const booking = {
            id,
            _id: id,
            guest: bookingData.guest,
            studio: bookingData.studio,
            date: bookingData.date || new Date().toISOString(),
            startTime: bookingData.startTime || "10:00",
            endTime: bookingData.endTime || "14:00",
            durationHours: bookingData.durationHours || 4,
            totalPrice: bookingData.totalPrice || 500,
            status: bookingData.status || "pending",
            paymentStatus: bookingData.paymentStatus || "unpaid",
            guestCount: bookingData.guestCount || 1,
            notes: bookingData.notes || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.db.bookings.push(booking);
        this.save();
        return booking;
    }
    getBookingsByGuest(guestId) {
        return this.db.bookings.filter((b) => b.guest === guestId || b.guest?.id === guestId || b.guest?._id === guestId);
    }
    getBookingsByHost(hostId) {
        const myStudioIds = this.getStudiosByHost(hostId).map((s) => s.id);
        return this.db.bookings.filter((b) => myStudioIds.includes(b.studio?.id) ||
            myStudioIds.includes(b.studio?._id) ||
            myStudioIds.includes(b.studio));
    }
    getBookingById(id) {
        return this.db.bookings.find((b) => b.id === id || b._id === id);
    }
    updateBookingStatus(id, status, reason) {
        const booking = this.db.bookings.find((b) => b.id === id || b._id === id);
        if (!booking)
            return null;
        booking.status = status;
        if (reason)
            booking.cancellationReason = reason;
        booking.updatedAt = new Date().toISOString();
        this.save();
        return booking;
    }
    // Bookmark Operations
    getBookmarks(userId) {
        const user = this.findUserById(userId);
        const bookmarkIds = user?.bookmarks || [];
        return this.db.studios.filter((s) => bookmarkIds.includes(s.id) || bookmarkIds.includes(s._id));
    }
    getBookmarkIds(userId) {
        const user = this.findUserById(userId);
        return user?.bookmarks || [];
    }
    addBookmark(userId, studioId) {
        const user = this.findUserById(userId);
        if (!user)
            return [];
        if (!user.bookmarks)
            user.bookmarks = [];
        if (!user.bookmarks.includes(studioId)) {
            user.bookmarks.push(studioId);
            this.save();
        }
        return user.bookmarks;
    }
    removeBookmark(userId, studioId) {
        const user = this.findUserById(userId);
        if (!user || !user.bookmarks)
            return [];
        user.bookmarks = user.bookmarks.filter((id) => id !== studioId);
        this.save();
        return user.bookmarks;
    }
}
exports.store = new DataStore();
