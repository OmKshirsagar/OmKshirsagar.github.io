import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { editable as e } from '@theatre/r3f';
import type { Group } from 'three';
import { VoxModel } from '../voxel/VoxModel';
import { VoxelOmRig, type OmRigHandle } from '../voxel/VoxelOmRig';
import type { SceneState } from '../lib/state';

const V = '/vox/';

// Flanking glass office towers: [x, y(center), z, scale, rotationY].
const OFFICE: Array<[number, number, number, number, number]> = [
  [-12.5, 9.0, -10, 0.15, 0.34],
  [-16.5, 10.8, -20, 0.18, 0.18],
  [12.5, 9.0, -11, 0.15, -0.34],
  [16.5, 10.8, -21, 0.18, -0.18],
  [-20, 12, -31, 0.2, 0.12],
  [20, 12, -32, 0.2, -0.12],
];

// Trees flanking the entrance walk: [x, z].
const TREES: Array<[number, number]> = [
  [-6, -1], [-7.4, -5], [-8.4, -10], [-5, 3],
  [6, -1], [7.4, -5], [8.4, -10], [5, 3],
];

// Bright brushed-steel portal frame.
const STEEL = { color: '#c9ccd2', metalness: 0.9, roughness: 0.2 };

/** Foreground entrance we look THROUGH: slim bright-steel sliding-door frame +
 *  thin tinted glass, with a sensor box on the top beam. NO center post. */
