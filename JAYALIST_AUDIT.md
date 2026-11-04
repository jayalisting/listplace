# Comprehensive Security Hardening & Performance Audit: Jayalist

**Audit Date:** November 3, 2026  
**Auditor Role:** Senior Security & Performance Engineer  
**Mode:** Read-Only Analysis & Architecture Verification  
**Target:** Jayalist ("Grolow / Jaya Developers") Real Estate & Asset Portfolio Platform  

---

## 1. PROJECT SNAPSHOT

- **Application Purpose:**  
  Jayalist is a high-end luxury real estate and commercial asset catalog platform for India (residential penthouses, commercial towers, industrial logistics parks, and agricultural land). It provides public exploration, verified legal specs, private off-market sharing with single-use VIP tokens, automated VIP tour booking dispatch via Gmail SMTP, and an administrative hub for estate management.

- **Languages, Frameworks & Versions:**  
  - **Runtime & Language:** Node.js (v22), TypeScript (v5.9.3)
  - **Framework:** Next.js 15.2.4 (App Router)
  - **Core UI Libraries:** React 19.3.1, Tailwind CSS 3.4.17, Radix UI primitives, Lucide React 0.454.0
  - **Database Driver:** `pg` (v8.23.1)
  - **Email Service:** Nodemailer (v10.3.1)
  - **Package Manager:** pnpm

- **Folder Structure (2 Levels Deep):**
  ```text
  .
  ├── README.md
  ├── app/
  │   ├── add-listing/          # Estate creation & configuration UI
  │   ├── admin/                # Inventory management, VIP tours & amenities customizer
  │   ├── agriculture/          # Farmland & plantation catalog
  │   ├── api/                  # REST API routes (properties, upload, vip-tours, auth, indexnow)
  │   ├── commercial/           # Office towers & commercial plots catalog
  │   ├── globals.css           # Design tokens, variables & typography
  │   ├── industrial/           # Logistics parks & warehouse catalog
  │   ├── layout.tsx            # Global metadata, Schema.org JSON-LD & theme providers
  │   ├── loading.tsx           # Global fallback loader
  │   ├── page.tsx              # Public home page & interactive asset filter
  │   ├── property/[id]/        # Individual estate view & VIP tour booking modal
  │   ├── residential/          # Sky villas & penthouses catalog
  │   ├── robots.ts             # Dynamic robots.txt generation
  │   └── sitemap.ts            # Dynamic XML sitemap generator
  ├── components/
  │   ├── footer.tsx
  │   ├── image-upload-manager.tsx
  │   ├── property-details-client.tsx
  │   ├── property-header.tsx
  │   ├── property-share-modal.tsx
  │   ├── related-properties.tsx
  │   ├── sliding-sidebar.tsx
  │   └── ui/                   # Shadcn/Radix UI components
  ├── hooks/                    # Mobile viewport & toast state hooks
  ├── lib/
  │   ├── admin-auth.ts         # HMAC token generation, salted password verification
  │   ├── db.ts                 # PostgreSQL connection pool & schema migrations
  │   ├── email.ts              # Nodemailer Gmail transport & HTML template
  │   ├── get-property.ts       # Cached database single-property fetcher
  │   ├── image-optimizer.ts    # Client-side canvas compression to WebP
  │   ├── indian-units.ts       # Cr/Lakh/SqFt/Cents formatting utility
  │   ├── json-ld.ts            # Schema.org structured data generators
  │   ├── luxury-properties.ts  # Fallback property constants & type definitions
  │   ├── public-listing.ts     # Public API / AI discovery formatting
  │   └── utils.ts              # Class name merging utilities
  ├── public/                   # Static icons, logo, manifest & local /uploads
  ├── scripts/                  # Brand generator & privacy assertion scripts
  ├── next.config.mjs           # Next.js bundler, image & build configuration
  ├── package.json              # Dependency declarations
  └── tailwind.config.ts        # Theme tokens & animations
  ```

