# Resume Portfolio Site — Design Spec

**Author**: Om Kshirsagar (brainstormed with Claude)
**Date**: 2026-06-02
**URL target**: `omkshirsagar.github.io`
**Status**: Pending user review

---

## 1. Overview

A personal portfolio site that replaces the traditional resume PDF. Built to be:

1. **QR-share ready** for conferences, meetups, business cards — a recruiter scanning at an event can understand who Om is in **10 seconds**.
2. **Cinematic and memorable** for visitors who want depth — a 45-second scroll-driven 3D "journey movie" tells the career story in a way no other engineer's portfolio does.
3. **Deployable on GitHub Pages** as a static user site at `omkshirsagar.github.io`.

The site has two routes:

| Route | Purpose | Stack |
|---|---|---|
| `/` | Static, fast, recruiter-friendly landing page. Replaces the resume PDF. | HTML + CSS + minimal JS |
| `/journey` | Cinematic 3D scroll-driven "journey movie" (~45s). Optional immersive experience. | WebGPU + React Three Fiber + TSL |

Both routes consume the same source-of-truth data file: `data/portfolio.yml`.

The "journey" route is **lazy-loaded** — the static page can be visited without paying the WebGPU cost. A graceful fallback message appears if the browser doesn't support WebGPU.

---

## 2. Architecture at a glance

```
                     ┌─────────────────────┐
                     │  data/portfolio.yml │
                     │  (single source of  │
                     │   truth, ~1300 LoC) │
                     └──────────┬──────────┘
                                │
              YAML import (Astro / Vite, build-time)
                                │
                                ▼
                     ┌─────────────────────┐
                     │  Typed data object  │
                     │  (zod-validated)    │
                     └──────────┬──────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
        ┌──────────────┐                  ┌──────────────────────┐
        │  /           │                  │  /journey            │
        │  Astro page  │                  │  Astro page +        │
        │  (zero JS,   │  ── CTA link ──▶ │  React Island        │
        │   static)    │                  │  (WebGPU + R3F)      │
        └──────────────┘                  └──────────────────────┘
              │                                   │
              └────────── Astro build ────────────┘
                                │
                                ▼
                  ┌───────────────────────────┐
                  │  GitHub Pages (dist/)     │
                  │  via GitHub Actions       │
                  │  → omkshirsagar.github.io │
                  └───────────────────────────┘
```

**Key principles**:
- Data is decoupled from presentation. Edit YAML → both routes update.
- **The static page ships zero JS by default** (Astro). Fully functional with JS disabled.
- The journey is opt-in (CTA) and hydrates a single React island, never blocks main content.
- Everything ships as static files. No backend.

---

## 3. Data layer

### 3.1 Source — dual-file (whitelabel)

Two files, ONE master, ONE public:

| File | Role | Committed? | Names |
|---|---|---|---|
| `data/portfolio.local.yml` | Master with real client names, real codenames, full context | ❌ **gitignored** | Global pharmaceutical manufacturer · US healthcare diagnostics provider · the client's flagship product · "internal engineering program" · the assistant |
| `data/portfolio.yml` | Anonymized, industry-descriptive, safe-for-public | ✅ committed | "Global pharmaceutical manufacturer" · "US healthcare diagnostics provider" · generic terms |

The public version is generated from the master by running `scripts/whitelabel.py` (a Python script applying a small set of regex transformations — preserves YAML comments + formatting). The script fails the build if any real client name leaks through (safety check at the end).

**Anonymization rules applied** (see `scripts/whitelabel.py` for the canonical list):

| Real | Anonymized |
|---|---|
| `Global pharmaceutical manufacturer` | `Global pharmaceutical manufacturer` |
| `US healthcare diagnostics provider` | `US healthcare diagnostics provider` |
| `the client's flagship product` | `the client's flagship product` |
| `"Assistant"` (agent persona) | `"Assistant"` |
| `` (program codename) | _(removed; "SOP" alone remains)_ |
| `Databricks Engineer (external collaborator)` | `Databricks Engineer (external collaborator)` |
| Project IDs `takeda-*`, `exact-*` | Domain-prefix + use-case-suffix: `pharma-workflow-platform`, `pharma-supply-chain-modeling`, `healthcare-voice-assistant`, `healthcare-policy-platform` |
| Engagement IDs `takeda`, `exact-sciences` | `pharma-client`, `healthcare-client` |

**`Deloitte` itself is kept** — public knowledge (LinkedIn), not protected.

**Workflow**: Om edits `portfolio.local.yml` only. After changes, runs `npm run whitelabel` (or `python3 scripts/whitelabel.py`) which regenerates `portfolio.yml`. Git pre-commit hook should remind / run automatically if not done.

### 3.2 Source — single-file consumer (build)

`data/portfolio.yml` (the anonymized public file) — what the site actually reads at build time. ~1300 lines, 14 top-level sections. Single source of truth FOR THE BUILD.

_(table below applies to the structure of either file — they share the same schema.)_

