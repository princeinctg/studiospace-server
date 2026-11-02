# StudioSpace Backend API Server

> Production-ready, secure REST API backend for StudioSpace — the premium cinematic creative studio marketplace.

* **Live Frontend (Netlify)**: https://studiospace-luxury.netlify.app/
* **Live Frontend (Vercel)**: https://studiospace-client-nine.vercel.app/
* **Live Backend API (Render)**: https://studiospace-server-f9ek.onrender.com/

---

## 🚀 Tech Stack
* **Runtime**: Node.js (v20+)
* **Framework**: Express.js with TypeScript (strict mode)
* **Database**: MongoDB with Mongoose ODM
* **Authentication**: JSON Web Tokens (JWT) with bcryptjs password hashing
* **Validation**: Zod schema validation
* **Security**: Helmet, CORS, Express-Rate-Limit
* **Logging**: Morgan

---

## 🔑 Examiner Demo Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Studio Host** | `host@studiospace.com` | `HostPassword123!` | Can list studios, edit/delete owned listings, view incoming host bookings |
| **Guest / Examiner** | `guest@studiospace.com` | `GuestPassword123!` | Can explore studios, book slots, view personal bookings, cancel own bookings |

---

## 🛠️ Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Key | Description | Default |
|---|---|---|
| `PORT` | API Server Port | `5000` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/studiospace` |
| `JWT_SECRET` | Secret key for JWT signing | `studiospace_secret_key` |
| `CLIENT_URL` | Allowed origin for CORS | `http://localhost:3000` |

---

## 🏃 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Seed Database with Realistic Studios & Accounts
```bash
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new Guest or Host account
* `POST /api/auth/login` — Sign in with email and password
* `POST /api/auth/google` — Google OAuth / Demo login endpoint
* `GET /api/auth/me` — Get current authenticated user profile (`Bearer <token>`)
* `POST /api/auth/logout` — Invalidate user session

### Studio Listings (`/api/studios`)
* `GET /api/studios` — Browse studios with search keyword, category, price range, city, and sorting
* `GET /api/studios/featured` — Fetch curated top-rated & featured studios
* `GET /api/studios/my-listings` — Fetch studios owned by the authenticated host
* `GET /api/studios/:id` — Get studio detail by ID or slug
* `POST /api/studios` — Create new studio listing *(Host auth required)*
* `PUT /api/studios/:id` — Update studio listing *(Owner verification enforced)*
* `DELETE /api/studios/:id` — Delete studio listing *(Owner verification enforced)*

### Bookings (`/api/bookings`)
* `POST /api/bookings` — Book studio time slot *(Enforces double-booking prevention)*
* `GET /api/bookings/my-bookings` — View current user's booked studio sessions
* `GET /api/bookings/host-bookings` — View bookings made on host's listed studios
* `PATCH /api/bookings/:id/status` — Update booking status (`confirmed`, `cancelled`, `completed`)

---

## 🛡️ Security & Double-Booking Protection
1. **Overlap Prevention**: Every booking request executes a collision query against the database checking for overlapping intervals (`start < existingEnd && end > existingStart`) on the same studio and date. Conflicts immediately reject with HTTP `409 Conflict`.
2. **Ownership Guard**: Hosts can only edit and delete studios they created; guests can only cancel their own bookings.
3. **Rate Limiting**: Protected against brute-force attacks via windowed rate limiting.
