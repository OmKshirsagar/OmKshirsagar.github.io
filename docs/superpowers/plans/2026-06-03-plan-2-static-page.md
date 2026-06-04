# Resume Portfolio — Plan 2: Static Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Plan-1 stub at `/` with the full polished static landing page from the approved v2 mockup. By the end, visiting `omkshirsagar.github.io` shows the recruiter-friendly portfolio with hero (text + voxel character + 6 stats), 3 editorial featured-project bands with bespoke 300×300 SVG illustrations, career arc strip, recognition grid with download placeholders, vertical timeline tree of all 14 projects, sticky bottom nav, and footer with QR-share callout.

**Architecture:** Astro pages + components consume typed data via existing selectors in `src/data/select.ts`. New selectors added for stats, work-timeline, recognized items, contact, and footer data. Most components are static `.astro` files. Bottom nav is a React island (`.tsx`) because it needs scroll-spy interactivity. All SVG illustrations are inlined Astro components (no external image files).

**Tech Stack:** Same as Plan 1 — Astro 4 · React 18 islands · TypeScript · Zod · Vitest · Playwright. No new runtime deps required.

**Spec reference:** `docs/superpowers/specs/2026-06-02-resume-portfolio-design.md` §4 (Static page).
**Visual reference:** the v2 mockup at `.superpowers/brainstorm/<latest-session>/content/static-page-v2.html` is the source-of-truth for layout, colors, typography, and SVG content. Implementers should reference it directly when copying SVG illustrations.

---

## File map

```
src/
├── components/
│   ├── TopBar.astro                        # CREATE
│   ├── Hero.astro                          # CREATE
│   ├── HeroStats.astro                     # CREATE
│   ├── VoxelOmSketch.astro                 # CREATE (SVG character)
│   ├── FeaturedBand.astro                  # CREATE (one band, accepts variant + illustration slot)
│   ├── illustrations/
│   │   ├── RtvaIllustration.astro          # CREATE (300×300 SVG)
│   │   ├── StarterKitIllustration.astro    # CREATE
│   │   └── SignLanguageIllustration.astro  # CREATE
│   ├── CareerArc.astro                     # CREATE
│   ├── Recognized.astro                    # CREATE
│   ├── WorkTimeline.astro                  # CREATE
│   ├── BottomNav.tsx                       # CREATE (React island, scroll-spy)
│   └── Footer.astro                        # CREATE
├── data/
│   └── select.ts                           # EXTEND — add statsData, workTimeline, recognizedItems, contactInfo, footerData
├── pages/
│   └── index.astro                         # REWRITE — compose all components
└── styles/
    └── tokens.css                          # EXTEND — add component-specific tokens if needed

tests/
├── select.test.ts                          # EXTEND — tests for new selectors
└── home.spec.ts                            # EXTEND — Playwright assertions for new sections
```

---

## Batch B1 — New selectors (TDD)

### Task 1: `statsData()` selector

**Files:**
- Create test: `tests/select.test.ts` (extend existing)
- Modify impl: `src/data/select.ts`

- [ ] **Step 1.1: Write failing test**

Append to `tests/select.test.ts`:

```ts
import { statsData } from '@/data/select';

describe('statsData', () => {
  it('returns 6 stat tiles with values and labels', () => {
    const stats = statsData();
    expect(stats.length).toBe(6);
    expect(stats[0]).toHaveProperty('value');
    expect(stats[0]).toHaveProperty('label');
    // Should include known stats
    const labels = stats.map(s => s.label);
    expect(labels.some(l => /deloitte/i.test(l))).toBe(true);
    expect(labels.some(l => /award/i.test(l))).toBe(true);
    expect(labels.some(l => /project/i.test(l))).toBe(true);
  });
});
```

- [ ] **Step 1.2: Run — expect FAIL**

```bash
npm test
```

Expected: 3 new tests fail with "statsData is not exported".

- [ ] **Step 1.3: Implement `statsData()` in `src/data/select.ts`**

Append:

```ts
export interface StatTile {
  value: string;
  suffix?: string;
  label: string;
  icon: 'badge' | 'award' | 'bars' | 'globe' | 'stack' | 'shield';
  highlight?: boolean;
}

export function statsData(): StatTile[] {
  const yearsExp = portfolio.personal.years_experience;
  const awardCount =
    portfolio.recognition_summary.awards_received.outstanding_awards +
    portfolio.recognition_summary.awards_received.applause_awards;
  const projectCount = portfolio.projects.length;
  const clientEngagementCount = portfolio.engagements.filter(
    (e: { type: string }) => e.type === 'client'
  ).length;
  const adoptionCount = 12;          // FastAPI Starter Kit's tracked adoption number
  const hackathonCount = portfolio.hackathons.length;

  return [
    { value: String(yearsExp), suffix: 'yr+', label: 'At Deloitte', icon: 'badge', highlight: true },
    { value: String(awardCount), label: 'Awards', icon: 'award' },
    { value: String(projectCount), suffix: '+', label: 'Projects', icon: 'bars' },
    { value: String(clientEngagementCount), label: 'Clients', icon: 'globe' },
    { value: String(adoptionCount), suffix: '+', label: 'SK adoptions', icon: 'stack' },
    { value: String(hackathonCount), label: 'Hackathons', icon: 'shield' },
  ];
}
```

- [ ] **Step 1.4: Run — expect PASS**

```bash
npm test
```

Expected: all tests pass (now 7+).

### Task 2: `workTimeline()` selector

- [ ] **Step 2.1: Write failing test**

Append to `tests/select.test.ts`:

