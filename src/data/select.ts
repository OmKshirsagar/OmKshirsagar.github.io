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
  const adoptionCount = 12;
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
  toneKey: 'redacted-client-a' | 'sop' | 'exact' | 'hackathon' | 'personal';
  children: WorkTimelineChild[];
}

export interface WorkTimelineSections {
  /** Client + internal-program engagements, sorted current → past.
      Each engagement's children are also sorted current → past. */
  engagements: WorkTimelineGroup[];
  /** Hackathons + personal side projects, sorted current → past. */
  side: WorkTimelineGroup[];
}

/** Parse a flexible date value ("2024-10", "2025-08-22", Date, "present", null)
 *  into a millisecond timestamp suitable for sorting. Missing / unparseable
 *  values become -Infinity so they sink to the bottom of any DESC sort. */
function dateToMs(v: unknown): number {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return new Date(`${v}-01-01`).getTime();
  if (typeof v === 'string') {
    if (!v) return -Infinity;
    if (/^present$/i.test(v)) return Number.POSITIVE_INFINITY;
    // YAML may give "2024-10" (no day) — normalize to first of month
    const s = /^\d{4}-\d{2}$/.test(v) ? `${v}-01` : v;
    const ms = new Date(s).getTime();
    return Number.isNaN(ms) ? -Infinity : ms;
  }
  return -Infinity;
}

/** Sort an array of records DESC by start_date (most recent first).
 *  Undated entries sink to the bottom. */
function sortByStartDesc<T extends Record<string, unknown>>(arr: T[]): T[] {
  return [...arr].sort((a, b) => dateToMs(b.start_date) - dateToMs(a.start_date));
}

