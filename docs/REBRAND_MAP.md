# Rebrand Map: every old-brand trace and what replaces it

> **Context:** The SDL platform is **already built and working**: public website, tracking engine, Express/SQLite API,
> admin console, documents and quotes. Claude is acting as a **senior professional developer** who has taken over this
> existing codebase to rebrand and improve it. Nothing here is built from scratch; every task modifies the working system
> in place and must leave it working. See `CLAUDE.md §0`.

**Approach:** this is surgical editing of an existing, working codebase: targeted replacements, not rewrites. Build and re-test after each group of files.

Audit taken from the `duolingo-express` repo on 2026-09-26. When you work through an item, tick it and note the commit.

---

## 1. Strings → replacements

| Old | New | Notes |
|---|---|---|
| `Duolingo Express Logistics LLC` | `SDL Global Logistics Ltd` | Legal, footer, documents |
| `Duolingo Express` / `DUOLINGO EXPRESS` | `SDL Global Logistics` / `SDL` | Follow BRAND_GUIDE §1 |
| `Duolingo Logistics Intake` | `SDL Intake Desk` | CreateShipmentView.tsx:1151 default sender |
| `duolingoexpress.com` | `sdlgloballogistics.com` | |
| `dispatch@duolingoexpress.com` | `info@sdlgloballogistics.com` | server/db.ts default settings, Header, Contact, PublicQuoteResult, Admin Settings, AdminLayout |
| `duolingo_express.db` | `sdl_global.db` | server/db.ts, server/index.ts, .env.example (see DEPLOYMENT §4) |
| `duolingo-express` (package name) | `sdl-global-logistics` | package.json + regenerate package-lock.json |
| `Duolingo Express Waterproof (Legal) Pouch` | `SDL Tamper-Evident Document Pouch` | CreateShipmentView.tsx |
| `Duolingo Express Commercial Linehaul Highway Hauler` | `SDL Freight Vehicle` (image alt) | TrackResultPage.tsx:616 |
| `Duolingo Express Dedicated Linehaul Division` | `SDL Freight & Linehaul` | |
| `DUOLINGO EXPRESS CORPORATE DESIGN SYSTEM` (CSS header comments) | `SDL Global Logistics design system` | tokens.css, many CSS headers |
| `NATIONWIDE COURIER NETWORK` badge | `WORLDWIDE LOGISTICS NETWORK` | Home hero |
| `Super Admin Operations Desk` (shown publicly as a facility) | `SDL Operations Centre` | TrackResultPage.tsx:425 |
| `Super Admin` (admin UI labels) | `Administrator` | Admin UI only; don't change stored audit values in existing data |
| `1-800-555-0199` and other placeholder phones | value from `brand.ts` | FacilityNetworkMap.tsx (×5+), settings defaults |
| `One World Trade Center, Suite 8500, New York…` | value from `brand.ts` (TBD) | ContactPage.tsx:30 default |
| Social links `#facebook` … | real URLs from `brand.ts`, or hide the icon | Footer.tsx:113–117 |

## 2. Files containing "Duolingo" (54 files, ~130 hits)

**Highest counts first:**
- [ ] src/admin/pages/DocumentCenterView.tsx (13)
- [ ] src/App.tsx (13)
- [ ] src/pages/PublicQuoteResultPage.tsx (9)
- [ ] src/pages/HomePage.tsx (9)
- [ ] src/admin/pages/CreateShipmentView.tsx (7)
- [ ] src/pages/AboutPage.tsx (6)
- [ ] src/pages/ShipPage.tsx (5)
- [ ] src/pages/LegalPage.tsx (5)
- [ ] src/components/Header.tsx (5)
- [ ] src/admin/pages/SettingsView.tsx (5)
- [ ] src/components/Footer.tsx (4)
- [ ] server/index.ts (4)
- [ ] server/db.ts (3)
- [ ] src/pages/TrackPage.tsx, ServicesPage.tsx, QuotePage.tsx, ContactPage.tsx (2 each)
- [ ] src/components/ShipmentDocuments.tsx, src/admin/AdminLayout.tsx (2 each)
- [ ] server/seed.ts, server/routes/shipments.ts, index.html, .env.example (2 each)
- [ ] 1 hit each: routingEngine.ts, planningEngine.ts, geocodingService.ts, TrackResultPage.tsx, main.tsx,
      mockShipments.ts, AdminDataContext.tsx, SupportModal.tsx, TrackingEventsView.tsx, EditShipmentModal.tsx,
      server/routes/documents.ts, package.json
