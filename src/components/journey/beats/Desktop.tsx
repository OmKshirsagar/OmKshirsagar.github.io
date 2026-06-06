import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';
import type { SceneState } from '../lib/state';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Beat 10 (Sidequest): a tiny voxel monitor + keyboard floats next to Om,
 * showing the portfolio site itself. The meta moment: voxel-Om building
 * this very page.
 */
export default function Desktop({ stateRef }: Props) {
  const groupRef = useRef<Group>(null);
  const matsRef = useRef<MeshStandardMaterial[]>([]);
  const screenMatRef = useRef<MeshStandardMaterial | null>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const v = stateRef.current.desktopVisible;
    groupRef.current.visible = v > 0.001;
    if (groupRef.current.visible) {
      for (const m of matsRef.current) m.opacity = v;
      // Pulse the screen glow so it reads as "active"
      if (screenMatRef.current) {
        screenMatRef.current.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 2) * 0.15;
      }
    }
  });

  const collect = (m: MeshStandardMaterial | null): void => {
    if (m && !matsRef.current.includes(m)) matsRef.current.push(m);
  };
  const collectScreen = (m: MeshStandardMaterial | null): void => {
    collect(m);
    screenMatRef.current = m;
  };

  return (
    <group ref={groupRef} position={[1.4, 1.05, 0.1]} rotation={[0, -0.5, 0]}>
      {/* Stand */}
      <mesh castShadow position={[0, -0.4, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.35]} />
        <meshStandardMaterial ref={collect} color="#22222d" flatShading transparent />
      </mesh>
      <mesh castShadow position={[0, -0.25, 0]}>
        <boxGeometry args={[0.1, 0.22, 0.1]} />
        <meshStandardMaterial ref={collect} color="#22222d" flatShading transparent />
      </mesh>
      {/* Monitor frame */}
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[0.95, 0.65, 0.08]} />
        <meshStandardMaterial ref={collect} color="#161318" flatShading transparent />
      </mesh>
      {/* Screen (emits warm glow → "the site is on") */}
      <mesh position={[0, 0.2, 0.045]}>
        <boxGeometry args={[0.85, 0.55, 0.01]} />
        <meshStandardMaterial
          ref={collectScreen}
          color="#ffd29a"
          emissive="#ff9460"
          emissiveIntensity={0.7}
          flatShading
          transparent
        />
      </mesh>
      {/* Two "code lines" on screen — small dark strips */}
      <mesh position={[-0.1, 0.32, 0.052]}>
        <boxGeometry args={[0.5, 0.04, 0.005]} />
        <meshStandardMaterial ref={collect} color="#1a1410" flatShading transparent />
      </mesh>
      <mesh position={[-0.15, 0.22, 0.052]}>
        <boxGeometry args={[0.4, 0.04, 0.005]} />
        <meshStandardMaterial ref={collect} color="#1a1410" flatShading transparent />
      </mesh>
      <mesh position={[-0.2, 0.12, 0.052]}>
        <boxGeometry args={[0.3, 0.04, 0.005]} />
        <meshStandardMaterial ref={collect} color="#1a1410" flatShading transparent />
      </mesh>
    </group>
  );
}