| Section | Purpose |
|---|---|
| `personal` | Name, role, location, contact, voxel avatar specs |
| `professional_identity` | Multiple framings (tagline, bio, elevator pitch, narrative) |
| `education` + `academic_highlights` | Degree + curated summary |
| `certifications` | (Currently TODO — placeholder slot on site) |
| `career` (with `phases` + `title_progression`) | Employer + chronological phases + official title progression |
| `career_milestones` | 12 "firsts" — the journey movie's narrative spine |
| `engagements` | Client/program drill-downs (Global pharmaceutical manufacturer · SOP · US healthcare diagnostics provider) |
| `growth_trajectory` | 6 engineering personas (Backend → Platform → Cloud → Full Stack → AI → AI Platform) |
| `leadership_without_title` | 6 evidence-backed informal-leadership behaviors |
| `recognition_summary` + `categorized_achievements` | Aggregated identity view |
| `leadership_stories` | 7 STAR-format case studies |
| `engineering_profile` | The recurring pattern: identify → build → prove → adopt |
| `projects` | 14 entries (training + 2 Global pharmaceutical manufacturer + SOP-program + 7 SOP children + 2 Exact + AI Resume Builder), most with rich `deliverables` arrays |
| `achievements`, `skills`, `publications`, `research_profile`, `open_source`, `hackathons`, `leadership`, `awards`, `interview_stories`, `technology_inventory` | Self-explanatory |

### 3.3 Loading & validation

- **Build-time**: Astro uses Vite under the hood; we configure `vite-plugin-yaml` in `astro.config.mjs` so `import data from '../../data/portfolio.yml'` returns a plain JS object. No runtime parsing.
- **Validation**: A `zod` schema (in `src/data/schema.ts`) validates the parsed YAML at build time. Any schema violation fails the build → prevents broken deploys.
- **Types**: Schema generates TypeScript types via `z.infer<>`. All components consume typed data.
- **Selectors**: Small selector functions in `src/data/select.ts` extract derived views (e.g., `featuredProjects()`, `careerArc()`, `recognizedItems()`). Astro components and React islands both call selectors — never traverse raw YAML.
- **Privacy filter**: `load.ts` strips any `public: false` entries before exposing the data to components (defensive — prevents private notes from leaking into the bundle).

### 3.4 Privacy

The PUBLIC YAML (`data/portfolio.yml`) is committed to the **public** `OmKshirsagar.github.io` repo. Defense in depth:

1. **Whitelabel script** (§3.1) anonymizes client names, codenames, and IDs.
2. Sections marked `public: false` (currently only `interview_stories`) are also filtered out at build time before bundling.
3. The MASTER YAML (`data/portfolio.local.yml`) lives only on Om's machine — `.gitignored` so never reaches GitHub even by accident.
4. The script does a final regex scan and fails loudly if any real client name slipped through.

If extra-sensitive context is ever needed (salary, NDA-bound architectural details), put it in `data/private.yml` (also `.gitignored`) — separate from the anonymized portfolio.

---

## 4. Static page (`/`)

### 4.1 Section order (top to bottom)

1. **Top bar** — minimal logo (`om.kshirsagar`) + "Open to senior + staff roles" status pill
2. **Hero** (split layout):
   - **Left**: kicker (`// Full Stack AI Engineer · Mumbai`), name with italic surname, role + "PROMOTED · JUN 2026" badge, 1-line tagline, primary `★ Watch my journey →` CTA + secondary `↓ Skim resume` CTA
   - **Right**: voxel character (currently a placeholder SVG — finalised during implementation; see §6.5)
   - **Footer row**: 6 stat tiles in a horizontal row (`2yr+ at Deloitte` · `3 Awards` · `14+ Projects` · `2 Clients` · `12+ Starter Kit adoptions` · `2 Hackathons`)
3. **Selected work** — 3 editorial bands, alternating left/right layout, each with a bespoke 300×300 SVG illustration + text + 3 tech chips + "Read case study →" link:
   - Featured 1: **Real-Time Voice Assistant** (US healthcare diagnostics provider)
   - Featured 2: **FastAPI Starter Kit** (SOP)
   - Featured 3: **Sign Language → Speech** (AgentX hackathon)
4. **Career arc** — horizontal 5-cell strip showing role evolution: Training → Global pharmaceutical manufacturer → SOP → Exact → Today (Analyst, promoted Jun 2026). Color-coded per phase.
5. **Recognized** — 4-up grid of awards + promotion, with a wide "Publication" card spanning 2 cells, and a dashed-border "Certification placeholder" slot. Every card has a `⬇ Download (PDF)` link (links missing assets stay disabled).
6. **All work** — vertical timeline tree. Gradient spine on the left. 5 colored engagement nodes (Global pharmaceutical manufacturer · SOP · Exact · Hackathons · Personal), each with branching sub-project rows on the right. Featured items get `★` marker + `Featured` badge; award-winning items get the award badge.
7. **Bottom nav pill** — sticky-bottom translucent pill with glow. Sections: Home · Work · Arc · Recognized · More · Contact. Active state updates on scroll.
8. **Footer** — `Get in touch.` heading + 4 contact buttons (GitHub, LinkedIn, Email, Journey) + a QR-share callout (mocked QR + "Built for conferences, meetups, inline biz cards. Scan → glance in 10 seconds.")

