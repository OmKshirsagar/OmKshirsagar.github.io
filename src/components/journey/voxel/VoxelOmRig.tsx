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
  // eslint-disable-next-line no-unused-vars
  setBadge: (on: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  setSeated: (on: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  setCheer: (on: boolean) => void;
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
    const badge = useRef<THREE.Group>(null); // lanyard + ID (toggled)
    const phase = useRef(0);
    const grad = useRef(false);
    const badgeOn = useRef(false);
    const seated = useRef(false);
    const cheer = useRef(false);

    useImperativeHandle(ref, () => ({
      setWalkPhase: (t: number) => {
        phase.current = t;
      },
      setGrad: (on: boolean) => {
        grad.current = on;
      },
      setBadge: (on: boolean) => {
        badgeOn.current = on;
      },
      setSeated: (on: boolean) => {
        seated.current = on;
      },
      setCheer: (on: boolean) => {
        cheer.current = on;
      },
      group: root.current,
    }));

    useFrame(() => {
      const g = grad.current;
      if (gradKit.current) gradKit.current.visible = g;
      if (diploma.current) diploma.current.visible = false; // diploma removed (was clipping the face)
      if (badge.current) badge.current.visible = badgeOn.current && !g;
      if (g) {
        // Graduation pose: stand still & dignified, arms at the sides.
        if (thighL.current) thighL.current.rotation.x = 0;
        if (thighR.current) thighR.current.rotation.x = 0;
        if (armL.current) armL.current.rotation.x = 0;
        if (armR.current) armR.current.rotation.x = 0;
        if (root.current) root.current.position.y = 0;
        return;
      }
      if (seated.current) {
        // Seated-at-desk pose: thighs swing forward to horizontal (sitting),
        // arms reach forward + down toward the keyboard. Hips (y=10) rest on
        // the chair seat — the scene positions the group at seat height.
        if (thighL.current) thighL.current.rotation.x = -1.5;
        if (thighR.current) thighR.current.rotation.x = -1.5;
        if (armL.current) armL.current.rotation.x = -1.05;
        if (armR.current) armR.current.rotation.x = -1.05;
        if (root.current) root.current.position.y = 0;
        return;
      }
      if (cheer.current) {
        // Triumph: both arms thrown up overhead, a little victory bob.
        const t = performance.now() * 0.006;
        if (thighL.current) thighL.current.rotation.x = 0;
        if (thighR.current) thighR.current.rotation.x = 0;
        if (armL.current) armL.current.rotation.x = 2.7;
        if (armR.current) armR.current.rotation.x = 2.7;
        if (root.current) root.current.position.y = Math.max(0, Math.sin(t) * 0.6);
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
    // ORIGINAL proportions (do NOT change — shared by every scene):
    //   thighs 10 hang from hips (y=10) -> feet at 0
    //   torso  spans y 10..18  -> center y=14
    //   head   sits on y=18    -> center y=21.5 ; shoulders at y=17
    return (
      <group ref={root} scale={scale}>
        <Part url={`${V}om_torso.vox`} position={[0, 14, 0]} />
        <Part url={`${V}om_head.vox`} position={[0, 21.5, 0]} />
        <group ref={armL} position={[-4, 17, 0]}>
          <Part url={`${V}om_upperarm_L.vox`} position={[0, -3, 0]} />
        </group>
        <group ref={armR} position={[4, 17, 0]}>
          <Part url={`${V}om_upperarm_R.vox`} position={[0, -3, 0]} />
          {/* diploma held in the right hand (at the hand tip, raised overhead) */}
          <group ref={diploma} visible={false}>
            <Part url={`${V}diploma.vox`} position={[0, -8, 0]} />
          </group>
        </group>
        <group ref={thighL} position={[-1.5, 10, 0]}>
          <Part url={`${V}om_thigh_L.vox`} position={[0, -5, 0]} />
        </group>
        <group ref={thighR} position={[1.5, 10, 0]}>
          <Part url={`${V}om_thigh_R.vox`} position={[0, -5, 0]} />
        </group>
        {/* graduation kit: gown over the body + mortarboard on the head.
            Gown pushed back (z -0.8) so its front plane is BETWEEN the torso
            front (+1.5) and the head front (+3) — no coplanar Z-fight on the
            chin/beard (that was the "flicker on scroll"). */}
        <group ref={gradKit} visible={false}>
          <Part url={`${V}gown.vox`} position={[0, 12, -0.8]} />
          <Part url={`${V}mortarboard.vox`} position={[0, 25.5, 0]} />
        </group>
        {/* Deloitte lanyard + ID badge on the chest (faces +Z) */}
        <group ref={badge} visible={false} position={[0, 13, 2.6]} rotation={[0, Math.PI, 0]}>
          <Part url={`${V}lanyard.vox`} position={[0, 0, 0]} />
        </group>
      </group>
    );
  },
);
