import { useRef, type MutableRefObject, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Group, PointLight } from 'three';
import { VoxModel } from '../voxel/VoxModel';
import { VoxelOmRig, type OmRigHandle } from '../voxel/VoxelOmRig';
import type { SceneState } from '../lib/state';

const V = '/vox/';
const ORIGIN: [number, number, number] = [0, 80, 0]; // war room lives away from the other scenes
const RED = new THREE.Color('#ff5a4d');
const GREEN = new THREE.Color('#5ce08a');

/** The crisis screen: a code editor (top) + a terminal that flips from a red
 *  FAILED run to a green PASSING run. Both states are mounted; the parent
 *  toggles their visibility from `warFix`. Faces the people / camera (+Z). */
function WarScreen({ errRef, okRef }: { errRef: RefObject<Group>; okRef: RefObject<Group> }) {
  const codeBars: Array<[number, number, number, string]> = [
    [-0.95, 0.62, 0.3, '#c678dd'], [-0.5, 0.62, 0.5, '#61afef'],
    [-0.85, 0.52, 0.22, '#d19a66'], [-0.3, 0.52, 0.66, '#98c379'],
    [-0.92, 0.42, 0.36, '#61afef'], [-0.4, 0.42, 0.42, '#abb2bf'],
    [-0.72, 0.32, 0.24, '#c678dd'], [-0.2, 0.32, 0.8, '#98c379'],
  ];
  return (
    <group>
      {/* dark editor panel */}
      <mesh><planeGeometry args={[2.6, 1.5]} /><meshBasicMaterial color="#181b21" toneMapped={false} /></mesh>
      {codeBars.map(([x, y, w, c], i) => (
        <mesh key={i} position={[x, y, 0.01]}><planeGeometry args={[w, 0.05]} /><meshBasicMaterial color={c} toneMapped={false} /></mesh>
      ))}
      {/* terminal divider */}
      <mesh position={[0, 0.05, 0.01]}><planeGeometry args={[2.5, 0.012]} /><meshBasicMaterial color="#2b2f38" toneMapped={false} /></mesh>
      {/* RED failing run */}
      <group ref={errRef} position={[0, 0, 0.02]}>
        <Text position={[-1.18, -0.12, 0]} fontSize={0.1} color="#8b93a1" anchorX="left" anchorY="middle" material-toneMapped={false}>$ pytest -q · uvicorn app:api</Text>
        <Text position={[-1.18, -0.3, 0]} fontSize={0.12} color="#ff5a4d" anchorX="left" anchorY="middle" material-toneMapped={false}>FAILED  etl_pipeline ✗ ✗ ✗</Text>
        <Text position={[-1.18, -0.48, 0]} fontSize={0.1} color="#e06c75" anchorX="left" anchorY="middle" material-toneMapped={false}>AssertionError: rows mismatch · 3 failed</Text>
      </group>
      {/* GREEN passing run */}
      <group ref={okRef} position={[0, 0, 0.02]} visible={false}>
        <Text position={[-1.18, -0.12, 0]} fontSize={0.1} color="#8b93a1" anchorX="left" anchorY="middle" material-toneMapped={false}>$ pytest -q · uvicorn app:api</Text>
        <Text position={[-1.18, -0.3, 0]} fontSize={0.12} color="#5ce08a" anchorX="left" anchorY="middle" material-toneMapped={false}>✓ 16 passed in 3.8s</Text>
        <Text position={[-1.18, -0.48, 0]} fontSize={0.1} color="#86bc25" anchorX="left" anchorY="middle" material-toneMapped={false}>▶ running · http://0.0.0.0:8000</Text>
      </group>
    </group>
  );
}

/** A coffee cup (reuse mug voxel) helper position scatter. */
function Coffee({ x, z }: { x: number; z: number }) {
  return <VoxModel url={`${V}mug.vox`} position={[x, 1.12, z]} scale={0.032} />;
}

