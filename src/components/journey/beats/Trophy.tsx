import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';
import type { SceneState } from '../lib/state';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

const C = {
  gold: '#ffd29a',
  goldShade: '#ff9460',
  goldRim: '#b35a3a',
  base: '#7a4a32',
} as const;

/**
 * Beat 02 hero prop: a chunky voxel trophy that materializes above Om's head
 * when sceneState.trophyVisible > 0. Descends from above and gently rotates.
 *
 * Visibility is driven by writing transparent material opacity from the
 * stateRef, so we can fade in / out smoothly via GSAP without re-mounting.
 * Position interpolates from y=+1.5 (above visible) to y=0 (rest) using the
 * trophyVisible value as a t value.
 */
export default function Trophy({ stateRef }: Props) {
  const groupRef = useRef<Group>(null);
  const matsRef = useRef<MeshStandardMaterial[]>([]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const v = stateRef.current.trophyVisible; // 0..1

    // Hide entirely when off — also keeps shadows from rendering
    groupRef.current.visible = v > 0.001;
    if (!groupRef.current.visible) return;

    // Slow rotation for "shimmer" feel during hero hold
    groupRef.current.rotation.y += delta * 0.4;

    // Descend from above as v rises
    const descent = (1 - v) * 1.2;
    groupRef.current.position.y = 2.8 + descent;

    // Fade every material in unison
    for (const m of matsRef.current) {
      m.opacity = v;
    }
  });

  const collect = (m: MeshStandardMaterial | null): void => {
    if (m && !matsRef.current.includes(m)) matsRef.current.push(m);
  };

  return (
    <group ref={groupRef} position={[0, 2.8, 0]}>
      {/* ===== Cup (the wide bowl-shape at the top) ===== */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.32, 0.5]} />
        <meshStandardMaterial
          ref={collect}
          color={C.gold}
          metalness={0.55}
          roughness={0.25}
          emissive={C.gold}
          emissiveIntensity={0.18}
          transparent
          flatShading
        />
      </mesh>
      {/* Inner cup colour band (slightly darker rim) */}
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[0.46, 0.06, 0.46]} />
        <meshStandardMaterial
          ref={collect}
          color={C.goldRim}
          metalness={0.5}
          roughness={0.3}
          transparent
          flatShading
        />
      </mesh>

      {/* ===== Handles (left + right) ===== */}
      <mesh position={[-0.32, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.22, 0.16]} />
        <meshStandardMaterial
          ref={collect}
          color={C.gold}
          metalness={0.55}
          roughness={0.25}
          transparent
          flatShading
        />
      </mesh>
      <mesh position={[0.32, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.22, 0.16]} />
        <meshStandardMaterial
          ref={collect}
          color={C.goldShade}
          metalness={0.55}
          roughness={0.25}
          transparent
          flatShading
        />
      </mesh>

      {/* ===== Stem ===== */}
      <mesh position={[0, -0.22, 0]} castShadow>
        <boxGeometry args={[0.12, 0.16, 0.12]} />
        <meshStandardMaterial
          ref={collect}
          color={C.goldShade}
          metalness={0.5}
          roughness={0.3}
          transparent
          flatShading
        />
      </mesh>

      {/* ===== Base ===== */}
      <mesh position={[0, -0.36, 0]} castShadow>
        <boxGeometry args={[0.38, 0.1, 0.38]} />
        <meshStandardMaterial
          ref={collect}
          color={C.base}
          metalness={0.2}
          roughness={0.5}
          transparent
          flatShading
        />
      </mesh>

      {/* Subtle glow plate beneath (gives the descending trophy a halo) */}
      <pointLight
        position={[0, 0, 0]}
        intensity={1.2}
        color={C.gold}
        distance={3}
        decay={2}
      />
    </group>
  );
}
