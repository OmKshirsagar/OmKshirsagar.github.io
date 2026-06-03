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
  const latestPromotion =
    titleProgression.length >= 2 ? titleProgression[titleProgression.length - 1] : null;

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
    .filter((p) => p.type !== 'parallel') // skip parallel tracks (hackathons/personal)
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      order: p.order,
      name: p.name,
      role: p.role ?? undefined,
      startDate: p.start_date ? String(p.start_date) : undefined,
      endDate: p.end_date ? String(p.end_date) : undefined,
    }));
}