```ts
import { workTimeline } from '@/data/select';

describe('workTimeline', () => {
  it('returns engagements with grouped sub-projects', () => {
    const tl = workTimeline();
    expect(tl.length).toBeGreaterThanOrEqual(4);
    const names = tl.map(g => g.name);
    expect(names.some(n => /pharma|takeda|client/i.test(n))).toBe(true);
    expect(names.some(n => /sop/i.test(n))).toBe(true);
    // Each engagement has children
    expect(tl[0].children.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2.2: Run — expect FAIL**

- [ ] **Step 2.3: Implement `workTimeline()`**

Append to `src/data/select.ts`:

```ts
export interface WorkTimelineChild {
  id: string;
  title: string;
  meta?: string;
  badge?: { label: string; tone: 'featured' | 'award' };
  featured: boolean;
}

export interface WorkTimelineGroup {
  id: string;
  name: string;
  type: 'client' | 'internal-program' | 'parallel' | 'side';
  dateRange: string;
  toneKey: 'takeda' | 'sop' | 'exact' | 'hackathon' | 'personal';
  children: WorkTimelineChild[];
}

export function workTimeline(): WorkTimelineGroup[] {
  const projects = portfolio.projects as Array<Record<string, unknown>>;
  const hackathons = portfolio.hackathons as Array<Record<string, unknown>>;

  // Helper to build a child entry
  const childFromProject = (p: Record<string, unknown>): WorkTimelineChild => {
    const role = (p.role as string | undefined) ?? '';
    const techStack = (p.technologies as { backend?: string[] } | string[] | undefined);
    const techHint =
      Array.isArray(techStack) ? (techStack as string[]).slice(0, 2).join(' · ') : '';
    const meta = [role, techHint].filter(Boolean).join(' · ') || undefined;
    const featured = p.featured === true;
    let badge: WorkTimelineChild['badge'];
    if (featured) badge = { label: 'Featured', tone: 'featured' };
    const recog = p.recognition as { contributed_to_award?: string } | undefined;
    if (recog?.contributed_to_award) badge = { label: recog.contributed_to_award, tone: 'award' };
    return { id: p.id as string, title: p.title as string, meta, badge, featured };
  };

  const groups: WorkTimelineGroup[] = [];

  // Pharma client (formerly Global pharmaceutical manufacturer)
  groups.push({
    id: 'pharma-client',
    name: portfolio.engagements[0]?.name ?? 'Pharma Client',
    type: 'client',
    dateRange: 'Apr – Nov 2024',
    toneKey: 'takeda',
    children: projects
      .filter(p => p.client === portfolio.engagements[0]?.name)
      .map(childFromProject),
  });

  // SOP Program (parent + children, but show children directly)
  const sopChildren = projects.filter(p => p.parent === 'sop-program').map(childFromProject);
  groups.push({
    id: 'sop-program',
    name: 'SOP Program',
    type: 'internal-program',
    dateRange: 'Oct 2024 – Aug 2025',
    toneKey: 'sop',
    children: sopChildren,
  });

  // Healthcare client (formerly US healthcare diagnostics provider)
  groups.push({
    id: 'healthcare-client',
    name: portfolio.engagements[2]?.name ?? 'Healthcare Client',
    type: 'client',
    dateRange: 'Aug 2025 – present',
    toneKey: 'exact',
    children: projects
      .filter(p => p.client === portfolio.engagements[2]?.name)
      .map(childFromProject),
  });

  // Hackathons
  groups.push({
    id: 'hackathons',
    name: 'Hackathons',
    type: 'parallel',
    dateRange: 'Ongoing',
    toneKey: 'hackathon',
    children: hackathons.map(h => ({
      id: h.id as string,
      title: (h.project_built ?? h.name) as string,
      meta: ((h.name as string | undefined) ?? '') + ((h.duration as string | undefined) ? ' · ' + h.duration : ''),
      badge: h.featured === true ? { label: 'Featured', tone: 'featured' as const } : undefined,
      featured: h.featured === true,
    })),
  });

  // Personal projects
  groups.push({
    id: 'personal',
    name: 'Personal',
    type: 'side',
    dateRange: '2026',
    toneKey: 'personal',
    children: projects.filter(p => p.type === 'personal').map(childFromProject),
  });

  return groups;
}
```

- [ ] **Step 2.4: Run — expect PASS**

### Task 3: `recognizedItems()` selector

- [ ] **Step 3.1: Write failing test**

```ts
import { recognizedItems } from '@/data/select';

describe('recognizedItems', () => {
  it('returns awards + promotion + publication', () => {
    const items = recognizedItems();
    expect(items.length).toBeGreaterThanOrEqual(5);  // 3 awards + 1 promo + 1 publication minimum
    const types = items.map(i => i.kind);
    expect(types).toContain('award');
    expect(types).toContain('promotion');
    expect(types).toContain('publication');
  });
});
```

- [ ] **Step 3.2: Run — expect FAIL**

- [ ] **Step 3.3: Implement**

```ts
export type RecognizedKind = 'award' | 'promotion' | 'publication' | 'certification';

export interface RecognizedItem {
  kind: RecognizedKind;
  title: string;
  meta: string;
  downloadUrl?: string;
  iconKey: string;
}