function EntrancePortal() {
  return (
    <group position={[0, 0, 2.7]}>
      {[-2.6, 2.6].map((x, i) => (
        <mesh key={i} position={[x, 3.2, -0.02]}>
          <planeGeometry args={[4.8, 6.3]} />
          <meshStandardMaterial color="#d2e2ec" transparent opacity={0.12} roughness={0.05} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[-5.2, 3.4, 0]}><boxGeometry args={[0.2, 7, 0.45]} /><meshStandardMaterial {...STEEL} /></mesh>
      <mesh position={[5.2, 3.4, 0]}><boxGeometry args={[0.2, 7, 0.45]} /><meshStandardMaterial {...STEEL} /></mesh>
      <mesh position={[-8.4, 3.4, 0]}><boxGeometry args={[0.3, 7, 0.45]} /><meshStandardMaterial {...STEEL} /></mesh>
      <mesh position={[8.4, 3.4, 0]}><boxGeometry args={[0.3, 7, 0.45]} /><meshStandardMaterial {...STEEL} /></mesh>
      <mesh position={[0, 6.85, 0]}><boxGeometry args={[17.4, 0.4, 0.45]} /><meshStandardMaterial {...STEEL} /></mesh>
      <mesh position={[0, 6.5, 0.12]}><boxGeometry args={[0.8, 0.3, 0.32]} /><meshStandardMaterial color="#15151a" /></mesh>
    </group>
  );
}

export default function SceneDeloitte({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const omRig = useRef<OmRigHandle>(null);
  const omGroup = useRef<Group>(null);
  const root = useRef<Group>(null);

  useFrame(() => {
    const s = stateRef.current;
    const vis = s.deloitteVisible > 0.01;
    if (root.current) root.current.visible = vis;
    if (!vis) return;
    if (omRig.current) {
      omRig.current.setWalkPhase(s.omWalkPhase);
      omRig.current.setGrad(false);
      omRig.current.setBadge(s.badgeVisible > 0.5);
    }
    if (omGroup.current) {
      omGroup.current.position.x = s.characterX;
      omGroup.current.position.z = s.characterZ;
      omGroup.current.rotation.y = s.characterRotationY;
      omGroup.current.visible = s.characterOpacity > 0.01;
    }
  });

  return (
    <group ref={root} visible={false}>
      {/* ---- golden-hour sun, low on the RIGHT ---- */}
      <directionalLight
        position={[16, 6, -2]}
        intensity={3.0}
        color="#ffb066"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={26}
        shadow-camera-bottom={-24}
        shadow-camera-far={90}
      />
      <directionalLight position={[-8, 6, 6]} intensity={0.7} color="#bcd2ff" />
      <pointLight position={[6, 3, 4]} intensity={1.4} distance={42} decay={2} color="#ffd9ad" />
      {/* sun disc + halo, visible in the gap on the right (editable as a unit) */}
      <e.group theatreKey="Sun" position={[10.5, 3.0, -14]}>
        <mesh><circleGeometry args={[1.9, 28]} /><meshBasicMaterial color="#fff4d8" toneMapped={false} /></mesh>
        <mesh position={[0, 0, -0.1]}><circleGeometry args={[3.8, 28]} /><meshBasicMaterial color="#ffcf92" transparent opacity={0.42} toneMapped={false} /></mesh>
      </e.group>

      {/* ---- plaza ground + entrance doormat ---- */}
      <mesh position={[0, -0.05, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#dcd3c2" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.02, 1.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#5c4634" roughness={1} />
      </mesh>

      {/* ---- HERO angular Deloitte tower (editable) ---- */}
      <e.group theatreKey="HeroTower" position={[0, 14.85, -19]}>
        <VoxModel url={`${V}tower_deloitte.vox`} position={[0, 0, 0]} scale={0.18} />
      </e.group>
      {/* ---- flanking glass office towers (each editable) ---- */}
      {OFFICE.map(([x, y, z, s, ry], i) => (
        <e.group key={i} theatreKey={`OfficeTower-${i}`} position={[x, y, z]} rotation={[0, ry, 0]}>
          <VoxModel url={`${V}tower_office.vox`} position={[0, 0, 0]} scale={s} />
        </e.group>
      ))}
      {/* ---- the iconic freestanding DELOITTE sign monolith (identity anchor) ----
          Wrapped as a Theatre.js editable so it can be dragged/placed in Studio
          (dev). The position prop is the default until Studio overrides it. */}
      <e.group theatreKey="DeloitteSign" position={[-5, 4.3, -3.4]}>
        <VoxModel url={`${V}deloitte_sign.vox`} position={[0, 0, 0]} scale={0.11} />
      </e.group>
      {/* ---- bronze revolving-door drum (behind Om, editable) ---- */}
      <e.group theatreKey="RevolvingDoor" position={[0, 1.7, -7]}>
        <VoxModel url={`${V}revolving_door.vox`} position={[0, 0, 0]} scale={0.12} />
      </e.group>

      {/* ---- tall full trees (each editable) + low hedge beds ---- */}
      {TREES.map(([x, z], i) => (
        <e.group key={i} theatreKey={`Tree-${i}`} position={[x, 2.1, z]}>
          <VoxModel url={`${V}tree_full.vox`} position={[0, 0, 0]} scale={0.14} />
        </e.group>
      ))}
      <mesh position={[-6.8, 0.25, -4]}><boxGeometry args={[2.4, 0.5, 10]} /><meshStandardMaterial color="#4a7846" roughness={1} /></mesh>
      <mesh position={[6.8, 0.25, -4]}><boxGeometry args={[2.4, 0.5, 10]} /><meshStandardMaterial color="#4a7846" roughness={1} /></mesh>

      {/* ---- hero Om — feet at y=0; X/Z/facing driven by shared state ----
          scale 0.1 to MATCH every other scene (college/office/library). This was
          0.13 (~30% bigger) which made Om's legs read oversized vs the college
          shot — the college rig is the reference and is left untouched. */}
      <group ref={omGroup}>
        <VoxelOmRig ref={omRig} scale={0.1} />
      </group>

      {/* ---- foreground entrance portal we look through (editable) ---- */}
      <e.group theatreKey="EntrancePortal">
        <EntrancePortal />
      </e.group>

      {/* drifting gold-dust motes in the low sun */}
      <Sparkles count={44} scale={[24, 9, 18]} position={[0, 4, -6]} size={3} speed={0.18} color="#ffe6b0" opacity={0.5} />
    </group>
  );
}
