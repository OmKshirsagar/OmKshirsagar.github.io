import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVox } from '../lib/useVox';
import { walkPose } from './walkPose';

export type OmRigHandle = {
  // eslint-disable-next-line no-unused-vars
  setWalkPhase: (phase: number) => void;
  group: THREE.Group | null;
};

const V = '/vox/'; // public path

/** Renders a loaded vox Mesh as a child at the given (pivot-local) position. */
function Part({ url, position }: { url: string; position: [number, number, number] }) {
  const mesh = useVox(url);
  if (!mesh) return null;
  return <primitive object={mesh} position={position} />;
}

export const VoxelOmRig = forwardRef<OmRigHandle, { scale?: number }>(
  function VoxelOmRig({ scale = 0.1 }, ref) {
    const root = useRef<THREE.Group>(null);
    const thighL = useRef<THREE.Group>(null);
    const thighR = useRef<THREE.Group>(null);
    const armL = useRef<THREE.Group>(null);
    const armR = useRef<THREE.Group>(null);
    const phase = useRef(0);

    useImperativeHandle(ref, () => ({
      setWalkPhase: (t: number) => {
        phase.current = t;
      },
      group: root.current,
    }));

    useFrame(() => {
      const p = walkPose(((phase.current % 1) + 1) % 1);
      if (thighL.current) thighL.current.rotation.x = p.thighL;
      if (thighR.current) thighR.current.rotation.x = p.thighR;
      if (armL.current) armL.current.rotation.x = p.armL;
      if (armR.current) armR.current.rotation.x = p.armR;
      if (root.current) root.current.position.y = p.bob;
    });

    // Each part mesh is CENTERED at its own origin by buildMesh. Part sizes
    // (from build_om.py): torso 6x8(z), head 6x7(z), arm 2x6(z), thigh 2x10(z).
    // Longer legs for a proper stance: FEET at y=0, hips at y=10.
    //   thighs 10 tall hang from hips (y=10) -> feet at 0
    //   torso  spans y 10..18  -> center y=14
    //   head   sits on y=18    -> center y=21.5
    //   shoulders at y=17
    // A pivot <group> sits AT the joint; the centered child mesh is offset so
    // its TOP edge meets the group origin, so group.rotation.x swings the limb
    // from the joint.
    return (
      <group ref={root} scale={scale}>
        <Part url={`${V}om_torso.vox`} position={[0, 14, 0]} />
        <Part url={`${V}om_head.vox`} position={[0, 21.5, 0]} />
        <group ref={armL} position={[-4, 17, 0]}>
          <Part url={`${V}om_upperarm_L.vox`} position={[0, -3, 0]} />
        </group>
        <group ref={armR} position={[4, 17, 0]}>
          <Part url={`${V}om_upperarm_R.vox`} position={[0, -3, 0]} />
        </group>
        <group ref={thighL} position={[-1.5, 10, 0]}>
          <Part url={`${V}om_thigh_L.vox`} position={[0, -5, 0]} />
        </group>
        <group ref={thighR} position={[1.5, 10, 0]}>
          <Part url={`${V}om_thigh_R.vox`} position={[0, -5, 0]} />
        </group>
      </group>
    );
  },
);
