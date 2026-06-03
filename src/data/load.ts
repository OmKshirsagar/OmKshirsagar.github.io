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
