# Resume Portfolio — Pick Up Here

**Last session ended:** Mon Jun 1, 2026 (the day Om was promoted to Analyst)
**Project:** Build `omkshirsagar.github.io` — a cinematic voxel-3D portfolio that replaces the traditional resume.

---

## Where we are

We're mid-brainstorming. **Data capture is paused** (asked to resume tomorrow). All major content is in `data/portfolio.yml` (~1300 lines). Design conversation is the next phase.

The very next thing to discuss when we resume is: **the narrative arc / scene sequence for the journey movie**, using the 12 career milestones as the spine.

---

## What's already in `data/portfolio.yml`

A single source of truth covering 14 top-level sections:

- **Identity** — personal · professional_identity · academic_highlights · research_profile · growth_trajectory (6 personas) · leadership_without_title (6 behaviors)
- **Career** — Deloitte (Feb 2024 → present), title progression Software Engineer → **Analyst (Jun 1, 2026)**, 6 chronological phases, 12 career_milestones ("firsts" timeline)
- **Engagements** — Global pharmaceutical manufacturer · SOP · US healthcare diagnostics provider, all fully detailed
- **Projects** — 14 entries: training-period + 2 Global pharmaceutical manufacturer (Insight Center, NMT) + SOP parent + 7 SOP children + 2 Exact (RTVA, RCM) + ai-resume-builder. Each top-level project has rich deliverables.
- **Hackathons** — AgentX (multimodal CV+ML+LLM, Team Lead) · Deep Research Agent (agentic long-running)
- **Recognition** — 2 Outstanding Awards + 1 Applause Award + 1 Promotion · recognition_summary + categorized_achievements
- **Leadership Stories** — 7 STAR-format case studies
- **Engineering Profile** — recurring pattern: *identify → build → prove → adopt*
- **Skills** — evidence-backed map (10 domains + 3-tier top_strengths)
- **Technology Inventory** — 12 domains
- **Publications** — JETIR 2022 (AlphaZero vs Stockfish)
- **Interview Stories** — Exact RTVA master story with 5 question-typed variants

---

## Design decisions LOCKED (don't re-litigate)

| Decision | Value |
|---|---|
| Site URL | `omkshirsagar.github.io` (GitHub user site) |
| Hosting | GitHub Pages, static |
| Stack | Vite + React + React Three Fiber + `three/webgpu` (WebGPU) + TSL shaders + GSAP/ScrollTrigger |
| Visual style | **Cinematic MagicaVoxel** (denser voxel + cinematic post-processing: bloom, god rays, atmospheric fog, color grading, film grain) |
| Architecture | Two-route: `/` static fast resume + `/journey` lazy WebGPU movie. Landing has a "Watch my journey →" CTA. |
| Structure | One-page scroll, in-page bottom nav, top-3 featured projects + "More work" strip |
| Browser support | Static page works everywhere; `/journey` requires WebGPU (Chrome 113+ / Safari 18+), shows graceful fallback otherwise |
| SMS Assistant placement | Stays as deliverable under `healthcare-voice-assistant` (not promoted to standalone project) |
| YAML privacy | Single public file for now; can split `data/private.yml` later if needed |

---

## Design decisions PENDING (the agenda for tomorrow)

In order of expected discussion:

1. **Narrative arc / scene sequence** — the 12 career milestones are the spine. Confirm which become scenes vs beats, scene count, and the transitions.
2. **Top 3 featured projects** — recommended: Exact RTVA + Contract Assistant + FastAPI Starter Kit. Pending confirmation.
3. **Static `/` page layout** — sections, hierarchy, visual treatment for the resume-page-replacement.
4. **Voxel character specs** — confirm/adjust skin tone, hair, glasses, outfit colors (currently using placeholder defaults in `personal.avatar`).
5. **Stack scaffolding plan** — Vite init, routing, YAML build-time loader, R3F + WebGPU baseline, GitHub Actions deploy.
6. **Transition to writing-plans** — once design is approved and the spec doc is written, hand off to implementation planning skill.

---

## Small YAML TODOs (low priority, fill as convenient)

- Education start/end years + location for Jai Hind College
- Contact: email, LinkedIn, Twitter handles
- Hackathon dates + outcomes (winner/finalist/participant) for AgentX + Deep Research Agent
- DOB visibility decision (currently `private by default`)
- Avatar colors final confirmation
- Various `# TODO` markers scattered through the file (team sizes, a few "what does this acronym stand for" gaps if any remain)

---

## How to resume tomorrow

Just say something like:

> *"Let's continue from yesterday"* — and reference this file.

I'll re-read `data/portfolio.yml` + `NEXT.md`, restart the visual companion if needed, and pick up with the narrative arc discussion.
