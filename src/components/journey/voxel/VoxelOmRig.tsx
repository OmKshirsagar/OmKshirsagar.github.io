import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVox } from '../lib/useVox';
import { walkPose } from './walkPose';

export type OmRigHandle = {
  // eslint-disable-next-line no-unused-vars
  setWalkPhase: (phase: number) => void;
  // eslint-disable-next-line no-unused-vars
  setGrad: (on: boolean) => void;
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
    const gradKit = useRef<THREE.Group>(null); // cap + gown (toggled)
    const diploma = useRef<THREE.Group>(null); // in the raised right hand (toggled)
    const phase = useRef(0);
    const grad = useRef(false);

    useImperativeHandle(ref, () => ({
      setWalkPhase: (t: number) => {
        phase.current = t;
      },
      setGrad: (on: boolean) => {
        grad.current = on;
      },
      group: root.current,
    }));

    useFrame(() => {
      const g = grad.current;
      if (gradKit.current) gradKit.current.visible = g;
      if (diploma.current) diploma.current.visible = g;
      if (g) {
        // Graduation pose: stand still, raise the right arm with the diploma.
        if (thighL.current) thighL.current.rotation.x = 0;
        if (thighR.current) thighR.current.rotation.x = 0;
        if (armL.current) armL.current.rotation.x = 0.25;
        if (armR.current) armR.current.rotation.x = -2.5; // raised overhead
        if (root.current) root.current.position.y = 0;
        return;
      }
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
    return (
      <group ref={root} scale={scale}>
        <Part url={`${V}om_torso.vox`} position={[0, 14, 0]} />
        <Part url={`${V}om_head.vox`} position={[0, 21.5, 0]} />
        <group ref={armL} position={[-4, 17, 0]}>
          <Part url={`${V}om_upperarm_L.vox`} position={[0, -3, 0]} />
        </group>
        <group ref={armR} position={[4, 17, 0]}>
          <Part url={`${V}om_upperarm_R.vox`} position={[0, -3, 0]} />
          {/* diploma held in the right hand (bottom of the arm) */}
          <group ref={diploma} visible={false}>
            <Part url={`${V}diploma.vox`} position={[0, -6, 0]} />
          </group>
        </group>
        <group ref={thighL} position={[-1.5, 10, 0]}>
          <Part url={`${V}om_thigh_L.vox`} position={[0, -5, 0]} />
        </group>
        <group ref={thighR} position={[1.5, 10, 0]}>
          <Part url={`${V}om_thigh_R.vox`} position={[0, -5, 0]} />
        </group>
        {/* graduation kit: gown over the body + mortarboard on the head */}
        <group ref={gradKit} visible={false}>
          <Part url={`${V}gown.vox`} position={[0, 12, 0]} />
          <Part url={`${V}mortarboard.vox`} position={[0, 25.5, 0]} />
        </group>
      </group>
    );
  },
);