export function recognizedItems(): RecognizedItem[] {
  const items: RecognizedItem[] = [];

  // Awards
  for (const a of portfolio.awards as Array<Record<string, unknown>>) {
    items.push({
      kind: 'award',
      title: a.title as string,
      meta: `${a.issuer} · ${a.date ?? a.year}`,
      downloadUrl: undefined,        // TODO: link to public/downloads/<file>.pdf when uploaded
      iconKey: 'trophy',
    });
  }

  // Promotion (from recognition_summary)
  for (const p of portfolio.recognition_summary.promotions ?? []) {
    items.push({
      kind: 'promotion',
      title: `Promoted to ${p.to}`,
      meta: `From ${p.from} · ${p.date}`,
      downloadUrl: undefined,
      iconKey: 'arrow-up',
    });
  }

  // Publications (only the first, presented prominently)
  const pubs = portfolio.publications as Array<Record<string, unknown>>;
  if (pubs.length > 0) {
    const p = pubs[0];
    items.push({
      kind: 'publication',
      title: p.title as string,
      meta: `${p.publisher} · ${p.date ?? p.year} · ${p.role}`,
      downloadUrl: p.url as string | undefined,
      iconKey: 'book',
    });
  }

  // Certifications placeholder (always show one dashed-placeholder card if none exist)
  const certs = portfolio.certifications as Array<unknown>;
  if (certs.length === 0) {
    items.push({
      kind: 'certification',
      title: '[Add certification]',
      meta: 'e.g. AWS, Azure, CKA',
      downloadUrl: undefined,
      iconKey: 'badge',
    });
  } else {
    for (const c of certs as Array<Record<string, unknown>>) {
      items.push({
        kind: 'certification',
        title: c.name as string,
        meta: `${c.issuer} · ${c.year}`,
        downloadUrl: c.credential_url as string | undefined,
        iconKey: 'badge',
      });
    }
  }

  return items;
}
```

- [ ] **Step 3.4: Run — expect PASS**

### Task 4: `contactInfo()` + `footerData()`

- [ ] **Step 4.1: Write failing tests + implement together**

Append test:

```ts
import { contactInfo, footerData } from '@/data/select';

describe('contactInfo + footerData', () => {
  it('contactInfo returns the available links', () => {
    const c = contactInfo();
    expect(c.github).toBeTruthy();
    // email/linkedin/twitter may be empty until filled
  });

  it('footerData includes a get-in-touch headline', () => {
    const f = footerData();
    expect(f.heading).toMatch(/in touch/i);
    expect(Array.isArray(f.links)).toBe(true);
  });
});
```

Append to `src/data/select.ts`:

```ts
export interface ContactInfo {
  email?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
}

export function contactInfo(): ContactInfo {
  const c = portfolio.personal.contact;
  return {
    email: c.email && c.email !== '' ? c.email : undefined,
    github: c.github ?? undefined,
    linkedin: c.linkedin ?? undefined,
    twitter: c.twitter ?? undefined,
  };
}

export interface FooterData {
  heading: string;
  subhead: string;
  links: Array<{ label: string; href: string; chipLabel: string }>;
  qrTagline: string;
}

export function footerData(): FooterData {
  const c = contactInfo();
  const links: FooterData['links'] = [];
  if (c.github) links.push({ label: c.github, chipLabel: 'github', href: `https://github.com/${c.github}` });
  if (c.linkedin) links.push({ label: c.linkedin, chipLabel: 'linkedin', href: c.linkedin });
  if (c.email) links.push({ label: c.email, chipLabel: 'email', href: `mailto:${c.email}` });
  links.push({ label: 'watch the movie ★', chipLabel: 'journey', href: '/journey' });

  return {
    heading: 'Get in touch.',
    subhead: 'Email me, find me on GitHub or LinkedIn, or scan the QR.',
    links,
    qrTagline: 'Built for conferences, meetups, inline biz cards. Scan → glance in 10 seconds.',
  };
}
```

- [ ] **Step 4.2: Run all tests — expect PASS**

---

## Batch B2 — Top bar + Hero + Voxel character

### Task 5: TopBar.astro

- [ ] **Step 5.1: Create `src/components/TopBar.astro`**

```astro
---
// Top bar — minimal logo + "available" status pill
---
<header class="topbar">
  <div class="logo">om<span>.kshirsagar</span></div>
  <div class="status">Open to senior + staff roles</div>
</header>

<style>
  .topbar {
    padding: 18px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 2;
  }
  .logo { font: 800 13px/1 var(--font-display); letter-spacing: -0.01em; color: var(--accent-warm); }
  .logo span { color: var(--text-dim); font-weight: 500; }
  .status { font: 500 10px/1 var(--font-mono); letter-spacing: 0.16em; text-transform: uppercase; color: var(--status-active); }
  .status::before { content: "● "; }
