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

  /** HTML overlays (per-frame DOM mutation, never re-render). */
  hero02Opacity: number;
  hero07Opacity: number;
  hero12Opacity: number;
  captionOpacity: number;
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
  hero02Opacity: 0,
  hero07Opacity: 0,
  hero12Opacity: 0,
  captionOpacity: 0,
};

/** Bottom-of-screen caption text per SCENE. */
export const BEAT_CAPTIONS: string[] = [
  'MUMBAI · INDIA',                              // 01 Globe → Mumbai
  '2024 · JAI HIND COLLEGE · CHURCHGATE',        // 02 College graduation (to build)
  'JOINING DELOITTE',                            // 03 Transition
  'FEB 2024 · FRONTEND TRAINING',                // 04 Deloitte training
  'APR 2024 · FIRST CLIENT PROJECT',             // 05 First project
  'OCT 2024 · FIRST OUTSTANDING AWARD',          // 06 Award 1
  'JAN 2025 · FASTAPI STARTER KIT',              // 07 Platform thinking
  'AUG 2025 · VOICE AI PILOT BEGINS',            // 08 Voice AI
  '',                                            // 09 Voice AI live ★
  'JAN 2026 · AGENTX HACKATHON',                 // 10 Hackathon
  'MAR 2026 · BUILDING THIS PORTFOLIO',          // 11 Sidequest
  '',                                            // 12 Today ★ promotion
];

export const BEAT_NAMES: string[] = [
  '01 · Mumbai · The Origin',
  '02 · College · Graduation',
  '03 · Joining Deloitte',
  '04 · Training',
  '05 · First Project',
  '06 · First Outstanding ★',
  '07 · FastAPI Starter Kit',
  '08 · Voice AI Pilot',
  '09 · Voice AI Live ★',
  '10 · AgentX Hackathon',
  '11 · Sidequest',
  '12 · Promotion ★',
];
