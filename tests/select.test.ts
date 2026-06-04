import { describe, it, expect } from 'vitest';
import {
  heroData,
  featuredProjects,
  careerArc,
  statsData,
  workTimeline,
  recognizedItems,
  contactInfo,
  footerData,
  caseStudyBySlug,
  allCaseStudies,
} from '@/data/select';

describe('Selectors', () => {
  it('heroData returns name + current role', () => {
    const hero = heroData();
    expect(hero.name).toBeTruthy();
    expect(hero.role).toBe('Software Engineer I');
    expect(hero.company).toBe('Deloitte');
  });

  it('featuredProjects returns exactly 3 items', () => {
    const featured = featuredProjects();
    expect(featured.length).toBe(3);
    const ids = featured.map((p) => p.id);
    expect(ids).toContain('healthcare-voice-assistant');
    expect(ids).toContain('sop-fastapi-starter');
    expect(ids).toContain('sign-language-ai');
  });

  it('careerArc returns at least 4 phase entries', () => {
    const arc = careerArc();
    expect(arc.length).toBeGreaterThanOrEqual(4);
    expect(arc[0].name).toMatch(/Training/i);
  });
});

describe('statsData', () => {
  it('returns 6 stat tiles with values and labels', () => {
    const stats = statsData();
    expect(stats.length).toBe(6);
    expect(stats[0]).toHaveProperty('value');
    expect(stats[0]).toHaveProperty('label');
    const labels = stats.map((s) => s.label);
    expect(labels.some((l) => /deloitte/i.test(l))).toBe(true);
    expect(labels.some((l) => /award/i.test(l))).toBe(true);
    expect(labels.some((l) => /project/i.test(l))).toBe(true);
  });
});

describe('workTimeline', () => {
  it('splits work into engagements + side sections, recent → past', () => {
    const tl = workTimeline();
    // Section A: engagements (client + internal program work)
    expect(tl.engagements.length).toBeGreaterThanOrEqual(3);
    const engNames = tl.engagements.map((g) => g.name);
    expect(engNames.some((n) => /pharma|client/i.test(n))).toBe(true);
    expect(engNames.some((n) => /sop/i.test(n))).toBe(true);
    // First engagement is the most recent (Healthcare client at the top)
    expect(tl.engagements[0]!.toneKey).toBe('exact');
    expect(tl.engagements[0]!.children.length).toBeGreaterThanOrEqual(1);

    // Section B: side projects (hackathons + personal)
    expect(tl.side.length).toBeGreaterThanOrEqual(1);
    const sideNames = tl.side.map((g) => g.name.toLowerCase());
    expect(sideNames.some((n) => /hackathon|personal/.test(n))).toBe(true);
  });

  it('engagement children are sorted current → past by start_date', () => {
    const tl = workTimeline();
    const sop = tl.engagements.find((g) => g.id === 'sop-program');
    expect(sop).toBeDefined();
    if (!sop) return;
    // sop-mcp-enablement (2025-08) must appear before sop-csc (2025-01) when sorted DESC
    const ids = sop.children.map((c) => c.id);
    const mcpIdx = ids.indexOf('sop-mcp-enablement');
    const csIdx = ids.indexOf('sop-csc');
    expect(mcpIdx).toBeGreaterThanOrEqual(0);
    expect(csIdx).toBeGreaterThanOrEqual(0);
    expect(mcpIdx).toBeLessThan(csIdx);
  });
});

describe('recognizedItems', () => {
  it('returns awards + promotion + publication', () => {
    const items = recognizedItems();
    expect(items.length).toBeGreaterThanOrEqual(5);
    const types = items.map((i) => i.kind);
    expect(types).toContain('award');
    expect(types).toContain('promotion');
    expect(types).toContain('publication');
  });
});

describe('contactInfo + footerData', () => {
  it('contactInfo returns the available links', () => {
    const c = contactInfo();
    expect(c.github).toBeTruthy();
  });

  it('footerData includes a get-in-touch headline', () => {
    const f = footerData();
    expect(f.heading).toMatch(/in touch/i);
    expect(Array.isArray(f.links)).toBe(true);
  });
});

describe('caseStudy selectors', () => {
  it('allCaseStudies returns case studies for all 3 featured slugs', () => {
    const cases = allCaseStudies();
    expect(cases['healthcare-voice-assistant']).toBeDefined();
    expect(cases['sop-fastapi-starter']).toBeDefined();
    expect(cases['sign-language-ai']).toBeDefined();
  });

  it('caseStudyBySlug returns a fully shaped record', () => {
    const cs = caseStudyBySlug('sop-fastapi-starter');
    expect(cs).toBeDefined();
    if (!cs) return;
    expect(cs.headline).toBeTruthy();
    expect(cs.problem).toBeTruthy();
    expect(cs.approach).toBeTruthy();
    expect(cs.architecture.nodes.length).toBeGreaterThan(0);
    expect(cs.architecture.edges.length).toBeGreaterThan(0);
    expect(cs.keyFeatures.length).toBeGreaterThan(0);
    expect(cs.myContributions.length).toBeGreaterThan(0);
    expect(Object.keys(cs.stack).length).toBeGreaterThan(0);
    expect(cs.outcomes.length).toBeGreaterThan(0);
  });

  it('caseStudyBySlug returns undefined for an unknown slug', () => {
    expect(caseStudyBySlug('does-not-exist')).toBeUndefined();
  });

  it('architecture nodes have valid layer enum values', () => {
    const validLayers = new Set(['edge', 'ui', 'orchestrator', 'ai', 'storage']);
    const cs = caseStudyBySlug('healthcare-voice-assistant');
    expect(cs).toBeDefined();
    if (!cs) return;
    for (const node of cs.architecture.nodes) {
      expect(validLayers.has(node.layer)).toBe(true);
    }
  });
});