</style>
```

### Task 6: VoxelOmSketch.astro

The voxel-Om character placeholder SVG. Source-of-truth: copy the SVG from the v2 mockup file (search for `pg-hero-avatar` in the `.superpowers/.../static-page-v2.html`). The SVG is roughly 360 lines.

- [ ] **Step 6.1: Read SVG from v2 mockup**

```bash
# Show file path of the latest v2 mockup
ls -t .superpowers/brainstorm/*/content/static-page-v2.html | head -1
```

Open that file, locate the SVG inside `<div class="pg-hero-avatar">`. Copy the full `<svg ...>...</svg>` block. It uses the avatar color tokens (`#dba577` skin, `#1a1410` hair, `#f4f1ea` shirt, `#2a3a6a` pants, `#c8311f` accent).

- [ ] **Step 6.2: Create `src/components/VoxelOmSketch.astro`**

```astro
---
// Voxel-Om SVG placeholder. Driven by personal.avatar tokens.
// Future: can be replaced with a GPT-generated portrait or refined art.
---
<div class="hero-avatar">
  <!-- PASTE the full SVG from the v2 mockup here, with viewBox="0 0 280 360" -->
  <svg viewBox="0 0 280 360" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- ... (full SVG content, ~80 polygons) ... -->
  </svg>
  <div class="placeholder-label">★ placeholder — voxel-Om OR gpt portrait, decide later</div>
</div>

<style>
  .hero-avatar {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 20px 0;
  }
  .hero-avatar svg { width: 100%; max-width: 320px; height: auto; }
  .placeholder-label {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    font: 600 8px/1 var(--font-mono);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent-warm);
    background: rgba(255, 210, 154, 0.06);
    border: 1px dashed rgba(255, 210, 154, 0.3);
    padding: 4px 10px;
    border-radius: 2px;
    white-space: nowrap;
  }
</style>
```

### Task 7: HeroStats.astro

- [ ] **Step 7.1: Create `src/components/HeroStats.astro`**

```astro
---
import { statsData } from '@/data/select';
const stats = statsData();

// Tiny inline SVG icons per icon key
const icons: Record<string, string> = {
  badge: '<polygon points="11,2 19,7 19,15 11,20 3,15 3,7" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="11" cy="11" r="3" fill="currentColor"/>',
  award: '<path d="M5 4 L17 4 L17 10 Q17 16 11 18 Q5 16 5 10 Z" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="11" cy="10" r="2" fill="currentColor"/>',
  bars: '<rect x="4" y="8" width="4" height="10" stroke="currentColor" stroke-width="1" fill="none"/><rect x="9" y="5" width="4" height="13" stroke="currentColor" stroke-width="1" fill="none"/><rect x="14" y="2" width="4" height="16" stroke="currentColor" stroke-width="1" fill="none"/>',
  globe: '<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1" fill="none"/><path d="M3 11 L19 11 M11 3 L11 19" stroke="currentColor" stroke-width="0.7" opacity="0.5"/><circle cx="11" cy="11" r="2" fill="currentColor"/>',
  stack: '<rect x="3" y="10" width="16" height="8" stroke="currentColor" stroke-width="1" fill="none"/><rect x="6" y="6" width="3" height="4" stroke="currentColor" stroke-width="1" fill="none"/><rect x="11" y="3" width="3" height="7" stroke="currentColor" stroke-width="1" fill="none"/><rect x="16" y="7" width="3" height="3" stroke="currentColor" stroke-width="1" fill="none"/>',
  shield: '<path d="M4 6 L11 3 L18 6 L18 15 L11 18 L4 15 Z" stroke="currentColor" stroke-width="1" fill="none"/><path d="M8 9 L14 9 M8 12 L14 12" stroke="currentColor" stroke-width="0.8"/>',
};
---
<div class="stats-row">
  {stats.map(s => (
    <div class:list={['stat', s.highlight && 'highlight']}>
      <svg class="ic" width="20" height="20" viewBox="0 0 22 22" fill="none" set:html={icons[s.icon]} />
      <div class="v">{s.value}{s.suffix && <small>{s.suffix}</small>}</div>
      <div class="l">{s.label}</div>
    </div>
  ))}
</div>

<style>
  .stats-row {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }
  .stat {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 14px 12px;
    position: relative;
  }
  .stat.highlight {
    background: rgba(255, 148, 96, 0.06);
    border-color: rgba(255, 148, 96, 0.25);
  }
  .stat .v { font: 800 26px/1 var(--font-display); letter-spacing: -0.04em; color: var(--accent-warm); font-variant-numeric: tabular-nums; }
  .stat .v small { font-size: 14px; opacity: 0.65; margin-left: 2px; }
  .stat .l { font: 500 9px/1.3 var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-top: 4px; }
  .stat .ic { position: absolute; top: 10px; right: 10px; opacity: 0.35; color: var(--accent-warm); }
  .stat.highlight .ic { color: var(--accent-orange); }
  .stat.highlight .v { color: #ffaa78; }

  @media (max-width: 1023px) {
    .stats-row { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 600px) {
    .stats-row { grid-template-columns: repeat(2, 1fr); }
  }
</style>
```

### Task 8: Hero.astro

- [ ] **Step 8.1: Create `src/components/Hero.astro`**

```astro
---
import { heroData } from '@/data/select';
import VoxelOmSketch from './VoxelOmSketch.astro';
import HeroStats from './HeroStats.astro';

const hero = heroData();
---
<section class="hero" id="home">
  <div class="hero-top">
    <div class="hero-text">
      <div class="kicker">{hero.kicker}</div>
      <h1 class="name">{hero.preferredName} <em>Kshirsagar</em></h1>
      <div class="role">
        <strong>{hero.role}</strong> @ {hero.company}
        {hero.promotedBadge && <span class="promo">{hero.promotedBadge}</span>}
      </div>
      <p class="tagline">
        I build AI-powered products, real-time systems, and the platforms other engineers build on.
        <strong>Healthcare. Voice. Agents. Foundations.</strong>
      </p>
      <a class="cta" href="/journey">★ Watch my journey →</a>
      <a class="cta-second" href="#work">↓ Skim resume</a>
    </div>
    <VoxelOmSketch />
  </div>

  <HeroStats />
</section>

<style>
  .hero {
    padding: 60px 40px 60px;
    position: relative;
    z-index: 2;
    background:
      radial-gradient(ellipse 800px 600px at 50% -10%, rgba(255, 210, 154, 0.06) 0%, transparent 60%);
  }
  .hero-top {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 50px;
    align-items: center;
    margin-bottom: 56px;
  }
  .kicker { font: 600 11px/1 var(--font-mono); letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent-orange); margin-bottom: 18px; }
  .name { font: 800 72px/0.88 var(--font-display); letter-spacing: -0.05em; color: #fff; margin: 0 0 14px; }
  .name em { font-family: var(--font-italic); font-style: italic; font-weight: 400; color: var(--accent-warm); }
  .role { font: 500 17px/1.3 var(--font-display); color: var(--text-sec); margin: 0; }
  .role strong { color: #fff; font-weight: 700; }
  .promo {
    display: inline-block; margin-left: 8px;
    font: 700 9px/1 var(--font-mono); letter-spacing: 0.18em;
    padding: 3px 7px; background: rgba(255, 210, 154, 0.18);
    color: var(--accent-warm); border-radius: 2px; vertical-align: 2px;
  }
  .tagline { font: 400 17px/1.45 var(--font-display); color: #aaa3b8; max-width: 480px; margin: 24px 0 30px; }
  .tagline strong { color: var(--text-pri); font-weight: 500; }
  .cta {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 22px;
    background: linear-gradient(135deg, var(--accent-warm) 0%, var(--accent-orange) 100%);
    color: #1a0f08; border: none; border-radius: 4px;
    font: 700 13px/1 var(--font-display);
    box-shadow: 0 0 24px rgba(255, 148, 96, 0.35);
  }
  .cta-second {
    display: inline-flex; align-items: center; gap: 8px;
    margin-left: 10px;
    padding: 14px 18px;
    background: transparent;
    color: var(--text-sec);
    border: 1px solid rgba(255, 210, 154, 0.2);
    border-radius: 4px;
    font: 600 12px/1 var(--font-display);
  }

  @media (max-width: 900px) {
    .hero-top { grid-template-columns: 1fr; }
    .name { font-size: 56px; }
  }
</style>
```

---

## Batch B3 — Featured Bands + 3 SVG illustrations

### Task 9–11: Three SVG illustration components

For each — paste the full bespoke SVG from the v2 mockup. Look in `.superpowers/brainstorm/*/content/static-page-v2.html` for the source.

- [ ] **Task 9: `src/components/illustrations/RtvaIllustration.astro`** — extract the SVG inside the first `<div class="pg-feat-band">` `<div class="pg-feat-illu">` block. ~80 polygons, includes caller voxel + voice waves + AI crystal with ACS/GPT/RAG labels + voxel phone + "1-800 LIVE CALL" caption.

- [ ] **Task 10: `src/components/illustrations/StarterKitIllustration.astro`** — extract from the SECOND `<div class="pg-feat-band reverse">`. Foundation block + 12 voxel towers + "12+" counter circle.

- [ ] **Task 11: `src/components/illustrations/SignLanguageIllustration.astro`** — extract from the THIRD `<div class="pg-feat-band">`. Camera viewfinder with voxel hand + MediaPipe landmark dots + TF brain hex + GPT crystal + waveform speech bubble + accessibility symbol.

Each component is structured:

```astro
---
// (no props for now)
---
<div class="illu">
  <!-- PASTE the <svg viewBox="0 0 300 300">...</svg> block -->
