import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import { VoxModel } from '../voxel/VoxModel';
import { VoxelOmRig, type OmRigHandle } from '../voxel/VoxelOmRig';
import type { SceneState } from '../lib/state';

const V = '/vox/';
const ORIGIN: [number, number, number] = [0, 60, 0]; // interior lives away from the world

// Monitor content per officeScreen index.
const SCREENS: Array<{ title: string; sub: string; accent: string }> = [
  { title: '', sub: '', accent: '#c2622c' }, // 0 (unused)
  { title: 'FRONTEND TRAINING', sub: 'React · Angular · TypeScript', accent: '#4a90d9' }, // 1
  { title: 'FIRST CLIENT PROJECT', sub: 'FastAPI · Python · Backend', accent: '#86bc25' }, // 2
  { title: 'FASTAPI STARTER KIT', sub: 'Reusable platform · adopted program-wide', accent: '#86bc25' }, // 3
  { title: 'REAL-TIME VOICE AI', sub: 'GPT Realtime · Azure Comms · Healthcare', accent: '#4ad9c2' }, // 4
  { title: 'AGENTX HACKATHON', sub: 'Led team of 5 · Deep Research Agent', accent: '#d98a4a' }, // 5
  { title: 'BUILDING THIS PORTFOLIO', sub: 'Three.js · Voxels · GSAP', accent: '#c26ad9' }, // 6
  { title: 'SOFTWARE ENGINEER I', sub: 'Promoted · Jun 2026 · still building', accent: '#86bc25' }, // 7
];

/** One self-lit monitor page — a DARK IDE/code-editor look (matches the
 *  `om-working` clip: dark screen with colorful syntax) + a title/subtitle card
 *  in the lower third so the milestone still reads. */
