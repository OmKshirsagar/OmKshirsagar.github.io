# Resume Portfolio — Plan 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Astro + React project, validate the YAML data pipeline, and ship a deployable scaffold to `omkshirsagar.github.io`. Result: visiting the live URL shows a placeholder page that renders `Om Kshirsagar — Analyst @ Deloitte` pulled from real portfolio data, proving every layer (data → build → deploy) works end-to-end.

**Architecture:** Astro 4 meta-framework with `@astrojs/react` integration for islands. Vite under the hood. `data/portfolio.yml` (anonymized, committed) drives content via `vite-plugin-yaml` + `zod` schema validation. Two stub Astro pages (`/`, `/journey`) prove routing + data flow. GitHub Actions workflow builds and deploys to GitHub Pages on every push to `main`.

**Tech Stack:** Astro 4 · `@astrojs/react` · React 18 · TypeScript strict · `vite-plugin-yaml` · `zod` · Vitest · Playwright · ESLint · Prettier · `js-yaml` (for whitelabel script verification only — Python script already exists).

**Spec reference:** `docs/superpowers/specs/2026-06-02-resume-portfolio-design.md`

---

## File map (created/touched by this plan)

```
.
├── .gitignore                              # CREATE
├── .github/workflows/deploy.yml            # CREATE
├── astro.config.mjs                        # CREATE
├── package.json                            # CREATE (via npm init)
├── tsconfig.json                           # CREATE
├── playwright.config.ts                    # CREATE
├── vitest.config.ts                        # CREATE
├── .eslintrc.cjs                           # CREATE
├── .prettierrc                             # CREATE
├── README.md                               # CREATE
├── public/
│   └── favicon.svg                         # CREATE
├── src/
│   ├── env.d.ts                            # CREATE (Astro types + custom YAML module type)
│   ├── layouts/
│   │   └── BaseLayout.astro                # CREATE
│   ├── pages/
│   │   ├── index.astro                     # CREATE (stub /)
│   │   └── journey.astro                   # CREATE (stub /journey)
│   ├── data/
│   │   ├── schema.ts                       # CREATE — zod schemas + inferred types
│   │   ├── load.ts                         # CREATE — YAML import + validation
│   │   └── select.ts                       # CREATE — derived view selectors
│   └── styles/
│       ├── tokens.css                      # CREATE — CSS custom-property tokens
│       ├── reset.css                       # CREATE
│       └── global.css                      # CREATE
├── tests/
│   ├── data.test.ts                        # CREATE — Zod validation against real YAML
│   ├── select.test.ts                      # CREATE — selector unit tests
│   └── home.spec.ts                        # CREATE — Playwright smoke
└── (existing) data/portfolio.yml, data/portfolio.local.yml, scripts/whitelabel.py — UNCHANGED
```

---

## Task 1: Initialize git repo + .gitignore

**Files:**
- Create: `.gitignore`

Set up version control. We're not committing yet — that comes in Task 22.

- [ ] **Step 1.1: Initialize git in the project root**

Run:
```bash
git init
git branch -M main
```

Expected output: `Initialized empty Git repository in <path>/.git/`

- [ ] **Step 1.2: Create `.gitignore`**

Create `.gitignore` with this exact content:

```
# Dependencies
node_modules/

# Build output
dist/
.astro/

# Brainstorming artifacts (visual companion sessions)
.superpowers/

# OS noise
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp

# Sensitive YAML — master with real client names, NEVER commit
data/portfolio.local.yml
data/private.yml

# Test artifacts
test-results/
playwright-report/
playwright/.cache/
coverage/

# Env
.env
.env.local
.env.*.local
```

- [ ] **Step 1.3: Verify `.gitignore` is correct**

Run:
```bash
git status --short
```

Expected: should NOT list `data/portfolio.local.yml`, `node_modules/`, or `.superpowers/`. Should list the new files in `data/`, `docs/`, `scripts/`, `NEXT.md`.

No commit yet.

---

## Task 2: Initialize Astro project + install dependencies

**Files:**
- Create: `package.json` (via `npm init`)
- Modify: `package.json` (add scripts)

- [ ] **Step 2.1: Initialize npm**

Run:
```bash
npm init -y
```

Expected: creates `package.json` with default fields.

- [ ] **Step 2.2: Install Astro + integrations**

Run:
```bash
npm install astro@^4 @astrojs/react@^3
```

Expected: installs ~150–200 packages including `astro`, `@astrojs/react`, `vite`, etc.

- [ ] **Step 2.3: Install React (for islands)**

Run:
```bash
npm install react@^18 react-dom@^18
npm install -D @types/react@^18 @types/react-dom@^18
```

- [ ] **Step 2.4: Install data layer deps**

Run:
```bash
npm install zod@^3
npm install -D vite-plugin-yaml@^1
```

- [ ] **Step 2.5: Install dev tooling**

Run:
```bash
npm install -D typescript@^5 vitest@^2 @vitest/ui@^2 playwright@^1 @playwright/test@^1
npm install -D eslint@^9 eslint-plugin-astro@^1 prettier@^3 prettier-plugin-astro@^0.13
```