### 4.2 Visual language

- **Background**: dark navy (`#08080d` → `#0a0a14`) with a peach radial glow top-center and a subtle SVG noise overlay.
- **Accents**: `#ffd29a` (warm cream — primary accent), `#ff9460` (orange — secondary), `#5a4870` (dusk purple — career arc), `#5af3d0` (cyan — hackathon/innovation).
- **Typography**:
  - Display: `Inter` 800 weight with `-0.04em` letter-spacing
  - Italic accent: `Fraunces` 400 (used on surname + section em-titles)
  - Meta / monospace: `JetBrains Mono` 500-700
  - Body: `Inter` 400-500
- **Iconography**: Bespoke SVG icons throughout. No icon fonts, no stock packs.
- **Texture**: SVG-generated noise overlay (`<feTurbulence>`) for warmth.

### 4.3 Components

| Component | Purpose |
|---|---|
| `<TopBar />` | Logo + status pill |
| `<Hero />` | Name, role, tagline, CTAs, character placeholder, stats footer row |
| `<FeaturedBand featured={...} variant="left"|"right" />` | Editorial band for one featured project |
| `<CareerArc phases={...} />` | Horizontal 5-cell strip |
| `<RecognizedGrid awards={...} publication={...} certs={...} />` | 4-up + wide publication + dashed cert slot |
| `<WorkTimeline engagements={...} />` | Vertical tree with engagement dots + sub-project branches |
| `<BottomNav sections={...} />` | Sticky-bottom in-page nav pill |
| `<Footer contact={...} />` | Heading + buttons + QR callout |

All components consume typed props from selectors. No direct YAML traversal in components.

### 4.4 Responsive behavior

- **Desktop (≥1024px)**: 2-column hero, 3-column featured bands, full timeline tree.
- **Tablet (768–1023px)**: hero collapses to single-column (character above text), featured bands wrap to single column, stats row goes 3×2 instead of 1×6.
- **Mobile (<768px)**: everything stacks single-column. Stats grid becomes 2×3. Featured-band SVGs scale down to 200×200. Bottom nav pill shrinks to 4 most important sections.

### 4.5 Accessibility

- Semantic HTML: `<header>`, `<main>`, `<section>` per content block.
- Section headings (`<h2>`) properly nested.
- All SVG illustrations have `<title>` + `<desc>` elements for screen readers.
- All interactive elements (CTAs, nav items) are keyboard-focusable with visible focus rings.
- Color contrast ≥4.5:1 for body text, ≥3:1 for headings (WCAG AA).
- `prefers-reduced-motion` — disable any subtle animations on the static page.

### 4.6 Performance budget

- First Contentful Paint <1.0s on 3G.
- Total page weight <300KB (HTML + CSS + minimal JS). No 3D on this route.
- Lighthouse Performance score ≥95.

---

## 5. Journey movie (`/journey`)

### 5.1 The arc (locked)

12-beat scroll-driven movie, ~45 seconds total runtime. Driven by the 12 entries in `career_milestones`. Three star ★ hero scenes anchor the emotional arc.

| # | Beat | Type | Duration | Visual |
|---|---|---|---|---|
| 00 | Cold Open | 2s | flash | Black → spotlight on young voxel-Om at library desk → JETIR paper materialises |
| 01 | First Job → First Client | 5s | medium | Training cubes (HTML/CSS/JS/React/Angular) zoom past → walks into Global pharmaceutical manufacturer pharma office |
| 02 | **★ Trust Earned** | 7s | **hero** | Red-tinted office, seniors pacing, calendar red. Voxel-you steps forward. Calendar flips green. First trophy rises |
| 03 | Platform Pivot | 5s | major | 12 mismatched code-towers harmonise as voxel-you raises a Starter Kit cube; project flags pop |
| 04 | Cloud Unlock | 1s | flash | AWS cloud-hat drops onto voxel-you's head |
| 05 | CSC · Marketing AI | 1s | flash | Marketing studio: document → AI mixer → HTML + PDF + email |
| 06 | RTSC · 48-Hour POC | 2s | flash | 48:00:00 clock ticks down fast, coffee voxels stack, demo applause |
| 07 | Contract RAG Constellation | 1s | flash | Contract tower dissolves into chunk-constellation, question lights answer path |
| 08 | MCP Layer Attaches | 1s | flash | MCP layer snaps onto Starter Kit cube; tool-handles grow on every service |
| 09 | **★ Voice AI Goes Live** | 8s | **hero** | Phones ring → ACS routing → GPT Realtime crystal → AI Search library lights up → auth-key unlocks → voice response → white-label crate exits |
| 10 | Frontend Without Asking | 4s | major | RCM meeting, frontend chair empty. Voxel-you stands, sits in chair. Frontend repo cube spawns. "ALPHA RELEASE · 1 WEEK" banner |
| 11 | **★ Today (Promotion)** | 8s | **hero** | Walks to centre stage. "ANALYST" rises overhead with bloom. Camera orbits + pulls back showing all 11 prior scenes in 3D. "TO BE CONTINUED" + contact CTA |

