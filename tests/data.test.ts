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

describe('Data loader', () => {
  it('exports a validated portfolio object', async () => {
    const { portfolio } = await import('@/data/load');
    expect(portfolio.personal.preferred_name).toBe('Om');
    expect(portfolio.personal.current_company).toBe('Deloitte');
  });
});