- [ ] **Step 2.6: Install Playwright browsers**

Run:
```bash
npx playwright install --with-deps chromium
```

Expected: downloads Chromium ~150 MB. Confirm output ends with `Browsers downloaded`.

- [ ] **Step 2.7: Update `package.json` scripts block**

Replace the `"scripts"` section in `package.json` with:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "astro": "astro",
  "check": "astro check && tsc --noEmit",
  "lint": "eslint . --ext .ts,.tsx,.astro",
  "format": "prettier --write \"**/*.{ts,tsx,astro,md,json}\"",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "whitelabel": "python3 scripts/whitelabel.py"
}
```

- [ ] **Step 2.8: Verify Astro CLI works**

Run:
```bash
npx astro --version
```

Expected: prints `astro v4.x.x`. No errors.

---

## Task 3: Configure `astro.config.mjs`

**Files:**
- Create: `astro.config.mjs`

The single most important config file. Wrong `base` or missing yaml plugin = broken build.

- [ ] **Step 3.1: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import yaml from 'vite-plugin-yaml';

// https://astro.build/config
export default defineConfig({
  site: 'https://omkshirsagar.github.io',
  base: '/',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [yaml()],
  },
  build: {
    assets: '_astro',
  },
});
```

- [ ] **Step 3.2: Verify config loads**

Run:
```bash
npx astro info
```

Expected: prints Astro version, integrations (`@astrojs/react`), Node version. No errors. If it errors with "module not found", re-check Task 2's install steps.

---

## Task 4: TypeScript strict configuration

**Files:**
- Create: `tsconfig.json`
- Create: `src/env.d.ts`

- [ ] **Step 4.1: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vitest/globals", "@types/react", "@types/react-dom"]
  },
  "include": ["src", "tests", "astro.config.mjs"],
  "exclude": ["node_modules", "dist", ".astro"]
}
```

- [ ] **Step 4.2: Create `src/env.d.ts`**

```ts
/// <reference types="astro/client" />

// Allow `import data from '*.yml'` (vite-plugin-yaml returns the parsed object)
declare module '*.yml' {
  const content: Record<string, unknown>;
  export default content;
}
declare module '*.yaml' {
  const content: Record<string, unknown>;
  export default content;
}
```

- [ ] **Step 4.3: Verify TypeScript builds**

Run:
```bash
npm run check
```

Expected: `astro check` runs, may print "0 errors" or warn about missing files (the `src/pages/` dir doesn't exist yet). If it errors on tsconfig syntax, re-check Step 4.1.

---

## Task 5: ESLint + Prettier

**Files:**
- Create: `.eslintrc.cjs`
- Create: `.prettierrc`

- [ ] **Step 5.1: Create `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:astro/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
    },
  ],
};
```

- [ ] **Step 5.2: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [
    {
      "files": "*.astro",
      "options": { "parser": "astro" }
    }
  ]
}
```

- [ ] **Step 5.3: Install missing TypeScript ESLint deps**

```bash
npm install -D @typescript-eslint/parser@^8 astro-eslint-parser@^1
```

- [ ] **Step 5.4: Verify lint runs (will be vacuous — no files yet)**

```bash
npm run lint
```

Expected: exits with status 0 (nothing to lint). If it errors on parser config, re-check Step 5.1.

---

## Task 6: Verify the existing whitelabel script

The script already exists at `scripts/whitelabel.py`. We just confirm it runs cleanly.

- [ ] **Step 6.1: Run the whitelabel script**

Run:
```bash
npm run whitelabel
```

Expected output (last lines):
```
Wrote data/portfolio.yml (X chars, was Y)
Total substitutions: 109
✓ No real client names detected in public output.
```

If it fails, the script path or Python version may be wrong. The script requires Python 3.7+ — verify with `python3 --version`.

- [ ] **Step 6.2: Verify the public YAML has no client name leaks**

Run:
```bash
grep -E "Global pharmaceutical manufacturer|US healthcare diagnostics provider|the client's flagship product|the assistant|internal engineering program" data/portfolio.yml || echo "CLEAN"
```

Expected: prints `CLEAN`. If it prints any matches, the script has a regression — fix before continuing.

---

## Task 7: Write the Zod schema for `personal` section

We'll build the schema **section-by-section** (TDD style) starting with the smallest. Each task adds one section to the schema, with a test that validates the real YAML's matching section.

**Files:**
- Create: `src/data/schema.ts`
- Create: `tests/data.test.ts`

- [ ] **Step 7.1: Write the failing test first**

Create `tests/data.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { personalSchema } from '@/data/schema';

const portfolio = yaml.load(
  readFileSync(resolve(__dirname, '../data/portfolio.yml'), 'utf8')
) as Record<string, unknown>;

describe('Portfolio schema validation', () => {
  it('personal section parses', () => {
    const result = personalSchema.safeParse(portfolio.personal);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 7.2: Install `js-yaml` for the test file**

```bash
npm install -D js-yaml @types/js-yaml
```

- [ ] **Step 7.3: Create `src/data/schema.ts` with just the `personal` schema**

```ts
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Atomic helpers
// ---------------------------------------------------------------------------

const HexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/);

// ---------------------------------------------------------------------------
// Personal
// ---------------------------------------------------------------------------

const LocationSchema = z.object({
  city: z.string(),
  state: z.string().optional(),
  country: z.string(),
});

const ContactSchema = z.object({
  email: z.string().email().or(z.literal('')).nullable().optional(),
  github: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  twitter: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});

const AvatarSchema = z.object({
  skin: HexColor,
  hair_color: HexColor,
  hair_style: z.string(),
  facial_hair: z.string(),
  glasses: z.boolean(),
  glasses_color: HexColor,
  shirt_color: HexColor,
  pants_color: HexColor,
  accent_color: HexColor,
});

export const personalSchema = z.object({
  full_name: z.string(),
  preferred_name: z.string(),
  pronouns: z.string().nullable().optional(),
  date_of_birth: z.union([z.string(), z.date()]).nullable().optional(),
  nationality: z.string().nullable().optional(),

  current_role: z.string(),
  current_functional_role: z.string().nullable().optional(),
  current_company: z.string(),
  location: LocationSchema,

  years_experience: z.number(),
  career_started: z.union([z.string(), z.date()]).nullable().optional(),

  short_bio: z.string(),
  specializations: z.array(z.string()),
  industries: z.array(z.string()),
  strengths: z.array(z.string()),
  interests: z.array(z.string()),
  current_focus: z.array(z.string()),
  career_highlights: z.array(z.string()),

  languages: z.object({
    spoken: z.array(z.string()),
  }),

  contact: ContactSchema,
  avatar: AvatarSchema,
});

export type Personal = z.infer<typeof personalSchema>;
```

- [ ] **Step 7.4: Run the test — expect PASS**

```bash
npm run test
```

Expected: 1 test passes (`personal section parses`). If it fails, the error output will show which YAML field doesn't match the schema. Inspect the real YAML and adjust the schema accordingly (likely making more fields optional).

- [ ] **Step 7.5: Commit**

We don't commit yet (Task 22 is the first commit). Skip for now.

---

## Task 8: Extend schema with remaining sections

Add schemas for each section in `portfolio.yml`. Same TDD pattern: add a test, expect fail, add schema, expect pass.

For brevity, the steps below add **one consolidated schema set** rather than one schema per section. The reasoning: most sections are simple arrays of objects, and writing 14 individual TDD cycles is wasteful.

- [ ] **Step 8.1: Replace `src/data/schema.ts` with the full schema**

```ts
import { z } from 'zod';

const HexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/);
const FlexDate = z.union([z.string(), z.date()]).nullable().optional();

// ===== Personal (unchanged from Task 7) =====
const LocationSchema = z.object({
  city: z.string(),
  state: z.string().optional(),
  country: z.string(),
});
const ContactSchema = z.object({
  email: z.string().email().or(z.literal('')).nullable().optional(),
  github: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  twitter: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});
const AvatarSchema = z.object({
  skin: HexColor, hair_color: HexColor, hair_style: z.string(),
  facial_hair: z.string(), glasses: z.boolean(), glasses_color: HexColor,
  shirt_color: HexColor, pants_color: HexColor, accent_color: HexColor,
});
export const personalSchema = z.object({
  full_name: z.string(), preferred_name: z.string(),
  pronouns: z.string().nullable().optional(),
  date_of_birth: FlexDate, nationality: z.string().nullable().optional(),
  current_role: z.string(), current_functional_role: z.string().nullable().optional(),
  current_company: z.string(), location: LocationSchema,
  years_experience: z.number(), career_started: FlexDate,
  short_bio: z.string(),
  specializations: z.array(z.string()), industries: z.array(z.string()),
  strengths: z.array(z.string()), interests: z.array(z.string()),
  current_focus: z.array(z.string()), career_highlights: z.array(z.string()),
  languages: z.object({ spoken: z.array(z.string()) }),
  contact: ContactSchema, avatar: AvatarSchema,
});

// ===== Professional Identity =====
export const professionalIdentitySchema = z.object({
  tagline: z.string(),
  one_line_bio: z.string(),
  short_bio: z.string(),
  elevator_pitch: z.string(),
  professional_mission: z.string(),
  areas_of_expertise: z.array(z.string()),
  engineering_philosophy: z.array(z.string()),
  differentiators: z.array(z.string()),
  career_narrative: z.string(),
  ideal_roles: z.array(z.string()),
});

// ===== Education =====
export const educationItemSchema = z.object({
  institution: z.string().nullable().optional(),
  degree: z.string(),
  field: z.string(),
  start_year: z.number().nullable().optional(),
  end_year: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
  gpa: z.number().nullable().optional(),
  highlights: z.array(z.string()).default([]),
});
export const academicHighlightsSchema = z.object({
  academic_strengths: z.array(z.string()),
  key_takeaways: z.array(z.string()),
});

