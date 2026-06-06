import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';
import type { SceneState } from '../lib/state';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Beats 05–08: a voxel telephone receiver floats to Om's right (Voice AI
 * pilot begins, then live), and a 3-node pipeline chain (ACS → GPT → SEARCH)
 * appears in beat 06.
 *
 * Beat 08 ("Generalization / white-label") fades a "BRANDED" overlay tile —
 * driven by sceneState.whitelabelDim — to suggest the branding being stripped.
 */
export default function PhoneAndPipeline({ stateRef }: Props) {
  const phoneRef = useRef<Group>(null);
  const pipelineRef = useRef<Group>(null);
  const phoneMats = useRef<MeshStandardMaterial[]>([]);
  const pipeMats = useRef<MeshStandardMaterial[]>([]);

  useFrame(({ clock }) => {
    const s = stateRef.current;

    if (phoneRef.current) {
      const v = s.phoneVisible;
      phoneRef.current.visible = v > 0.001;
      if (phoneRef.current.visible) {
        // Subtle bobbing — like the receiver is "ringing"
        const bob = Math.sin(clock.elapsedTime * 3) * 0.04 * v;
        phoneRef.current.position.y = 1.5 + bob;
        for (const m of phoneMats.current) m.opacity = v;
      }
    }

    if (pipelineRef.current) {
      const v = s.pipelineVisible;
      pipelineRef.current.visible = v > 0.001;
      if (pipelineRef.current.visible) {
        for (const m of pipeMats.current) m.opacity = v;
      }
    }
  });

  const collectPhone = (m: MeshStandardMaterial | null): void => {
    if (m && !phoneMats.current.includes(m)) phoneMats.current.push(m);
  };
  const collectPipe = (m: MeshStandardMaterial | null): void => {
    if (m && !pipeMats.current.includes(m)) pipeMats.current.push(m);
  };

  return (
    <>
      {/* ===== Voxel phone receiver floating to Om's right ===== */}
      <group ref={phoneRef} position={[2.0, 1.5, -0.3]}>
        {/* Earpiece */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <boxGeometry args={[0.55, 0.3, 0.4]} />
          <meshStandardMaterial ref={collectPhone} color="#5a4870" flatShading transparent />
        </mesh>
        {/* Handle */}
        <mesh castShadow position={[0, 0.05, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[1.4, 0.18, 0.25]} />
          <meshStandardMaterial ref={collectPhone} color="#3a3450" flatShading transparent />
        </mesh>
        {/* Mouthpiece */}
        <mesh castShadow position={[0.65, -0.55, 0]}>
          <boxGeometry args={[0.55, 0.3, 0.4]} />
          <meshStandardMaterial ref={collectPhone} color="#5a4870" flatShading transparent />
        </mesh>
        {/* Speaker dots (top) */}
        <mesh position={[-0.12, 0.62, 0.21]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial ref={collectPhone} color="#ffd29a" flatShading transparent />
        </mesh>
        <mesh position={[0.12, 0.62, 0.21]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial ref={collectPhone} color="#ffd29a" flatShading transparent />
        </mesh>
        {/* Sound waves curving outward */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.6 + i * 0.18, -0.5 - i * 0.15]} rotation={[0.4, 0, 0]}>
            <torusGeometry args={[0.4 + i * 0.18, 0.018, 8, 24, Math.PI]} />
            <meshStandardMaterial
              ref={collectPhone}
              color="#ffaa78"
              flatShading
              transparent
              emissive="#ffaa78"
              emissiveIntensity={0.4}
              opacity={0.7 - i * 0.15}
            />
          </mesh>
        ))}
      </group>

      {/* ===== Pipeline chain: 3 nodes behind/above Om ===== */}
      <group ref={pipelineRef} position={[0, 2.6, -1.5]}>
        {(['ACS', 'GPT', 'SEARCH'] as const).map((_, i) => {
          const x = (i - 1) * 1.2;
          const color = i === 0 ? '#ffaa78' : i === 1 ? '#5af3d0' : '#8a6da0';
          return (
            <group key={i} position={[x, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.6, 0.6, 0.6]} />
                <meshStandardMaterial
                  ref={collectPipe}
                  color={color}
                  flatShading
                  transparent
                  emissive={color}
                  emissiveIntensity={0.25}
                />
              </mesh>
              {/* Connector segment between nodes (skip after the last one) */}
              {i < 2 && (
                <mesh position={[0.6, 0, 0]}>
                  <boxGeometry args={[0.6, 0.06, 0.06]} />
                  <meshStandardMaterial
                    ref={collectPipe}
                    color="#ffd29a"
                    flatShading
                    transparent
                    emissive="#ffd29a"
                    emissiveIntensity={0.6}
                  />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
    </>
  );
}
