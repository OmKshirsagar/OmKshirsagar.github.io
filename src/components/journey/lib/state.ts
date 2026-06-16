// Mutable state shared between the GSAP timeline (writer) and R3F's
// useFrame loop (reader). Held in plain refs so React never re-renders
// during scroll.

export interface CameraState {
  x: number;
  y: number;
  z: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
  fov: number;
}

export interface SceneState {
  /** Index 0..N-1 of the current SCENE. */
  beat: number;
  /** Overall scroll progress within the movie pin, 0..1. */
  progress: number;

  /** ===== Character (voxel-Om) ===== */
  /** XZ position + facing so the character can walk through scenes. */
  characterX: number;
  characterZ: number;
  characterRotationY: number;
  /** 0 = character hidden (e.g. during the opening globe scene). */
  characterOpacity: number;

  /** ===== Scene 01 · Globe → Mumbai ===== */
  globeVisible: number;     // 0..1 (fades out as we dive to the city)
  globeRotationY: number;   // direct Y-axis rotation, tweened by the timeline

  /** ===== Sky / atmosphere (Earth space → golden dusk) ===== */
  skyWarmth: number;        // 0 = dark space, 1 = golden-hour dusk (lerps bg/fog/light)
  cloudsVisible: number;    // 0..1 voxel cloud field presence
  cityVisible: number;      // 0..1 voxel Mumbai skyline + mountains + ocean

  /** ===== Jai Hind College, Churchgate ===== */
  collegeVisible: number;   // 0..1 — campus building + ground + props

  /** ===== Jai Hind voxel scene ===== */
  omWalkPhase: number;   // stride cycles (GSAP increments this; rig reads it)
  omRimLight: number;    // 0..1 rim highlight strength on the hero
  signGlow: number;      // 0..1 "JAI HIND COLLEGE" sign emissive strength
  crowdVisible: number;  // 0..1 NPC crowd gate
  gradVisible: number;   // 0..1 graduation layer (gown/cap/diploma + crowd + fireworks)

  /** ===== Publish-paper interior (library/desk) ===== */
  paperVisible: number;  // 0..1 — desk scene (laptop + lamp + seated Om) gate
  paperReveal: number;   // 0..1 — laptop screen "PUBLISHED PAPER" card reveal
  interior: number;      // 0..1 — dims the outdoor sun/sky toward a warm dark room
  fadeBlack: number;     // 0..1 — full-screen black wipe for hard scene cuts

  /** ===== Deloitte chapter (exterior tower + office montage) ===== */
  dayBlue: number;       // 0..1 — bright blue daytime sky blend (Deloitte exterior/office)
  deloitteVisible: number; // 0..1 — glass tower + plaza + revolving door
  badgeVisible: number;  // 0..1 — blue lanyard + ID on voxel-Om
  trainingVisible: number; // 0..1 — open-plan training office (SHOT 11, first day)
  warRoomVisible: number;  // 0..1 — night "war room" first-project debugging scene
  warFix: number;          // 0..1 — code run goes from red FAILED -> green PASSING
  officeVisible: number; // 0..1 — interior office (desk + monitor + window skyline)
  officeScreen: number;  // monitor content index (1=training,2=project,3=starter,4=voice,5=hackathon,6=portfolio)
  trophyReveal: number;  // 0..1 — award trophy rise + sparkles
  waveLevel: number;     // 0..1 — voice-AI waveform activity
  confetti: number;      // 0..1 — promotion finale confetti

  /** HTML overlays (per-frame DOM mutation, never re-render). */
  hero02Opacity: number;
  hero07Opacity: number;
  hero12Opacity: number;
  captionOpacity: number;
  comingSoonOpacity: number; // 0..1 — end-of-(shipped)-journey "more coming soon" card
  degreeFlip: number; // 0..1 — graduation degree certificate flips onto the screen
}

export const initialCameraState: CameraState = {
  x: 0,
  y: 1.6,
  z: 5,
  lookAtX: 0,
  lookAtY: 1.0,
  lookAtZ: 0,
  fov: 45,
};

export const initialSceneState: SceneState = {
  beat: 0,
  progress: 0,
  characterX: 0,
  characterZ: 0,
  characterRotationY: 0,
  characterOpacity: 0, // hidden during globe scene
  globeVisible: 1,
  globeRotationY: 0,
  skyWarmth: 0,
  cloudsVisible: 0,
  cityVisible: 0,
  collegeVisible: 0,
  omWalkPhase: 0,
  omRimLight: 1,
  signGlow: 1,
  crowdVisible: 1,
  gradVisible: 0,
  paperVisible: 0,
  paperReveal: 0,
  interior: 0,
  fadeBlack: 0,
  dayBlue: 0,
  deloitteVisible: 0,
  badgeVisible: 0,
  trainingVisible: 0,
  warRoomVisible: 0,
  warFix: 0,
  officeVisible: 0,
  officeScreen: 1,
  trophyReveal: 0,
  waveLevel: 0,
  confetti: 0,
  hero02Opacity: 0,
  hero07Opacity: 0,
  hero12Opacity: 0,
  captionOpacity: 0,
  comingSoonOpacity: 0,
  degreeFlip: 0,
};

/** Bottom-of-screen caption text per SCENE. */
export const BEAT_CAPTIONS: string[] = [
  'MUMBAI · INDIA',                              // 01 Globe → Mumbai
  '2024 · JAI HIND COLLEGE · CHURCHGATE',        // 02 College arrival
  'PUBLISHED PAPER · JETIR 2022',                // 03 Research paper (library/desk)
  'GRADUATED · BSc IT · CGPA 9.89 / 10',         // 04 Graduation
  'JOINING DELOITTE',                            // 05 Transition
  'FEB 2024 · FRONTEND TRAINING',                // 06 Deloitte training
  'APR 2024 · FIRST PROJECT · WAR ROOM',          // 07 First project (Takeda/NMT)
  'OCT 2024 · FIRST OUTSTANDING AWARD',          // 08 Award 1
  'JAN 2025 · FASTAPI STARTER KIT',              // 09 Platform thinking
  'AUG 2025 · VOICE AI PILOT BEGINS',            // 10 Voice AI
  '',                                            // 11 Voice AI live ★
  'JAN 2026 · AGENTX HACKATHON',                 // 12 Hackathon
  'MAR 2026 · BUILDING THIS PORTFOLIO',          // 13 Sidequest
  '',                                            // 14 Today ★ promotion
];

export const BEAT_NAMES: string[] = [
  '01 · Mumbai · The Origin',
  '02 · Jai Hind College',
  '03 · Published Paper ★',
  '04 · Graduation',
  '05 · Joining Deloitte',
  '06 · Training',
  '07 · War Room',
  '08 · First Outstanding ★',
  '09 · FastAPI Starter Kit',
  '10 · Voice AI Pilot',
  '11 · Voice AI Live ★',
  '12 · AgentX Hackathon',
  '13 · Sidequest',
  '14 · Promotion ★',
];