- [ ] 1 hit each in CSS header comments: TrackResultPage.css, ServicesPage.css, HomePage.css, AboutPage.css,
      USJourneyMap.css, TrackingLoadingScreen.css, TrackingEventsView.css, SettingsView.css, QuoteRequestsView.css,
      OperationsCenter.css, DocumentCenterView.css, CreateShipmentView.css, AllShipmentsView.css,
      ShipmentControlModal.css, RecentlyDeletedModal.css, EditShipmentModal.css, DeleteShipmentModal.css,
      AdminLogin.css, AdminLayout.css

## 3. Identifier prefixes (`DXP-`), 64 occurrences in 19 files

### 3.1 Tracking-ID generators: replace them all with the ONE shared `generateTrackingId()`
Shared module: `src/shared/trackingId.ts` (generate, normalise, validate, `parsePieceLabel`, `pieceLabel`); server allocator with DB uniqueness check + retry: `server/trackingIds.ts`. Tests: `npm test` (`scripts/trackingId.test.ts`).
- [x] `server/routes/shipments.ts:216`: `DXP-2026-${Math.random()…}` (the **server** generator is the authority; add a uniqueness check). *Always generates; a client-sent ID is ignored.*
- [x] `server/routes/quotes.ts:258`: quote → shipment conversion. *Always generates; a client-sent ID is ignored.*
- [x] `src/context/AdminDataContext.tsx:528` and `:752`. *No longer generate: they send a draft and adopt the ID the server returns.*
- [x] `src/admin/pages/CreateShipmentView.tsx:337`. *Shows `DLS·····` until the server assigns the ID.*
- [x] `src/pages/ShipPage.tsx:181`. *Uses the server-assigned ID.*
- [x] `src/services/planningEngine.ts:638`: return-to-origin → a new DLS ID linked to the original (BRAND_GUIDE §7). *`RTO-` gone; see tracker Blocked #12 (the return leg is never persisted).*

### 3.2 Lookup and matching
- [x] `src/App.tsx:308`: sample/alias matching (`DXP-SAMPLE`, `7K2M9QRX`) → normalise input (BRAND_GUIDE §7) and match `DLS` IDs and child labels
- [x] `src/data/mockShipments.ts:304–409`: alias map keys
- [x] `server/routes/track.ts`: add the normaliser + regex validation before the DB lookup (return 400 for a malformed ID, 404 for not found)

### 3.3 Display, placeholders, help text
- [x] `src/pages/TrackPage.tsx` (2), `HomePage.tsx:1040/1044` (barcode demo), `HelpPage.tsx:52/59` (the "16-character" text → "8-character"), `ContactPage.tsx:80/268`, `SupportModal.tsx:71`, `TrackResultPage.tsx:141` (fallback), `TrackingEventsView.tsx:130–132` (default selection → first shipment). *TrackPage also separates "not a tracking ID" (format help) from "not found".*
- [x] Type comments: `src/types/shipment.ts:62`, `src/types/admin.ts:71/98`

### 3.4 Other references
- [ ] Seals `DXP-SEAL-892401` → `SDL-SL-######`: CreateShipmentView.tsx:173, 615, 2631, 2667
- [ ] Tickets `DXP-SPT-` (SupportModal.tsx:59), `DXP-TKT-` (ContactPage.tsx:55) → `SDL-TKT-######`
- [ ] Invoice auth ref `DXP-CORP-PAY-4091` → `SDL-INV-######` (DocumentCenterView.tsx:1368)
- [ ] `DXP-AUTOGEN-REGISTER` → `DLS·····` (CreateShipmentView.tsx:4021)
- [ ] `DXP SECURE LINEHAUL` badge → `SDL SECURE VAULT` (ServicesPage.tsx:584)

