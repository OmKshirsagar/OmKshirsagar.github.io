import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
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

export default function SceneJaiHind({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const omRig = useRef<OmRigHandle>(null);
  const omGroup = useRef<Group>(null);
  const env = useRef<Group>(null);

  useFrame(() => {
    const s = stateRef.current;
    if (env.current) env.current.visible = s.collegeVisible > 0.01;
    if (omRig.current) omRig.current.setWalkPhase(s.omWalkPhase);
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
        {/* Facade at far -Z; front face (windows/door) faces +Z toward Om.
            40 tall @0.1 = 4 units -> lift y=2 so base sits on ground. */}
        <VoxModel url={`${V}jaihind_facade.vox`} position={[0, 2, -9]} scale={0.1} />
        {/* Trees flanking the path (16 tall @0.12 = 1.92 -> lift y=0.96) */}
        <VoxModel url={`${V}tree.vox`} position={[-5, 0.96, 4]} scale={0.12} />
        <VoxModel url={`${V}tree.vox`} position={[5, 0.96, 6]} scale={0.12} />
        <VoxModel url={`${V}tree.vox`} position={[-6, 0.96, -2]} scale={0.12} />
        {/* Lamps along the path (10 tall @0.1 = 1.0 -> lift y=0.5) */}
        <VoxModel url={`${V}lamp.vox`} position={[-2, 0.5, 2]} scale={0.1} />
        <VoxModel url={`${V}lamp.vox`} position={[2, 0.5, -4]} scale={0.1} />
        <Crowd visible={stateRef.current.crowdVisible} />
      </group>
      {/* Hero Om — feet at y=0 by rig construction; X/Z driven by state */}
      <group ref={omGroup}>
        <VoxelOmRig ref={omRig} scale={0.1} />
      </group>
    </group>
  );
}
