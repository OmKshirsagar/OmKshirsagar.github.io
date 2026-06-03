import { describe, it, expect } from 'vitest';
import { heroData, featuredProjects, careerArc } from '@/data/select';

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