</div>

<style>
  .illu { width: 320px; height: 320px; background: radial-gradient(ellipse at center, rgba(255,210,154,0.06) 0%, transparent 70%); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex: 0 0 320px; }
  .illu svg { width: 300px; height: 300px; display: block; }
</style>
```

### Task 12: FeaturedBand.astro

- [ ] **Step 12.1: Create `src/components/FeaturedBand.astro`**

```astro
---
interface Props {
  num: string;
  badge: string;
  title: string;
  titleEm?: string;        // italic accent word
  meta: string;
  desc: string;
  chips: string[];
  variant: 'left' | 'right';
}

const { num, badge, title, titleEm, meta, desc, chips, variant } = Astro.props;
---
<div class:list={['feat-band', variant === 'right' && 'reverse']}>
  {variant === 'right' && <div class="text-col">
    <slot name="text" />
  </div>}
  <div class="illu-col">
    <slot name="illustration" />
  </div>
  {variant === 'left' && <div class="text-col">
    <div class="num">{num}</div>
    <div class="badge">{badge}</div>
    <h3 class="title" set:html={titleEm ? title.replace(titleEm, `<em>${titleEm}</em>`) : title} />
    <p class="meta">{meta}</p>
    <p class="desc" set:html={desc} />
    <div class="stack">
      {chips.map(c => <span class="chip">{c}</span>)}
    </div>
    <a class="more">Read the case study →</a>
  </div>}
  {variant === 'right' && (() => null)()}
</div>