### 3.5 Demo data
- [ ] `server/seed.ts` (17 hits) and `src/data/mockShipments.ts` (14 hits): rewrite as SDL demo shipments with worldwide
      routes (e.g. Lagos → London by air, Shanghai → Rotterdam by ocean, Dubai → Nairobi by air). Remove the
      personal-name demo ("Randy's Tacoma") and use fictional names like "Demo Consignee".

## 4. CSS / class naming
- [x] Tokens `--dxp-*` → `--sdl-*` (63 unique tokens, 59 files). Do it with a single, scoped find-and-replace on `src/`, then build.
- [x] Classes `.dxp-admin-*` → `.sdl-admin-*` (AdminLayout and its CSS). *All `dxp-` class prefixes were renamed to `sdl-` in the same pass.*
- [x] `.corp-highlight-orange` → `.sdl-highlight`; `text-orange` → `text-accent`. *Other `*-highlight-orange` page classes (about-, contact-, …) keep their names; they now render red.*
- [ ] Optional (Phase 5 cleanup): rename the `corp-` section prefixes on Home to `sdl-`.

## 5. Images & static assets (`Public/`)
| Old file | Action |
|---|---|
| `logo.png` | Replace → `Public/brand/sdl-logo.svg` (update Header.tsx:96, :193, DocumentCenterView ×5, PublicQuoteResultPage:382) |
| `logo-for-footer-or-any-area-having-thesame-color-as-the-footer.png` | Replace → `Public/brand/sdl-logo-white.svg` (Footer.tsx:102, AdminLayout.tsx:128) |
| `favicon.png` | Replace (index.html uses `/favicon.png?v=2`; bump to `?v=3`) |
| `Automotive & Parts.jpg`, `E-Commerce & Retail.jpg`, `Healthcare & Pharma.jpg` (root of Public, unused duplicates) | Delete |
| `images/home/*.jpg` (3) | Replace with `images/sdl/industry-*.jpg` (HomePage.tsx:573, 625, 651, 747, 769, 791) |
| `images/services/*.jpg` (3) | Replace with `images/sdl/service-*.jpg` |
| `images/tracking/truck_highway_hero.jpg` | Replace with `images/sdl/track-result-vehicle.jpg` (TrackResultPage.tsx:615) |
| `images/tracking/toyota_tacoma_hero.jpg` | Delete (tied to the old demo) |
| `screens/*` | Old reference screenshots; move out of the repo or into a private folder before the repo goes public |

## 6. Invented content to remove or replace (public trust and legal risk)
- [ ] **Testimonials** (HomePage.tsx:93–111): "Jessica Morgan / Apex", "David Vance", "Marcus Sterling". These are invented people. Replace with real, permissioned quotes, or swap the section for "Our commitments" (CONTENT.md §2.10).
- [ ] **Client logos** (ClientLogos.tsx: Titan, Kroma, Synthex, Voltix, Blackwood, Aeris, Norva, Zenith): invented brands presented as clients. Replace with real partners you're authorised to show, or with the "Modes we connect" strip (CONTENT.md §2.11).
- [ ] **Hard stats** (HomePage.tsx:863–871 "142 Trucks/Day", "48,000 Pcs/Hour", "1.4 Hours"; :994–1002 "0.001s", "100%", "Zero"; "YEARS OF…" at :499): keep only numbers SDL can verify.
- [ ] **Certification claims** ("CERTIFIED" badge, "Certified Quality Standards"): keep only certifications SDL actually holds.

## 7. Final sweep (the Phase 6 gate)

```bash
# Must return nothing:
grep -rniE "duolingo|dxp|nationwide|interstate" --exclude-dir={node_modules,dist,dist-server,.git} .
# Review each hit manually:
grep -rniE "\bUSA\b|United States|\bU\.S\.|1-800|555-01" src server
# Check built output and metadata:
grep -rli "duolingo" dist dist-server
```

**Allowed hits (document each here):**
| Hit | Why it's allowed |
|---|---|
| | |
