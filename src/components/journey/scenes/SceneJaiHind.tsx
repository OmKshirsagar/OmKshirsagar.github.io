import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { Group } from 'three';
import { VoxModel } from '../voxel/VoxModel';
import { VoxelOmRig, type OmRigHandle } from '../voxel/VoxelOmRig';
import type { SceneState } from '../lib/state';

const V = '/vox/';

function Crowd({ visible }: { visible: number }) {
  // NPC 20 tall @0.08 = 1.6 -> lift y=0.8; spots kept clear of the camera's
  // right-side hero track (camera sweeps to ~x=3..4, z=0..2.5).
  const spots: Array<[number, number, number]> = [
    [-3, 0.8, 5],
    [-4.5, 0.8, 1],
    [-4, 0.8, -3],
    [6, 0.8, 4],
    [6.5, 0.8, -2],
    [-6, 0.8, 8],
  ];
  if (visible < 0.5) return null;
  return (
    <group>
      {spots.map((p, i) => (
        <VoxModel
          key={i}
          url={`${V}npc_base.vox`}
          position={p}
          scale={0.08}
          rotation={[0, i % 2 ? 0.6 : -0.4, 0]}
        />
      ))}
    </group>
  );
}

// Graduate crowd in front of Om (between camera and the stage), facing the
// stage (-Z) so we see the tops/backs of their mortarboards.
const GRADS: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  for (let row = 0; row < 4; row++) {
    const z = 1 + row * 3;
    const n = 5 + row;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 2.2 + (row % 2 ? 0.7 : 0);
      if (Math.abs(x) < 1.2 && row === 0) continue; // keep a small aisle to Om
      out.push([x, z]);
    }
  }
  return out;
})();

// Tossed-cap launch points (animated in useFrame). [x, baseY, z, phase]
const TOSS: Array<[number, number, number, number]> = [
  [-3, 3.2, 4, 0.0], [2, 3.0, 6, 0.35], [-1, 3.4, 8, 0.6],
  [4, 3.1, 5, 0.2], [-5, 3.3, 7, 0.8], [1, 3.5, 3, 0.5],
];

function GradLayer({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const group = useRef<Group>(null);
  const caps = useRef<Group>(null);

  useFrame(() => {
    const vis = stateRef.current.gradVisible > 0.01;
    if (group.current) group.current.visible = vis;
    if (!vis || !caps.current) return;
    const t = performance.now() * 0.001;
    caps.current.children.forEach((cap, i) => {
      const [x, baseY, , phase] = TOSS[i];
      const tt = (t * 0.45 + phase) % 1;
      cap.position.x = x;
      cap.position.y = baseY + Math.sin(tt * Math.PI) * 4.2; // arc up + fall
      cap.rotation.z = t * 2.2 + i;
      cap.rotation.x = t * 1.7 + i;
    });
  });

  return (
    <group ref={group} visible={false}>
      {/* seated/standing graduate crowd facing the stage (-Z) */}
      {GRADS.map(([x, z], i) => (
        <VoxModel
          key={i}
          url={`${V}grad_npc.vox`}
          position={[x, 0.95, z]}
          scale={0.09}
          rotation={[0, Math.PI, 0]}
        />
      ))}
      {/* tossed caps */}
      <group ref={caps}>
        {TOSS.map(([x, baseY, z], i) => (
          <group key={i} position={[x, baseY, z]}>
            <VoxModel url={`${V}mortarboard.vox`} position={[0, 0, 0]} scale={0.09} />
          </group>
        ))}
      </group>
      {/* golden fireworks/confetti above the ceremony */}
      <Sparkles count={140} scale={[20, 9, 12]} position={[0, 7, 4]} size={7} speed={0.5} color="#ffe39c" />
    </group>
  );
}

export default function SceneJaiHind({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const omRig = useRef<OmRigHandle>(null);
  const omGroup = useRef<Group>(null);
  const env = useRef<Group>(null);

  useFrame(() => {
    const s = stateRef.current;
    if (env.current) env.current.visible = s.collegeVisible > 0.01;
    if (omRig.current) {
      omRig.current.setWalkPhase(s.omWalkPhase);
      omRig.current.setGrad(s.gradVisible > 0.5);
    }
    if (omGroup.current) {
      omGroup.current.position.x = s.characterX;
      omGroup.current.position.z = s.characterZ;
      omGroup.current.rotation.y = s.characterRotationY;
      omGroup.current.visible = s.characterOpacity > 0.01;
    }
  });

  return (
    <group>
      <group ref={env}>
        {/* Single baked ground mesh (1 draw call), centered at origin.
            200x256x1 vox @0.1 -> X[-10,10], Z[-12.8,12.8], ~flat at y=0. */}
        <VoxModel url={`${V}ground.vox`} position={[0, 0, 0]} scale={0.1} />
        {/* Jai Hind College (Sheila Gopal Raheja Building) — tall tower, front
            face (+Z) toward Om. 104 tall @0.1 = 10.4 units -> lift y=5.2. */}
        <VoxModel url={`${V}jaihind_facade.vox`} position={[-1, 5.2, -10]} scale={0.1} />
        {/* Trees flanking the path (16 tall @0.12 = 1.92 -> lift y=0.96) */}
        <VoxModel url={`${V}tree.vox`} position={[-5, 0.96, 4]} scale={0.12} />
        <VoxModel url={`${V}tree.vox`} position={[5, 0.96, 6]} scale={0.12} />
        <VoxModel url={`${V}tree.vox`} position={[-6, 0.96, -2]} scale={0.12} />
        {/* Lamps along the path (10 tall @0.1 = 1.0 -> lift y=0.5) */}
        <VoxModel url={`${V}lamp.vox`} position={[-2, 0.5, 2]} scale={0.1} />
        <VoxModel url={`${V}lamp.vox`} position={[2, 0.5, -4]} scale={0.1} />
        <Crowd visible={stateRef.current.crowdVisible} />
      </group>
      {/* Graduation layer (gown/cap on Om via the rig; crowd + caps + sparkles here) */}
      <GradLayer stateRef={stateRef} />
      {/* Hero Om — feet at y=0 by rig construction; X/Z driven by state */}
      <group ref={omGroup}>
        <VoxelOmRig ref={omRig} scale={0.1} />
      </group>
    </group>
  );
}