<style>
  /* See v2 mockup .pg-feat-band styles — copy verbatim, swap colors to CSS tokens */
  .feat-band {
    margin-top: 50px;
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 48px;
    align-items: center;
    padding: 36px 0;
    border-top: 1px solid var(--border);
  }
  .feat-band.reverse { grid-template-columns: 1fr 320px; }
  .illu-col { display: flex; justify-content: center; }
  .num { font: 800 56px/1 var(--font-display); letter-spacing: -0.05em; color: #2a2638; font-variant-numeric: tabular-nums; }
  .badge { display: inline-block; margin-bottom: 6px; font: 700 9px/1 var(--font-mono); letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent-orange); }
  .title { font: 700 36px/1.05 var(--font-display); letter-spacing: -0.03em; color: #fff; margin: 6px 0 8px; }
  .title em { color: var(--accent-warm); font-style: normal; font-family: var(--font-italic); font-weight: 400; }
  .meta { font: 500 11px/1.3 var(--font-mono); color: var(--text-muted); margin: 0 0 16px; }
  .desc { font: 400 15px/1.55 var(--font-display); color: var(--text-sec); margin: 0 0 22px; max-width: 540px; }
  .desc strong { color: var(--text-pri); font-weight: 500; }
  .stack { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 18px; }
  .chip { font: 600 10px/1 var(--font-mono); letter-spacing: 0.06em; padding: 5px 9px; background: rgba(255, 210, 154, 0.08); color: var(--text-sec); border-radius: 2px; }
  .more { display: inline-flex; align-items: center; gap: 6px; font: 600 12px/1 var(--font-display); color: var(--accent-warm); }

  @media (max-width: 900px) {
    .feat-band, .feat-band.reverse { grid-template-columns: 1fr; }
  }
</style>
```

---

## Batch B4 — Career Arc + Recognized

### Task 13: CareerArc.astro

- [ ] **Step 13.1: Create `src/components/CareerArc.astro`**

```astro
---
import { careerArc } from '@/data/select';

const arc = careerArc();

// Tone keys per phase index — falls back to neutral
const tones = ['t-training', 't-takeda', 't-sop', 't-exact', 't-today'];
const formatDateRange = (start?: string, end?: string): string => {
  if (!start) return '';
  const fmt = (s: string) => {
    const m = s.match(/^(\d{4})-(\d{2})/);
    if (!m) return s;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m[2]) - 1]} ${m[1]}`;
  };
  return `${fmt(start)} – ${end === 'present' ? 'present' : fmt(end ?? '')}`;
};
---
<section class="section" id="arc">
  <div class="sec-num">// 02</div>
  <h2 class="sec-title">Career <em>arc</em></h2>
  <p class="sec-eyebrow">Two years, six phases, one promotion.</p>

  <div class="strip">
    {arc.map((p, i) => (
      <div class:list={['cell', tones[i] ?? 'neutral']}>
        <div class="ph">{i === arc.length - 1 ? 'Today' : String(p.order).padStart(2, '0')}</div>
        <div class="nm">{p.name}</div>
        <div class="dt">{formatDateRange(p.startDate, p.endDate)}</div>
      </div>
    ))}
    <!-- Append the "Today" cell hard-coded -->
    <div class="cell t-today">
      <div class="ph">Today</div>
      <div class="nm">Software Engineer I</div>
      <div class="dt">Promoted Jun 2026</div>
    </div>
  </div>
</section>

<style>
  .section { padding: 70px 40px; }
  .sec-num { font: 700 10px/1 var(--font-mono); letter-spacing: 0.22em; color: var(--accent-orange); }
  .sec-title { font: 700 36px/1 var(--font-display); letter-spacing: -0.03em; color: #fff; margin: 12px 0 0; }
  .sec-title em { color: var(--accent-warm); font-style: normal; font-family: var(--font-italic); font-weight: 400; }
  .sec-eyebrow { font: 400 13px/1.4 var(--font-display); color: var(--text-muted); margin: 10px 0 0; }

  .strip { display: flex; margin-top: 36px; border-radius: 6px; overflow: hidden; box-shadow: 0 0 0 1px var(--border); }
  .cell { padding: 22px 18px; flex: 1; position: relative; }
  .cell .ph { font: 700 11px/1 var(--font-mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-orange); }
  .cell .nm { font: 700 16px/1.2 var(--font-display); letter-spacing: -0.02em; color: #fff; margin: 8px 0 4px; }
  .cell .dt { font: 500 10px/1.3 var(--font-mono); color: var(--text-dim); }
  .cell.t-training { background: #1a1a26; }
  .cell.t-takeda { background: #1d1820; }
  .cell.t-sop { background: #221a26; }
  .cell.t-exact { background: #281c25; }
  .cell.t-today { background: linear-gradient(90deg, #2a1e22, #1a1410); }
  .cell.t-today .nm { color: var(--accent-warm); }
  .cell.t-today::after { content: "★"; position: absolute; right: 14px; top: 14px; color: var(--accent-warm); font-size: 13px; }

  @media (max-width: 720px) {
    .strip { flex-direction: column; }
  }
</style>
```

### Task 14: Recognized.astro

- [ ] **Step 14.1: Create `src/components/Recognized.astro`** — see v2 mockup `.pg-section #recognition` for exact markup. Use `recognizedItems()` selector. Layout: 4-up grid, publication card spans 2 cells. Each card has icon + title + meta + `⬇ Download` link.

Copy the SVG icons (trophy, applause, promotion-arrow, book, cert-dashed) inline. Code follows the same pattern as HeroStats with `icons` map keyed by `iconKey`. Reference the v2 mockup for exact SVG paths.

---

## Batch B5 — Work Timeline

### Task 15: WorkTimeline.astro

- [ ] **Step 15.1: Create `src/components/WorkTimeline.astro`**