- **Build, Run, and Test:**  
  - **Dev Server:** `pnpm dev` or `npm run dev` (runs on `http://localhost:3000`)
  - **Production Build:** `pnpm build` (`next build`)
  - **Production Start:** `pnpm start` (`next start`)
  - **Testing:** No automated test runner configured in `package.json` (`scripts/test-privacy.mjs` is an ad-hoc script).

- **Database, Storage, Hosting & Deployment Target:**  
  - **Database:** PostgreSQL (local / remote connection string via `DATABASE_URL`)
  - **File Storage:** Local server filesystem (`public/uploads/`)
  - **Deployment Target:** Node.js standalone server / Vercel / Linux VPS / Docker container

- **External Services & APIs Used (Names Only):**  
  - Google Gmail SMTP (`smtp.gmail.com` via Nodemailer)
  - Microsoft Bing / IndexNow API (`api.indexnow.org`)
  - Unsplash Image CDN (remote estate photography)

---

## 2. ARCHITECTURE AND DATA FLOW

- **Entry Points:**  
  - **Public Web Pages:** Home (`/`), Category catalogs (`/residential`, `/commercial`, `/industrial`, `/agriculture`), Estate Details (`/property/[id]`).
  - **Protected Web Pages:** Admin Hub (`/admin`), Add Listing (`/add-listing`).
  - **API Endpoints:**
    - `GET /api/properties`: Public listing collection (supports `?category=`, `?includePrivate=`, `?format=ai`).
    - `POST /api/properties`: Estate creation and database re-seed endpoint (`?action=reset`).
    - `GET/PATCH/PUT/DELETE /api/properties/[id]`: Individual estate CRUD operations.
    - `GET/POST /api/properties/[id]/vip-tokens`: Single-use VIP private link generator & inspector.
    - `POST /api/vip-tokens/[tokenId]/revoke`: VIP token invalidation.
    - `GET /api/vip-token/verify`: Token redemption & access check.
    - `POST /api/upload`: Multipart image upload to `/public/uploads`.
    - `POST /api/vip-tours`: VIP appointment submission & Gmail dispatch.
    - `GET/PATCH/DELETE /api/vip-tours/[id]`: VIP appointment management.
    - `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/check`: Admin session handlers.
    - `POST /api/indexnow`: Instant search engine ping gateway.
    - `GET /sitemap.xml`, `GET /robots.txt`: Search crawler entry points.

- **User Request Flow:**  
  1. User requests a page or triggers a filter. Next.js server components render initial static shell.
  2. Client component initiates an un-cached fetch (`/api/properties?t=...`).
  3. API route handler calls `getDbProperties` in `lib/db.ts`.
  4. Pool connects to PostgreSQL, evaluates SQL query (`ORDER BY featured_home DESC, display_order ASC, id DESC`), maps records, and returns JSON.
  5. UI updates state and renders cards. When a user submits a VIP Tour booking, `POST /api/vip-tours` persists the booking to PostgreSQL and initiates asynchronous non-blocking Gmail SMTP dispatch via Nodemailer to the admin.

- **Data Storage & Sensitivity:**  
  - Stored in PostgreSQL:
    - `properties`: Titles, specs, prices, locations, amenities, custom FAQs, seller names, seller contact numbers, visibility (`public` vs `private`).
    - `vip_tour_bookings`: Client legal names, personal phone numbers, email addresses, requested dates, appointment notes (**Highly Sensitive PII**).
    - `vip_share_tokens`: Client names, phone numbers, single-use access tokens (**Sensitive Private Client Information**).
  - Stored on Filesystem:
    - Uploaded images stored under `public/uploads/` (**Publicly accessible**).

- **Login, Sessions & Tokens:**  
  - Admin login accepts a PIN/password, salts it, and compares against SHA-256 hash using `crypto.timingSafeEqual`.
  - On success, generates an HMAC-SHA256 signed token (`${timestamp}.${random}.${signature}`).
  - Issues an HTTP-only cookie `jaya_admin_session` (7 days duration) and also returns the raw token in the JSON body, which the frontend duplicates into `localStorage.getItem("jaya_admin_token")`.

---

