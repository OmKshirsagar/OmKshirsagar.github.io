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
  /** XYZ position so the character can walk through scenes, not just float. */
  characterX: number;
  characterY: number;
  characterZ: number;
  characterScale: number;
  characterRotationY: number;
  /** 0 = character hidden (e.g. during the opening globe scene). */
  characterOpacity: number;

  /** ===== Scene 01 · Globe → Mumbai ===== */
  globeVisible: number;     // 0..1 (fades out as we transition to Scene 02)
  globeRotationY: number;   // direct Y-axis rotation, tweened by the timeline.
                            // No more useFrame easing — eliminates the race
                            // where the globe hadn't landed by the time scroll
                            // reached the "Mumbai locked" keyframe.

  /** ===== Sky / atmosphere (Earth space → golden dusk) ===== */
  skyWarmth: number;        // 0 = dark space, 1 = golden-hour dusk (lerps bg/fog/light)
  cloudsVisible: number;    // 0..1 voxel cloud field presence
  cityVisible: number;      // 0..1 voxel Mumbai skyline + mountains + ocean

  /** ===== Scene 02 · Jai Hind College, Churchgate ===== */
  collegeVisible: number;       // 0..1 — campus building + ground
  gradCapVisible: number;       // 0..1 — mortarboard on Om's head
  cgpaCardVisible: number;      // 0..1 — "CGPA 9.89 / 10" floating card
  paperVisible: number;         // 0..1 — "Published · JETIR" research-paper artifact

  /** ===== Jai Hind voxel scene (Plan 3 slice) ===== */
  omWalkPhase: number;   // stride cycles (GSAP increments this; rig reads it)
  omRimLight: number;    // 0..1 rim highlight strength on the hero
  signGlow: number;      // 0..1 "JAI HIND COLLEGE" sign emissive strength
  crowdVisible: number;  // 0..1 NPC crowd gate

  /** ===== Per-prop visibility, reused across scenes (0..1) ===== */
  trophyVisible: number;
  starterKitVisible: number;
  replicasVisible: number;
  phoneVisible: number;
  pipelineVisible: number;
  whitelabelDim: number;
  handsVisible: number;
  desktopVisible: number;
  recognitionVisible: number;
  badgeVisible: number;

  /** Ambient particle field strength. */
  sparkleIntensity: number;

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
  characterY: 0,
  characterZ: 0,
  characterScale: 1,
  characterRotationY: 0,
  characterOpacity: 0, // hidden during globe scene
  globeVisible: 1,
  globeRotationY: 0,
  skyWarmth: 0,
  cloudsVisible: 0,
  cityVisible: 0,
  collegeVisible: 0,
  gradCapVisible: 0,
  cgpaCardVisible: 0,
  paperVisible: 0,
  omWalkPhase: 0,
  omRimLight: 1,
  signGlow: 1,
  crowdVisible: 1,
  trophyVisible: 0,
  starterKitVisible: 0,
  replicasVisible: 0,
  phoneVisible: 0,
  pipelineVisible: 0,
  whitelabelDim: 0,
  handsVisible: 0,
  desktopVisible: 0,
  recognitionVisible: 0,
  badgeVisible: 0,
  sparkleIntensity: 0.4,
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