```astro
---
import { workTimeline } from '@/data/select';
const tl = workTimeline();
---
<section class="section" id="more">
  <div class="sec-num">// 04</div>
  <h2 class="sec-title">All <em>work</em></h2>
  <p class="sec-eyebrow">14 projects across 5 engagements. ★ = featured above.</p>

  <div class="timeline">
    {tl.map(g => (
      <div class="engagement">
        <span class:list={['dot', `tone-${g.toneKey}`]}></span>
        <div class="eng-header">
          <span class="eng-name">{g.name}</span>
          <span class="eng-type">{g.type.replace('-', ' ')}</span>
          <span class="eng-date">{g.dateRange}</span>
        </div>
        <div class="children">
          {g.children.map(c => (
            <div class="sub">
              <span class="sub-title">{c.title} {c.featured && <span class="star">★</span>}</span>
              {c.meta && <span class="sub-meta">{c.meta}</span>}
              {c.badge && <span class:list={['sub-badge', c.badge.tone]}>{c.badge.label}</span>}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
</section>

<style>
  /* Copy from v2 mockup .pg-timeline / .tl-engagement / .tl-sub */
  .section { padding: 70px 40px; }
  .timeline { margin-top: 36px; position: relative; padding-left: 38px; }
  .timeline::before {
    content: ""; position: absolute;
    left: 11px; top: 14px; bottom: 14px; width: 2px;
    background: linear-gradient(180deg, #8a6da0 0%, #b35a3a 35%, #ffaa78 65%, #5af3d0 90%, #c4b598 100%);
    opacity: 0.55;
  }
  .engagement { margin-bottom: 30px; position: relative; }
  .engagement:last-child { margin-bottom: 0; }
  .dot {
    position: absolute;
    left: -32px; top: 4px;
    width: 14px; height: 14px;
    border-radius: 50%;
    border: 3px solid var(--bg);
    z-index: 2;
  }
  .tone-takeda    { background: #8a6da0; box-shadow: 0 0 0 2px #8a6da0, 0 0 18px rgba(138, 109, 160, 0.5); }
  .tone-sop       { background: #b35a3a; box-shadow: 0 0 0 2px #b35a3a, 0 0 18px rgba(179, 90, 58, 0.5); }
  .tone-exact     { background: #ffaa78; box-shadow: 0 0 0 2px #ffaa78, 0 0 18px rgba(255, 170, 120, 0.55); }
  .tone-hackathon { background: #5af3d0; box-shadow: 0 0 0 2px #5af3d0, 0 0 16px rgba(90, 243, 208, 0.5); }
  .tone-personal  { background: #c4b598; box-shadow: 0 0 0 2px #c4b598, 0 0 14px rgba(196, 181, 152, 0.4); }

  .eng-header { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
  .eng-name { font: 700 17px/1.2 var(--font-display); letter-spacing: -0.02em; color: #fff; }
  .eng-date { font: 500 10px/1 var(--font-mono); letter-spacing: 0.14em; color: var(--text-muted); text-transform: uppercase; }
  .eng-type { font: 600 9px/1 var(--font-mono); letter-spacing: 0.18em; color: var(--accent-orange); text-transform: uppercase; padding: 4px 8px; background: rgba(255, 148, 96, 0.08); border-radius: 2px; }

  .children { margin-top: 14px; padding-left: 28px; display: grid; gap: 6px; position: relative; }
  .sub {
    background: var(--bg-raised); border: 1px solid var(--border);
    border-radius: 4px; padding: 11px 16px;
    display: flex; align-items: center; gap: 14px;
    position: relative;
  }
  .sub::before { content: ""; position: absolute; left: -22px; top: 50%; width: 18px; height: 1px; background: rgba(255, 210, 154, 0.25); }
  .sub-title { font: 600 13px/1.2 var(--font-display); letter-spacing: -0.01em; color: var(--text-pri); flex: 0 0 auto; min-width: 200px; }
  .star { color: var(--accent-warm); margin-left: 4px; }
  .sub-meta { font: 500 10px/1.4 var(--font-mono); color: var(--text-muted); flex: 1; }
  .sub-badge { font: 600 9px/1 var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 7px; border-radius: 2px; }
  .sub-badge.featured { background: rgba(255, 210, 154, 0.15); color: var(--accent-warm); }
  .sub-badge.award { background: rgba(255, 170, 120, 0.12); color: #ffaa78; }
</style>
```

---

## Batch B6 — Bottom nav + Footer

### Task 16: BottomNav.tsx (React island)

- [ ] **Step 16.1: Create `src/components/BottomNav.tsx`**

