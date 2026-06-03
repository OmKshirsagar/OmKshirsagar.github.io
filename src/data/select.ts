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

export function workTimeline(): WorkTimelineGroup[] {
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

  const groups: WorkTimelineGroup[] = [];

  groups.push({
    id: 'pharma-client',
    name: (portfolio.engagements[0]?.name as string) ?? 'Pharma Client',
    type: 'client',
    dateRange: 'Apr – Nov 2024',
    toneKey: 'redacted-client-a',
    children: projects
      .filter((p) => p.client === (portfolio.engagements[0]?.name as string))
      .map(childFromProject),
  });

  groups.push({
    id: 'sop-program',
    name: 'SOP Program',
    type: 'internal-program',
    dateRange: 'Oct 2024 – Aug 2025',
    toneKey: 'sop',
    children: projects.filter((p) => p.parent === 'sop-program').map(childFromProject),
  });

  groups.push({
    id: 'healthcare-client',
    name: (portfolio.engagements[2]?.name as string) ?? 'Healthcare Client',
    type: 'client',
    dateRange: 'Aug 2025 – present',
    toneKey: 'exact',
    children: projects
      .filter((p) => p.client === (portfolio.engagements[2]?.name as string))
      .map(childFromProject),
  });

  groups.push({
    id: 'hackathons',
    name: 'Hackathons',
    type: 'parallel',
    dateRange: 'Ongoing',
    toneKey: 'hackathon',
    children: hackathons.map((h) => ({
      id: h.id as string,
      title: (h.project_built ?? h.name) as string,
      meta:
        ((h.name as string | undefined) ?? '') +
        ((h.duration as string | undefined) ? ' · ' + (h.duration as string) : ''),
      badge: h.featured === true ? { label: 'Featured', tone: 'featured' as const } : undefined,
      featured: h.featured === true,
    })),
  });

  groups.push({
    id: 'personal',
    name: 'Personal',
    type: 'side',
    dateRange: '2026',
    toneKey: 'personal',
    children: projects.filter((p) => p.type === 'personal').map(childFromProject),
  });

  return groups;
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
        meta: `${c.issuer as string} · ${c.year as string | number}`,
        downloadUrl: c.credential_url as string | undefined,
        iconKey: 'badge',
      });
    }
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
  if (c.linkedin) links.push({ label: c.linkedin, chipLabel: 'linkedin', href: c.linkedin });
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
