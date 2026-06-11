import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Text } from '@react-three/drei';
import type { Group } from 'three';
import { VoxModel } from '../voxel/VoxModel';
import { VoxelOmRig, type OmRigHandle } from '../voxel/VoxelOmRig';
import type { SceneState } from '../lib/state';

const V = '/vox/';
const ORIGIN: [number, number, number] = [0, 60, 0]; // office montage lives at world-Y 60
const CYAN = '#61dafb';

/** The presenter slide: dark React-docs panel with the atom logo, a title and
 *  a few bullets — "React Basics". Self-lit so it glows on the room. */
function ReactSlide() {
  const bullets = ['Components & JSX', 'Props & State', 'Hooks · useState / useEffect', 'One-way data flow'];
  return (
    <group>
      <mesh><planeGeometry args={[7.4, 4.1]} /><meshBasicMaterial color="#20232a" toneMapped={false} /></mesh>
      {/* atom logo (small, top-left) */}
      <group position={[-2.7, 1.2, 0.05]}>
        <mesh><sphereGeometry args={[0.1, 14, 14]} /><meshBasicMaterial color={CYAN} toneMapped={false} /></mesh>
        {[0, 60, 120].map((deg, i) => (
          <mesh key={i} rotation={[0, 0, (deg * Math.PI) / 180]} scale={[1, 0.4, 1]}>
            <torusGeometry args={[0.55, 0.028, 10, 48]} /><meshBasicMaterial color={CYAN} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <Text position={[-1.95, 1.2, 0.06]} fontSize={0.44} color={CYAN} anchorX="left" anchorY="middle" letterSpacing={0.02} material-toneMapped={false}>
        React Basics
      </Text>
      <mesh position={[0, 0.55, 0.05]}><planeGeometry args={[6.3, 0.02]} /><meshBasicMaterial color="#3a4250" toneMapped={false} /></mesh>
      {bullets.map((t, i) => (
        <group key={i} position={[-2.85, 0.1 - i * 0.6, 0.06]}>
          <mesh><planeGeometry args={[0.13, 0.13]} /><meshBasicMaterial color={CYAN} toneMapped={false} /></mesh>
          <Text position={[0.34, 0, 0]} fontSize={0.28} color="#e8e8ea" anchorX="left" anchorY="middle" material-toneMapped={false}>
            {t}
          </Text>
        </group>
      ))}
    </group>
  );
}

/** A small open laptop (dark base + glowing screen facing +Z). */
function Laptop() {
  return (
    <group>
      <mesh castShadow><boxGeometry args={[0.5, 0.04, 0.36]} /><meshStandardMaterial color="#2b2d31" metalness={0.3} roughness={0.5} /></mesh>
      <group position={[0, 0.17, -0.17]} rotation={[-0.4, 0, 0]}>
        <mesh><boxGeometry args={[0.5, 0.34, 0.03]} /><meshStandardMaterial color="#1b1d22" /></mesh>
        <mesh position={[0, 0, 0.02]}><planeGeometry args={[0.44, 0.28]} /><meshBasicMaterial color="#4a6fa5" toneMapped={false} /></mesh>
      </group>
    </group>
  );
}

/** A seated colleague with their own chair + a laptop in front. Faces -Z (screen). */
function Attendee({ x, z, vox }: { x: number; z: number; vox: string }) {
  const toCenter = x < 0 ? 1 : -1; // shift the laptop onto the table
  return (
    <group position={[x, 0, z]}>
      <VoxModel url={`${V}office_chair.vox`} position={[0, 0.78, 0]} scale={0.028} />
      <group position={[0, 1.12, 0]} rotation={[0, Math.PI, 0]}>
        <VoxModel url={`${V}${vox}.vox`} position={[0, 0, 0]} scale={0.1} />
      </group>
      {/* laptop on the table in front of the person (screen faces back toward them) */}
      <group position={[toCenter * 1.2, 1.06, -0.55]}>
        <Laptop />
      </group>
    </group>
  );
}

export default function SceneTraining({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const root = useRef<Group>(null);
  const omRig = useRef<OmRigHandle>(null);

  useFrame(() => {
    const s = stateRef.current;
    const vis = s.trainingVisible > 0.01;
    if (root.current) root.current.visible = vis;
    if (!vis) return;
    if (omRig.current) {
      omRig.current.setSeated(true);
      omRig.current.setGrad(false);
      omRig.current.setBadge(true);
    }
  });

  // left-edge + right-edge seats (Om takes a left-edge seat near the front)
  const leftSeats: Array<[number, string]> = [[3.0, 'att_blue'], [1.0, 'att_red'], [-3.0, 'att_green']];
  const rightSeats: Array<[number, string]> = [[3.0, 'att_cream'], [1.0, 'att_steel'], [-1.0, 'att_blue'], [-3.0, 'att_red']];

  return (
    <group ref={root} position={ORIGIN} visible={false}>
      {/* ===== lighting: golden window + cool presenter-screen glow ===== */}
      <hemisphereLight args={['#ffd49a', '#5e4d38', 0.5]} />
      <ambientLight intensity={0.28} color="#ffe6ca" />
      <directionalLight position={[-8, 6, 4]} intensity={2.4} color="#ffb066" castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14}
        shadow-camera-top={12} shadow-camera-bottom={-6} shadow-camera-far={48} shadow-bias={-0.0004} />
      {/* cool glow from the big React screen at the front */}
      <pointLight position={[0, 2.6, -7.2]} intensity={2.8} distance={16} decay={2} color="#76c6f0" />
      <pointLight position={[3, 3.4, 4]} intensity={0.8} distance={18} decay={2} color="#ffd9ad" />

      {/* ===== room shell: carpet floor, ceiling, walls ===== */}
      <mesh position={[0, -0.05, -2]} receiveShadow><boxGeometry args={[18, 0.2, 26]} /><meshStandardMaterial color="#8d8070" roughness={1} /></mesh>
      <mesh position={[0, 6.0, -2]}><boxGeometry args={[18, 0.3, 26]} /><meshStandardMaterial color="#e8e4dc" roughness={1} /></mesh>
      {/* front presenter wall */}
      <mesh position={[0, 3, -9]}><boxGeometry args={[18, 7, 0.4]} /><meshStandardMaterial color="#d7d2c6" roughness={1} /></mesh>
      {/* right wall */}
      <mesh position={[8.5, 3, -2]}><boxGeometry args={[0.4, 7, 26]} /><meshStandardMaterial color="#ded9cf" roughness={1} /></mesh>

      {/* ===== left WINDOW WALL with golden-hour Mumbai skyline ===== */}
      <mesh position={[-8.6, 4, -2]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[26, 14]} /><meshBasicMaterial color="#f3b878" toneMapped={false} /></mesh>
      <VoxModel url={`${V}tower_office.vox`} position={[-11, 3.4, -6]} scale={0.2} rotation={[0, Math.PI / 2, 0]} />
      <VoxModel url={`${V}tower_block.vox`} position={[-11, 3.0, -1]} scale={0.22} rotation={[0, Math.PI / 2, 0]} />
      <VoxModel url={`${V}tower_round.vox`} position={[-11, 3.6, 4]} scale={0.2} rotation={[0, Math.PI / 2, 0]} />
      {/* glass + vertical mullions on the left */}
      {[-7, -2, 3].map((z, i) => (
        <mesh key={i} position={[-8.4, 3, z]}><boxGeometry args={[0.12, 6, 0.12]} /><meshStandardMaterial color="#3a3f48" /></mesh>
      ))}

      {/* ===== big presenter DISPLAY (React Basics) on the front wall ===== */}
      <group position={[0, 2.7, -8.75]}>
        <mesh position={[0, 0, -0.05]}><boxGeometry args={[8.0, 4.6, 0.2]} /><meshStandardMaterial color="#101216" roughness={0.4} /></mesh>
        <group position={[0, 0, 0.08]}><ReactSlide /></group>
      </group>

      {/* ===== conference table (long axis along Z) — near-white top ===== */}
      <mesh position={[0, 0.98, -2]} castShadow receiveShadow><boxGeometry args={[4.6, 0.16, 11]} /><meshStandardMaterial color="#eef0f1" roughness={0.55} metalness={0.08} /></mesh>
      <mesh position={[0, 0.45, -6.5]}><boxGeometry args={[3.6, 1.0, 0.5]} /><meshStandardMaterial color="#b6b8bc" /></mesh>
      <mesh position={[0, 0.45, 2.5]}><boxGeometry args={[3.6, 1.0, 0.5]} /><meshStandardMaterial color="#b6b8bc" /></mesh>

      {/* ===== attendees around the table (~10), each with chair + laptop ===== */}
      {leftSeats.map(([z, vox], i) => <Attendee key={`l${i}`} x={-2.7} z={z} vox={vox} />)}
      {rightSeats.map(([z, vox], i) => <Attendee key={`r${i}`} x={2.7} z={z} vox={vox} />)}
      <Attendee x={0} z={4.0} vox="att_green" />
      {/* presenter standing beside the screen */}
      <group position={[3.4, 0, -7.0]}><VoxModel url={`${V}npc_base.vox`} position={[0, 1.0, 0]} scale={0.1} /></group>

      {/* ===== Om — seated on the LEFT edge, near the front (own chair + laptop) ===== */}
      <VoxModel url={`${V}office_chair.vox`} position={[-2.7, 0.78, -1.0]} scale={0.03} />
      <group position={[-2.7, -0.45, -1.0]} rotation={[0, Math.PI, 0]}>
        <VoxelOmRig ref={omRig} scale={0.1} />
      </group>
      <group position={[-1.5, 1.06, -1.55]}><Laptop /></group>

      {/* drifting gold-dust motes in the window light */}
      <Sparkles count={36} scale={[14, 5, 18]} position={[-2, 3, -2]} size={3} speed={0.2} color="#ffe6b0" opacity={0.45} />
    </group>
  );
}