**Total**: ~45 seconds.

### 5.2 Visual language

- **Aesthetic**: "Cinematic MagicaVoxel" — denser-than-Crossy-Road voxel geometry (more cubes per object for sculptural detail) + WebGPU/TSL post-processing (bloom, volumetric god rays, atmospheric fog, color grading, film grain, letterbox bars during hero beats).
- **Palette**: matches the static page (`#ffd29a` accent, `#ff9460` warm orange, navy backgrounds with peach light) but with scene-specific tints (red-tint = pressure scenes, gold = trophy moments, cyan = innovation).
- **Camera**: scripted dolly/orbit moves per scene. Cinematic ratios via letterbox bars on the ★ hero beats.
- **Lighting**: scene-specific. Dawn → mid-day → late-night → dawn again at the end. Establishes emotional tone.

### 5.3 Character: voxel-Om

Driven by `personal.avatar` config in YAML:

```yaml
avatar:
  skin:          "#dba577"
  hair_color:    "#1a1410"
  hair_style:    short
  glasses:       true
  shirt_color:   "#f4f1ea"
  pants_color:   "#2a3a6a"
  accent_color:  "#c8311f"   # shirt logo
```

Built procedurally in three.js via `BoxGeometry` instances (no external GLB needed). ~100–150 voxels per character. Animations: idle bob, walk cycle, point/raise-hand. Mixamo not used — character is too low-poly to need a skeletal rig. Animations are programmatic.

### 5.4 Asset compounding pattern

The "FastAPI Starter Kit cube" introduced in Scene 03 reappears as a literal voxel object in later scenes:
- Scene 08 (MCP layer attaches to it)
- Scene 09 (visible as the base layer beneath the white-labeled RTVA platform)

This visual through-line reinforces the *platform compounding* narrative without needing a dedicated callout (per user direction).

### 5.5 Scene system architecture

```
src/journey/
├── JourneyScene.tsx          # Main scene container, R3F Canvas
├── camera/
│   ├── ScrollCamera.tsx      # GSAP ScrollTrigger-driven camera path
│   └── keyframes.ts          # Camera positions/lookAts per beat
├── beats/
│   ├── 00-cold-open.tsx
│   ├── 01-first-job.tsx
│   ├── 02-trust-earned.tsx   # ★ hero
│   ├── ...
│   └── 11-today.tsx          # ★ hero, climax
├── character/
│   ├── VoxelCharacter.tsx    # Procedural voxel-Om from avatar config
│   ├── animations.ts         # Idle/walk/point procedural anim
│   └── shaders.ts            # TSL material for character (subtle pulse on hero beats)
├── primitives/
│   ├── VoxelCube.tsx         # InstancedMesh wrapper for perf
│   ├── VoxelText.tsx         # Voxel-rendered text (for "ANALYST", "PROMOTED" etc.)
│   └── VoxelTrophy.tsx       # Reused trophy mesh
├── postfx/
│   ├── bloom.ts              # TSL bloom post-pass
│   ├── godrays.ts            # TSL volumetric rays (hero beats)
│   ├── grain.ts              # Film grain
│   └── pipeline.ts           # Compose passes
└── audio/
    └── ambient.mp3           # Optional ambient track (opt-in via sound toggle)
```

**Beat contract**: each `beats/*.tsx` exports a component receiving `({ progress }: { progress: number /* 0-1 within beat */ })`. The scene container handles overall scroll → progress mapping and beat sequencing.

### 5.6 Scroll behavior

- **Driver**: GSAP ScrollTrigger or drei `<ScrollControls>` (decide during scaffolding — both work).
- **Layout**: A 1200vh tall scroll container with the WebGPU canvas pinned full-screen. As user scrolls, scroll position maps to time (0–45s).
- **Auto-play**: If the user is idle for 3 seconds, auto-scroll resumes at 1.0× pace until interaction. A small "▶ playing" indicator appears.
- **Skip controls**: A floating "skip to end" button + "back to /" button always visible.
- **Captions**: Each beat displays a short caption ("FIRST CLIENT · TAKEDA · APR 2024") synced with progress. Helps recruiters scanning quickly.

### 5.7 Browser support & fallback

- **Required**: WebGPU (Chrome 113+, Edge 113+, Safari 18+, Firefox Nightly).
- **Detection**: at route entry, check `'gpu' in navigator && await navigator.gpu.requestAdapter()`. If missing, show fallback view: a single full-screen card with "This journey requires WebGPU. Try Chrome, Edge, or Safari (latest)." + a static storyboard graphic + the "Back to resume" button.
- **No WebGL fallback** for the journey — the visual quality difference would be too jarring and we don't have time to maintain two codepaths.

### 5.8 Performance budget

