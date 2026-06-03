import { z } from 'zod';

const HexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/);
const FlexDate = z.union([z.string(), z.date(), z.number()]).nullable().optional();

// ===== Personal =====
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
  date_of_birth: FlexDate,
  nationality: z.string().nullable().optional(),
  current_role: z.string(),
  current_functional_role: z.string().nullable().optional(),
  current_company: z.string(),
  location: LocationSchema,
  years_experience: z.number(),
  career_started: FlexDate,
  short_bio: z.string(),
  specializations: z.array(z.string()),
  industries: z.array(z.string()),
  strengths: z.array(z.string()),
  interests: z.array(z.string()),
  current_focus: z.array(z.string()),
  career_highlights: z.array(z.string()),
  languages: z.object({ spoken: z.array(z.string()) }),
  contact: ContactSchema,
  avatar: AvatarSchema,
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

// ===== Education + Academic Highlights =====
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
  start_date: FlexDate,
  end_date: FlexDate,
  focus: z.array(z.string()).default([]),
  refs: z.array(z.string()).default([]),
  refs_section: z.string().nullable().optional(),
  refs_filter: z.record(z.string()).nullable().optional(),
});
const TitleProgressionSchema = z.object({
  title: z.string(),
  start_date: FlexDate,
  end_date: FlexDate,
  summary: z.string(),
});
export const careerItemSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  functional_role: z.string().nullable().optional(),
  start_date: FlexDate,
  end_date: FlexDate,
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
export const engagementSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    employer: z.string(),
    industry: z.string().nullable().optional(),
    start_date: FlexDate,
    end_date: FlexDate,
  })
  .passthrough();

// ===== Growth trajectory =====
export const growthTrajectorySchema = z.record(
  z.object({
    order: z.number(),
    responsibilities: z.array(z.string()),
  })
);

// ===== Leadership without title =====
export const leadershipWithoutTitleItemSchema = z.object({
  behavior: z.string(),
  backed_by: z.array(z.string()),
});

// ===== Recognition summary =====
export const recognitionSummarySchema = z.object({
  awards_received: z.object({
    outstanding_awards: z.number(),
    applause_awards: z.number(),
  }),
  promotions: z.array(
    z.object({ from: z.string(), to: z.string(), date: FlexDate })
  ),
  notable_achievements: z.array(z.string()),
  categorized_achievements: z.record(z.array(z.string())).optional(),
});

// ===== Leadership stories =====
export const leadershipStorySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    period: z.string(),
  })
  .passthrough();

// ===== Engineering profile =====
export const engineeringProfileSchema = z.object({
  strongest_traits: z.array(z.string()),
  recurring_pattern: z.object({
    sequence: z.array(z.string()),
    description: z.string(),
  }),
});

// ===== Projects =====
export const projectSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
  })
  .passthrough();

// ===== Skills =====
export const skillsSchema = z.record(z.unknown());

// ===== Publications =====
export const publicationSchema = z
  .object({
    title: z.string(),
    publisher: z.string(),
    year: z.number(),
    role: z.string(),
  })
  .passthrough();

// ===== Research profile =====
export const researchProfileSchema = z.object({
  total_publications: z.number(),
  primary_research_interests: z.array(z.string()),
  demonstrated_capabilities: z.array(z.string()),
  impact_on_career: z.array(z.string()),
});

// ===== Hackathons =====
export const hackathonSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    project_built: z.string(),
  })
  .passthrough();

// ===== Awards =====
export const awardSchema = z
  .object({
    title: z.string(),
    issuer: z.string(),
    year: z.number(),
  })
  .passthrough();

// ===== Interview stories =====
export const interviewStorySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    public: z.boolean(),
  })
  .passthrough();

// ===== Technology inventory =====
export const technologyInventorySchema = z.record(z.unknown());

// =====================================================================
// ROOT
// =====================================================================
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
