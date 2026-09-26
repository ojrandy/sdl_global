# SDL Global Logistics — Prompt Pack for Claude in VS Code

Copy **one prompt at a time** into Claude in VS Code, in order. Wait until Claude reports back and you've checked the
result before sending the next one. Every prompt assumes `CLAUDE.md` is at the project root and the other docs are in `/docs`.

**How to use this pack**
- One prompt = one chat turn. When a prompt says **STOP**, Claude should report back and wait.
- Look at the site in your browser (`npm run dev` → http://localhost:3000) after every prompt.
- If something breaks, use **Prompt F1 (Fix)** at the bottom before moving on.
- Starting a fresh chat later? Send **Prompt R (Resume)** first.
- Big prompts (marked 🧭) work best in **Plan mode**: Claude shows its plan first, and you approve it.

**Admin console:** `https://private.sdlgloballogistics.com` (production) · `http://localhost:3000/#/admin` (local)

---

## STAGE A — Foundations

### Prompt 00 — Orientation (no code changes)
```
You are a senior full-stack developer who has just taken over an existing, fully working logistics platform for a client, SDL Global Logistics Ltd. The system is already built: public website, tracking engine, Express + SQLite API, admin console, PDF documents, quotes and bookings. Your job is to rebrand and improve it, NOT to rebuild it.

Before touching any code:
1. Read CLAUDE.md, then every file in /docs (PROJECT_TRACKER, BRAND_GUIDE, CONTENT, REBRAND_MAP, MOTION_3D_SPEC, DEPLOYMENT, PROMPTS).
2. Walk through the codebase: package.json, vite.config.ts, index.html, src/App.tsx (routing + isAdminHost), src/main.tsx, the pages in src/pages, src/components, src/services, src/context/AdminDataContext.tsx, and server/ (index.ts, db.ts, seed.ts, routes/).
3. Write a "System notes" section at the bottom of docs/PROJECT_TRACKER.md (max ~40 lines) covering: how routing works, how the public site talks to the API, where shipments/tracking IDs are created, how admin auth works, where the DB lives, and anything fragile you noticed.

Do NOT change any other file. STOP and report: (a) a short summary of how the system works, (b) any risks you see for the rebrand, (c) any questions for me.
```

### Prompt 01 — Baseline test
```
Run the existing system and record the baseline before we change anything.
1. Run `npm install` then `npm run dev`. Fix nothing yet. If it fails to start, report the exact error and STOP.
2. Confirm each of these works and record pass/fail in PROJECT_TRACKER (Phase 0): public pages load; tracking a demo shipment; admin login at #/admin; creating a shipment in admin; tracking that new shipment publicly; downloading a document PDF; submitting a quote request and seeing it in admin.
3. Run `npm run build` and record whether it passes and any warnings.
4. Tick tasks 0.3 and 0.3b in the tracker and add a Change log entry.
This baseline must never regress. STOP and report the results.
```

### Prompt 02 — Git safety net
```
Set up version control safely before editing.
1. Show me `git status` and `git remote -v`.
2. Confirm .gitignore excludes node_modules/, dist/, dist-server/, /data/, .env, *.local.
3. Create a branch `sdl-rebrand` and commit the current state (docs included) as "chore: add SDL project docs and baseline notes".
4. Do NOT push, and do NOT change remotes. I'll create the new SDL GitHub repo myself; tell me the exact commands I'll need to point this project at it (fresh history, per DEPLOYMENT.md §2).
STOP and report.
```

### Prompt 03 — Image inventory & mapping (no image changes yet)
```
I've put the new SDL images in the project's image folder. Find it (look under Public/ first, then the project root) and list every file with its dimensions, file size and format.

Then:
1. Identify which files are logos (full colour / white / icon) and which are photos.
2. Propose a mapping table: each image → which page/section it should be used on and its target name from BRAND_GUIDE.md §8. Base it on what each photo actually shows. Open and look at each image to decide.
3. List any slots in BRAND_GUIDE §8 that have no suitable image, and any images left unused.
4. Draft alt text for each photo (describe what's actually in it).
Do not move, rename or convert anything yet. STOP and show me the table for approval.
```

### Prompt 04 — Optimise & place images
```
Using the mapping I approved, prepare the images (originals stay untouched in their folder as a backup):
1. Logos → Public/brand/ as sdl-logo (full colour), sdl-logo-white, sdl-mark. Keep SVG if we have it; otherwise high-res PNG with transparency.
2. Generate favicon.png (512×512), apple-touch-icon.png (180×180) and og-image.jpg (1200×630) from the logo/brand.
3. Photos → Public/images/sdl/<target-name>, each as WebP plus a JPG fallback, in widths 640/1024/1600/2400 (never upscale). Aim for ≤ 250 KB at 1600w. Use `sharp` as a devDependency if needed.
4. Create a small reusable <ResponsiveImage> component (picture + srcset + width/height + lazy loading by default, eager for heroes) in src/components/.
5. Update the alt text table in CONTENT.md §12 with the approved alt text.
Don't wire the images into pages yet. Build must pass. Commit "assets: add optimised SDL images and logos". STOP and report sizes before/after.
```

### Prompt 05 — Brand config + admin on private subdomain 🧭
```
Tracker tasks 1.1 and the admin host change.
1. Create src/config/brand.ts as the single source of truth: COMPANY, LEGAL_NAME ("SDL Global Logistics Ltd"), EMAIL ("info@sdlgloballogistics.com"), DOMAIN ("sdlgloballogistics.com"), ADMIN_SUBDOMAIN ("private"), TRACKING_PREFIX ("DLS"), PHONE/WHATSAPP/HQ_ADDRESS (empty strings until I supply them), SOCIAL links (empty), TAGLINE.
2. Change isAdminHost() in src/App.tsx so the admin opens ONLY on private.<domain> (read from brand.ts), never on the public domain. Keep #/admin working on localhost/127.0.0.1 only. Make sure #/admin on the public domain falls back to Home, as today.
3. On the admin host, set <meta name="robots" content="noindex, nofollow"> at runtime and a separate document title "SDL Operations Console".
4. Make sure the server's session cookie still works when the site is served from private.sdlgloballogistics.com (same app, same origin for its own API calls). Don't set a cookie domain that would share the admin session with the public domain.
5. Any UI element that would show an empty phone/address/social value must hide itself.
Build, test admin login locally, update the tracker, commit "rebrand: brand config and private admin subdomain". STOP and report.
```

### Prompt 06 — Colour palette from the logo
```
Tracker task 1.2. Follow BRAND_GUIDE.md §4 exactly.
1. Extract the colours from Public/brand/sdl-logo (SVG fills, or dominant colours from the PNG).
2. Propose Primary, Accent and Ink roles plus full 50–900 scales, with a contrast check (text on white, text on Ink 950, button text on Primary/Accent). Show the numbers.
3. Render a quick preview for me: a temporary HTML swatch page in /tmp or a scratch route. Don't commit it.
Do not edit tokens.css yet. STOP and show me the proposed palette for approval.
```

### Prompt 07 — Re-theme the design system 🧭
```
Tracker tasks 1.2 (apply) and 1.3, using the palette I approved.
1. Write the new tokens into src/styles/tokens.css using the --sdl-* names in BRAND_GUIDE §4.1. Map every old --dxp-* token to its closest new role (orange → accent; navy → ink; blue → primary/info as appropriate).
2. Rename --dxp-* → --sdl-* across src/ in one scoped pass; rename .dxp-admin-* → .sdl-admin-*, .corp-highlight-orange → .sdl-highlight, text-orange → text-accent.
3. Keep shipment status colours semantic (success/warning/danger/info), not brand colours.
4. Replace CSS header comments that mention the old brand.
Don't change layouts. Build must pass. Visually check Home, Track Result and Admin dashboard at 375px and 1440px and list anything that looks off. Commit "rebrand: SDL design tokens". STOP and report.
```

### Prompt 08 — Logo, favicon, metadata
```
Tracker tasks 1.4 and 1.5.
1. Replace every logo reference (see REBRAND_MAP §5): header (colour, or white over the dark hero), mobile drawer, footer (white), admin sidebar, document previews, public quote print. Use brand.ts for alt text.
2. index.html: favicon (bump the cache-bust query), apple-touch-icon, site.webmanifest, theme-color from the palette, default title/description/OG/Twitter tags from CONTENT.md §1.1, canonical https://sdlgloballogistics.com/.
3. Add a small per-page title/description updater in App.tsx using the CONTENT.md §1.1 table.
4. Delete the old logo/favicon files and the unused root images listed in REBRAND_MAP §5.
Build, check, commit "rebrand: logos, favicon and metadata". STOP and report.
```

### Prompt 09 — Names, emails, package & database file
```
Tracker tasks 1.6 and 1.7.
1. package.json name → sdl-global-logistics; add "engines": { "node": ">=22.5" }; regenerate package-lock.json with npm install.
2. Rename the default DB file duolingo_express.db → sdl_global.db in server/db.ts, server/index.ts and .env.example. Don't change tables or columns. My local data/ folder can start fresh; tell me if I need to delete anything.
3. Replace all dispatch@duolingoexpress.com defaults with brand.ts EMAIL (server/db.ts settings defaults, Header, Contact, PublicQuoteResult, SettingsView, AdminLayout).
4. The /api/health service name → "SDL Global Logistics API". The server start log → SDL.
5. Protect /api/diag/storage with requireAdminAuth (don't delete it yet; we need it on Hostinger).
Build, run, confirm the app creates the new DB and everything from the baseline still works. Commit "rebrand: package, database file and contact defaults". STOP and report.
```

### Prompt 10 — New tracking ID system (DLS, 8 characters) 🧭
```
Tracker tasks 1.8 and 1.9. Follow BRAND_GUIDE.md §7 exactly. This touches core logic, so be careful and thorough.
1. Create ONE shared module (e.g. src/shared/trackingId.ts) with: generateTrackingId() → "DLS" + 5 chars from 23456789ABCDEFGHJKLMNPQRSTUVWXYZ using crypto randomness; normalizeTrackingInput() (trim, uppercase, strip spaces/dashes, but keep a -NN piece suffix); isValidTrackingId() with regex ^DLS[2-9A-HJ-NP-Z]{5}$; parsePieceLabel() for DLSXXXXX-01 style. Make sure both tsconfig.json and tsconfig.server.json include it.
2. Replace all six generators listed in REBRAND_MAP §3.1. The server is the authority: generate there, check uniqueness against the DB, retry on collision. The client generators become previews at most.
3. Returns get a new DLS ID linked to the original (planningEngine.ts); remove the RTO- prefix scheme.
4. Validate in server/routes/track.ts: 400 for malformed, 404 for not found; child piece labels resolve to the parent.
5. Update lookups/placeholders/help text (REBRAND_MAP §3.2–3.3): "8-character tracking ID, e.g. DLS7K2M9".
6. Add a tiny test script (node --test or a tsx script) covering generate/validate/normalise/piece parsing.
Build, run the tests, then create a shipment in admin and track it publicly. Commit "feat: DLS 8-character tracking IDs". STOP and report.
```

### Prompt 11 — Other references + demo data
```
Tracker tasks 1.10 and 1.11.
1. Replace the reference prefixes per BRAND_GUIDE §7: seals SDL-SL-######, tickets SDL-TKT-######, invoices SDL-INV-######, the DLS····· placeholder, and the SDL SECURE VAULT badge.
2. Rewrite server/seed.ts and src/data/mockShipments.ts as SDL demo data with DLS IDs and worldwide routes (e.g. Lagos→London by air, Shanghai→Rotterdam by sea, Dubai→Nairobi by air, Houston→Rotterdam by sea). Use fictional names like "Demo Consignee". Remove every personal/old demo reference (e.g. "Randy's Tacoma").
3. The public facility label "Super Admin Operations Desk" → "SDL Operations Centre". In the admin UI, show "Administrator" instead of "Super Admin". Leave already-stored audit values alone.
4. "Duolingo Logistics Intake" → "SDL Intake Desk".
Build, test with SEED_DEMO_DATA=true on a fresh local DB, then set it back. Commit "rebrand: reference IDs and SDL demo data". STOP and report.
```

### Prompt 12 — Old-brand sweep checkpoint
```
Tracker task 1.12. Run the sweep commands in REBRAND_MAP.md §7 across source AND a fresh production build (dist/, dist-server/).
List every remaining hit with file:line. Fix all that are brand leftovers; for anything that must legitimately stay, add it to the "Allowed hits" table with a reason. Tick the finished items in REBRAND_MAP.
Build must pass. Commit "rebrand: phase 1 sweep". STOP and report the final counts.
```

---

## STAGE B — Worldwide operations

### Prompt 13 — Global gateway network data 🧭
```
Tracker tasks 2.1 and 2.4.
1. Create src/data/gateways.ts from CONTENT.md §9 (code, name, city, country, ISO, lat, lng, IANA time zone, modes) plus the trade-lane list.
2. Rewire HomeNetworkMap, FacilityNetworkMap and LocationsPage to use it instead of the U.S. hub data. Show a world view, great-circle arcs for lanes, and each gateway's live local time on Locations.
3. Remove the invented facility phone numbers. Gateway contact buttons go to the Contact page with the gateway pre-filled.
4. Rename USJourneyMap → JourneyMap (component, CSS, imports); remove interstate/highway wording.
Keep Leaflet. Build, check the maps on mobile and desktop, commit "feat: global gateway network". STOP and report.
```

### Prompt 14 — Geocoding, routing & time zones 🧭
```
Tracker tasks 2.2, 2.3 and 2.5.
1. geocodingService.ts: add the gateway table as an offline fallback; stop assuming state/ZIP (make them optional, add country + ISO); keep Nominatim for free text.
2. routingEngine.ts: if OSRM can't route (different continents/sea) or the leg mode is air/sea, draw a great-circle arc instead; road legs keep OSRM. The shipment's current position must still interpolate correctly along mixed legs.
3. Time: replace the ET/CT/MT/PT parsing in server/routes/track.ts and shipments.ts with IANA time zones; display local time + UTC offset. Existing stored events must still display.
4. Don't break the simulation engine. Test it with a Lagos→London (air) demo shipment and a Houston→Rotterdam (sea) one.
Build, test tracking of the mixed-mode demos, commit "feat: worldwide geocoding, routing and time zones". STOP and report.
```

### Prompt 15 — Forms, units & currency
```
Tracker tasks 2.6, 2.7 and 2.8, across Quote, Ship and admin Create Shipment.
1. Addresses: country selector first (searchable list), then fields that fit it: "State/Region" optional, postcode optional, phone with country code.
2. Units: kg/cm by default with a lb/in toggle; store one canonical unit in the DB and convert for display.
3. Currency: default USD, admin Settings can switch display currency (USD/NGN/GBP/EUR); format with Intl.NumberFormat.
4. Service mode labels: Air Freight / Ocean Freight / Road where relevant.
Existing records must still load. Build, test all three forms end to end, commit "feat: international forms, units and currency". STOP and report.
```

---

## STAGE C — Content & images (copy comes ONLY from docs/CONTENT.md)

### Prompt 16 — Header & footer
```
Tracker task 3.1. Apply CONTENT.md §1.2 and §1.3 to Header, mobile drawer and Footer, keeping the current layout.
Use brand.ts for all contact values; hide empty ones. Footer year is computed. Social icons appear only when a URL exists.
Build, check at 375/768/1440, commit "content: header and footer". STOP and report.
```

### Prompt 17 — Home page copy & images 🧭
```
Tracker tasks 3.2, 3.14 and 4.2 (Home). Apply CONTENT.md §2 section by section (2.1–2.13) into the existing HomePage markup. Keep the layout and components.
- Wire the approved SDL images with <ResponsiveImage> (hero eager, the rest lazy).
- Replace the invented testimonials with Option A "Our commitments" (§2.10) and the client logos with "Modes we connect" (§2.11).
- Remove every unverifiable number; only show stats marked as confirmed.
- The barcode demo uses DLS7K2M9.
Build, check at 375/768/1440, list anything that doesn't fit the layout, commit "content: home page". STOP and report.
```

### Prompt 18 — Services & About
```
Tracker tasks 3.3 and 3.4. Apply CONTENT.md §3 (Services) and §4 (About) into the existing pages, with the approved images.
Items marked [confirm] in CONTENT.md: implement the text but collect them in a list for me. If a stat or timeline depends on {{YEAR_FOUNDED}} or real dates, hide it until provided.
Build, check, commit "content: services and about". STOP and report, including the [confirm] list.
```

### Prompt 19 — Locations, Track & Track Result
```
Tracker tasks 3.5 and 3.8. Apply CONTENT.md §5 and §6 (track page, loading screen lines, track-result labels and status names, support modal).
Status names and mode labels ("By air / By sea / By road") must also be updated wherever the admin sets them, so public and admin stay consistent.
Use the approved track images. Build, then track a demo shipment in each status, commit "content: network and tracking pages". STOP and report.
```

### Prompt 20 — Quote, Ship, Help, Contact
```
Tracker tasks 3.6, 3.7, 3.9 and 3.10. Apply CONTENT.md §7 and §8 into the existing pages and flows. Success messages use the new SDL-TKT reference format.
Build, submit each form once end to end, commit "content: quote, ship, help and contact". STOP and report.
```

### Prompt 21 — Legal, documents & admin strings
```
Tracker tasks 3.11, 3.12 and 3.13.
1. Legal: restructure the tabs per CONTENT.md §13 (Privacy, Terms, Shipping Terms, Cookies, Accessibility) with plain-language drafts. Put a visible "Last updated" date and leave {{JURISDICTION}} as a clearly marked TODO in the code comment (hidden in the UI).
2. Generated documents (ShipmentDocuments, DocumentCenterView, CreateShipmentView previews/PDFs): apply CONTENT.md §11. Check that every PDF shows only SDL branding.
3. Admin: apply CONTENT.md §10 (login, sidebar, role label, settings defaults).
Build, download one of each document type, commit "content: legal, documents and admin". STOP and remind me the legal pages need a lawyer's review.
```

---

## STAGE D — 3D & motion (follow docs/MOTION_3D_SPEC.md strictly)

### Prompt 22 — Performance baseline & code-splitting
```
MOTION_3D_SPEC §2. Before adding any motion:
1. Measure: production build bundle sizes per chunk, and Lighthouse mobile for Home/Track/Services (run `npm run build && npm start`, then Lighthouse CLI or Chrome DevTools). Record the numbers in the tracker.
2. React.lazy the admin app so public visitors never download it; lazy-load the Leaflet maps when they enter the viewport; load jspdf/html2canvas only when a document is generated.
3. Re-measure and record before/after.
Nothing may change visually or functionally. Commit "perf: code-split admin, maps and PDF tools". STOP and report.
```

### Prompt 23 — Motion foundation
```
Tracker task 5.1. Create src/motion/ exactly as described in MOTION_3D_SPEC §4: useReducedMotion, useReveal, useTilt, useParallax, useCountUp, optional SmoothScroll (Lenis), and motion.css with the reduced-motion overrides.
Add Lenis only if it doesn't interfere with Leaflet maps or modals (maps get data-lenis-prevent; pause while modals are open; disabled on touch and reduced motion).
Apply only to the Home "Why SDL" cards as a proof. Build, test with OS reduced-motion on and off, commit "feat(motion): motion foundation". STOP and report.
```

### Prompt 24 — Hero 3D globe 🧭
```
Tracker task 5.2. Build the hero globe per MOTION_3D_SPEC §6: three + @react-three/fiber v8 (React 18), lazy-loaded after load/idle, static hero-globe-fallback image in the same framing (zero layout shift), device/reduced-motion/Save-Data/WebGL gating, a single-draw-call dotted earth, gateway markers and trade-lane arcs from src/data/gateways.ts with travelling light pulses, brand colours read from CSS tokens, rendering paused off-screen and when the tab is hidden, full disposal on unmount, aria-hidden canvas.
Report the 3D chunk size (gzip, must be ≤ 200 KB) and the frame time on a throttled CPU (4× slowdown). Commit "feat(3d): hero globe". STOP and report.
```

### Prompt 25 — Home page motion
```
Tracker tasks 5.3–5.6 for Home. Apply the Home table in MOTION_3D_SPEC §5 section by section: reveals, tilt, parallax, count-ups, the self-drawing "How it works" path, the industries 3D crossfade, the barcode label straightening + scan sweep, the modes marquee and the FAQ height animation. Only animate transform/opacity. Build, test reduced motion, commit "feat(motion): home page". STOP and report.
```

### Prompt 26 — Motion on other pages + Track Result
```
Tracker tasks 5.3–5.7 for the other pages, per MOTION_3D_SPEC §5 "Other pages": hero parallax + headline stagger everywhere; services tier transitions; locations arc animation; track loading screen mini globe (CSS/SVG only); Track Result map entrance tilt that settles flat, marker pulse, air/sea dashed arcs, sequential timeline reveal, passport card 3D flip. No decorative motion in admin.
Check that Leaflet click/drag accuracy is unaffected. Build, commit "feat(motion): site-wide motion and tracking visuals". STOP and report.
```

### Prompt 27 — Performance & accessibility pass
```
Tracker task 5.8 and MOTION_3D_SPEC §7. Measure against the §2 budget (Lighthouse mobile Home ≥ 85 performance, ≥ 95 accessibility, LCP ≤ 2.5 s, CLS ≤ 0.05, INP ≤ 200 ms). Fix what fails, largest wins first. Run the whole §7 motion QA checklist and tick it. Commit "perf: final performance and accessibility pass". STOP and report before/after numbers.
```

---

## STAGE E — QA & launch

### Prompt 28 — Full QA, SEO & final sweep
```
Phase 6 of the tracker.
1. Final old-brand sweep (REBRAND_MAP §7) on source + fresh build = zero unexplained hits.
2. Full functional run: create shipment (admin) → track publicly → change statuses → documents → quote → accept → ship booking → contact → callback.
3. Cross-browser/device notes (tell me what I need to test manually on my phone).
4. SEO: robots.txt, sitemap.xml (public pages only, never the private admin host), Organization structured data, per-page titles, OG image.
5. Accessibility: keyboard navigation, focus states, alt text, contrast.
Commit "chore: QA and SEO". STOP and give me a launch-readiness report with anything still waiting on me.
```

### Prompt 29 — Hostinger deployment prep
```
Phase 7 prep per DEPLOYMENT.md. Don't deploy anything yourself; prepare and instruct.
1. Confirm the production build + `npm start` works locally with NODE_ENV=production.
2. Produce the exact env var list for Hostinger, and give me the commands to generate ADMIN_PASSWORD_HASH and SESSION_SECRET.
3. Write me a step-by-step checklist for hPanel: connect the GitHub repo, Node version, install/build/start commands, persistent DB_PATH, adding sdlgloballogistics.com + www + private.sdlgloballogistics.com (as an alias of the SAME app), SSL, force HTTPS.
4. List the post-deploy smoke test (DEPLOYMENT §7), including verifying the admin opens only on private.sdlgloballogistics.com and that /api/diag/storage persists across a redeploy.
STOP. After I confirm persistence works, I'll ask you to remove the diag endpoint.
```

---

## Utility prompts

### Prompt R — Resume in a new chat
```
Resume work on the SDL Global Logistics rebrand. You are the senior developer on this existing, working system. Read CLAUDE.md and docs/PROJECT_TRACKER.md (including System notes and the Change log), check `git status` and `git log --oneline -10`, then tell me: what's done, what's in progress, and the next task. Don't change anything until I confirm.
```

### Prompt F1 — Fix something that broke
```
Something broke: [describe what you see, the page, the steps, and any error message].
Investigate like a senior developer: reproduce it, find the root cause (check the most recent commits first), and explain it to me before fixing. Then apply the smallest fix that doesn't change unrelated behaviour, confirm the baseline flows still work, and commit "fix: …". Log it in the tracker.
```

### Prompt F2 — Owner info arrived
```
Here is new business information: [phone / WhatsApp / address / year founded / socials / certifications / real testimonials].
Add it to src/config/brand.ts (or CONTENT.md for copy), unhide the related UI, move the item out of "Blocked / Needs owner" in the tracker, build, and commit "content: add owner-supplied details".
```

### Prompt F3 — Review before a milestone
```
Do a code review of everything on this branch since [commit/tag] as a strict senior reviewer: correctness, broken flows, security (admin host isolation, auth, exposed endpoints), performance budget, leftover old branding, and anything invented that isn't in the docs. List the findings by severity, and fix only after I approve.
```