## 3. BEHAVIOR BASELINE (Must Not Break)

- **User-Visible Features & Critical Flows:**  
  1. **Home & Category Navigation:** Browsing all estates or filtering by category (Residential, Commercial, Industrial, Agriculture) and micro-market search (e.g. Mumbai, Mangalore, Dakshina Kannada).
  2. **Estate Details Exploration:** Viewing high-resolution carousels, verified specifications, amenities matrix, floor plans, location landmarks, and structured FAQs.
  3. **VIP Tour Booking Flow:** Submitting an in-person or virtual tour request, displaying immediate confirmation, saving to PostgreSQL, and delivering an instant formatted alert to `jayalisting@gmail.com`.
  4. **Private Off-Market VIP Share Links:** Opening a private off-market listing using a unique single-use token (`/property/[id]?vip_token=...`), verifying consumption, and displaying private estate details only to authorized prospective buyers.
  5. **Admin Hub Management:** Logging into `/admin`, viewing inventory, pinning estates to the Home page (`featured_home`), reordering priority rank (`#1`, `#2`, ...), editing full specifications and custom FAQs, toggling public/private visibility, and managing VIP Tour bookings (confirming, completing, cancelling).
  6. **Add Listing Hub:** Publishing a new luxury asset with custom images, tags, pricing, specifications, and initial priority order from `/add-listing`.
  7. **SEO & Discovery:** Valid rendering of Schema.org JSON-LD structured data (`RealEstateAgent`, `SingleFamilyResidence`), `/sitemap.xml`, `/robots.txt`, `/llms.txt`, and `/api/properties/[id]/markdown`.

- **Existing Tests:**  
  - Only `scripts/test-privacy.mjs` exists: a 58-line standalone script that validates a mock fixture object. It does not test API endpoints, authentication, database queries, or UI components.

- **Missing Tests Required Before Refactoring:**  
  1. Unit tests for `lib/admin-auth.ts`: timing attacks, expired tokens, tampered signatures, and missing headers.
  2. Integration tests for API authentication boundaries: verifying that unauthorized requests to `POST/PATCH/DELETE /api/properties*`, `GET/POST /api/properties/[id]/vip-tokens`, and `GET/PATCH/DELETE /api/vip-tours*` return `401 Unauthorized`.
  3. Endpoint tests for `POST /api/vip-tours`: verifying rate limiting, honeypot bot trap, phone/email validation, and email template escaping.
  4. Database integrity tests: verifying connection pooling release under load, transactional consistency, and non-destructive migrations.

---

## 4. SECURITY AUDIT

### Status Checklist:
| Security Domain | Status | Key Finding Summary |
|---|---|---|
| Hardcoded secrets, keys, credentials | **FAIL** | Plaintext fallback credentials, secrets, and backdoor admin key strings exist in code. |
| .env / config exposure & .gitignore | **PASS** | `.env*` properly declared in `.gitignore`. |
| Authentication & session / token handling | **FAIL** | Fallback HMAC key, tokens stored in `localStorage`, `sameSite: "lax"`. |
| Authorization (horizontal / vertical access) | **FAIL** | Multiple critical endpoints (`POST /api/properties`, `PATCH /api/properties/:id`, VIP token endpoints) lack auth checks. |
| Input validation and sanitization | **FAIL** | Missing schema validation on property payloads; unescaped inputs in HTML email templates. |
| Injection (SQL, command, template, path) | **PASS** | PostgreSQL queries use parameterized statements (`$1, $2`); no dynamic shell execution. |
| XSS, CSRF, open redirects, SSRF | **FAIL** | SVG upload allows stored XSS; unescaped JSON-LD script tags; unauthenticated IndexNow outbound SSRF risk. |
| CORS & security headers | **FAIL** | Zero security headers configured (no CSP, HSTS, X-Frame-Options, or X-Content-Type-Options). |
| Rate limiting / brute-force protection | **FAIL** | Admin login has no rate limiting; VIP tour rate limiter uses unbounded memory map. |
| File upload handling | **FAIL** | Unauthenticated upload endpoint; allows SVG execution; writes to ephemeral local disk. |
| Password storage & encryption | **FAIL** | Hardcoded default password hash and salt fallback in source code. |
| HTTPS enforcement & insecure storage | **FAIL** | Authentication token stored in browser `localStorage`. |
| Error messages & sensitive info leakage | **FAIL** | Full error messages (`error.message`) returned in API 500 JSON responses. |
| Vulnerable or outdated dependencies | **FAIL** | `pnpm audit` reports 44 vulnerabilities (4 critical RCE in Next.js 15.2.4). |
| Debug mode / dev settings in production | **FAIL** | `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` in `next.config.mjs`. |