export function workTimeline(): WorkTimelineSections {
  const projects = portfolio.projects as Array<Record<string, unknown>>;
  const hackathons = portfolio.hackathons as Array<Record<string, unknown>>;

  const childFromProject = (p: Record<string, unknown>): WorkTimelineChild => {
    const role = (p.role as string | undefined) ?? '';
    const techStack = p.technologies as { backend?: string[] } | string[] | undefined;
    const techHint = Array.isArray(techStack)
      ? (techStack as string[]).slice(0, 2).join(' · ')
      : '';
    const meta = [role, techHint].filter(Boolean).join(' · ') || undefined;
    const featured = p.featured === true;
    let badge: WorkTimelineChild['badge'];
    if (featured) badge = { label: 'Featured', tone: 'featured' };
    const recog = p.recognition as { contributed_to_award?: string } | undefined;
    if (recog?.contributed_to_award) badge = { label: recog.contributed_to_award, tone: 'award' };
    return { id: p.id as string, title: p.title as string, meta, badge, featured };
  };

  const pharmaClient = portfolio.engagements[0]?.name as string;
  const healthcareClient = portfolio.engagements[2]?.name as string;

  // === Section A: Engagements (client + internal program), recent → past ===
  const engagements: WorkTimelineGroup[] = [
    {
      id: 'healthcare-client',
      name: healthcareClient ?? 'Healthcare Client',
      type: 'client',
      dateRange: 'Aug 2025 – present',
      toneKey: 'exact',
      children: sortByStartDesc(projects.filter((p) => p.client === healthcareClient)).map(
        childFromProject
      ),
    },
    {
      id: 'sop-program',
      name: 'SOP Program',
      type: 'internal-program',
      dateRange: 'Oct 2024 – Aug 2025',
      toneKey: 'sop',
      children: sortByStartDesc(projects.filter((p) => p.parent === 'sop-program')).map(
        childFromProject
      ),
    },
    {
      id: 'pharma-client',
      name: pharmaClient ?? 'Pharma Client',
      type: 'client',
      dateRange: 'Apr – Nov 2024',
      toneKey: 'redacted-client-a',
      children: sortByStartDesc(projects.filter((p) => p.client === pharmaClient)).map(
        childFromProject
      ),
    },
  ];

  // === Section B: Side projects + hackathons, recent → past ===
  const personalChildren = sortByStartDesc(
    projects.filter((p) => p.type === 'personal')
  ).map(childFromProject);

  const hackathonChildren = sortByStartDesc(hackathons).map((h) => ({
    id: h.id as string,
    title: (h.project_built ?? h.name) as string,
    meta:
      ((h.name as string | undefined) ?? '') +
      ((h.duration as string | undefined) ? ' · ' + (h.duration as string) : ''),
    badge: h.featured === true ? { label: 'Featured', tone: 'featured' as const } : undefined,
    featured: h.featured === true,
  }));

  const side: WorkTimelineGroup[] = [];
  if (personalChildren.length > 0) {
    side.push({
      id: 'personal',
      name: 'Personal',
      type: 'side',
      dateRange: '2026',
      toneKey: 'personal',
      children: personalChildren,
    });
  }
  if (hackathonChildren.length > 0) {
    side.push({
      id: 'hackathons',
      name: 'Hackathons',
      type: 'parallel',
      dateRange: 'Jan 2025 – Oct 2025',
      toneKey: 'hackathon',
      children: hackathonChildren,
    });
  }

  return { engagements, side };
}

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

  for (const a of portfolio.awards as Array<Record<string, unknown>>) {
    items.push({
      kind: 'award',
      title: a.title as string,
      meta: `${a.issuer as string} · ${(a.date ?? a.year) as string | number}`,
      downloadUrl: undefined,
      iconKey: 'trophy',
    });
  }

  for (const p of portfolio.recognition_summary.promotions ?? []) {
    items.push({
      kind: 'promotion',
      title: `Promoted to ${p.to}`,
      meta: `From ${p.from} · ${p.date as string | number | Date}`,
      downloadUrl: undefined,
      iconKey: 'arrow-up',
    });
  }

  const pubs = portfolio.publications as Array<Record<string, unknown>>;
  if (pubs.length > 0) {
    const p = pubs[0];
    items.push({
      kind: 'publication',
      title: p.title as string,
      meta: `${p.publisher as string} · ${(p.date ?? p.year) as string | number} · ${p.role as string}`,
      downloadUrl: p.url as string | undefined,
      iconKey: 'book',
    });
  }

  // Real certifications only — drop empty array entries AND placeholder
  // entries where the name is null/empty (the YAML may contain a single
  // skeleton row with all-null fields).
  const certs = portfolio.certifications as Array<Record<string, unknown>>;
  for (const c of certs) {
    const name = typeof c.name === 'string' ? c.name.trim() : '';
    if (!name) continue; // skip placeholder rows
    items.push({
      kind: 'certification',
      title: name,
      meta: `${(c.issuer as string | undefined) ?? ''} · ${(c.year as string | number | undefined) ?? ''}`,
      downloadUrl: c.credential_url as string | undefined,
      iconKey: 'badge',
    });
  }

  return items;
}

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
  if (c.github)
    links.push({ label: c.github, chipLabel: 'github', href: `https://github.com/${c.github}` });
  if (c.linkedin) {
    // Show 'in/handle' instead of the full https://linkedin.com/in/handle/ URL
    const handle =
      c.linkedin
        .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
        .replace(/\/$/, '') || c.linkedin;
    links.push({ label: `in/${handle}`, chipLabel: 'linkedin', href: c.linkedin });
  }
  if (c.email) links.push({ label: c.email, chipLabel: 'email', href: `mailto:${c.email}` });
  links.push({ label: 'watch the movie ★', chipLabel: 'journey', href: '/journey' });

  return {
    heading: 'Get in touch.',
    subhead: 'Email me, find me on GitHub or LinkedIn, or scan the QR.',
    links,
    qrTagline:
      'Built for conferences, meetups, inline biz cards. Scan → glance in 10 seconds.',
  };
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

// ===================================================================
// Case studies (modal popups for the 3 featured projects)
// ===================================================================
export type ArchLayer = 'edge' | 'orchestrator' | 'ai' | 'storage' | 'ui';

export interface ArchNode {
  id: string;
  label: string;
  layer: ArchLayer;
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  status: 'production' | 'shipped' | 'in-progress' | 'demo';
  headline: string;
  problem: string;
  approach: string;
  keyFeatures: string[];
  architecture: { nodes: ArchNode[]; edges: ArchEdge[] };
  myContributions: string[];
  stack: Record<string, string[]>;
  patterns: string[];
  outcomes: string[];
}