- Initial JS bundle for `/journey` route: <500KB gzip (three.js is the biggest).
- Texture/asset payload: 0 (everything is procedural).
- Target frame rate: 60fps on M1 MacBook, 30fps minimum on mid-range phones.
- WebGPU compute used for particles (TSL `Fn(...)` based) — instanced mesh count scales by device tier (detected via `device.limits`).

### 5.9 Accessibility

- **`prefers-reduced-motion`**: disable scroll-driven movie entirely. Show the storyboard fallback instead.
- **Skip to content** keyboard shortcut (Tab → first focusable = "Skip journey" button).
- **Captions** are real DOM text, screen-reader-readable.
- **No essential information** in the journey that isn't also on the static page.

---

## 6. Visual language (cross-cutting)

### 6.1 Color tokens

```ts
// src/styles/tokens.ts
export const colors = {
  bg:         '#08080d',
  bgRaised:   '#11111a',
  bgSurface:  '#14141c',
  border:     '#1f1f2c',
  textPri:    '#f4f1ea',
  textSec:    '#c4b598',
  textMuted:  '#888094',
  textDim:    '#5a5566',
  accentWarm: '#ffd29a',  // primary cream
  accentOrange: '#ff9460',
  accentDusk: '#5a4870',
  accentCyan: '#5af3d0',
  accentRed:  '#c8311f',  // shirt logo + danger
  status:     '#88e07d',  // "open to roles"
};
```

### 6.2 Typography stack

```ts
// src/styles/fonts.ts
export const fonts = {
  display: '"Inter", system-ui, sans-serif',
  italic:  '"Fraunces", Georgia, serif',
  mono:    '"JetBrains Mono", ui-monospace, monospace',
};
```

Loaded via Google Fonts `<link>` in the HTML head with `font-display: swap`.

### 6.3 Motion

- Static page: minimal motion, mainly hover states + scroll-triggered fades on section entry (CSS-only).
- Journey: scripted timeline driven by scroll position.
- Respect `prefers-reduced-motion`.

### 6.4 Iconography

All SVG icons are bespoke (no Lucide, no Heroicons, no FontAwesome). Stored inline in components or in `src/icons/` for reuse. Style: 1-2px stroke lines, no fills (except hero stat-card pictograms which have small accent fills).

### 6.5 Voxel character

Two parallel representations:

| Representation | Location | Purpose |
|---|---|---|
| SVG voxel sketch | Static page hero | Lightweight placeholder, "feels like" the character |
| Three.js procedural mesh | `/journey` scenes | The real character driving the movie |

Both share the same color tokens from `personal.avatar` YAML. Designed so editing the YAML updates both (the SVG references colors via CSS custom properties).

**Future option**: replace SVG sketch with a GPT-generated portrait (or commissioned voxel art). The static page never has actual 3D rendering — the SVG is the canonical static representation.

---

## 7. Stack & dependencies

| Layer | Choice | Why |
|---|---|---|
| Meta-framework | **Astro 4+** | Ships zero JS for static content by default. Static `/` route loads instantly. Uses Vite under the hood. File-based routing replaces React Router. |
| Routing | Astro file-based | `src/pages/index.astro` → `/`; `src/pages/journey.astro` → `/journey`. No React Router needed. |
| Interactive islands | **React 18** + TypeScript via `@astrojs/react` | Only hydrated where needed (the journey canvas + any small interactive bits on `/`). |
| Styling | Astro scoped styles (`<style>` blocks in `.astro` files) + custom-properties tokens | Co-located styles, scoped automatically, no runtime cost. CSS Modules also available for React islands. Tailwind explicitly *not* used. |
| Data | `data/portfolio.yml` imported via Astro/Vite + `vite-plugin-yaml` | Build-time parse, zero runtime cost. |
| Validation | **zod** | Schema + types. Build fails on invalid YAML. |
| 3D | **three** (specifically `three/webgpu`) + **@react-three/fiber** + **@react-three/drei** | R3F declarative scenes inside a React island. drei helpers (ScrollControls, OrbitControls dev-only). |
| Shaders | **TSL** via `three/tsl` | Custom materials, post-fx, GPU compute particles. |
| Scroll choreography | **GSAP** + ScrollTrigger | Battle-tested scroll-driven animation, runs inside the journey island. (Alternative: drei ScrollControls + useScroll — decide during scaffolding.) |
| Fonts | Google Fonts CDN (or self-hosted via Astro) | Inter + Fraunces + JetBrains Mono. |
| Linting | ESLint + Prettier (Astro plugin) | Standard, Astro-aware. |
| Type-check | tsc strict mode + Astro's built-in `astro check` | Validates both `.astro` and `.tsx` files. |
| Test | Vitest (unit) + Playwright (visual regression of static page only) | The journey is too animation-heavy to snapshot-test usefully. |
| Deploy | **GitHub Actions** → GitHub Pages (modern Pages workflow, no `gh-pages` branch) | See §9 for the full deployment story. |

### 7.1 Dependency inventory (approximate)

