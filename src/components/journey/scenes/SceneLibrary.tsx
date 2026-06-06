import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import { VoxModel } from '../voxel/VoxModel';
import { VoxelOmRig, type OmRigHandle } from '../voxel/VoxelOmRig';
import type { SceneState } from '../lib/state';

const V = '/vox/';
// Interior lives far above the outdoor world; the dark room fog/bg hides the void.
const ORIGIN: [number, number, number] = [0, 40, 0];

/** The laptop's self-lit browser page: "PUBLISHED PAPER / JETIR 2022" card. */
function ScreenContent({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const card = useRef<Group>(null);
  useFrame(() => {
    const r = stateRef.current.paperReveal;
    if (card.current) {
      card.current.visible = r > 0.02;
      const s = 0.9 + 0.1 * r;
      card.current.scale.set(s, s, s);
    }
  });
  // placeholder article text bars (left column)
  const bars = [-0.62, -0.5, -0.38, 0.42, 0.3];
  return (
    <group>
      {/* white page */}
      <mesh>
        <planeGeometry args={[2.5, 1.62]} />
        <meshBasicMaterial color="#f5f3ef" toneMapped={false} />
      </mesh>
      {/* grey placeholder text bars */}
      {bars.map((y, i) => (
        <mesh key={i} position={[-0.78, y, 0.01]}>
          <planeGeometry args={[0.7, 0.045]} />
          <meshBasicMaterial color="#d9d6d0" toneMapped={false} />
        </mesh>
      ))}
      {/* reveal card */}
      <group ref={card} position={[0.18, 0.02, 0.02]}>
        <mesh>
          <planeGeometry args={[1.55, 1.05]} />
          <meshBasicMaterial color="#eceae5" toneMapped={false} />
        </mesh>
        {/* mini Om headshot (left of the card) */}
        <group position={[-0.5, -0.04, 0.04]} scale={0.028} rotation={[0, 0, 0]}>
          <VoxModel url={`${V}om_head.vox`} position={[0, 0, 0]} scale={1} />
        </group>
        <Text
          position={[0.2, 0.22, 0.05]}
          fontSize={0.135}
          color="#1c1c20"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.04}
          material-toneMapped={false}
        >
          PUBLISHED PAPER
        </Text>
        <mesh position={[0.2, 0.09, 0.05]}>
          <planeGeometry args={[0.78, 0.012]} />
          <meshBasicMaterial color="#1c1c20" toneMapped={false} />
        </mesh>
        <Text
          position={[0.2, -0.06, 0.05]}
          fontSize={0.16}
          color="#c2622c"
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
        >
          JETIR · 2022
        </Text>
        <Text
          position={[0, -0.4, 0.05]}
          fontSize={0.058}
          color="#5a5a5e"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.4}
          textAlign="center"
          material-toneMapped={false}
        >
          AlphaZero vs Stockfish — A Review of Chess Engines
        </Text>
      </group>
    </group>
  );
}

export default function SceneLibrary({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const root = useRef<Group>(null);
  const omRig = useRef<OmRigHandle>(null);
  const lampLight = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const s = stateRef.current;
    const vis = s.paperVisible > 0.01;
    if (root.current) root.current.visible = vis;
    if (!vis) return;
    if (omRig.current) {
      omRig.current.setWalkPhase(0);
      omRig.current.setGrad(false);
    }
    if (lampLight.current) lampLight.current.intensity = 5.5 * s.paperVisible;
  });

  return (
    <group ref={root} position={ORIGIN} visible={false}>
      {/* warm lamp light (the room's key light) */}
      <pointLight
        ref={lampLight}
        position={[-2.4, 2.0, -0.3]}
        intensity={5.5}
        distance={9}
        decay={2}
        color="#ffcf8c"
        castShadow
      />
      {/* soft warm fill so the dark side isn't pure black */}
      <pointLight position={[2.5, 1.6, 3]} intensity={1.1} distance={10} decay={2} color="#7a4a2a" />

      {/* desk top + apron */}
      <mesh position={[0, -0.12, 0.4]} receiveShadow castShadow>
        <boxGeometry args={[9, 0.24, 5]} />
        <meshStandardMaterial color="#7a4a26" roughness={0.85} />
      </mesh>
      {/* back wall + a shelf to catch the lamp glow */}
      <mesh position={[0, 2.2, -2.6]}>
        <boxGeometry args={[12, 7, 0.4]} />
        <meshStandardMaterial color="#3a2415" roughness={1} />
      </mesh>
      <mesh position={[-2.2, 3.0, -2.3]} castShadow>
        <boxGeometry args={[4.5, 0.18, 0.7]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.9} />
      </mesh>

      {/* laptop: base flat on the desk + hinged screen standing up, leaning back */}
      <group position={[-1.1, 0, 0.5]} rotation={[0, 0.5, 0]}>
        <VoxModel url={`${V}laptop_base.vox`} position={[0, 0.1, 0]} scale={0.1} />
        {/* hinge at the back edge of the deck; lean the screen back ~16° */}
        <group position={[0, 0.2, -0.95]} rotation={[-0.28, 0, 0]}>
          {/* panel faces -Z as built -> flip 180° about Y so the display faces the camera */}
          <group rotation={[0, Math.PI, 0]}>
            <VoxModel url={`${V}laptop_screen.vox`} position={[0, 0.9, 0]} scale={0.1} />
          </group>
          {/* live self-lit screen content (un-flipped so text reads correctly) */}
          <group position={[0, 0.9, 0.14]} scale={0.82}>
            <ScreenContent stateRef={stateRef} />
          </group>
        </group>
      </group>

      {/* desk lamp (left) */}
      <VoxModel url={`${V}desk_lamp.vox`} position={[-3.1, 1.2, -0.6]} scale={0.1} />

      {/* foreground clutter */}
      <mesh position={[1.5, 0.08, 1.9]} castShadow>
        <boxGeometry args={[0.5, 0.3, 0.8]} />
        <meshStandardMaterial color="#8a5a30" roughness={0.9} />
      </mesh>
      <mesh position={[2.3, 0.12, 1.2]} castShadow>
        <boxGeometry args={[0.7, 0.45, 0.5]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.9} />
      </mesh>

      {/* seated Om — right of the desk, back to camera, looking at the screen */}
      <group position={[3.0, -0.1, 2.4]} rotation={[0, -2.15, 0]}>
        <VoxelOmRig ref={omRig} scale={0.1} />
      </group>
    </group>
  );
}
