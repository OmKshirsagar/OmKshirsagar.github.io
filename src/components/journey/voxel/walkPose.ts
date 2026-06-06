export type Pose = {
  thighL: number;
  thighR: number;
  armL: number;
  armR: number;
  bob: number;
};

const SWING = 0.45; // radians peak leg swing (eased so the stride isn't splayed)

/** t in [0,1) = one full stride cycle. */
export function walkPose(t: number): Pose {
  const a = t * Math.PI * 2;
  const thighL = Math.sin(a) * SWING;
  const thighR = Math.sin(a + Math.PI) * SWING;
  return {
    thighL,
    thighR,
    armL: -thighL, // arms counter-swing legs
    armR: -thighR,
    bob: Math.abs(Math.sin(a * 2)) * 0.12, // 2x freq vertical bob
  };
}