```json
{
  "dependencies": {
    "astro": "^4",
    "@astrojs/react": "^3",
    "react": "^18",
    "react-dom": "^18",
    "three": "^0.170",
    "@react-three/fiber": "^8",
    "@react-three/drei": "^9",
    "gsap": "^3",
    "zod": "^3"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/three": "^0.170",
    "vite-plugin-yaml": "^1",
    "typescript": "^5",
    "vitest": "^2",
    "playwright": "^1",
    "eslint": "^9",
    "eslint-plugin-astro": "^1",
    "prettier": "^3",
    "prettier-plugin-astro": "^0.13"
  }
}
```

`react-router-dom`, `vite`, and `@vitejs/plugin-react` are NOT direct deps — Astro brings Vite in transitively and Astro file-based routing replaces React Router.

---

## 8. Project structure

```
OmKshirsagar.github.io/              # repo root on GitHub (renamed from current `resume/`)
├── .github/
│   └── workflows/
│       └── deploy.yml                # See §9 — Pages-native workflow, no gh-pages branch
├── astro.config.mjs                  # Astro config: integrations, vite plugins, site URL
├── data/
│   ├── portfolio.local.yml           # ⚠ MASTER (real names), gitignored, lives only locally
│   ├── portfolio.yml                 # ✓ PUBLIC (anonymized), committed, generated by whitelabel.py
│   └── private.yml                   # (optional, gitignored, for sensitive extra context)
├── scripts/
│   └── whitelabel.py                 # transforms portfolio.local.yml → portfolio.yml
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-06-02-resume-portfolio-design.md
├── public/                            # served as-is (no processing)
│   ├── favicon.svg
│   ├── og.png                         # social card for /
│   ├── og-journey.png                 # social card for /journey
│   └── downloads/
│       ├── outstanding-2024.pdf      # award letters (TODO collect)
│       ├── outstanding-2025.pdf
│       ├── applause-2025.pdf
│       ├── promotion-letter.pdf
│       └── jetir-paper.pdf
├── src/
│   ├── pages/                         # Astro file-based routing
│   │   ├── index.astro                # → /  (static, zero JS by default)
│   │   └── journey.astro              # → /journey (mounts the React island)
│   ├── layouts/
│   │   └── BaseLayout.astro           # shared <head>, fonts, OG, favicon
│   ├── components/                    # mostly .astro (static), some .tsx (islands)
│   │   ├── TopBar.astro
│   │   ├── Hero.astro
│   │   ├── HeroStats.astro
│   │   ├── VoxelOmSketch.astro        # SVG character placeholder (pure static)
│   │   ├── FeaturedBand.astro
│   │   ├── illustrations/
│   │   │   ├── RtvaIllustration.astro
│   │   │   ├── StarterKitIllustration.astro
│   │   │   └── SignLanguageIllustration.astro
│   │   ├── CareerArc.astro
│   │   ├── Recognized.astro
│   │   ├── WorkTimeline.astro
│   │   ├── BottomNav.tsx              # ← React island (needs scroll-spy interactivity)
│   │   └── Footer.astro
│   ├── islands/                       # interactive React islands hydrated on demand
│   │   └── JourneyCanvas.tsx          # the WebGPU+R3F island, loaded on /journey
│   ├── journey/                       # all journey code (see §5.5)
│   │   ├── JourneyScene.tsx
│   │   ├── camera/
│   │   ├── beats/
│   │   ├── character/
│   │   ├── primitives/
│   │   ├── postfx/
│   │   └── audio/
│   ├── data/
│   │   ├── schema.ts                  # zod schemas + types
│   │   ├── load.ts                    # imports YAML, validates, strips public:false
│   │   └── select.ts                  # derived view selectors
│   ├── styles/
│   │   ├── tokens.css                 # CSS custom properties (colors, fonts)
│   │   ├── reset.css
│   │   └── global.css
│   └── icons/                         # bespoke SVG (.astro components)
├── tests/
│   ├── data.test.ts                   # YAML schema validation
│   ├── select.test.ts                 # selector logic
│   └── home.spec.ts                   # Playwright visual regression of /
├── package.json
├── tsconfig.json
├── playwright.config.ts
├── NEXT.md                            # handoff doc (already exists)
└── README.md                          # short, points to /docs/superpowers/specs
```

---

## 9. Deployment

This section is the full, step-by-step deployment story. The goal: **anyone reading this** (including future-Om six months from now) **can take a fresh laptop and ship the site without guessing**.

### 9.1 How GitHub Pages user sites work

GitHub Pages has two flavors:

| Type | Repo name | Published URL | Path prefix |
|---|---|---|---|
| **User site** ← we're using this | `<username>.github.io` (exactly) | `https://<username>.github.io` | None (root) |
| Project site | any name | `https://<username>.github.io/<repo>/` | `/<repo>/` |

**For our case**: the repo must be named **`OmKshirsagar.github.io`** (case matches the username; URLs are case-insensitive so visitors hit `omkshirsagar.github.io`). Each GitHub account gets exactly **one user site**.

### 9.2 Astro configuration for GitHub Pages