function ScreenPage({ title, sub, accent }: { title: string; sub: string; accent: string }) {
  // Colorful "syntax" bars in the upper 2/3 (center-x, y, width, color).
  const code: Array<[number, number, number, string]> = [
    [-1.0, 0.62, 0.28, '#c678dd'], [-0.55, 0.62, 0.5, '#61afef'], [0.02, 0.62, 0.3, '#5c6370'],
    [-0.85, 0.52, 0.22, '#d19a66'], [-0.3, 0.52, 0.7, '#98c379'],
    [-0.95, 0.42, 0.35, '#61afef'], [-0.45, 0.42, 0.5, '#abb2bf'], [0.05, 0.42, 0.18, '#e06c75'],
    [-0.78, 0.32, 0.25, '#c678dd'], [-0.2, 0.32, 0.9, '#98c379'],
    [-0.9, 0.22, 0.4, '#abb2bf'], [-0.4, 0.22, 0.3, '#d19a66'],
    [-0.7, 0.12, 0.6, '#5c6370'],
  ];
  return (
    <group>
      {/* dark editor panel */}
      <mesh>
        <planeGeometry args={[2.7, 1.5]} />
        <meshBasicMaterial color="#1e2127" toneMapped={false} />
      </mesh>
      {/* gutter stripe */}
      <mesh position={[-1.27, 0.36, 0.005]}>
        <planeGeometry args={[0.16, 0.72]} />
        <meshBasicMaterial color="#181a1f" toneMapped={false} />
      </mesh>
      {code.map(([x, y, w, c], i) => (
        <mesh key={i} position={[x, y, 0.01]}>
          <planeGeometry args={[w, 0.05]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
      {/* blinking-style green cursor block */}
      <mesh position={[0.5, 0.32, 0.012]}>
        <planeGeometry args={[0.04, 0.07]} />
        <meshBasicMaterial color="#86bc25" toneMapped={false} />
      </mesh>
      {/* lower-third title card */}
      <mesh position={[0, -0.34, 0.008]}>
        <planeGeometry args={[2.7, 0.62]} />
        <meshBasicMaterial color="#16181d" toneMapped={false} />
      </mesh>
      <Text position={[0, -0.2, 0.04]} fontSize={0.18} color="#f0eee8" anchorX="center" anchorY="middle" letterSpacing={0.02} maxWidth={2.5} textAlign="center" material-toneMapped={false}>
        {title}
      </Text>
      <mesh position={[0, -0.35, 0.04]}>
        <planeGeometry args={[1.2, 0.014]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <Text position={[0, -0.5, 0.04]} fontSize={0.095} color={accent} anchorX="center" anchorY="middle" maxWidth={2.4} textAlign="center" material-toneMapped={false}>
        {sub}
      </Text>
    </group>
  );
}

/** A small rising-green-bar-chart panel (matches the `fastapi-2` clip): proof
 *  that the work pays off. Lives beside the main monitor, always on. */
function MetricsPanel() {
  const heights = [0.14, 0.22, 0.3, 0.42, 0.56, 0.72];
  return (
    <group>
      <mesh>
        <planeGeometry args={[1.25, 0.92]} />
        <meshBasicMaterial color="#15171c" toneMapped={false} />
      </mesh>
      {/* baseline */}
      <mesh position={[0, -0.36, 0.005]}>
        <planeGeometry args={[1.1, 0.012]} />
        <meshBasicMaterial color="#3a3f4b" toneMapped={false} />
      </mesh>
      {heights.map((h, i) => (
        <mesh key={i} position={[-0.46 + i * 0.17, -0.36 + h / 2, 0.01]}>
          <planeGeometry args={[0.12, h]} />
          <meshBasicMaterial color="#86bc25" toneMapped={false} />
        </mesh>
      ))}
      {/* up-arrow trend line */}
      <mesh position={[0.05, 0.02, 0.015]} rotation={[0, 0, -0.7]}>
        <planeGeometry args={[1.0, 0.03]} />
        <meshBasicMaterial color="#b6f08a" toneMapped={false} />
      </mesh>
      <mesh position={[0.46, 0.27, 0.015]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.16, 0.03]} />
        <meshBasicMaterial color="#b6f08a" toneMapped={false} />
      </mesh>
      <mesh position={[0.52, 0.21, 0.015]} rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[0.16, 0.03]} />
        <meshBasicMaterial color="#b6f08a" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Voice waveform — a row of bars whose heights pulse with waveLevel. */
function Waveform({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const grp = useRef<Group>(null);
  const N = 17;
  useFrame(() => {
    const lvl = stateRef.current.waveLevel;
    if (!grp.current) return;
    grp.current.visible = lvl > 0.02;
    const t = performance.now() * 0.004;
    grp.current.children.forEach((bar, i) => {
      const d = Math.abs(i - (N - 1) / 2) / N;
      const h = (0.1 + (0.9 - d) * Math.abs(Math.sin(t + i * 0.7))) * lvl;
      bar.scale.y = Math.max(0.05, h);
    });
  });
  return (
    <group ref={grp} visible={false}>
      {Array.from({ length: N }).map((_, i) => (
        <mesh key={i} position={[(i - (N - 1) / 2) * 0.13, 0, 0]}>
          <boxGeometry args={[0.07, 1, 0.07]} />
          <meshStandardMaterial color="#4ad9c2" emissive="#2a9d8f" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function SceneOffice({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const root = useRef<Group>(null);
  const omRig = useRef<OmRigHandle>(null);
  const screens = useRef<Group>(null);
  const trophy = useRef<Group>(null);
  const trophySparkle = useRef<Group>(null);
  const confetti = useRef<Group>(null);

  useFrame(() => {
    const s = stateRef.current;
    const vis = s.officeVisible > 0.01;
    if (root.current) root.current.visible = vis;
    if (!vis) return;
    if (omRig.current) {
      omRig.current.setWalkPhase(0);
      omRig.current.setGrad(false);
      omRig.current.setBadge(false); // clean white shirt (no lanyard)
    }
    // toggle the active monitor page
    const active = Math.round(s.officeScreen);
    if (screens.current) {
      screens.current.children.forEach((g, i) => {
        g.visible = i + 1 === active;
      });
    }
    // trophy rise + scale + sparkles
    if (trophy.current) {
      const r = s.trophyReveal;
      trophy.current.visible = r > 0.02;
      trophy.current.scale.setScalar(0.1 * (0.4 + 0.6 * r));
      trophy.current.position.y = 1.15 + (1 - r) * -0.4;
    }
    if (trophySparkle.current) trophySparkle.current.visible = s.trophyReveal > 0.4;
    if (confetti.current) confetti.current.visible = s.confetti > 0.05;
  });

  return (
    <group ref={root} position={ORIGIN} visible={false}>
      {/* cool daylight from the window + a soft fill */}
      <pointLight position={[0, 4, -3]} intensity={3.2} distance={20} decay={2} color="#dce8f5" />
      <pointLight position={[4, 3, 6]} intensity={1.0} distance={18} decay={2} color="#fff0dc" />
      {/* cool monitor glow on Om + warm desk rim (warm/cool contrast like om-working) */}
      <pointLight position={[-1.8, 1.9, 0.9]} intensity={2.2} distance={7} decay={2} color="#6ea8e0" />
      <pointLight position={[3.0, 2.2, 1.4]} intensity={1.1} distance={9} decay={2} color="#ffcaa0" />
      {/* ambient gold-dust motes drifting in the light */}
      <Sparkles count={46} scale={[14, 5.5, 9]} position={[0, 3, 0.5]} size={3.2} speed={0.25} color="#ffe6b0" opacity={0.5} />

      {/* room: ENCLOSED box (floor, ceiling, L+R walls) so no camera angle sees
          the void; back wall has a central window gap. Floor/ceiling oversized
          + pushed forward so the hero cameras (z up to ~7) always sit inside. */}
      <mesh position={[0, -0.15, 1]} receiveShadow>
        <boxGeometry args={[22, 0.3, 24]} />
        <meshStandardMaterial color="#cdc7bd" roughness={0.95} />
      </mesh>
      <mesh position={[0, 6.4, 1]}>
        <boxGeometry args={[22, 0.3, 24]} />
        <meshStandardMaterial color="#e6e2da" roughness={1} />
      </mesh>
      <mesh position={[-9.5, 3, 1]}>
        <boxGeometry args={[0.4, 7, 24]} />
        <meshStandardMaterial color="#dedad0" roughness={1} />
      </mesh>
      <mesh position={[9.5, 3, 1]}>
        <boxGeometry args={[0.4, 7, 24]} />
        <meshStandardMaterial color="#dedad0" roughness={1} />
      </mesh>
      {/* back wall split around a central window (x -3..3, y 1.2..4.8) */}
      <mesh position={[-6.25, 3, -5.2]}>
        <boxGeometry args={[7.5, 7, 0.4]} />
        <meshStandardMaterial color="#dedad0" roughness={1} />
      </mesh>
      <mesh position={[6.25, 3, -5.2]}>
        <boxGeometry args={[7.5, 7, 0.4]} />
        <meshStandardMaterial color="#dedad0" roughness={1} />
      </mesh>
      <mesh position={[0, 5.6, -5.2]}>
        <boxGeometry args={[6, 1.8, 0.4]} />
        <meshStandardMaterial color="#dedad0" roughness={1} />
      </mesh>
      <mesh position={[0, 0.6, -5.2]}>
        <boxGeometry args={[6, 1.2, 0.4]} />
        <meshStandardMaterial color="#dedad0" roughness={1} />
      </mesh>
      {/* window mullion + a bright sky pane behind the gap */}
      <mesh position={[0, 3, -5.4]}>
        <planeGeometry args={[6, 3.6]} />
        <meshBasicMaterial color="#bcdcf2" toneMapped={false} />
      </mesh>
      {/* a little skyline seen through the window */}
      {[[-2, 1.1, 1.4], [-0.6, 1.6, 1.0], [0.8, 1.3, 1.6], [2.1, 1.9, 1.1]].map(([x, h, w], i) => (
        <mesh key={i} position={[x, 1.4 + h / 2, -5.7]}>
          <boxGeometry args={[w, h * 2, 0.3]} />
          <meshStandardMaterial color="#9fb6cc" roughness={1} />
        </mesh>
      ))}

      {/* desk */}
      <mesh position={[0, 1.0, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[8, 0.25, 2.6]} />
        <meshStandardMaterial color="#6f4a2c" roughness={0.85} />
      </mesh>
      <mesh position={[-3.4, 0.5, 0.3]}><boxGeometry args={[0.3, 1, 2.4]} /><meshStandardMaterial color="#5a3a22" /></mesh>
      <mesh position={[3.4, 0.5, 0.3]}><boxGeometry args={[0.3, 1, 2.4]} /><meshStandardMaterial color="#5a3a22" /></mesh>

      {/* dense desk props (om-working): blue-backlit keyboard, mug, plant, pens */}
      <VoxModel url={`${V}keyboard.vox`} position={[1.2, 1.2, 1.05]} scale={0.03} />
      <VoxModel url={`${V}mug.vox`} position={[-3.0, 1.37, 0.9]} scale={0.04} />
      <VoxModel url={`${V}plant.vox`} position={[-3.6, 1.62, -0.35]} scale={0.045} />
      <VoxModel url={`${V}penholder.vox`} position={[-0.4, 1.45, 0.15]} scale={0.04} />

      {/* monitor (left of desk), faces +Z toward camera */}
      <group position={[-1.8, 1.13, 0.1]} rotation={[0, Math.PI, 0]}>
        <VoxModel url={`${V}monitor.vox`} position={[0, 0.8, 0]} scale={0.1} />
      </group>
      {/* self-lit monitor pages (un-flipped so text reads), in front of the screen */}
      <group ref={screens} position={[-1.8, 1.95, 0.18]} scale={0.78}>
        {SCREENS.slice(1).map((s, i) => (
          <group key={i} visible={i === 0}>
            <ScreenPage title={s.title} sub={s.sub} accent={s.accent} />
          </group>
        ))}
      </group>
      {/* metrics panel beside the monitor (fastapi-2): rising green chart */}
      <group position={[0.2, 1.92, 0.12]} rotation={[0, -0.2, 0]} scale={0.82}>
        <MetricsPanel />
      </group>
      {/* voice waveform floating in front of the desk */}
      <group position={[-1.8, 2.0, 0.6]}>
        <Waveform stateRef={stateRef} />
      </group>

      {/* award trophy — front-centre of the desk so it's never hidden by Om */}
      <group ref={trophy} position={[0.9, 1.15, 1.3]} scale={0.1} visible={false}>
        <VoxModel url={`${V}trophy.vox`} position={[0, 0, 0]} scale={1} />
      </group>
      <group ref={trophySparkle} visible={false}>
        <Sparkles count={60} scale={[3, 3.5, 3]} position={[0.9, 2.6, 1.3]} size={5} speed={0.5} color="#ffe39c" />
      </group>

      {/* promotion confetti */}
      <group ref={confetti} visible={false}>
        <Sparkles count={160} scale={[12, 7, 6]} position={[0, 4, 1]} size={8} speed={0.7} color="#ffe39c" />
      </group>

      {/* Om at the desk (right), facing camera, wearing the Deloitte lanyard */}
      <group position={[2.2, 0, 1.6]} rotation={[0, 0, 0]}>
        <VoxelOmRig ref={omRig} scale={0.1} />
      </group>
    </group>
  );
}