---

### Security Findings (Highest Impact First, Max 10):

#### SEC-01 | CRITICAL | [app/api/properties/route.ts:56-68](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/api/properties/route.ts#L56-L68)
- **What is wrong:** The `POST /api/properties` route has **zero authentication or authorization checks**. Any unauthenticated external client can call `POST /api/properties?action=reset`, executing `seedDefaultProperties(true)` which runs `DELETE FROM properties` and wipes all production listings. Anyone can also inject arbitrary fake property listings.
- **Minimal fix:** Call `if (!verifyAdminRequest(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });` at the start of `POST`.
- **Risk of changing behavior:** Zero risk to legitimate users. Admin UI requests pass the session cookie.

#### SEC-02 | CRITICAL | [app/api/properties/[id]/route.ts:44-85](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/api/properties/%5Bid%5D/route.ts#L44-L85)
- **What is wrong:** `PATCH` and `PUT` methods in `/api/properties/[id]` have **no authentication checks**. Any anonymous user can modify, deface, reorder, or alter prices/bank account/seller info on any luxury property in the database.
- **Minimal fix:** Enforce `verifyAdminRequest(req)` before processing `PATCH` or `PUT`.
- **Risk of changing behavior:** Zero risk to legitimate users. Protects database integrity.

#### SEC-03 | CRITICAL | Multiple Files ([lib/email.ts:18-19](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/lib/email.ts#L18-L19), [lib/admin-auth.ts:4-12](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/lib/admin-auth.ts#L4-L12), [lib/db.ts:13](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/lib/db.ts#L13))
- **What is wrong:** Hardcoded plaintext secrets and fallback credentials exist directly in application source code:
  - `lib/email.ts`: Hardcoded fallback Gmail user and Google App Password (`[REDACTED]`).
  - `lib/admin-auth.ts`: Hardcoded fallback salt (`[REDACTED]`), password hash (`[REDACTED]`), and HMAC session secret (`[REDACTED]`).
  - `lib/db.ts`: Hardcoded local DB user and connection string fallback (`[REDACTED]`).