In `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import yaml from 'vite-plugin-yaml';

export default defineConfig({
  site: 'https://omkshirsagar.github.io',   // canonical absolute URL (for OG tags + sitemap)
  base: '/',                                 // user site → root path, NOT '/repo/'
  output: 'static',                          // SSG, no SSR
  integrations: [react()],
  vite: {
    plugins: [yaml()],
  },
  build: {
    assets: '_astro',                        // hashed asset dir; default is fine
  },
});
```

**Critical details**:
- `base: '/'` — user sites serve from root. If we used a project site this would be `/repo-name/`.
- `output: 'static'` — Astro pre-renders all pages to HTML at build time (no server runtime).
- `site` is used for canonical `<link>` and OG `<meta>` tags. Hardcoded to the canonical lowercase URL.

### 9.3 Workflow file (GitHub Actions)

We use the **modern Pages-native workflow** (no separate `gh-pages` branch). The workflow uploads the `dist/` directory as a Pages artifact and Pages serves it directly.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:                          # allow manual re-deploy from Actions tab

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false                   # let in-flight deploys finish

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build                    # → produces dist/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 9.4 First-time setup checklist (one-time)

Do these in order the first time you publish. After this it's just `git push`.

1. **Create the repo on GitHub** named exactly `OmKshirsagar.github.io` (must match username case-wise). Make it **Public** — required for GitHub Pages free tier.
2. **Locally**: rename the working folder from `resume/` to `OmKshirsagar.github.io/`, then:
   ```bash
   cd OmKshirsagar.github.io
   git init
   git branch -M main
   git remote add origin https://github.com/OmKshirsagar/OmKshirsagar.github.io.git
   ```
3. **Add a `.gitignore`** with at minimum:
   ```
   node_modules/
   dist/
   .astro/
   .superpowers/             # brainstorming artifacts
   .DS_Store
   data/portfolio.local.yml  # ⚠ master YAML with real client names — NEVER commit
   data/private.yml          # extra-sensitive context, if ever created
   ```
4. **Scaffold the Astro project** (the implementation plan will detail this) and commit.
5. **Push initial commit**:
   ```bash
   git add .
   git commit -m "Initial portfolio scaffold"
   git push -u origin main
   ```
6. **Enable Pages in repo Settings → Pages**:
   - **Source**: GitHub Actions (NOT "Deploy from a branch")
   - This unlocks the Pages-native workflow above
7. **First push triggers `deploy.yml`**. Watch in the **Actions** tab. Build runs (~30-60s), then deploy step publishes. Look for the green check.
8. **Visit `https://omkshirsagar.github.io`**. Site is live (DNS propagation is immediate for `*.github.io`).

### 9.5 Ongoing workflow

```bash
# Make changes locally
git add .
git commit -m "Update featured project copy"
git push                                  # ← triggers deploy.yml automatically
```

Within ~1 minute the site updates. The Actions tab shows live progress. If the build fails (e.g., zod schema rejects new YAML), the deploy step is skipped — the live site stays on the previous successful build. Safe by default.

### 9.6 Verifying a deployment

After every push:
1. Go to **Actions** tab → newest run should show green check on both build + deploy jobs.
2. **Settings → Pages** shows the published URL with a "Last deployed" timestamp.
3. Hard-refresh `https://omkshirsagar.github.io` (Cmd+Shift+R) to bypass cache.
4. Run a quick Lighthouse check from DevTools → confirm Performance ≥95 on `/`.

### 9.7 Rollback story

If a deploy goes bad:
- **Fastest**: revert the bad commit, push. Pages redeploys to the previous working state in ~1 minute.
- **Slower but possible**: in Settings → Pages, you can manually re-trigger a specific previous workflow run.
- We don't keep separate "production" / "staging" branches — main IS production. For a portfolio this is fine; if it ever isn't, add a `staging` branch + a Pages preview workflow.

### 9.8 Custom domain (deferred to v2)

Not in v1 scope, but to add later:

1. Buy a domain (e.g., `omk.dev`) from Namecheap / Porkbun / Cloudflare.
2. DNS: add a `CNAME` record on the domain pointing to `OmKshirsagar.github.io`.
3. In the repo, add a single-line file at `public/CNAME` containing `omk.dev`. This file ships into `dist/` and tells Pages which domain to expect.
4. **Repo Settings → Pages → Custom domain**: enter `omk.dev`, enable "Enforce HTTPS" once cert provisions (5–60 min).
5. Update `site:` in `astro.config.mjs` from `omkshirsagar.github.io` to `omk.dev`.

After that, both `omkshirsagar.github.io` and `omk.dev` serve the site; the custom domain becomes canonical.

### 9.9 What can break and how to detect it