interface RawCaseStudy {
  status?: string;
  headline?: string;
  problem?: string;
  approach?: string;
  key_features?: unknown;
  architecture?: { nodes?: unknown; edges?: unknown };
  my_contributions?: unknown;
  stack?: Record<string, unknown>;
  patterns?: unknown;
  outcomes?: unknown;
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function isLayer(v: unknown): v is ArchLayer {
  return v === 'edge' || v === 'orchestrator' || v === 'ai' || v === 'storage' || v === 'ui';
}

function shapeCaseStudy(slug: string, title: string, raw: RawCaseStudy): CaseStudy {
  const statusRaw = raw.status ?? 'shipped';
  const status: CaseStudy['status'] =
    statusRaw === 'production' || statusRaw === 'in-progress' || statusRaw === 'demo'
      ? statusRaw
      : 'shipped';

  const nodes: ArchNode[] = Array.isArray(raw.architecture?.nodes)
    ? (raw.architecture!.nodes as unknown[])
        .filter(
          (n): n is { id: string; label: string; layer: ArchLayer } =>
            !!n &&
            typeof n === 'object' &&
            typeof (n as { id?: unknown }).id === 'string' &&
            typeof (n as { label?: unknown }).label === 'string' &&
            isLayer((n as { layer?: unknown }).layer)
        )
        .map((n) => ({ id: n.id, label: n.label, layer: n.layer }))
    : [];

  const edges: ArchEdge[] = Array.isArray(raw.architecture?.edges)
    ? (raw.architecture!.edges as unknown[])
        .filter(
          (e): e is { from: string; to: string; label?: string } =>
            !!e &&
            typeof e === 'object' &&
            typeof (e as { from?: unknown }).from === 'string' &&
            typeof (e as { to?: unknown }).to === 'string'
        )
        .map((e) => ({
          from: e.from,
          to: e.to,
          label: typeof e.label === 'string' && e.label.length > 0 ? e.label : undefined,
        }))
    : [];

  const stack: Record<string, string[]> = {};
  if (raw.stack && typeof raw.stack === 'object') {
    for (const [layer, items] of Object.entries(raw.stack)) {
      const arr = strArr(items);
      if (arr.length > 0) stack[layer] = arr;
    }
  }

  return {
    slug,
    title,
    status,
    headline: raw.headline ?? '',
    problem: raw.problem ?? '',
    approach: raw.approach ?? '',
    keyFeatures: strArr(raw.key_features),
    architecture: { nodes, edges },
    myContributions: strArr(raw.my_contributions),
    stack,
    patterns: strArr(raw.patterns),
    outcomes: strArr(raw.outcomes),
  };
}

export function caseStudyBySlug(slug: string): CaseStudy | undefined {
  // Search projects first
  for (const p of portfolio.projects as unknown as Array<{
    id: string;
    title?: string;
    case_study?: RawCaseStudy;
  }>) {
    if (p.id === slug && p.case_study) {
      return shapeCaseStudy(slug, p.title ?? slug, p.case_study);
    }
  }
  // Then hackathons
  for (const h of portfolio.hackathons as unknown as Array<{
    id: string;
    project_built?: string;
    name?: string;
    case_study?: RawCaseStudy;
  }>) {
    if (h.id === slug && h.case_study) {
      return shapeCaseStudy(slug, h.project_built ?? h.name ?? slug, h.case_study);
    }
  }
  return undefined;
}

export function allCaseStudies(): Record<string, CaseStudy> {
  const out: Record<string, CaseStudy> = {};
  for (const p of portfolio.projects as unknown as Array<{
    id: string;
    title?: string;
    case_study?: RawCaseStudy;
  }>) {
    if (p.case_study) out[p.id] = shapeCaseStudy(p.id, p.title ?? p.id, p.case_study);
  }
  for (const h of portfolio.hackathons as unknown as Array<{
    id: string;
    project_built?: string;
    name?: string;
    case_study?: RawCaseStudy;
  }>) {
    if (h.case_study)
      out[h.id] = shapeCaseStudy(h.id, h.project_built ?? h.name ?? h.id, h.case_study);
  }
  return out;
}