- **Minimal fix:** Remove all hardcoded credential fallbacks. Throw an explicit startup error if required environment variables (`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, `DATABASE_URL`) are missing.
- **Risk of changing behavior:** None, as long as environment variables are configured in `.env.local` or host dashboard.

#### SEC-04 | CRITICAL | Multiple Files ([app/api/properties/[id]/route.ts:125](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/api/properties/%5Bid%5D/route.ts#L125), [app/api/vip-tours/route.ts:171](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/api/vip-tours/route.ts#L171), [app/api/vip-tours/[id]/route.ts:22,73](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/api/vip-tours/%5Bid%5D/route.ts#L22))
- **What is wrong:** A hardcoded static backdoor API header check `req.headers.get("x-admin-key") === "jayaadmin"` is present in four authorization checks. Anyone sending header `x-admin-key: jayaadmin` bypasses all session and HMAC checks, gaining full delete and read permissions.
- **Minimal fix:** Remove `|| req.headers.get("x-admin-key") === "jayaadmin"` from all route handlers; enforce only `verifyAdminRequest(req)`.
- **Risk of changing behavior:** Closes unauthorized backdoor access.

#### SEC-05 | HIGH | [app/api/properties/[id]/vip-tokens/route.ts:13-46](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/api/properties/%5Bid%5D/vip-tokens/route.ts#L13-L46)
- **What is wrong:** `GET` and `POST` in `/api/properties/[id]/vip-tokens` have **zero authentication**. Anyone can call `GET` to dump all VIP tokens, client names, and client phone numbers for confidential off-market estates, or call `POST` to generate unapproved VIP access links.
- **Minimal fix:** Protect both `GET` and `POST` with `verifyAdminRequest(req)`.
- **Risk of changing behavior:** Zero risk. VIP token generation and inspection is an admin-only workflow.

#### SEC-06 | HIGH | [app/api/upload/route.ts:15,18-50](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/api/upload/route.ts#L15-L50)
- **What is wrong:** 
  1. The upload endpoint is completely unauthenticated, allowing anonymous users to upload up to 5MB files repeatedly, exhausting server storage.
  2. `ALLOWED_MIME_TYPES` includes `image/svg+xml`. Uploaded SVG files are served directly from `/uploads/` on the same origin without sanitization, permitting Stored Cross-Site Scripting (XSS via `<script>` or embedded XML entities).
- **Minimal fix:** Require `verifyAdminRequest(req)`. Remove `image/svg+xml` from allowed upload types (or sanitize with DOMPurify).
- **Risk of changing behavior:** None; only administrators upload listing media.

#### SEC-07 | HIGH | [lib/email.ts:165,174,184,203,223](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/lib/email.ts#L165-L223)
- **What is wrong:** User-supplied fields (`booking.clientName`, `booking.notes`, `booking.propertyTitle`) are directly interpolated into the HTML email template string without HTML entity escaping. An attacker can submit `<a href="...">` phishing overlays, tracking pixels, or HTML markup (HTML/Email Injection) delivered directly into the administrator's mailbox.
- **Minimal fix:** Pass all dynamic variables through an HTML entity escape helper (`str.replace(/[&<>"']/g, ...)`).
- **Risk of changing behavior:** None. Special characters display cleanly as text.

#### SEC-08 | HIGH | [app/api/admin/login/route.ts:4-35](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/api/admin/login/route.ts#L4-L35)
- **What is wrong:** 
  1. There is no rate limiting, attempt throttling, or exponential backoff on `POST /api/admin/login`. An attacker can launch high-speed password brute-force or dictionary attacks against the admin PIN.
  2. The response body outputs the raw token (`token,`), prompting the client to store it in `localStorage` ([app/admin/page.tsx:647](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/admin/page.tsx#L647)), negating the protection of HttpOnly cookies against XSS credential theft.
- **Minimal fix:** Add IP-based rate limiting (e.g. max 5 attempts per 15 minutes). Stop returning the token in the JSON body; rely strictly on the `HttpOnly` cookie.
- **Risk of changing behavior:** Minimal; legitimate administrators entering their PIN are unaffected.

#### SEC-09 | HIGH | [next.config.mjs:1-14](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/next.config.mjs#L1-L14)
- **What is wrong:** 
  1. No security headers are configured. Missing `Content-Security-Policy`, `X-Frame-Options: DENY` (clickjacking), `X-Content-Type-Options: nosniff` (MIME sniffing), `Strict-Transport-Security` (HSTS), and `Referrer-Policy`.
  2. `ignoreDuringBuilds: true` and `ignoreBuildErrors: true` suppress TypeScript and ESLint build failures.
- **Minimal fix:** Configure `headers()` in `next.config.mjs` returning standard hardening headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`). Remove `ignoreDuringBuilds` once clean.
- **Risk of changing behavior:** Low; prevents embedding in malicious iframes and secures transport.

#### SEC-10 | HIGH | [package.json:49](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/package.json#L49)
- **What is wrong:** `next@15.2.4` has 44 known security vulnerabilities according to `pnpm audit` (4 Critical, 19 High, 19 Moderate), including Remote Code Execution advisories (`GHSA-9qr9-h5gf-34mp`, `GHSA-p293-qw3h-jr36`, `GHSA-g77x-4436-9437`).
- **Minimal fix:** Upgrade `next` to a patched release (`>=15.5.24` or the latest stable Next.js 15.x patch release).
- **Risk of changing behavior:** Low-to-medium; requires verifying App Router builds post-upgrade.

---

## 5. PERFORMANCE / COMPUTE AUDIT

### Performance Findings (Highest Impact First, Max 10):

#### PERF-01 | [next.config.mjs:9-11](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/next.config.mjs#L9-L11)
- **Why it is expensive:** `images: { unoptimized: true }` disables Next.js's built-in image optimization. Every estate image loaded from Unsplash or `/uploads` is transferred across the network at raw multi-megabyte resolution without WebP/AVIF transcoding, responsive resizing, or device-specific `srcset`. This inflates network bandwidth, drains mobile battery, and hurts Google Core Web Vitals (LCP).
- **Estimated saving:** **HIGH** (60%–85% decrease in page payload size; significantly faster mobile LCP).
- **Minimal fix:** Remove `unoptimized: true` from `next.config.mjs` and configure remote image domains (`images.unsplash.com`).
- **Risk of changing behavior:** None; images render with identical visual quality at much smaller sizes.

#### PERF-02 | [lib/db.ts:32-97](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/lib/db.ts#L32-L97)
- **Why it is expensive:** `initializeDatabase()` is called inside **every single database operation** (15 separate function call sites). While `isInitialized` guards subsequent calls in warm memory, on serverless cold starts or multi-instance restarts, it executes over 15 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS` DDL statements against PostgreSQL before serving the user's query, introducing 500ms–2000ms latency spikes.
- **Estimated saving:** **HIGH** (eliminates redundant DDL roundtrips on cold starts).
- **Minimal fix:** Run database initialization once during startup/deployment migration script, not inside individual query functions.
- **Risk of changing behavior:** None.

#### PERF-03 | [lib/db.ts:40-80, 304](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/lib/db.ts#L40-L80)
- **Why it is expensive:** Missing indexes on `properties`. Queries filter by `visibility` and `category` and sort by `ORDER BY featured_home DESC, display_order ASC, id DESC`. There are no indexes on `(category, visibility)` or `(featured_home, display_order)`. Every public page load performs a full sequential table scan.
- **Estimated saving:** **MED** (reduces DB query execution time from linear scan to sub-millisecond B-tree index lookup as properties grow).
- **Minimal fix:** Add `CREATE INDEX IF NOT EXISTS idx_properties_order ON properties(featured_home DESC, display_order ASC, id DESC);` and `CREATE INDEX IF NOT EXISTS idx_properties_cat_vis ON properties(category, visibility);`.
- **Risk of changing behavior:** None.

#### PERF-04 | [app/page.tsx:120-131](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/page.tsx#L120-L131), [app/residential/page.tsx:43](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/residential/page.tsx#L43), [app/commercial/page.tsx:43](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/commercial/page.tsx#L43)
- **Why it is expensive:** Every page navigation triggers an un-cached network fetch: `fetch('/api/properties?t=' + Date.now(), { cache: 'no-store' })`. Bypassing HTTP caching causes repeated database roundtrips every time a visitor switches between tabs or returns to the home page, increasing DB CPU and connection churn.
- **Estimated saving:** **HIGH** (drastically reduces PostgreSQL query load; instant page-to-page tab transitions).
- **Minimal fix:** Enable Next.js ISR (Incremental Static Regeneration) or use `next: { revalidate: 60 }` with cache tags (`revalidateTag('properties')`) when an admin updates a listing.
- **Risk of changing behavior:** None; listings stay fresh via on-demand revalidation.

#### PERF-05 | [app/page.tsx:115-116](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/page.tsx#L115-L116), [app/residential/page.tsx:37](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/residential/page.tsx#L37)
- **Why it is expensive:** Every category page bundle statically imports `LUXURY_PROPERTIES` from `lib/luxury-properties.ts` (~36 KB) merely to initialize state, before immediately overwriting it with `fetch('/api/properties')`. This unnecessarily inflates the JavaScript bundle for every route by 36 KB of duplicate JSON data.
- **Estimated saving:** **MED** (reduces initial JavaScript bundle size across all 5 catalog pages).
- **Minimal fix:** Fetch initial properties server-side via React Server Component (RSC) and pass down to client, or initialize with an empty array.
- **Risk of changing behavior:** None.

#### PERF-06 | [lib/email.ts:55](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/lib/email.ts#L55)
- **Why it is expensive:** `createTransporter()` is called on every VIP tour booking, recreating a new Nodemailer transport instance each time instead of maintaining a singleton pooled transport.
- **Estimated saving:** **LOW** (prevents repeated TLS socket recreation).
- **Minimal fix:** Store `transporter` in module scope: `let transporterInstance: nodemailer.Transporter | null = null;`.
- **Risk of changing behavior:** None.

#### PERF-07 | [package.json:58](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/package.json#L58)
- **Why it is expensive:** `recharts` is installed (large SVG chart rendering library, >500 KB uncompressed) and imported in `components/ui/chart.tsx`, but is never utilized in any page or component across the entire app.
- **Estimated saving:** **MED** (removes unused dependencies and shrinks `node_modules` and build footprint).
- **Minimal fix:** Remove `recharts` from `package.json` and delete unused `components/ui/chart.tsx`.
- **Risk of changing behavior:** Zero; no chart is rendered in the app.

#### PERF-08 | [package.json:44,46](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/package.json#L44-L46)
- **Why it is expensive:** 
  1. `"fs": "latest"` is declared in `dependencies`. `fs` is a Node.js built-in module; declaring it on npm downloads a dummy package.
  2. `"date-fns": "4.1.0"` is declared in `dependencies` with zero usages across the codebase.
- **Estimated saving:** **LOW** (cleans dependency tree, reduces install time).
- **Minimal fix:** Remove `fs` and `date-fns` from `package.json`.
- **Risk of changing behavior:** None.

#### PERF-09 | [app/api/vip-tours/route.ts:16-33](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/api/vip-tours/route.ts#L16-L33)
- **Why it is expensive:** `rateLimitMap = new Map<string, { count: number; expiresAt: number }>()` stores IP rate-limit records in memory and never deletes expired keys unless the exact same IP requests again. Over time under crawler/bot activity, this map grows monotonically without bound, causing a steady memory leak.
- **Estimated saving:** **MED** (prevents long-term Node.js memory bloat).
- **Minimal fix:** Add a periodic cleanup interval (`setInterval`) or use a fixed-size LRU cache (e.g. max 1,000 entries).
- **Risk of changing behavior:** None.

#### PERF-10 | [app/admin/page.tsx](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/admin/page.tsx) & [app/add-listing/page.tsx](file:///Users/nikhilkotian/Desktop/JAYA%20developers/websites/grolow%20demo%2010/app/add-listing/page.tsx)
- **Why it is expensive:** Both files are monolithic client components (2,446 lines and 2,680 lines respectively). All form states reside in a single top-level state object without memoized subcomponents. Every keystroke re-renders thousands of DOM elements, causing noticeable input latency and high CPU usage on low-power devices.
- **Estimated saving:** **MED** (smooth UI rendering, lower CPU and battery consumption during admin catalog work).
- **Minimal fix:** Break forms into modular subcomponents and wrap static sections with `React.memo`.
- **Risk of changing behavior:** Low; requires component isolation.

---

## 6. SAFE EXECUTION PLAN (Do NOT Apply Yet)

### Step 1: Critical Security Boundary Lockdown
*Priority: P0 (Immediate)*
1. **Secure API Routes:**
   - Touch: `app/api/properties/route.ts`, `app/api/properties/[id]/route.ts`, `app/api/properties/[id]/vip-tokens/route.ts`, `app/api/vip-tokens/[tokenId]/revoke/route.ts`, `app/api/upload/route.ts`.
   - Action: Add `if (!verifyAdminRequest(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });` to all write and inspection endpoints. Remove hardcoded `"jayaadmin"` backdoor string.
   - Verification: Run curl test without auth -> must return `401 Unauthorized`. Test from `/admin` with valid session -> must return `200 OK`.

2. **Sanitize Email & Disallow SVG Uploads:**
   - Touch: `lib/email.ts`, `app/api/upload/route.ts`.
   - Action: HTML-escape client inputs in email templates. Remove `image/svg+xml` from allowed MIME types.
   - Verification: Submit a VIP tour booking with special characters (`<`, `>`, `&`) -> verify plain text and email render escaped characters safely.

3. **Externalize Hardcoded Secrets:**
   - Touch: `lib/admin-auth.ts`, `lib/email.ts`, `lib/db.ts`.
   - Action: Remove plaintext fallback strings. Ensure runtime throws if environment variables are missing.
   - Verification: App continues to function normally using values from `.env.local`.

### Step 2: Rate Limiting & Admin Session Hardening
*Priority: P1*
1. **Rate Limiting on Admin Login & Memory Cleanup:**
   - Touch: `app/api/admin/login/route.ts`, `app/api/vip-tours/route.ts`.
   - Action: Implement rate limiting on login (5 attempts per 15 min). Add LRU bounded eviction to the VIP tour rate limit map. Set cookie `sameSite: "strict"`. Stop returning raw token in JSON login response.
   - Verification: 6 consecutive failed logins trigger `429 Too Many Requests`.

2. **Add Standard Security Headers:**
   - Touch: `next.config.mjs`.
   - Action: Add `headers()` with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
   - Verification: Inspect response headers with `curl -I http://localhost:3000/`.

### Step 3: Performance & Cost Optimization
*Priority: P2*
1. **Enable Next.js Image Optimization & Add Database Indexes:**
   - Touch: `next.config.mjs`, `lib/db.ts`.
   - Action: Remove `unoptimized: true`. Add PostgreSQL indexes for `(featured_home DESC, display_order ASC, id DESC)` and `(category, visibility)`.
   - Verification: Inspect images in Chrome DevTools -> format served as WebP/AVIF with reduced byte count.

2. **Clean Unused Dependencies:**
   - Touch: `package.json`, delete `components/ui/chart.tsx`.
   - Action: Remove `recharts`, `fs`, and `date-fns`. Run `pnpm install`.
   - Verification: Run `pnpm build` -> build succeeds with zero errors and smaller bundle size.

3. **Optimize Database Connection Pooling & Initialization:**
   - Touch: `lib/db.ts`.
   - Action: Preserve `globalForPg.pgPool` in production. Move DDL statements out of per-query handlers into an explicit setup migration.
   - Verification: Stress test with concurrent requests -> 0 connection pool timeouts.

### Automated Tests to Add First:
1. `tests/auth.test.ts`: Verify `verifyAdminRequest` with valid, invalid, expired, and missing tokens.
2. `tests/api-security.test.ts`: Automated tests verifying `401 Unauthorized` on unauthenticated calls to all protected API routes.
3. `tests/email-sanitizer.test.ts`: Verify HTML injection escaping in email generation.
4. `tests/db-ordering.test.ts`: Verify that `getDbProperties()` correctly respects `featured_home DESC, display_order ASC`.

---

## 7. UNKNOWNS AND QUESTIONS

1. **Production Hosting Environment:**  
   *Unknown:* Is Jayalist deployed on Vercel, a containerized platform (Docker/Kubernetes), or a dedicated Node.js VPS?  
   *Need from user:* If hosted on Vercel or AWS Lambda, the local filesystem (`public/uploads/`) is ephemeral and files will be lost on container recycle. An S3, Cloudflare R2, or Supabase Storage bucket would be required for persistent media storage.

2. **Third-Party AI / Search Engine Key:**  
   *Unknown:* `app/api/indexnow/route.ts` references `INDEXNOW_KEY` defaulting to `'jayalisting_indexnow_key_2026'`.  
   *Need from user:* Has a verified IndexNow key text file been placed in the public web root for Bing Webmaster Tools?

3. **Admin Password Management:**  
   *Unknown:* Is there a planned multi-user RBAC requirement in the future, or will the single administrator PIN model remain sufficient?