| Failure mode | How you'd notice | Fix |
|---|---|---|
| `base:` set wrong (`/repo/` instead of `/`) | All asset URLs 404 | Reset to `base: '/'` in `astro.config.mjs` |
| `vite-plugin-yaml` missing in `astro.config.mjs` | Build errors on YAML import | Add to `vite.plugins` array |
| zod schema rejects updated YAML | Build job fails, no deploy | Read build log, fix YAML or update schema |
| Repo accidentally private | Pages 404s entire site | Settings → Change visibility to Public |
| Pages "Source" set to `gh-pages` branch instead of Actions | Workflow runs but site doesn't update | Settings → Pages → Source = GitHub Actions |
| OG image broken in social previews | LinkedIn/Twitter card empty | Verify `public/og.png` exists, `site:` is correct in config |
| `dist/` accidentally committed | Repo bloat, slow clones | Confirm `.gitignore` includes `dist/` |
| Pages stuck on old version after push | Browser cache | Hard refresh (Cmd+Shift+R) or wait ~5 min for CDN edge |

---

## 10. Testing

### 10.1 What we test

- **YAML schema** (`tests/data.test.ts`): the zod schema parses the real `portfolio.yml`. Catches regressions when adding new YAML content.
- **Selectors** (`tests/select.test.ts`): unit tests for `featuredProjects()`, `recognizedItems()`, etc. Snapshot-style assertions.
- **Static page visual regression** (`tests/home.spec.ts`): Playwright takes screenshots of `/` at desktop/tablet/mobile widths. Compares against committed baselines. Catches CSS regressions.

### 10.2 What we don't test

- The `/journey` route — too animation-heavy. Visual correctness verified manually during development.
- Cross-browser parity — Chrome is the primary target; we accept that the journey only works in WebGPU-capable browsers (the static page is universally compatible).
- Performance — measured manually with Lighthouse during development; no automated perf budget enforcement (overkill for v1).

---

## 11. Open questions / deferred decisions

1. **Voxel character final form** — SVG sketch (current placeholder), GPT-generated portrait, or refined voxel SVG/3D. Decide during build; the avatar config is decoupled.
2. **Custom domain** — defer to v2.
3. **Sound design** — optional ambient track on `/journey`, defaults to muted. Asset choice TBD; could omit entirely for v1.
4. **Audience version** — should the static `/` page have a "developer view" (shows commit graphs, GitHub stars, etc.) toggle? Not in v1 scope.
5. **Asset downloads** — award letter PDFs not yet collected; `Download PDF` links disabled until assets are in `public/downloads/`.
6. **Hackathon details** — AgentX + Deep Research Agent dates, outcomes, placements are TODO in YAML. Cosmetic; doesn't block build.
7. **Education years + location** — TODO in YAML. Will display as N/A on site if not filled.
8. **Contact details** — email + LinkedIn handle TODO. Display "[email pending]" / "[LinkedIn pending]" until filled.
9. **Cert placeholder** — site shows a dashed-border "Add certification" card. If Om has actual certs (AWS, Azure, etc.), drop them in YAML and the slot fills.

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| WebGPU not supported on target browsers | Static page is universal; `/journey` shows graceful fallback with storyboard graphic. |
| `/journey` heavy on mobile | Adaptive quality (lower particle count on small devices) + `prefers-reduced-motion` → fallback. |
| 3D scenes look amateur (uncanny valley) | Commit hard to the voxel aesthetic — embraces the "made of cubes" look. Doesn't try to be photoreal. |
| Recruiter bounces in <5s | Hero must hook: name + title + tagline + one CTA visible above fold. Stats below. Tested via Playwright at 1440×900 viewport. |
| YAML drift between content and code | zod schema fails the build on missing fields. Tests run in CI. |
| Public repo exposes private data | `interview_stories` filtered at build. `private.yml` gitignored. Top-of-YAML warning. |
| Visual companion server died ~6 times during brainstorming | Pure annoyance, not a real risk for build. Implementation doesn't use companion. |

---

## 13. What's locked vs what's flexible

**Locked (don't re-litigate)**:
- URL: `omkshirsagar.github.io`
- Stack: Vite + React + TS + R3F + WebGPU/TSL
- Two routes: `/` + `/journey`
- Static page sections + visual treatment
- 12-beat journey arc
- Top 3 featured: RTVA, Starter Kit, Sign Language AI
- Voxel "Cinematic MagicaVoxel" aesthetic
- Identify → Build → Prove → Adopt as the thesis
- Data lives in `portfolio.yml`

**Flexible (can change during build)**:
- Voxel character details (currently placeholder)
- Specific scene-by-scene visual choices in journey
- GSAP vs drei ScrollControls choice
- Whether to include ambient audio
- Whether to add Tailwind back (currently NO; using CSS Modules)
- Exact stat tiles in hero (6 is the current pick)

---

## 14. Next steps after this spec is approved

1. **Hand off to writing-plans skill** — produces a step-by-step implementation plan with file-level changes, ordered tasks, and acceptance criteria.
2. **Scaffold the repo** — Vite init, install deps, set up CI workflow, parse YAML.
3. **Build the static page** — section by section, components extracted to selectors.
4. **Visual regression baseline** — capture Playwright screenshots, commit baselines.
5. **Build the journey shell** — Canvas, scroll plumbing, beat scaffolding, single placeholder voxel-Om.
6. **Implement beats** — 12 beats in order, hero beats last so the formula is locked first.
7. **Polish + perf pass + deploy** — Lighthouse audit, GitHub Pages deploy, share QR.

---
