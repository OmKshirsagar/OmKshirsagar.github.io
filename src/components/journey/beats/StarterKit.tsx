import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';
import type { SceneState } from '../lib/state';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Beats 03 + 04 prop: the FastAPI Starter Kit visualised as a stacked
 * 3-layer puzzle floating to the left of Om — matches the home-page
 * illustration: FastAPI base (cream/gold), middle row (MCP / AUTH / DB),
 * Observability top layer (warm cream).
 *
 * Beat 03 fades the whole stack in. Beat 04 ("The Multiplier") fades in
 * 12 ghost copies fanning out behind it.
 */
export default function StarterKit({ stateRef }: Props) {
  const groupRef = useRef<Group>(null);
  const replicasRef = useRef<Group>(null);
  const matsRef = useRef<MeshStandardMaterial[]>([]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const v = stateRef.current.starterKitVisible;
    const r = stateRef.current.replicasVisible;

    groupRef.current.visible = v > 0.001;
    if (groupRef.current.visible) {
      groupRef.current.rotation.y += delta * 0.15;
      for (const m of matsRef.current) m.opacity = v;
    }

    if (replicasRef.current) {
      replicasRef.current.visible = r > 0.001;
      // Pulse each replica's scale based on r so they animate in
      replicasRef.current.scale.setScalar(0.6 + r * 0.4);
    }
  });

  const collect = (m: MeshStandardMaterial | null): void => {
    if (m && !matsRef.current.includes(m)) matsRef.current.push(m);
  };

  return (
    <>
      {/* Main stack, floats to Om's left */}
      <group ref={groupRef} position={[-2.0, 1.5, -0.3]} scale={0.6}>
        {/* OBS top */}
        <mesh castShadow position={[0, 1.0, 0]}>
          <boxGeometry args={[2.4, 0.5, 0.8]} />
          <meshStandardMaterial ref={collect} color="#ffd29a" flatShading transparent roughness={0.6} />
        </mesh>
        {/* Middle row: MCP / AUTH / DB */}
        <mesh castShadow position={[-0.85, 0.4, 0]}>
          <boxGeometry args={[0.7, 0.5, 0.8]} />
          <meshStandardMaterial ref={collect} color="#5af3d0" flatShading transparent roughness={0.65} />
        </mesh>
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[0.7, 0.5, 0.8]} />
          <meshStandardMaterial ref={collect} color="#ffaa78" flatShading transparent roughness={0.65} />
        </mesh>
        <mesh castShadow position={[0.85, 0.4, 0]}>
          <boxGeometry args={[0.7, 0.5, 0.8]} />
          <meshStandardMaterial ref={collect} color="#8a6da0" flatShading transparent roughness={0.65} />
        </mesh>
        {/* FastAPI base */}
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[2.4, 0.5, 0.8]} />
          <meshStandardMaterial
            ref={collect}
            color="#ff9460"
            flatShading
            transparent
            roughness={0.55}
            emissive="#ff9460"
            emissiveIntensity={0.1}
          />
        </mesh>
      </group>

      {/* 12 ghost replicas fan out behind the original — Beat 04 */}
      <group ref={replicasRef} position={[-2.0, 1.5, -0.3]} visible={false}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = -1.2 + (i / 11) * 2.4; // -1.2..+1.2 rad, fans behind
          const dist = 1.8 + (i % 3) * 0.4;
          const x = Math.sin(angle) * dist;
          const z = -Math.cos(angle) * dist;
          return (
            <mesh
              key={i}
              position={[x, (i % 4) * 0.15 - 0.2, z]}
              scale={[0.5, 0.5, 0.5]}
            >
              <boxGeometry args={[2.4, 1.6, 0.8]} />
              <meshStandardMaterial
                color="#ffaa78"
                flatShading
                transparent
                opacity={0.18}
                roughness={0.7}
              />
            </mesh>
          );
        })}
      </group>
    </>
  );
}
