# SDL Global Logistics — Project Tracker

> **Context:** The SDL platform is **already built and working**: public website, tracking engine, Express/SQLite API,
> admin console, documents and quotes. Claude is acting as a **senior professional developer** who has taken over this
> existing codebase to rebrand and improve it. Nothing here is built from scratch; every task modifies the working system
> in place and must leave it working. See `CLAUDE.md §0`.

**Working method:** treat this like a client engagement on a live system. Before each task, read the affected files; after each task, run `npm run build`, test the flow you touched, commit with a clear message, and log it below.

**Owner:** SDL Global Logistics Ltd · **Repo:** (new SDL repo) · **Target:** sdlgloballogistics.com on Hostinger
**Status legend:** `[ ]` to do · `[~]` in progress · `[x]` done · `[!]` blocked (see Needs owner)

---

## Phase 0 — Take over the existing system & record a baseline
- [ ] 0.1 Create a new GitHub repo for SDL (don't keep pushing to the old `duolingo-express` repo). Copy the code across without the old git history.
- [ ] 0.2 Copy `CLAUDE.md` to the repo root and all other docs into `/docs`.
- [~] 0.3 Run `npm install` and `npm run dev`; confirm the existing site, tracking, admin login, shipment creation, documents and quotes all work (this is the baseline that must never regress). *API + build verified; the browser-only checks are pending (see Baseline below).*
- [x] 0.3b Codebase walkthrough: read App.tsx, the main pages, server routes and db.ts; write a short "system notes" summary at the bottom of this tracker so future sessions start with context.

### Baseline (2026-09-26, Node 22.14.0, npm 11.6.2)
The owner's own servers were already running (Vite :3000, `npm start` :5000). They were left alone. Tests ran against an **isolated API instance** (tsx, port 5055, scratch DB, test-only password). Neither `.env` nor `data/` was touched.

| Check | Result | How verified |
|---|---|---|
| `npm install` (+ postinstall build) | PASS | 0 vulnerabilities |
| `npm run build` | PASS, 0 TS errors, 2 warnings | (1) esbuild CSS: orphan declarations with no selector at `src/pages/TrackResultPage.css:231`, so those styles are dead today; (2) main JS chunk 1,697 kB (453 kB gzip) > 500 kB, since nothing is code-split |
| Fresh DB init + demo seed | PASS | 3 demo shipments, quotes, docs seeded |
| Public pages load | PASS (HTTP) | `/` 200 on Vite :3000 and on the built app :5000. **Visual render not checked, needs a browser** |
| Track demo shipment | PASS | `GET /api/track/DXP-2026-7K2M9QRX` 200, PII masked; unknown ID 404; lowercase input works |
| Admin login | PASS | wrong pw 401, right pw 200, session `isAdmin:true`; admin routes 401 without a session |
| Create shipment (admin) | PASS | `POST /api/shipments` 201 with 2 pieces; duplicate ID 409; foreign-Origin write 403 (CSRF guard) |
| Track new shipment publicly | PASS | 200, masked; status update → IN_TRANSIT, event added |
| Piece-label lookup (`…-01`) | 404 (current behaviour) | known gap, fixed in 1.8 |
| Documents | PASS (API) | `POST /api/documents/generate` 201, listed in admin. **PDF download is client-side (jspdf), needs a browser check** |
| Quote request → admin | PASS | `POST /api/quotes` 201 (`QR-2026-#####`), appears in the admin list, public lookup 200 |
| Settings / stats (admin) | PASS | 200 |

**Owner to confirm in a browser** (then tick 0.3): pages render; `#/admin` login UI; admin Create Shipment wizard; a document PDF download; the quote form UI.
- [ ] 0.4 Take "before" screenshots of every page → `screens/before/`.
- [ ] 0.5 Owner drops SDL images into `Public/images/sdl/` using the names in `BRAND_GUIDE.md §8`.
- [ ] 0.6 Owner supplies logo files (full-colour, white/reversed, icon-only) → `Public/brand/`.

## Phase 1 — Brand foundation (no visual redesign yet)
- [ ] 1.1 Create `src/config/brand.ts` with every value from `CLAUDE.md §2`; replace hard-coded brand strings with imports.
- [ ] 1.2 Extract the colour palette from the SDL logo (BRAND_GUIDE §4), then write the tokens into `src/styles/tokens.css`.
- [ ] 1.3 Rename token prefix `--dxp-*` → `--sdl-*` and class prefix `dxp-` → `sdl-` across `src/` (~59 files, 63 tokens).
- [ ] 1.4 Replace `logo.png`, footer logo, favicon, apple-touch-icon; add `site.webmanifest` and OG image.
- [ ] 1.5 Update `index.html`: title, description, Open Graph/Twitter tags, theme-color, canonical (CONTENT.md §1).
- [ ] 1.6 Update `package.json` name → `sdl-global-logistics`; rename DB file default `duolingo_express.db` → `sdl_global.db` (server/db.ts, server/index.ts, .env.example).
- [ ] 1.7 Replace all emails with `info@sdlgloballogistics.com` (defaults in `server/db.ts` settings, Header, Contact, PublicQuoteResult, Admin Settings).
- [ ] 1.8 Implement the new tracking-ID generator (`DLS` + 5 chars = 8 total) as ONE shared util; replace all 6 generators (see REBRAND_MAP §3).
- [ ] 1.9 Update tracking input validation, placeholders and help text to the new 8-character format.
- [ ] 1.10 Replace demo data (`src/data/mockShipments.ts`, `server/seed.ts`) with SDL-branded, worldwide demo shipments using DLS IDs.
- [ ] 1.11 Replace the other ID prefixes: seals, support tickets, invoices, returns (REBRAND_MAP §3).
- [ ] 1.12 Sweep: `grep -rniE "duolingo|dxp|dex\b" --exclude-dir=node_modules .` → only allowed hits remain (list them in REBRAND_MAP §6).

## Phase 2 — Worldwide operations
- [ ] 2.1 Replace the U.S. hub data with the global gateway network (CONTENT.md §9) in `HomeNetworkMap`, `FacilityNetworkMap`, `LocationsPage`.
- [ ] 2.2 `geocodingService.ts`: add a `GLOBAL_GATEWAY_DATABASE` (city, country, ISO code, lat/lng, IANA time zone); keep Nominatim for free-text; stop assuming `state`/`zip`.
- [ ] 2.3 `routingEngine.ts`: when OSRM cannot route (different continents/oceans), draw air/sea legs as great-circle arcs instead of failing.
- [ ] 2.4 Rename `USJourneyMap` → `JourneyMap` (component + CSS + imports); remove "interstate/highway" wording.
- [ ] 2.5 Time zones: replace `ET/CT/MT/PT` handling (server/routes/track.ts, shipments.ts) with IANA zones + UTC offset display.
- [ ] 2.6 Address forms (Quote, Ship, Admin Create Shipment): country selector first, then fields that fit that country (postcode optional, "State/Region").
- [ ] 2.7 Units: kg/cm by default with lb/in toggle; currency display configurable (default USD, allow NGN/GBP/EUR).
- [ ] 2.8 Service modes: add Air Freight / Ocean Freight / Road labels to shipment types where the copy mentions them.

## Phase 3 — Copy (page by page, from CONTENT.md)
- [ ] 3.1 Header + footer + mobile drawer (nav labels, footer columns, legal line, social links)
- [ ] 3.2 Home — all 13 sections
- [ ] 3.3 Services
- [ ] 3.4 About
- [ ] 3.5 Locations
- [ ] 3.6 Quote + Public Quote Result
- [ ] 3.7 Ship
- [ ] 3.8 Track + Track Result + loading screen + support modal
- [ ] 3.9 Help / FAQ
- [ ] 3.10 Contact
- [ ] 3.11 Legal (Privacy, Terms, Cookies, Shipping Terms) — **must be reviewed by a lawyer before launch**
- [ ] 3.12 Generated documents: waybill, BOL, POD, invoice, seal labels (ShipmentDocuments, DocumentCenterView, CreateShipmentView)
- [ ] 3.13 Admin console strings (AdminLayout, AdminLogin, Settings defaults)
- [ ] 3.14 Replace invented testimonials & client logos per CONTENT.md §2.10–2.11 (remove until real ones exist)

## Phase 4 — Images
- [ ] 4.1 Optimise all SDL images (WebP + JPG fallback, max 2400px wide hero, ≤ 250 KB each where possible).
- [ ] 4.2 Swap image paths in Home, Services, TrackResult; delete old image files from `Public/`.
- [ ] 4.3 Write alt text for every image (CONTENT.md §12).

## Phase 5 — 3D & motion (MOTION_3D_SPEC.md)
- [ ] 5.1 Motion foundation: `useReveal`, `useTilt`, `useParallax` hooks + reduced-motion guard + (optional) Lenis smooth scroll.
- [ ] 5.2 Hero 3D globe with animated trade-route arcs (lazy-loaded; static fallback image).
- [ ] 5.3 Section reveals + staggered cards on all pages.
- [ ] 5.4 3D tilt on service/industry/value cards.
- [ ] 5.5 Parallax depth on image sections and page heroes.
- [ ] 5.6 Animated counters + "How it works" connecting path animation.
- [ ] 5.7 Track Result: tilted map, animated marker, 3D parcel "passport" card flip.
- [ ] 5.8 Performance pass: Lighthouse mobile ≥ 85 Performance, ≥ 95 Accessibility; fix regressions.

## Phase 6 — QA & SEO
- [ ] 6.1 Old-brand sweep = zero (REBRAND_MAP §6).
- [ ] 6.2 Functional test: create shipment in admin → track it publicly → documents download → quote flow → contact form.
- [ ] 6.3 Cross-browser: Chrome, Safari (iOS), Firefox, Samsung Internet; low-end Android test.
- [ ] 6.4 SEO: per-page titles/descriptions, `robots.txt`, `sitemap.xml`, OG image, structured data (Organization).
- [ ] 6.5 Accessibility: keyboard nav, focus states, alt text, contrast, reduced motion.
- [ ] 6.6 Take "after" screenshots → `screens/after/`.
- [ ] 6.7 Remove the demo shipments from the public site: turn off the mock-shipment fallback in `App.tsx`/`AdminDataContext.tsx`, and set `SEED_DEMO_DATA=false` in production.

## Phase 7 — Deploy (DEPLOYMENT.md)
- [ ] 7.1 Hostinger Node.js app connected to the SDL GitHub repo; Node ≥ 22.5.
- [ ] 7.2 Env vars set (fresh `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `DB_PATH` on persistent storage, `SEED_DEMO_DATA=false`).
- [ ] 7.3 DNS: root + `www` + `private.` (admin, alias of the same Node app); SSL on all three.
- [ ] 7.4 Email: info@sdlgloballogistics.com mailbox + SPF/DKIM/DMARC.
- [ ] 7.5 Post-deploy smoke test (DEPLOYMENT.md §7); set up DB backup routine.

---

## Blocked / Needs owner
| # | Item | Needed for |
|---|---|---|
| 1 | Logo files (full colour, white, icon) | 1.2, 1.4 |
| 2 | Phone number(s) + WhatsApp number | 1.1, 3.1, 3.10 |
| 3 | Head-office address (and any regional offices) | 1.1, 3.10, 6.4 |
| 4 | Confirm the global gateway list (CONTENT.md §9) | 2.1 |
| 5 | Year founded / real stats (shipments, countries, years) or approve removing stat blocks | 3.2, 3.4 |
| 6 | Real customer testimonials + permission, or approve removing the section | 3.14 |
| 7 | Real partner/carrier logos you're authorised to show, or approve removing the strip | 3.14 |
| 8 | Certifications/licences you actually hold (e.g. IATA, customs broker licence, ISO) | 3.2, 3.4 |
| 9 | Social media links | 3.1 |
| 10 | ~~Admin subdomain name~~ **Resolved: `private.sdlgloballogistics.com`** | 7.3 |
| 11 | Lawyer review of legal pages | 3.11 |

## Decisions log
| Date | Decision |
|---|---|
| 2026-09-26 | Brand: SDL Global Logistics Ltd; email info@sdlgloballogistics.com; worldwide coverage. |
| 2026-09-26 | Keep the four existing service lines (Priority Express, Scheduled Linehaul/Freight, Vehicle Transport, Secure Vault). |
| 2026-09-26 | Palette to be derived from the SDL logo. |
| 2026-09-26 | Tracking ID = `DLS` + 5 characters, 8 total. |
| 2026-09-26 | All pages rebranded, including admin and generated documents. |
| 2026-09-26 | Admin console lives only at private.sdlgloballogistics.com (replaces the old `dr.` subdomain). |
| 2026-09-26 | Admin subdomain is an alias of the same app, domain and API as the public site. The separate `ADMIN_PROXY_TARGET` deployment mode is not used. `ALLOWED_ORIGIN` must accept both the public and `private.` origins. |
| 2026-09-26 | Owner's source images are in `images/` at the project root. They are processed into `Public/` in Prompts 03–04. Existing site images that have no SDL replacement are **kept** (Phase 4 deletes only the images that were actually replaced, plus the old logos). |
| 2026-09-26 | Piece labels use one format for every piece type: base ID + `-NN` (e.g. `DLS7K2M9-01`). The `-PL`, `-CTR`, `-FR`, `-DOC` and `-PET` suffixes are retired. A search for a piece label resolves to its parent. |
| 2026-09-26 | Demo shipments stay available (rebranded to SDL in 1.10) during the rebrand. They are removed before launch (see 6.7). |
| 2026-09-26 | `DB_PATH`, `SEED_DEMO_DATA` and `/api/diag/storage` (admin-gated) are added as part of Prompt 09 / task 1.6. |

## Change log
| Date | Task | Note |
|---|---|---|
| 2026-09-26 | 0.3b | Codebase walkthrough; System notes added at the bottom of this file. |
| 2026-09-26 | 0.3 | Baseline recorded: install/build pass (2 warnings), all API flows pass; browser-only checks pending owner. No code changed. |
---

## System notes (codebase walkthrough, 2026-09-26)

**Shape.** One Node process. `server/index.ts` (Express 5) serves `/api/*` and the built SPA from `dist/`. Dev: Vite on :3000 proxies `/api` to Express on :5000. Build: `tsc` (src) → `vite build` → `tsc -p tsconfig.server.json` → `dist-server/`.

**Routing.** No router library. `src/App.tsx` keeps `currentPage` in state and syncs it with `location.hash` (`#/services`, `#/track/:id`, `#/quote/:id`). `getInitialPage()` resolves the first paint synchronously; a `hashchange` effect handles the rest. `KNOWN_PAGES` is the allow-list. `track-result` and `quote-result` are internal states, not hash pages. Admin: `isAdminHost()` = `hostname.startsWith('dr.')` → always `admin`. On localhost/127.0.0.1, `#/admin` also opens admin; anywhere else `#/admin` falls back to Home. The admin bundle is statically imported, so it ships to every public visitor.

**Frontend ↔ API.** `src/services/api.ts` holds relative `fetch('/api/...')` calls with `credentials: 'include'` on the auth calls. `AdminDataProvider` (`src/context/AdminDataContext.tsx`) wraps the **whole** app, public pages included. It starts from `MOCK_SHIPMENTS` (`src/data/mockShipments.ts`), then replaces them with server data. Public visitors get 401s, so they keep the mocks, and the 12 s poller stops after the first 401. Admin mutations are **optimistic**: local state is updated first, then the API is called fire-and-forget (`.catch(console.error)`). Public tracking (`handleTrackShipment`): quote IDs (`QR…`) first, then local context/mock lookup, then `GET /api/track/:id` (PII-masked per the settings), then the `DXP-SAMPLE`/`7K2M9QRX` sample fallback. TrackResult re-polls every 8 s. `simulationEngine` no longer ticks. It broadcasts updates across tabs through localStorage key `dxp_live_shipment_stream`.

**Server progress.** `server/progress.ts` advances `progress_percent` and the map position on every read, based on elapsed time. It imports `src/services/{routingEngine,planningEngine,geocodingService}.ts`, so those files are **shared with Node** and must stay DOM-free.

**Where tracking IDs are created.** They're created in six places, and each one makes its own ID: `server/routes/shipments.ts:216` (fallback only), `server/routes/quotes.ts:258`, `AdminDataContext.tsx:464` & `:688` (the REBRAND_MAP line numbers are stale), `CreateShipmentView.tsx:332–338` (`DXP-2026-` + 8 chars), `ShipPage.tsx:181`, and `planningEngine.ts:630` (`DXP-RTO-…`). **The client usually generates the ID and the server accepts it** (`POST /api/shipments` takes `body.trackingNumber` and returns 409 on collision, even on the public, unauthenticated route). Piece suffixes are inconsistent: `-01`, `-PL01`, `-CTR01`, `-FR01`, `-DOC01`, `-PET01`, and piece ids `-P1`. `/api/track` does exact matching only. There's no normalisation and no child→parent resolution. Other IDs: quotes `QR-2026-#####`, docs `BOL/LBL/INV/REC/INS-2026-#####`.

**Admin auth.** A single shared password, checked with `bcrypt.compare` against `ADMIN_PASSWORD_HASH` (`server/routes/auth.ts`, rate-limited to 20 per 15 min). On success, `req.session.isAdmin = true`. The session uses the default in-memory store: cookie `dxp.sid`, httpOnly, sameSite=lax, secure in production, 12 h, trust proxy 1. Because the store is in memory, **every restart or redeploy logs everyone out.** `requireAdminAuth` gates routes, and for writes it also checks `Origin` against `ALLOWED_ORIGIN` (**one** value) plus the localhost origins. Mixed public/admin routers (shipments, quotes, documents) gate per route; settings and stats are gated at the mount. The login page does a full page reload afterwards.

**DB.** `node:sqlite` (Node ≥ 22.5) at `<cwd>/data/duolingo_express.db`, hard-coded, WAL mode, foreign keys on. **No `DB_PATH` env var exists yet**, although DEPLOYMENT.md assumes one. The schema is created in `initDatabase()` with try/catch `ALTER` migrations, and the default `general` settings are inserted only if missing. `seedDatabaseIfEmpty()` runs **unconditionally**: it seeds if `DXP-2026-7K2M9QRX` is absent. There is **no `SEED_DEMO_DATA` flag.** `ADMIN_PROXY_TARGET` mode (a separate admin deployment that proxies `/api` and uses an in-memory DB) is how the admin subdomain was deployed last time.

**Fragile / worth knowing**
- **DEPLOYMENT.md doesn't match the code.** It expects `DB_PATH`, `SEED_DEMO_DATA` and `/api/diag/storage`. None of them exist, so all three have to be built. The DB currently lives inside the deploy folder, which a redeploy may wipe.
- Renaming the seed's flagship ID makes the seed re-run on existing DBs. Removing the seed needs the flag.
- Hosting admin on `private.` as an alias of the same app needs `ALLOWED_ORIGIN` to accept **both** origins, or every admin write gets a 403.
- Renaming the `dxp.sid` cookie or the `dxp_live_shipment_stream` key is harmless (it just logs everyone out once), but those names must change together with the logout `clearCookie`.
- There are many `'New York'/'NY'` and `'August 24, 2026'` fallback defaults in the server insert paths. The `ET|CT|MT|PT` timestamp parsing is duplicated in `track.ts` and `shipments.ts`.
- The schema columns (`*_state`, `*_zip`, `*_lbs`) are U.S.-shaped. They stay as they are (rule 10); the worldwide work has to map onto them.
- `CreateShipmentView.tsx` is 4,030 lines and `DocumentCenterView.tsx` is 1,967 lines. Edit them surgically.
- The tree has old git history (`duolingo-express` remote). `package-lock.json` is modified, and `images/` is untracked.