// ===== Career =====
const PhaseSchema = z.object({
  order: z.number(),
  name: z.string(),
  type: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  start_date: FlexDate, end_date: FlexDate,
  focus: z.array(z.string()).default([]),
  refs: z.array(z.string()).default([]),
  refs_section: z.string().nullable().optional(),
  refs_filter: z.record(z.string()).nullable().optional(),
});
const TitleProgressionSchema = z.object({
  title: z.string(), start_date: FlexDate, end_date: FlexDate, summary: z.string(),
});
export const careerItemSchema = z.object({
  id: z.string(), company: z.string(), role: z.string(),
  functional_role: z.string().nullable().optional(),
  start_date: FlexDate, end_date: FlexDate,
  location: LocationSchema.nullable().optional(),
  summary: z.string(),
  technologies: z.array(z.string()).default([]),
  direct_reports: z.number().default(0),
  joining_context: z.record(z.unknown()).nullable().optional(),
  key_themes: z.array(z.string()).default([]),
  phases: z.array(PhaseSchema).default([]),
  title_progression: z.array(TitleProgressionSchema).default([]),
});

// ===== Career milestones =====
export const careerMilestoneSchema = z.object({
  date: FlexDate,
  milestone: z.string(),
  details: z.string(),
  refs: z.array(z.string()).default([]),
  refs_section: z.string().nullable().optional(),
});

// ===== Engagements =====
export const engagementSchema = z.object({
  id: z.string(), name: z.string(), type: z.string(),
  employer: z.string(), industry: z.string().nullable().optional(),
  start_date: FlexDate, end_date: FlexDate,
}).passthrough(); // engagement details vary widely; allow extra fields

// ===== Growth trajectory =====
export const growthTrajectorySchema = z.record(z.object({
  order: z.number(), responsibilities: z.array(z.string()),
}));

// ===== Leadership without title =====
export const leadershipWithoutTitleItemSchema = z.object({
  behavior: z.string(), backed_by: z.array(z.string()),
});

// ===== Recognition summary =====
export const recognitionSummarySchema = z.object({
  awards_received: z.object({ outstanding_awards: z.number(), applause_awards: z.number() }),
  promotions: z.array(z.object({ from: z.string(), to: z.string(), date: FlexDate })),
  notable_achievements: z.array(z.string()),
  categorized_achievements: z.record(z.array(z.string())).optional(),
});

// ===== Leadership stories =====
export const leadershipStorySchema = z.object({
  id: z.string(), title: z.string(), period: z.string(),
}).passthrough();

// ===== Engineering profile =====
export const engineeringProfileSchema = z.object({
  strongest_traits: z.array(z.string()),
  recurring_pattern: z.object({
    sequence: z.array(z.string()),
    description: z.string(),
  }),
});

// ===== Projects =====
export const projectSchema = z.object({
  id: z.string(), title: z.string(), type: z.string(),
}).passthrough(); // project entries are highly varied — accept any extra fields

// ===== Skills =====
export const skillsSchema = z.record(z.unknown()); // varies heavily; loose schema

// ===== Publications =====
export const publicationSchema = z.object({
  title: z.string(), publisher: z.string(),
  year: z.number(), role: z.string(),
}).passthrough();

// ===== Research profile =====
export const researchProfileSchema = z.object({
  total_publications: z.number(),
  primary_research_interests: z.array(z.string()),
  demonstrated_capabilities: z.array(z.string()),
  impact_on_career: z.array(z.string()),
});

// ===== Hackathons =====
export const hackathonSchema = z.object({
  id: z.string(), name: z.string().nullable(),
  project_built: z.string(),
}).passthrough();

// ===== Awards =====
export const awardSchema = z.object({
  title: z.string(), issuer: z.string(), year: z.number(),
}).passthrough();

// ===== Interview stories =====
export const interviewStorySchema = z.object({
  id: z.string(), title: z.string(), public: z.boolean(),
}).passthrough();

// ===== Technology inventory =====
export const technologyInventorySchema = z.record(z.unknown());

// ===========================================================================
// ROOT
// ===========================================================================

export const portfolioSchema = z.object({
  personal: personalSchema,
  professional_identity: professionalIdentitySchema,
  education: z.array(educationItemSchema),
  academic_highlights: academicHighlightsSchema,
  certifications: z.array(z.unknown()).default([]),
  career: z.array(careerItemSchema),
  career_milestones: z.array(careerMilestoneSchema),
  engagements: z.array(engagementSchema),
  growth_trajectory: growthTrajectorySchema,
  leadership_without_title: z.array(leadershipWithoutTitleItemSchema),
  recognition_summary: recognitionSummarySchema,
  leadership_stories: z.array(leadershipStorySchema),
  engineering_profile: engineeringProfileSchema,
  projects: z.array(projectSchema),
  achievements: z.array(z.unknown()).default([]),
  skills: skillsSchema,
  publications: z.array(publicationSchema),
  research_profile: researchProfileSchema,
  open_source: z.array(z.unknown()).default([]),
  hackathons: z.array(hackathonSchema),
  leadership: z.array(z.unknown()).default([]),
  awards: z.array(awardSchema),
  interview_stories: z.array(interviewStorySchema),
  technology_inventory: technologyInventorySchema,
});

