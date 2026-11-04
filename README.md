# JayaListing — Luxury Real Estate & Discovery Platform
**Built by Jaya Developers**

JayaListing is an institutional-grade luxury real estate platform designed for high-net-worth clients, commercial developers, and institutional investors in India. Built with Next.js 15, PostgreSQL, and full modern technical SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization).

---

## Technical Stack
- **Framework**: Next.js 15.2.4 (App Router, Server Components, SSR)
- **Database**: PostgreSQL (`grolow_db`) with `pg` connection pool
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS & Lucide Icons
- **Discovery Layer**: Schema.org JSON-LD, dynamic XML sitemaps, IndexNow, AI Crawler Policy (`robots.ts`), `/llms.txt`

---

## Quick Start & Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL running locally or remotely (default: `postgres://nikhilkotian@localhost:5432/grolow_db`)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the project root:
```env
DATABASE_URL=postgres://nikhilkotian@localhost:5432/grolow_db
NEXT_PUBLIC_SITE_URL=http://localhost:3000
INDEXNOW_KEY=jayalisting_indexnow_key_2026
ADMIN_PASSWORD_HASH=0937a0be005391bc40c0c660f5c18e3845bca8fe2e106bb9e72bb3a75a004eb7
ADMIN_SALT=c855a90d96d91d120a17f69ee73504ad
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Discovery & SEO Endpoints
- **Public Sitemap**: `http://localhost:3000/sitemap.xml`
- **Robots Policy**: `http://localhost:3000/robots.txt`
- **AI Model Index**: `http://localhost:3000/llms.txt`
- **Public Properties API**: `http://localhost:3000/api/properties`
- **IndexNow Ping Gateway**: `POST /api/indexnow`

---

## Technical Documentation
Full implementation specifications and operator guides are located in `/docs`:
- [`/docs/SEO-AEO-SPEC.md`](./docs/SEO-AEO-SPEC.md): Technical SEO, AEO, and GEO architecture.
- [`/docs/DATA-VISIBILITY.md`](./docs/DATA-VISIBILITY.md): Private vs. Public field matrix and privacy barrier.
- [`/docs/STRUCTURED-DATA.md`](./docs/STRUCTURED-DATA.md): Schema.org JSON-LD templates and graph structure.
- [`/docs/INDEXING-RUNBOOK.md`](./docs/INDEXING-RUNBOOK.md): Sitemaps, Search Console, Bing, and IndexNow runbook.
- [`/docs/ADMIN-GUIDE.md`](./docs/ADMIN-GUIDE.md): Admin publishing workflow and image alt text guide.
- [`/docs/LAUNCH-CHECKLIST.md`](./docs/LAUNCH-CHECKLIST.md): Audit and verification checklist.
- [`/docs/DECISIONS.md`](./docs/DECISIONS.md): Architectural Decision Records (ADRs).
