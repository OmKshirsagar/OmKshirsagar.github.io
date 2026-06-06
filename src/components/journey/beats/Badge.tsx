import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';
import type { SceneState } from '../lib/state';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Beat 12 (Today ★): a "SOFTWARE ENGINEER I" badge pins onto Om's shirt.
 * Rises into place from below as badgeVisible goes 0 → 1.
 */
export default function Badge({ stateRef }: Props) {
  const groupRef = useRef<Group>(null);
  const matsRef = useRef<MeshStandardMaterial[]>([]);

  useFrame(() => {
    if (!groupRef.current) return;
    const v = stateRef.current.badgeVisible;
    groupRef.current.visible = v > 0.001;
    if (groupRef.current.visible) {
      // Lift into place
      groupRef.current.position.y = 0.85 - (1 - v) * 0.6;
      groupRef.current.scale.setScalar(v);
      for (const m of matsRef.current) m.opacity = v;
    }
  });

  const collect = (m: MeshStandardMaterial | null): void => {
    if (m && !matsRef.current.includes(m)) matsRef.current.push(m);
  };

  return (
    <group ref={groupRef} position={[-0.25, 0.85, 0.21]}>
      {/* Lanyard ribbon (warm cream) */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.08, 0.4, 0.02]} />
        <meshStandardMaterial ref={collect} color="#ff9460" flatShading transparent />
      </mesh>
      {/* Badge card */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.3, 0.03]} />
        <meshStandardMaterial
          ref={collect}
          color="#fff5e8"
          flatShading
          transparent
          metalness={0.2}
          roughness={0.4}
          emissive="#ffd29a"
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Accent bar at top of card */}
      <mesh position={[0, 0.13, 0.02]}>
        <boxGeometry args={[0.4, 0.04, 0.005]} />
        <meshStandardMaterial ref={collect} color="#ff9460" flatShading transparent />
      </mesh>
      {/* "Photo" square */}
      <mesh position={[-0.12, 0, 0.02]}>
        <boxGeometry args={[0.12, 0.12, 0.005]} />
        <meshStandardMaterial ref={collect} color="#c89571" flatShading transparent />
      </mesh>
      {/* Three "text" lines */}
      <mesh position={[0.06, 0.04, 0.02]}>
        <boxGeometry args={[0.18, 0.02, 0.005]} />
        <meshStandardMaterial ref={collect} color="#1a1410" flatShading transparent />
      </mesh>
      <mesh position={[0.06, 0, 0.02]}>
        <boxGeometry args={[0.16, 0.015, 0.005]} />
        <meshStandardMaterial ref={collect} color="#888094" flatShading transparent />
      </mesh>
      <mesh position={[0.06, -0.04, 0.02]}>
        <boxGeometry args={[0.14, 0.015, 0.005]} />
        <meshStandardMaterial ref={collect} color="#888094" flatShading transparent />
      </mesh>
    </group>
  );
}