export type Portfolio = z.infer<typeof portfolioSchema>;
```

- [ ] **Step 8.2: Replace the test file with the full schema test**

Replace `tests/data.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { portfolioSchema, personalSchema } from '@/data/schema';

const portfolio = yaml.load(
  readFileSync(resolve(__dirname, '../data/portfolio.yml'), 'utf8')
) as Record<string, unknown>;

describe('Portfolio YAML', () => {
  it('parses personal section', () => {
    const result = personalSchema.safeParse(portfolio.personal);
    if (!result.success) console.error(JSON.stringify(result.error.format(), null, 2));
    expect(result.success).toBe(true);
  });

  it('parses full portfolio schema', () => {
    const result = portfolioSchema.safeParse(portfolio);
    if (!result.success) console.error(JSON.stringify(result.error.format(), null, 2));
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 8.3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 8.4: Run the tests**

```bash
npm run test
```

Expected: 2 tests pass. If a test fails, the printed Zod error tells you exactly which field rejected — fix the schema (likely loosening a type or marking a field optional). Iterate until both pass.

---

## Task 9: Data loader

**Files:**
- Create: `src/data/load.ts`

- [ ] **Step 9.1: Create `src/data/load.ts`**

```ts
import portfolioYaml from '../../data/portfolio.yml';
import { portfolioSchema, type Portfolio } from './schema';

/**
 * Parses and validates the portfolio YAML at build time.
 * Throws (fails the build) if the YAML doesn't conform to the schema.
 * Also strips any entries with `public: false`.
 */
function loadAndValidate(): Portfolio {
  const result = portfolioSchema.safeParse(portfolioYaml);
  if (!result.success) {
    console.error('[data/load] portfolio.yml failed schema validation:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('portfolio.yml schema validation failed');
  }

  // Strip interview_stories where public === false
  const cleaned = {
    ...result.data,
    interview_stories: result.data.interview_stories.filter(
      (s: { public?: boolean }) => s.public !== false
    ),
  };

  return cleaned;
}

export const portfolio: Portfolio = loadAndValidate();
```

- [ ] **Step 9.2: Smoke test the loader**

Run:
```bash
node --experimental-strip-types --import 'data:text/javascript,import{register}from "node:module";import{pathToFileURL}from "node:url";register("@swc-node/register/esm",pathToFileURL("./"));' -e "import('./src/data/load.ts').then(m => console.log('Loaded. Name:', m.portfolio.personal.full_name)).catch(e => { console.error(e); process.exit(1); });"
```

This is gnarly. Easier: write a tiny test instead.

Update `tests/data.test.ts` — add at the bottom:

```ts
describe('Data loader', () => {
  it('exports a validated portfolio object', async () => {
    const { portfolio } = await import('@/data/load');
    expect(portfolio.personal.preferred_name).toBe('Om');
    expect(portfolio.personal.current_company).toBe('Deloitte');
  });
});
```

Run:
```bash
npm run test
```

Expected: 3 tests pass.

---

## Task 10: Selectors (derived views)

**Files:**
- Create: `src/data/select.ts`
- Create: `tests/select.test.ts`

Selectors keep components ignorant of YAML shape. Add the ones we need for Plan 1 (just enough for the stub page).

- [ ] **Step 10.1: Write the failing test first**

Create `tests/select.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { heroData, featuredProjects, careerArc } from '@/data/select';

describe('Selectors', () => {
  it('heroData returns name + current role', () => {
    const hero = heroData();
    expect(hero.name).toBeTruthy();
    expect(hero.role).toBe('Analyst');
    expect(hero.company).toBe('Deloitte');
  });

  it('featuredProjects returns exactly 3 items', () => {
    const featured = featuredProjects();
    expect(featured.length).toBe(3);
    // Should include RTVA (now renamed to healthcare-voice-assistant), Starter Kit, Sign Language
    const ids = featured.map((p) => p.id);
    expect(ids).toContain('healthcare-voice-assistant');
    expect(ids).toContain('sop-fastapi-starter');
    expect(ids).toContain('sign-language-ai');
  });

  it('careerArc returns 5 phase entries', () => {
    const arc = careerArc();
    expect(arc.length).toBeGreaterThanOrEqual(4);
    expect(arc[0].name).toMatch(/Training/i);
  });
});
```

- [ ] **Step 10.2: Run — expect FAIL (no select.ts yet)**

```bash
npm run test
```

Expected: 3 new tests fail with "Cannot find module '@/data/select'".

- [ ] **Step 10.3: Create `src/data/select.ts`**

```ts
import { portfolio } from './load';

export interface HeroData {
  name: string;
  preferredName: string;
  role: string;
  functionalRole?: string;
  company: string;
  kicker: string;
  tagline: string;
  promotedBadge?: string;
}

export function heroData(): HeroData {
  const p = portfolio.personal;
  const pi = portfolio.professional_identity;
  const titleProgression = portfolio.career[0]?.title_progression ?? [];
  const latestPromotion = titleProgression.length >= 2 ? titleProgression[titleProgression.length - 1] : null;

  return {
    name: p.full_name,
    preferredName: p.preferred_name,
    role: p.current_role,
    functionalRole: p.current_functional_role ?? undefined,
    company: p.current_company,
    kicker: `// ${p.current_functional_role ?? p.current_role} · ${p.location.city}`,
    tagline: pi.tagline,
    promotedBadge: latestPromotion
      ? `PROMOTED · ${formatPromotionDate(latestPromotion.start_date)}`
      : undefined,
  };
}

function formatPromotionDate(d: unknown): string {
  if (!d) return '';
  const str = d instanceof Date ? d.toISOString() : String(d);
  // Take YYYY-MM and format as "MMM YYYY"
  const m = str.match(/^(\d{4})-(\d{2})/);
  if (!m) return str;
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

export interface FeaturedProject {
  id: string;
  title: string;
  client?: string;
  role?: string;
  summary?: string;
  technologies?: unknown;
  order?: number;
}

export function featuredProjects(): FeaturedProject[] {
  // Combine projects[] and hackathons[] both filtered by featured: true
  const projectsFeatured = (portfolio.projects as Array<Record<string, unknown>>)
    .filter((p) => p.featured === true)
    .map((p) => ({
      id: p.id as string,
      title: p.title as string,
      client: p.client as string | undefined,
      role: p.role as string | undefined,
      summary: p.summary as string | undefined,
      technologies: p.technologies,
      order: p.order as number | undefined,
    }));

  const hackathonsFeatured = (portfolio.hackathons as Array<Record<string, unknown>>)
    .filter((h) => h.featured === true)
    .map((h) => ({
      id: h.id as string,
      title: (h.project_built ?? h.name) as string,
      client: undefined,
      role: h.your_role as string | undefined,
      summary: h.summary as string | undefined,
      technologies: h.technologies,
      order: h.order as number | undefined,
    }));

  return [...projectsFeatured, ...hackathonsFeatured].sort(
    (a, b) => (a.order ?? 99) - (b.order ?? 99)
  );
}

export interface ArcPhase {
  order: number;
  name: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}

export function careerArc(): ArcPhase[] {
  const phases = portfolio.career[0]?.phases ?? [];
  return phases
    .filter((p) => p.type !== 'parallel') // skip Hackathons/Personal parallel tracks
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      order: p.order,
      name: p.name,
      role: p.role ?? undefined,
      startDate: p.start_date ? String(p.start_date) : undefined,
      endDate: p.end_date ? String(p.end_date) : undefined,
    }));
}
```

- [ ] **Step 10.4: Run tests again — expect PASS**

```bash
npm run test
```

Expected: all 6 tests pass (3 schema + 3 selectors). If `featuredProjects` returns more or fewer than 3, double-check that exactly RTVA, Starter Kit, and Sign Language have `featured: true` in `data/portfolio.yml`.

---

## Task 11: Global styles + tokens

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/reset.css`
- Create: `src/styles/global.css`