```tsx
import { useEffect, useState } from 'react';

const sections = [
  { id: 'home',        label: 'Home' },
  { id: 'work',        label: 'Work' },
  { id: 'arc',         label: 'Arc' },
  { id: 'recognized',  label: 'Recognized' },
  { id: 'more',        label: 'More' },
  { id: 'contact',     label: 'Contact' },
];

export default function BottomNav() {
  const [active, setActive] = useState('home');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bnav-wrap">
      <nav className="bnav">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`item ${active === s.id ? 'active' : ''}`}
          >
            {s.label}
          </a>
        ))}
      </nav>
      <style>{`
        .bnav-wrap { display: flex; justify-content: center; position: sticky; bottom: 20px; padding: 28px 0; z-index: 50; }
        .bnav { padding: 8px 12px; background: rgba(20, 20, 28, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,210,154,0.18); border-radius: 100px; display: inline-flex; gap: 4px; box-shadow: 0 8px 40px rgba(0,0,0,0.5); }
        .bnav .item { padding: 8px 14px; font: 600 11px/1 'Inter', sans-serif; color: #888094; border-radius: 100px; text-decoration: none; cursor: pointer; }
        .bnav .item.active { background: rgba(255,210,154,0.15); color: #ffd29a; }
      `}</style>
    </div>
  );
}
```

### Task 17: Footer.astro

- [ ] **Step 17.1: Create `src/components/Footer.astro`** with QR-share callout. Use `footerData()` selector. Match v2 mockup `.pg-footer` styles.

---

## Batch B7 — Compose page + Playwright

### Task 18: Rewrite `src/pages/index.astro` to compose everything

- [ ] **Step 18.1: Replace contents of `src/pages/index.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import TopBar from '@/components/TopBar.astro';
import Hero from '@/components/Hero.astro';
import FeaturedBand from '@/components/FeaturedBand.astro';
import RtvaIllustration from '@/components/illustrations/RtvaIllustration.astro';
import StarterKitIllustration from '@/components/illustrations/StarterKitIllustration.astro';
import SignLanguageIllustration from '@/components/illustrations/SignLanguageIllustration.astro';
import CareerArc from '@/components/CareerArc.astro';
import Recognized from '@/components/Recognized.astro';
import WorkTimeline from '@/components/WorkTimeline.astro';
import BottomNav from '@/components/BottomNav.tsx';
import Footer from '@/components/Footer.astro';
import { heroData } from '@/data/select';

const hero = heroData();
---
<BaseLayout title={`${hero.name} — ${hero.role} @ ${hero.company}`}>
  <TopBar />
  <Hero />

  <section class="section" id="work">
    <div class="sec-num">// 01</div>
    <h2 class="sec-title">Selected <em>work</em></h2>
    <p class="sec-eyebrow">Three flagships — voice AI, platform foundation, accessibility innovation.</p>

    <FeaturedBand
      num="01"
      badge="Featured · Production AI"
      title="Real-Time Voice Assistant"
      titleEm="Assistant"
      meta="Healthcare client · Full Stack AI Engineer · Aug–Oct 2025"
      desc="Customers dial a 1-800 number, talk to an AI in real time, get medication and order help. <strong>Shipped to production, then white-labeled as a reusable Deloitte asset.</strong>"
      chips={['GPT Realtime', 'Azure ACS', 'Azure AI Search', 'RAG', 'FastAPI']}
      variant="left"
    >
      <RtvaIllustration slot="illustration" />
    </FeaturedBand>

    <FeaturedBand
      num="02"
      badge="Featured · Foundation"
      title="FastAPI Starter Kit"
      titleEm="Kit"
      meta="Deloitte SOP · Platform Engineer · since Jan 2025"
      desc="A reusable framework with standardized architecture, full test infra, and MCP baked in. <strong>Adopted by 12+ projects.</strong>"
      chips={['FastAPI', 'FastMCP', 'SQLAlchemy 2.0', '100% coverage']}
      variant="right"
    >
      <StarterKitIllustration slot="illustration" />
    </FeaturedBand>

    <FeaturedBand
      num="03"
      badge="Featured · Hackathon · Accessibility"
      title="Sign Language → Speech"
      titleEm="Speech"
      meta="AgentX · Team Lead · 3-day weekend · Team of 5"
      desc="A multimodal AI that turns live hand gestures into natural speech in real time. <strong>Built end-to-end in 3 days as the most ambitious accessibility hack of the event.</strong>"
      chips={['MediaPipe', 'TensorFlow', 'GPT Realtime', 'WebSockets']}
      variant="left"
    >
      <SignLanguageIllustration slot="illustration" />
    </FeaturedBand>
  </section>

  <CareerArc />
  <section id="recognized"><Recognized /></section>
  <WorkTimeline />
  <BottomNav client:load />
  <section id="contact"><Footer /></section>
</BaseLayout>

<style>
  .section { padding: 70px 40px; }
  .sec-num { font: 700 10px/1 var(--font-mono); letter-spacing: 0.22em; color: var(--accent-orange); }
  .sec-title { font: 700 36px/1 var(--font-display); letter-spacing: -0.03em; color: #fff; margin: 12px 0 0; }
  .sec-title em { color: var(--accent-warm); font-style: normal; font-family: var(--font-italic); font-weight: 400; }
  .sec-eyebrow { font: 400 13px/1.4 var(--font-display); color: var(--text-muted); margin: 10px 0 0; }
</style>
```

### Task 19: Extend Playwright tests

- [ ] **Step 19.1: Extend `tests/home.spec.ts`** — add assertions:

```ts
test('hero shows stats row with 6 tiles', async ({ page }) => {
  await page.goto('/');
  const stats = page.locator('.stat');
  await expect(stats).toHaveCount(6);
});

test('featured section has 3 bands', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.feat-band')).toHaveCount(3);
});

test('work timeline has 5 engagement groups', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.engagement')).toHaveCount(5);
});

test('bottom nav pill renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.bnav')).toBeVisible();
});

test('recognized section shows at least 3 award cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pg-recog-card, .award-card').first()).toBeVisible();
});
```

### Task 20: Final verification + commit + push

- [ ] **Step 20.1: Full check suite**

```bash
npm run check        # 0 errors
npm run lint         # clean
npm run test         # all vitest pass
npm run build        # 0 errors
npm run test:e2e     # all playwright pass
```

- [ ] **Step 20.2: Commit + push**

```bash
git add -A
git commit -m "feat: Plan 2 — full static landing page

- Hero with split layout (text + voxel character + 6-tile stats row)
- 3 featured editorial bands with bespoke 300×300 SVG illustrations
- Career arc strip (5 phases)
- Recognition grid (3 awards + promotion + publication + cert placeholder)
- Vertical timeline tree of all 14 projects across 5 engagements
- Sticky bottom nav pill (React island, scroll-spy)
- Footer with QR-share callout
- New selectors: statsData, workTimeline, recognizedItems, contactInfo, footerData"

git push
```

- [ ] **Step 20.3: Verify live deploy**

```bash
sleep 90
curl -s https://omkshirsagar.github.io | grep -oE '(Software Engineer I|Selected work|Career arc|All work|Recognized|Get in touch)' | sort -u
```

Expected: lists all the section headings — confirms the new page is live.

---

## Done.

After Task 20, https://omkshirsagar.github.io shows the full polished static landing page exactly matching the v2 mockup. Tests cover every section. Plan 3 (the cinematic /journey movie) comes next.