export default function SceneWarRoom({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const root = useRef<Group>(null);
  const omRig = useRef<OmRigHandle>(null);
  const omGroup = useRef<Group>(null);
  const omChair = useRef<Group>(null);
  const errScreen = useRef<Group>(null);
  const okScreen = useRef<Group>(null);
  const glow = useRef<PointLight>(null);
  const mate1 = useRef<Group>(null);
  const mate2 = useRef<Group>(null);
  const m1Chair = useRef<Group>(null);
  const m2Chair = useRef<Group>(null);

  useFrame(() => {
    const s = stateRef.current;
    const vis = s.warRoomVisible > 0.01;
    if (root.current) root.current.visible = vis;
    if (!vis) return;
    const fix = s.warFix;
    const fixed = fix > 0.55;
    // turn factor: 0 = seated facing the screen (-Z), 1 = stood up + turned to camera
    const turn = THREE.MathUtils.clamp((fix - 0.5) / 0.35, 0, 1);
    const faceScreen = Math.PI * (1 - turn); // PI -> 0
    const L = THREE.MathUtils.lerp;

    if (errScreen.current) errScreen.current.visible = !fixed;
    if (okScreen.current) okScreen.current.visible = fixed;
    if (glow.current) {
      glow.current.color.copy(RED).lerp(GREEN, fix);
      glow.current.intensity = 2.6 + (fixed ? 1.0 : 0);
    }
    // Om: types seated facing the screen, then STANDS UP, turns to camera + cheers
    if (omGroup.current) {
      omGroup.current.rotation.y = faceScreen;
      omGroup.current.position.y = L(-0.3, 0.0, turn);   // rise off the chair
      omGroup.current.position.z = L(1.9, 2.3, turn);    // step forward
    }
    if (omRig.current) {
      omRig.current.setBadge(true);
      omRig.current.setSeated(!fixed);
      omRig.current.setCheer(fixed);
    }
    if (omChair.current) {                                // chair left shoved back, askew
      omChair.current.rotation.y = L(0, 0.7, turn);
      omChair.current.position.z = L(1.95, 1.6, turn);
    }
    // colleagues stand behind Om, lean in to watch, then straighten + turn
    if (mate1.current) { mate1.current.rotation.y = faceScreen + 0.18; mate1.current.rotation.x = L(0.18, 0, turn); mate1.current.position.z = L(1.95, 2.15, turn); }
    if (mate2.current) { mate2.current.rotation.y = faceScreen - 0.18; mate2.current.rotation.x = L(0.18, 0, turn); mate2.current.position.z = L(1.95, 2.15, turn); }
    if (m1Chair.current) { m1Chair.current.rotation.y = L(0, -0.6, turn); m1Chair.current.position.z = L(1.95, 1.55, turn); }
    if (m2Chair.current) { m2Chair.current.rotation.y = L(0, 0.6, turn); m2Chair.current.position.z = L(1.95, 1.55, turn); }
  });

  return (
    <group ref={root} position={ORIGIN} visible={false}>
      {/* ===== night war-room lighting ===== */}
      <ambientLight intensity={0.16} color="#2a3346" />
      {/* warm desk lamp (key) */}
      <pointLight position={[-2.4, 2.0, 1.2]} intensity={2.2} distance={8} decay={2} color="#ffcaa0" />
      {/* the MONITOR drives the mood: red crisis -> green fixed (lights the faces) */}
      <pointLight ref={glow} position={[0.4, 1.8, -0.1]} intensity={2.6} distance={7} decay={2} color="#ff5a4d" />
      {/* cool night rim from the window */}
      <pointLight position={[0, 3, -4]} intensity={0.9} distance={14} decay={2} color="#5d7bb0" />

      {/* ===== dim room shell ===== */}
      <mesh position={[0, -0.05, -1]} receiveShadow><boxGeometry args={[18, 0.2, 20]} /><meshStandardMaterial color="#2c2a2e" roughness={1} /></mesh>
      <mesh position={[0, 5.5, -1]}><boxGeometry args={[18, 0.3, 20]} /><meshStandardMaterial color="#26242a" roughness={1} /></mesh>
      <mesh position={[0, 2.7, -6]}><boxGeometry args={[18, 6, 0.4]} /><meshStandardMaterial color="#322f36" roughness={1} /></mesh>
      <mesh position={[8.6, 2.7, -1]}><boxGeometry args={[0.4, 6, 20]} /><meshStandardMaterial color="#322f36" roughness={1} /></mesh>

      {/* night window with blinds (cool glow) on the back wall */}
      <mesh position={[-3.2, 3.0, -5.78]}><planeGeometry args={[4.2, 2.6]} /><meshBasicMaterial color="#2b3b58" toneMapped={false} /></mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[-3.2, 2.0 + i * 0.42, -5.7]}><boxGeometry args={[4.3, 0.1, 0.06]} /><meshStandardMaterial color="#3c4658" /></mesh>
      ))}

      {/* ===== desk (its near edge sits just in front of the team) ===== */}
      <mesh position={[0.2, 1.0, -0.1]} castShadow receiveShadow><boxGeometry args={[7.8, 0.16, 2.8]} /><meshStandardMaterial color="#4a4036" roughness={0.8} /></mesh>
      <mesh position={[-3.4, 0.5, -0.1]}><boxGeometry args={[0.25, 1, 2.6]} /><meshStandardMaterial color="#37302a" /></mesh>
      <mesh position={[3.8, 0.5, -0.1]}><boxGeometry args={[0.25, 1, 2.6]} /><meshStandardMaterial color="#37302a" /></mesh>

      {/* desk lamp (left) */}
      <VoxModel url={`${V}desk_lamp.vox`} position={[-2.9, 1.5, -0.6]} scale={0.05} />

      {/* ===== the big monitor (crisis screen) — far edge, faces the team ===== */}
      <group position={[0.5, 1.95, -1.15]}>
        <mesh castShadow><boxGeometry args={[2.9, 1.75, 0.08]} /><meshStandardMaterial color="#15171c" roughness={0.4} /></mesh>
        <group position={[0, 0, 0.06]} scale={0.9}><WarScreen errRef={errScreen} okRef={okScreen} /></group>
        <mesh position={[0, -1.05, 0]}><boxGeometry args={[0.16, 0.5, 0.16]} /><meshStandardMaterial color="#23262d" /></mesh>
      </group>

      {/* keyboard + scattered coffee + papers (on the desk, in front of the team) */}
      <VoxModel url={`${V}keyboard.vox`} position={[0.2, 1.14, 0.9]} scale={0.03} />
      <Coffee x={-1.3} z={0.5} />
      <Coffee x={-0.3} z={0.1} />
      <Coffee x={2.5} z={0.4} />
      <mesh position={[-1.2, 1.1, 0.1]} rotation={[-Math.PI / 2, 0, 0.2]}><planeGeometry args={[0.7, 0.5]} /><meshStandardMaterial color="#d8d2c4" roughness={1} /></mesh>

      {/* ===== chairs (separate, so they stay shoved-back-at-an-angle on the win) ===== */}
      <group ref={omChair} position={[0.2, 0, 1.95]}><VoxModel url={`${V}office_chair.vox`} position={[0, 0.88, 0]} scale={0.035} rotation={[0, Math.PI, 0]} /></group>
      <group ref={m1Chair} position={[-1.7, 0, 1.95]}><VoxModel url={`${V}office_chair.vox`} position={[0, 0.88, 0]} scale={0.035} rotation={[0, Math.PI, 0]} /></group>
      <group ref={m2Chair} position={[2.1, 0, 1.95]}><VoxModel url={`${V}office_chair.vox`} position={[0, 0.88, 0]} scale={0.035} rotation={[0, Math.PI, 0]} /></group>

      {/* ===== people: seated facing the screen, then they STAND, turn + cheer ===== */}
      <group ref={omGroup} position={[0.2, -0.3, 1.9]}>
        <VoxelOmRig ref={omRig} scale={0.1} />
      </group>
      <group ref={mate1} position={[-1.7, 1.0, 1.95]}>
        <VoxModel url={`${V}att_stand_blue.vox`} position={[0, 0, 0]} scale={0.1} />
      </group>
      <group ref={mate2} position={[2.1, 1.0, 1.95]}>
        <VoxModel url={`${V}att_stand_green.vox`} position={[0, 0, 0]} scale={0.1} />
      </group>

      {/* faint dust in the lamp light */}
      <Sparkles count={26} scale={[10, 4, 8]} position={[-1, 2.4, 0.5]} size={2.4} speed={0.15} color="#ffd9b0" opacity={0.4} />
    </group>
  );
}