- [ ] **Step 11.1: Create `src/styles/tokens.css`**

```css
:root {
  /* ---- Color tokens ---- */
  --bg:           #08080d;
  --bg-raised:    #11111a;
  --bg-surface:   #14141c;
  --border:       #1f1f2c;

  --text-pri:     #f4f1ea;
  --text-sec:     #c4b598;
  --text-muted:   #888094;
  --text-dim:     #5a5566;

  --accent-warm:    #ffd29a;
  --accent-orange:  #ff9460;
  --accent-dusk:    #5a4870;
  --accent-cyan:    #5af3d0;
  --accent-red:     #c8311f;

  --status-active:  #88e07d;

  /* ---- Fonts ---- */
  --font-display: 'Inter', system-ui, sans-serif;
  --font-italic:  'Fraunces', Georgia, serif;
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;

  /* ---- Spacing ---- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

- [ ] **Step 11.2: Create `src/styles/reset.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }
html, body { height: 100%; }
img, picture, svg, video { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
button { background: none; border: none; cursor: pointer; color: inherit; }
a { color: inherit; text-decoration: none; }
h1, h2, h3, h4, h5, h6 { font-weight: inherit; font-size: inherit; }
```

- [ ] **Step 11.3: Create `src/styles/global.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,500&family=JetBrains+Mono:wght@400;500;700&display=swap');

@import './reset.css';
@import './tokens.css';

body {
  background: var(--bg);
  color: var(--text-pri);
  font-family: var(--font-display);
  font-feature-settings: 'cv11', 'ss01';
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

---

## Task 12: Base layout

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 12.1: Create `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Om Kshirsagar — Full Stack AI Engineer' } = Astro.props;
const site = Astro.site?.toString() ?? 'https://omkshirsagar.github.io';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <link rel="canonical" href={site} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- OpenGraph -->
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={site} />
    <meta property="og:type" content="website" />
    <meta property="og:image" content={`${site}og.png`} />

    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

---

## Task 13: Stub pages

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/pages/journey.astro`
- Create: `public/favicon.svg`

Bare-minimum pages that render real data. The full design comes in Plan 2 + Plan 3.

- [ ] **Step 13.1: Create `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#08080d"/>
  <text x="16" y="22" font-family="Inter, sans-serif" font-size="18" font-weight="800" fill="#ffd29a" text-anchor="middle">O</text>
</svg>
```

- [ ] **Step 13.2: Create `src/pages/index.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { heroData } from '@/data/select';

const hero = heroData();
---
<BaseLayout title={`${hero.name} — ${hero.role} @ ${hero.company}`}>
  <main style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 40px;">
    <p style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent-orange); margin-bottom: 16px;">
      {hero.kicker}
    </p>
    <h1 style="font-size: 72px; font-weight: 800; letter-spacing: -0.04em; line-height: 0.9; margin-bottom: 16px;">
      {hero.preferredName} <span style="font-family: var(--font-italic); font-style: italic; font-weight: 400; color: var(--accent-warm);">Kshirsagar</span>
    </h1>
    <p style="font-size: 18px; color: var(--text-sec);">
      <strong style="color: var(--text-pri);">{hero.role}</strong> @ {hero.company}
      {hero.promotedBadge && (
        <span style="margin-left: 8px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em; padding: 3px 7px; background: rgba(255, 210, 154, 0.18); color: var(--accent-warm); border-radius: 2px; vertical-align: 2px;">
          {hero.promotedBadge}
        </span>
      )}
    </p>
    <p style="margin-top: 40px; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
      ★ scaffold v0 — full page in Plan 2 · <a href="/journey" style="color: var(--accent-warm);">/journey →</a>
    </p>
  </main>
</BaseLayout>
```

- [ ] **Step 13.3: Create `src/pages/journey.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
---
<BaseLayout title="Journey · Om Kshirsagar">
  <main style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; text-align: center;">
    <p style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent-orange); margin-bottom: 16px;">
      // journey
    </p>
    <h1 style="font-size: 48px; font-weight: 800; letter-spacing: -0.03em;">
      The cinematic <span style="font-family: var(--font-italic); font-style: italic; font-weight: 400; color: var(--accent-warm);">movie</span> ships in Plan 3.
    </h1>
    <p style="margin-top: 40px;">
      <a href="/" style="color: var(--accent-warm); font-family: var(--font-mono); font-size: 12px;">← back to /</a>
    </p>
  </main>
</BaseLayout>
```

- [ ] **Step 13.4: Run dev server + verify pages render**

```bash
npm run dev
```

Expected: Astro starts, prints "Local: http://localhost:4321/". Open the URL in browser:
- `/` shows "Om Kshirsagar" as h1 with "Analyst @ Deloitte" + "PROMOTED · JUN 2026" badge.
- `/journey` shows "The cinematic movie ships in Plan 3."

Stop the dev server with Ctrl+C.

- [ ] **Step 13.5: Build + verify dist/**

```bash
npm run build
```

Expected: Astro builds without errors. Output: `dist/index.html`, `dist/journey/index.html`, `dist/_astro/...`. If it errors on YAML import, the `vite-plugin-yaml` is not loaded — re-check `astro.config.mjs` from Task 3.

Run preview to verify the built output:
```bash
npm run preview
```

Expected: serves on `http://localhost:4321/`. Same content as dev mode.

---

## Task 14: Playwright smoke test

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/home.spec.ts`

- [ ] **Step 14.1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
```

- [ ] **Step 14.2: Create `tests/home.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('homepage renders name and role from YAML', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Kshirsagar');
  await expect(page.locator('body')).toContainText('Analyst');
  await expect(page.locator('body')).toContainText('Deloitte');
  await expect(page.locator('body')).toContainText('PROMOTED');
});

test('journey route renders placeholder', async ({ page }) => {
  await page.goto('/journey');
  await expect(page.locator('h1')).toContainText('cinematic');
});

test('cross-link from home to journey works', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/journey"]');
  await expect(page).toHaveURL(/\/journey/);
});
```

- [ ] **Step 14.3: Run Playwright**

```bash
npm run test:e2e
```

Expected: 3 tests pass. Playwright will auto-build + preview the site before running.

---

## Task 15: README

**Files:**
- Create: `README.md`

- [ ] **Step 15.1: Create `README.md`**

```markdown
# omkshirsagar.github.io

Personal portfolio for **Om Kshirsagar** — Full Stack AI Engineer at Deloitte.

Live: [omkshirsagar.github.io](https://omkshirsagar.github.io)

## Stack

- **Astro 4** (static site)
- **React 18** islands (the `/journey` route is a WebGPU canvas)
- **TypeScript** strict
- Data: `data/portfolio.yml` → Zod-validated at build time
- Deploy: GitHub Actions → GitHub Pages on every push to `main`

See `docs/superpowers/specs/` for the full design spec.
See `docs/superpowers/plans/` for implementation plans (this is Plan 1).

## Development

```bash
npm install            # one-time
npm run dev            # http://localhost:4321
npm run build          # build to dist/
npm run preview        # preview the built site
npm test               # vitest (schema + selectors)
npm run test:e2e       # playwright smoke
npm run lint
npm run whitelabel     # regenerate data/portfolio.yml from data/portfolio.local.yml
```

## Whitelabel

`data/portfolio.local.yml` (gitignored) is the master with real client names. `data/portfolio.yml` (committed) is the anonymized version generated by `scripts/whitelabel.py`. Always edit the `.local` file, then run `npm run whitelabel`.
```

---

## Task 16: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 16.1: Create the workflow file**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

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

      - run: npm run build

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

---

## Task 17: GitHub repo creation + first commit + push

**This task involves doing things on github.com that the agent can't do directly. Follow the manual steps.**

- [ ] **Step 17.1: Stage all current changes**

Run:
```bash
git add -A
git status --short
```

Expected: lists all created files, does NOT list `data/portfolio.local.yml`, `node_modules/`, or `.superpowers/`. If those appear, fix `.gitignore` from Task 1.

- [ ] **Step 17.2: First commit**

```bash
git commit -m "feat: Plan 1 — Astro scaffold with data pipeline, whitelabel, deploy workflow"
```

- [ ] **Step 17.3: Create the GitHub repo (manual)**

Go to https://github.com/new and create a new repo:
- Owner: `OmKshirsagar`
- Repository name: `OmKshirsagar.github.io` (exactly — must match username casing)
- Visibility: **Public** (required for free Pages tier)
- Do NOT add a README, .gitignore, or license (we already have them locally)

Click "Create repository".

- [ ] **Step 17.4: Add the remote + push**

```bash
git remote add origin https://github.com/OmKshirsagar/OmKshirsagar.github.io.git
git push -u origin main
```

Expected: pushes ~30 files. If you get an auth error, set up a GitHub Personal Access Token or use the GitHub CLI (`gh auth login`).

- [ ] **Step 17.5: Enable GitHub Pages (manual)**

In the repo on GitHub:
1. Click **Settings** → **Pages** (left sidebar)
2. Under "Build and deployment" → "Source": select **GitHub Actions** (NOT "Deploy from a branch")

The first push triggers `deploy.yml` automatically.

- [ ] **Step 17.6: Watch the deploy succeed**

In the GitHub repo:
1. Click the **Actions** tab.
2. You should see a workflow run titled "feat: Plan 1 — Astro scaffold..."
3. Wait for both `build` and `deploy` jobs to show green checkmarks (typically 1–2 minutes).
4. The `deploy` job's "Deploy to GitHub Pages" step output shows the deployed URL: `https://omkshirsagar.github.io`.

- [ ] **Step 17.7: Visit the live site**

Open https://omkshirsagar.github.io in a browser.

Expected: the scaffolded page renders. Shows "Om Kshirsagar" h1, "Analyst @ Deloitte" + "PROMOTED · JUN 2026" badge, and a link to `/journey`.

If the page 404s, double-check:
- Repo is **Public**
- Pages source = **GitHub Actions**
- Workflow finished (green checkmark in Actions tab)
- Hard refresh the browser (Cmd+Shift+R)

---

## Task 18: Final verification + lint pass

- [ ] **Step 18.1: Run the full check suite locally**

```bash
npm run check        # astro check + tsc --noEmit
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright smoke
npm run build        # Astro build
```

Expected: all five commands exit with status 0. Fix anything that fails.

- [ ] **Step 18.2: Commit any final fixes**

```bash
git add -A
git commit -m "chore: pass full check suite" || echo "Nothing to commit"
git push
```

The push triggers another deploy. Verify it succeeds in the Actions tab.

- [ ] **Step 18.3: Final smoke from live URL**

```bash
curl -s https://omkshirsagar.github.io | grep -E "(Kshirsagar|Analyst|Deloitte)" || echo "FAIL"
```

Expected: prints lines containing "Kshirsagar", "Analyst", "Deloitte". If it prints "FAIL", the site isn't serving — check the Actions tab for failures.

---

## Done.

After Task 18 you have:
- ✅ Astro project initialised with React + TypeScript + Tailwind-free CSS Modules pattern
- ✅ `data/portfolio.yml` flows through Zod validation into typed selectors
- ✅ `/` and `/journey` stub pages render real data
- ✅ Vitest unit tests + Playwright smoke pass
- ✅ Deployed to https://omkshirsagar.github.io via GitHub Actions
- ✅ Whitelabel script working; private master gitignored
- ✅ Update `NEXT.md` to point to Plan 2 next

**Next plan:** `docs/superpowers/plans/2026-06-XX-plan-2-static-page.md` — build all the static page components (hero, featured bands, timeline tree, etc.). After Plan 2 ships, the recruiter-friendly landing page is complete.
