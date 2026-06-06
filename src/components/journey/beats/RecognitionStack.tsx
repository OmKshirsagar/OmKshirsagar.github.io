import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';
import type { SceneState } from '../lib/state';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Beat 11: a small vertical column of award medallions floating beside Om.
 * Top → bottom: 2 trophy discs (Outstanding × 2), 1 sparkle (Applause), 1
 * upward-arrow badge (Promotion). All gold/warm; pulse softly.
 */
export default function RecognitionStack({ stateRef }: Props) {
  const groupRef = useRef<Group>(null);
  const matsRef = useRef<MeshStandardMaterial[]>([]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const v = stateRef.current.recognitionVisible;
    groupRef.current.visible = v > 0.001;
    if (groupRef.current.visible) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.25;
      for (const m of matsRef.current) {
        m.opacity = v;
        m.emissiveIntensity = 0.3 + Math.sin(clock.elapsedTime * 1.5) * 0.15;
      }
    }
  });

  const collect = (m: MeshStandardMaterial | null): void => {
    if (m && !matsRef.current.includes(m)) matsRef.current.push(m);
  };

  return (
    <group ref={groupRef} position={[1.8, 1.4, -0.4]}>
      {/* 4 medallions stacked vertically with small gaps */}
      {[
        { color: '#ffd29a', emissive: '#ffd29a' }, // Outstanding 1
        { color: '#ffd29a', emissive: '#ffd29a' }, // Outstanding 2
        { color: '#ffaa78', emissive: '#ff9460' }, // Applause
        { color: '#5af3d0', emissive: '#5af3d0' }, // Promotion
      ].map((c, i) => (
        <mesh key={i} castShadow position={[0, 0.6 - i * 0.42, 0]}>
          <boxGeometry args={[0.5, 0.32, 0.16]} />
          <meshStandardMaterial
            ref={collect}
            color={c.color}
            emissive={c.emissive}
            emissiveIntensity={0.4}
            flatShading
            transparent
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
