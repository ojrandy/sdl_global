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
- [~] 0.1 Create a new GitHub repo for SDL (don't keep pushing to the old `duolingo-express` repo). Copy the code across without the old git history. *Repo `ojrandy/sdl_global` exists (remote `sdl`), but it still has the old history; fresh-history step pending.*
- [x] 0.2 Copy `CLAUDE.md` to the repo root and all other docs into `/docs`.
- [x] 0.3 Run `npm install` and `npm run dev`; confirm the existing site, tracking, admin login, shipment creation, documents and quotes all work (this is the baseline that must never regress). *API + build verified by Claude; browser checks confirmed by owner 2026-09-26.*
- [x] 0.3b Codebase walkthrough: read App.tsx, the main pages, server routes and db.ts; write a short "system notes" summary at the bottom of this tracker so future sessions start with context.

### Baseline (re-run 2026-09-26 on commit `6b8185f`, Node 22.14.0, npm 11.6.2)
The first baseline ran on older code (`0ae1ff4`). `main` then gained 11 upstream commits, so it was re-run. The owner's servers (Vite :3000, `npm start` :5000) were left alone. Tests ran against an **isolated API instance** (tsx, port 5055, scratch DB, test-only password, `SEED_DEMO_DATA=true`). Neither `.env` nor `data/` was touched.

| Check | Result | How verified |
|---|---|---|
| `npm install` (+ postinstall build) | PASS | 0 vulnerabilities |
| `npm run build` | PASS, 0 TS errors, 2 warnings | (1) esbuild CSS: orphan declarations with no selector at `src/pages/TrackResultPage.css:242`, so those styles are dead today; (2) main JS chunk 1,710 kB (456 kB gzip) > 500 kB, since nothing is code-split |
| Fresh DB init + demo seed | PASS | seeded only because `SEED_DEMO_DATA=true` |
| Public pages load | PASS (HTTP) | `/` 200 on Vite :3000 and on the built app :5000. **Visual render not checked, needs a browser** |
| Track demo shipment | PASS | `GET /api/track/DXP-2026-7K2M9QRX` 200; name/email masked; unknown ID 404 |
| Admin login | PASS | wrong pw 401, right pw 200, session `isAdmin:true`; admin routes 401 without a session |
| Create shipment (admin) | PASS | 201 with 2 pieces; duplicate ID 409 |
| Track new shipment publicly | PASS | 200; status update → IN_TRANSIT, event added |
| Trash / restore | PASS | delete → public 404 → listed in trash → restore → public 200 |
| Piece-label lookup (`…-01`) | 404 (current behaviour) | known gap, fixed in 1.8 |
| Documents | PASS (API) | `POST /api/documents/generate` 201; admin list requires a session. **PDF download is client-side (jspdf), needs a browser check** |
| Quote request → admin | PASS | 201 (`QR-2026-#####`), appears in the admin list, public lookup 200 |
| Settings | PASS | public GET 200; PUT without a session 401 |
| Stats (admin) | PASS | 200 |
| `/api/diag/storage` | responds, **unauthenticated** | returns the server's data path; see System notes |

**Browser checks (owner, 2026-09-26): PASS.** Pages render; `#/admin` login UI; admin Create Shipment wizard; document PDF download; quote form UI.
- [ ] 0.4 Take "before" screenshots of every page → `screens/before/`.
- [x] 0.5 Owner drops SDL images into `Public/images/sdl/` using the names in `BRAND_GUIDE.md §8`.
- [~] 0.6 Owner supplies logo files (full-colour, white/reversed, icon-only) → `Public/brand/`. *Derived from `logo.jpeg` (transparent, white, icon); vector/SVG originals still wanted.*

## Phase 1 — Brand foundation (no visual redesign yet)
- [~] 1.1 Create `src/config/brand.ts` with every value from `CLAUDE.md §2`; replace hard-coded brand strings with imports. *brand.ts created; admin host, admin title and all public contact/social/licence values now read from it. The remaining old-brand strings are replaced in their own tasks (1.4–1.7, Phase 3).*
- [x] 1.2 Extract the colour palette from the SDL logo (BRAND_GUIDE §4), then write the tokens into `src/styles/tokens.css`.
- [x] 1.3 Rename token prefix `--dxp-*` → `--sdl-*` and class prefix `dxp-` → `sdl-` across `src/` (~59 files, 63 tokens).
- [x] 1.4 Replace `logo.png`, footer logo, favicon, apple-touch-icon; add `site.webmanifest` and OG image.
- [x] 1.5 Update `index.html`: title, description, Open Graph/Twitter tags, theme-color, canonical (CONTENT.md §1).
- [x] 1.6 Update `package.json` name → `sdl-global-logistics`; rename DB file default `duolingo_express.db` → `sdl_global.db` (server/db.ts, server/index.ts, .env.example).
- [x] 1.7 Replace all emails with `info@sdlgloballogistics.com` (defaults in `server/db.ts` settings, Header, Contact, PublicQuoteResult, Admin Settings).
- [x] 1.8 Implement the new tracking-ID generator (`DLS` + 5 chars = 8 total) as ONE shared util; replace all 6 generators (see REBRAND_MAP §3). *The server assigns every ID; clients adopt it. Tests: `npm test`.*
- [x] 1.9 Update tracking input validation, placeholders and help text to the new 8-character format.
- [x] 1.10 Replace demo data (`src/data/mockShipments.ts`, `server/seed.ts`) with SDL-branded, worldwide demo shipments using DLS IDs. *Both build from `src/shared/demoData.ts` (Lagos→London air, Shanghai→Rotterdam sea, Dubai→Nairobi air, Houston→Rotterdam sea).*
- [x] 1.11 Replace the other ID prefixes: seals, support tickets, invoices, returns (REBRAND_MAP §3). *`src/shared/references.ts`; returns done in the 1.8 follow-up.*
- [x] 1.12 Sweep: `grep -rniE "duolingo|dxp|dex\b" --exclude-dir=node_modules .` → only allowed hits remain (list them in REBRAND_MAP §6). *Listed in REBRAND_MAP §7 "Allowed hits"; `nationwide`/`interstate`/US hits are logged there as deferred to 2.x/3.x.*

## Phase 2 — Worldwide operations
- [x] 2.1 Replace the U.S. hub data with the global gateway network (CONTENT.md §9) in `HomeNetworkMap`, `FacilityNetworkMap`, `LocationsPage`.
- [ ] 2.2 `geocodingService.ts`: add a `GLOBAL_GATEWAY_DATABASE` (city, country, ISO code, lat/lng, IANA time zone); keep Nominatim for free-text; stop assuming `state`/`zip`.
- [ ] 2.3 `routingEngine.ts`: when OSRM cannot route (different continents/oceans), draw air/sea legs as great-circle arcs instead of failing.
- [x] 2.4 Rename `USJourneyMap` → `JourneyMap` (component + CSS + imports); remove "interstate/highway" wording.
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
- [x] 4.1 Optimise all SDL images (WebP + JPG fallback, max 2400px wide hero, ≤ 250 KB each where possible).
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
- [ ] 6.4 SEO: per-page titles/descriptions, `robots.txt`, `sitemap.xml`, OG image, structured data (Organization). **Blocker for go-live:** the OG image URL is absolute (`https://sdlgloballogistics.com/brand/og-image.jpg`) and only works once the domain serves the site; verify it with DEPLOYMENT.md §7 before announcing the launch.
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
| 4 | Confirm the global gateway list (CONTENT.md §9). **Now live on Home, Locations and Contact** from `src/data/gateways.ts`; edit that file (and CONTENT §9) if anything changes. Accra (ACC) has no trade lane in §9, so it shows no lane on the maps. | 2.1 |
| 5 | Year founded / real stats (shipments, countries, years) or approve removing stat blocks | 3.2, 3.4 |
| 6 | Real customer testimonials + permission, or approve removing the section | 3.14 |
| 7 | Real partner/carrier logos you're authorised to show, or approve removing the strip | 3.14 |
| 8 | Certifications/licences you actually hold (e.g. IATA, customs broker licence, ISO) | 3.2, 3.4 |
| 9 | Social media links | 3.1 |
| 10 | ~~Admin subdomain name~~ **Resolved: `private.sdlgloballogistics.com`** | 7.3 |
| 11 | Lawyer review of legal pages | 3.11 |
| 12 | ~~Returns kept only in browser state~~ **Resolved 2026-09-28: a return is its own linked shipment row (`POST /api/shipments/:id/return`).** Still browser-only after a control action: `statusMessage`, the audit log and the hold "frozen" flag (no columns). Decide whether to persist them. | 1.8 follow-up |
| 13 | Public site shows demo shipments from the client mock (`App.tsx` looks up `mockShipments` before the API), even when the DB has no demo data. Remove with the demo data before launch. | 6.7 |
| 14 | Contact form: the "Gateway" field (pre-filled by "Contact this gateway") only shows on the ticket confirmation; the form still sends nothing to the server. Decide where gateway enquiries should go. | 2.1, 3.10 |

## Decisions log
| Date | Decision |
|---|---|
| 2026-09-26 | Brand: SDL Global Logistics Ltd; email info@sdlgloballogistics.com; worldwide coverage. |
| 2026-09-27 | Admin session cookie renamed `dxp.sid` → `sdl.sid` (owner approved signing everyone out once). |
| 2026-09-27 | ~~Demo shipments keep their current routes until Phase 2: position labels come from `US_METRO_DATABASE`, so intercontinental demo routes would show US city names. Revisit in 1.10 once 2.2/2.3 land.~~ **Superseded 2026-09-28: owner asked for worldwide demo routes now (1.10).** |
| 2026-09-28 | Demo data uses worldwide routes (owner request). To keep in-transit labels honest, `findNearestMetro` returns nothing beyond ~3° from a US metro, so the last known label is kept instead of a wrong US city. The map's estimated-position marker still follows the road-routing geometry (Phase 2, 2.2/2.3). Admin UI shows "Administrator"; new records store it; existing "Super Admin" values are not rewritten (shown via `displayOperator`). |
| 2026-09-27 | Public `/api/track` only accepts DLS IDs (400 for anything else). Records created before the DLS format stay reachable in the admin console. |
| 2026-09-27 | The server assigns every tracking ID: `POST /api/shipments` and quote conversion ignore any `trackingNumber` in the body (the public route must not let callers pick IDs). Admin create, quick create, the Ship page and quote conversion now wait for the server and use its ID. If the server fails, nothing is added locally and an error is shown (previously a local-only shipment appeared with an ID the server never saved). |
| 2026-09-28 | Returns are real shipments: each return gets its own shipment row and server-assigned DLS ID, linked both ways (`return_leg_json` on the original, `return_of_tracking` on the return). One return per shipment; a return can't itself be returned (409). Columns added, none renamed. |
| 2026-09-26 | Keep the four existing service lines (Priority Express, Scheduled Linehaul/Freight, Vehicle Transport, Secure Vault). |
| 2026-09-26 | Palette to be derived from the SDL logo. |
| 2026-09-26 | Tracking ID = `DLS` + 5 characters, 8 total. |
| 2026-09-26 | All pages rebranded, including admin and generated documents. |
| 2026-09-26 | Admin console lives only at private.sdlgloballogistics.com (replaces the old `dr.` subdomain). |
| 2026-09-26 | Admin subdomain is an alias of the same app, domain and API as the public site. The separate `ADMIN_PROXY_TARGET` deployment mode is not used. (The Origin/CSRF check that needed `ALLOWED_ORIGIN` was already removed upstream in `dd47754`.) |
| 2026-09-26 | Owner's source images are in `images/` at the project root. They are processed into `Public/` in Prompts 03–04. Existing site images that have no SDL replacement are **kept** (Phase 4 deletes only the images that were actually replaced, plus the old logos). |
| 2026-09-26 | Piece labels use one format for every piece type: base ID + `-NN` (e.g. `DLS7K2M9-01`). The `-PL`, `-CTR`, `-FR`, `-DOC` and `-PET` suffixes are retired. A search for a piece label resolves to its parent. |
| 2026-09-26 | Tagline is **"Fast, Safe, Reliable"** (from the logo), replacing "Moving the world, one promise at a time". Updated in BRAND_GUIDE §2 and CONTENT §1.1/§1.3. The Home hero H1 (CONTENT §2.1) also uses it: "Fast, Safe, **Reliable.**" (owner confirmed). |
| 2026-09-26 | Images: use the supplied SDL images as they are (AI artwork, logo lettered "SOL" in places). Every card photo is a 1:1 square so cards line up at one height. Gaps are filled with CC0/public-domain photos (sources in `images/free-cc0/SOURCES.md`); existing site photos without a replacement are kept. Real staff photos replace the AI people when the owner supplies them. Home hero: owner-supplied `landingimage.png` (web) and `landingimage-mobile.png` (mobile), confirmed. |
| 2026-09-26 | Logo: transparent, white and icon versions are derived from `images/logo.jpeg` by `scripts/optimize-images.mjs` until vector files are supplied. |
| 2026-09-26 | Public contact values resolve as: admin Settings (DB, editable without a deploy) → `src/config/brand.ts` → empty. Empty phone / address / social / licence values hide their element (`src/utils/useCompanyContact.ts`); where a phone line would disappear, the email is shown instead. |
| 2026-09-26 | Admin opens only when `hostname === ADMIN_HOST` (`private.sdlgloballogistics.com`, exact match) or via `#/admin` on localhost/127.0.0.1. The admin page adds `<meta name="robots" content="noindex, nofollow">` at runtime and uses the title "SDL Operations Console". The session cookie stays host-only (no `Domain`), so the admin session is never shared with the public domain. |
| 2026-09-26 | Palette approved: Primary = graphite from the logo black, Accent = SDL red (500 = logo red `#D3070B`), Ink 950 = `#141414`. Old orange → accent, navy → ink, brand blue → primary; Tailwind blues stay as the semantic info colour. Status badges: in transit = info (blue), delivered = success (green). |
| 2026-09-26 | Demo shipments stay available (rebranded to SDL in 1.10) during the rebrand. They are removed before launch (see 6.7). |
| 2026-09-26 | `DB_PATH`, `SEED_DEMO_DATA` and `/api/diag/storage` already exist (upstream commits). Prompt 09 / task 1.6 only renames the default DB file and puts `/api/diag/storage` behind `requireAdminAuth`. |

## Change log
| Date | Task | Note |
|---|---|---|
| 2026-09-26 | 0.3b | Codebase walkthrough; System notes added at the bottom of this file. |
| 2026-09-26 | 0.3 | Baseline recorded: install/build pass (2 warnings), all API flows pass; browser-only checks pending owner. No code changed. |
| 2026-09-26 | 0.3 / 0.3b | Re-ran the baseline and rewrote the System notes for `6b8185f` (11 upstream commits landed after the first pass). Local branch `sdl-rebrand` created. |
| 2026-09-26 | 0.3 | Owner confirmed the browser checks. Baseline complete. |
| 2026-09-26 | 4.1 / 0.5 / 0.6 | Prompt 04: `scripts/optimize-images.mjs` builds `Public/brand/*` (transparent/white logo, mark, favicon, apple-touch, OG) and `Public/images/sdl/*` (WebP+JPG, square cards); `<ResponsiveImage>` added; 4 CC0 gap photos in `images/free-cc0/`. Not wired into pages yet. |
| 2026-09-26 | 1.1 (partial) + admin host | Prompt 05: `src/config/brand.ts`, `useCompanyContact`; `isAdminHost()` reads `ADMIN_HOST`; robots noindex + console title on admin; fake phones/addresses/USDOT/social links removed or hidden across Header, Footer, Home, Contact, Help, Quote, PublicQuoteResult, Track, TrackResult, About, Legal, Locations, Services. Build passes; login + host-only Secure cookie verified on a `private.` Host header (production mode). |
| 2026-09-26 | 1.2 / 1.3 | Prompt 07: new `tokens.css` (--sdl-* per BRAND_GUIDE §4.1 + rgb triplets + role aliases); 1,258 token refs remapped, 500 hard-coded brand hexes and 197 rgba values moved to the palette (CSS via var(), TS/TSX via literal hex for Leaflet/SVG/jsPDF), 610 `dxp-`/orange class renames across 71 files, 19 CSS header comments rebranded. Build passes; Home / Track Result / Admin checked at 375 and 1440 against before screenshots. |
| 2026-09-26 | 0.2 | Docs are in the repo (`CLAUDE.md` at the root, the rest in `/docs`). |
| 2026-09-27 | 1.8 / 1.9 | Server-authoritative IDs (see Decisions); normaliser keeps a `-NN` piece suffix and accepts Unicode dashes; `parsePieceLabel()`; `src/shared` in `tsconfig.server.json`; `npm test` (8 tests); Track page tells "bad format" apart from "not found". Verified on a scratch DB: 15 API checks, forced-collision retry, admin wizard → public track by `dls xxx-xx - 01`, Ship page booking. |
| 2026-09-28 | 1.8 follow-up | Server IDs now use `crypto.randomInt` (BRAND_GUIDE §7; the shared generator takes a random source). Returns are stored: `POST /api/shipments/:id/return` creates the return as its own shipment (new DLS ID, route and parties swapped, pieces relabelled) in one transaction; new columns `return_leg_json` / `return_of_tracking`; public page links both ways; `applyReturnToOrigin` removed from planningEngine. Verified: 15 API checks incl. 401/400/404/409, public lookup of the return's piece label, return from the admin control modal on a DB created before the migration. |
| 2026-09-28 | 1.10 / 1.11 | Reference IDs via `src/shared/references.ts` (SDL-SL / SDL-TKT / SDL-INV + 6 digits; server default seal too; invoice auth ref stable per document; support ticket no longer re-rolls on render). Demo data rewritten from `src/shared/demoData.ts` (4 worldwide shipments, 2 quotes, 1 ocean BOL; Demo names, example.com, no phones). "Super Admin" → "Administrator" (UI + new records), "SDL Operations Centre" public facility, "SDL Intake Desk" default sender, Tacoma presets and personal-demo comments removed, US-only nearest-metro labels capped. `npm test` 13/13. Verified on a fresh DB with SEED_DEMO_DATA=true passed per process (`.env` unchanged, flag stays off): 10 API checks, all four demo IDs tracked in the browser with no old strings, admin shows Administrator, 0 page errors. |
| 2026-09-28 | 1.12 | Phase 1 sweep (REBRAND_MAP §7) on source and a fresh build. Last 35 "Duolingo Express" strings in 9 public pages now read from `brand.ts` (name only, no new copy; the invented testimonial no longer names a brand, pending 3.14). localStorage keys `dxp_*` → `sdl_*` (recent tracking, admin draft, live stream: each resets once). Old brand removed from two comments (auth.ts, db.ts). Remaining hits are all in the Allowed table (legacy settings migration in db.ts, negative tests, docs, binary false positives, local WAL). `npm run build` passes, `npm test` 13/13. |
| 2026-09-28 | 2.1 / 2.4 | Global gateway network: `src/data/gateways.ts` (18 gateways + 15 lanes from CONTENT §9) drives HomeNetworkMap, FacilityNetworkMap and LocationsPage. World view, great-circle lanes split at the antimeridian (`src/utils/greatCircle.ts`), live local time per gateway (`useNow`), Home section uses CONTENT §2.7 copy/stats (invented hub metrics removed). Invented facility phones, addresses and hours removed; "Contact this gateway" opens Contact with the gateway pre-selected. `USJourneyMap` → `JourneyMap` (component, CSS, import), its interstate/highway wording removed. Verified: build passes; headless Chrome at 375px and 1440px on Home, Locations and Contact pre-fill, no console errors, no horizontal overflow. |
---

## System notes (codebase walkthrough, updated 2026-09-26 for commit `6b8185f`)

**Shape.** One Node process. `server/index.ts` (Express 5) serves `/api/*` and the built SPA from `dist/`. Dev: Vite on :3000 proxies `/api` to Express on :5000. Build: `tsc` (src) → `vite build` → `tsc -p tsconfig.server.json` → `dist-server/`.

**Routing.** No router library. `src/App.tsx` keeps `currentPage` in state and syncs it with `location.hash` (`#/services`, `#/track/:id`, `#/quote/:id`). `getInitialPage()` resolves the first paint synchronously; a `hashchange` effect handles the rest. `KNOWN_PAGES` is the allow-list. Admin: `isAdminHost()` = `hostname.startsWith('dr.')` → always `admin`. On localhost, `#/admin` also opens admin; anywhere else `#/admin` falls back to Home. The admin bundle is statically imported, so it ships to every public visitor.

**Frontend ↔ API.** `src/services/api.ts` holds relative `fetch('/api/...')` calls. `AdminDataProvider` (`src/context/AdminDataContext.tsx`) wraps the **whole** app, public pages included. It starts from `MOCK_SHIPMENTS`, then replaces them with server data. Public visitors get 401s, so they keep the mocks, and the 12 s poller stops after the first 401. Status updates, settings saves and deletes now await the server and roll back on failure. Shipment creation and quote conversion are still fire-and-forget (`AdminDataContext.tsx:871`, `:739`). Public tracking: quote IDs (`QR…`) first, then local context/mock lookup, then `GET /api/track/:id` (PII-masked, including email), then the `DXP-SAMPLE`/`7K2M9QRX` fallback. The public site also reads company contact info from `GET /api/settings`. `simulationEngine` only broadcasts across tabs through localStorage key `dxp_live_shipment_stream`.

**Server progress.** `server/progress.ts` advances progress and the map position on every read. It imports `src/services/{routingEngine,planningEngine,geocodingService}.ts`, so those files are **shared with Node** and must stay DOM-free.

**Where tracking IDs are created.** *(Updated 2026-09-27, tasks 1.8/1.9: IDs are now allocated only by `server/trackingIds.ts` via `src/shared/trackingId.ts`; the clients adopt the server's ID; piece labels are always `DLSxxxxx-NN`; `/api/track` normalises input and resolves child labels. The rest of this note describes the state before that.)* Six places, each making its own ID: `server/routes/shipments.ts:216` (fallback only), `server/routes/quotes.ts:258`, `AdminDataContext.tsx:528` & `:752`, `CreateShipmentView.tsx:337` (`DXP-2026-` + 8 chars), `ShipPage.tsx:181`, and `planningEngine.ts:638` (`DXP-RTO-…`). **The client usually generates the ID and the server accepts it** (`POST /api/shipments` takes `body.trackingNumber`, returns 409 on collision, even on the public, unauthenticated route). Piece suffixes are inconsistent (`-01`, `-PL01`, `-CTR01`, `-FR01`, `-DOC01`, `-PET01`; piece ids `-P1`). `/api/track` does exact matching (case-insensitive) with no child→parent resolution.

**Admin auth.** A single shared password, checked with `bcrypt.compare` against `ADMIN_PASSWORD_HASH` (rate-limited to 20 per 15 min). It sets `req.session.isAdmin`. Session store is in memory: cookie `dxp.sid`, httpOnly, sameSite=lax, secure in production, 12 h, trust proxy 1. **Every restart or redeploy logs everyone out.** `requireAdminAuth` is now a plain session check; the Origin/CSRF check was removed (`dd47754`), so CSRF protection relies on SameSite=lax alone. Shipments, quotes, documents and settings gate per route; stats is gated at the mount.

**DB.** `node:sqlite` (Node ≥ 22.5) at `DB_PATH`, or `<cwd>/data/sdl_global.db` if unset. WAL mode, foreign keys on. The schema is created in `initDatabase()` with try/catch `ALTER` migrations (incl. `deleted_at_ts` for soft delete). The seed runs **only** when `SEED_DEMO_DATA=true` **and** the shipments table is empty. Shipment delete is soft (trash); `/permanent` hard-deletes from the trash.

**Fragile / worth knowing**
- **`/api/diag/storage` is public** and returns the server's absolute data path. Gate it (Prompt 09) and remove it after the persistence check.
- **`GET /api/settings` is public** and returns the whole settings object, including `signatureStampUrl`, `signatoryName`, `defaultFuelSurchargeRate` and `hubSortStatus` once they are set. Consider returning only the public fields.
- `ADMIN_PROXY_TARGET` mode is still in the code but unused under the same-app decision. Candidate for removal.
- The `dxp.sid` cookie, the `dxp_live_shipment_stream` key and the logout `clearCookie` must be renamed together. Renaming them logs everyone out once.
- Many `'New York'/'NY'` and `'August 24, 2026'` fallback defaults sit in the server insert paths. The `ET|CT|MT|PT` timestamp parsing is duplicated in `track.ts` and `shipments.ts`.
- Schema columns (`*_state`, `*_zip`, `*_lbs`) are U.S.-shaped. They stay (rule 10); the worldwide work maps onto them.
- `CreateShipmentView.tsx` (4,030 lines) and `DocumentCenterView.tsx` (1,967 lines): edit surgically.
- The repo still carries the old history (22 commits), and it was pushed to `sdl` (`ojrandy/sdl_global`). `origin` still points at the old `duolingo-express` repo. `screens/` (~11 MB) is tracked.
