import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';
import type { SceneState } from '../lib/state';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Beat 09: voxel hand + tiny neural-net node ring near Om, plus a curved
 * arrow of mint particles indicating sign-language → speech flow.
 */
export default function Hands({ stateRef }: Props) {
  const groupRef = useRef<Group>(null);
  const matsRef = useRef<MeshStandardMaterial[]>([]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const v = stateRef.current.handsVisible;
    groupRef.current.visible = v > 0.001;
    if (groupRef.current.visible) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.2;
      for (const m of matsRef.current) m.opacity = v;
    }
  });

  const collect = (m: MeshStandardMaterial | null): void => {
    if (m && !matsRef.current.includes(m)) matsRef.current.push(m);
  };

  return (
    <group ref={groupRef} position={[1.6, 1.4, 0.3]}>
      {/* Palm */}
      <mesh castShadow>
        <boxGeometry args={[0.45, 0.55, 0.18]} />
        <meshStandardMaterial ref={collect} color="#c89571" flatShading transparent />
      </mesh>
      {/* Fingers — three raised */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[-0.13 + i * 0.13, 0.45, 0]}>
          <boxGeometry args={[0.1, 0.34, 0.16]} />
          <meshStandardMaterial ref={collect} color="#c89571" flatShading transparent />
        </mesh>
      ))}
      {/* Thumb */}
      <mesh castShadow position={[-0.25, 0.05, 0.05]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.12, 0.3, 0.15]} />
        <meshStandardMaterial ref={collect} color="#a07449" flatShading transparent />
      </mesh>
      {/* Landmark dots (mint) — like MediaPipe overlays */}
      {[
        [-0.13, 0.6, 0.1],
        [0, 0.6, 0.1],
        [0.13, 0.6, 0.1],
        [-0.13, 0.45, 0.1],
        [0, 0.45, 0.1],
        [0.13, 0.45, 0.1],
        [0, 0.2, 0.1],
        [-0.2, 0.2, 0.1],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial
            ref={collect}
            color="#5af3d0"
            emissive="#5af3d0"
            emissiveIntensity={1}
            transparent
          />
        </mesh>
      ))}
      {/* Curved-arrow particles flowing right (toward voice output) */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.4 + i * 0.2, 0.6 - i * 0.05, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            ref={collect}
            color="#ffd29a"
            emissive="#ffd29a"
            emissiveIntensity={0.8}
            transparent
            opacity={0.7 - i * 0.12}
          />
        </mesh>
      ))}
    </group>
  );
}
