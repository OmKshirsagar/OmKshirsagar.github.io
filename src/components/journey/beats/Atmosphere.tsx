import { Sparkles } from '@react-three/drei';
import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { SceneState } from '../lib/state';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Ambient particle field around the stage. Density / opacity tied to
 * sceneState.sparkleIntensity (1 by default; beats can dim it). Always
 * subtly present so the void never feels static.
 */
export default function Atmosphere({ stateRef }: Props) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    // Use scale.setScalar as a proxy for opacity since Sparkles material
    // is internal; very subtle scale lets us "dim" the effect.
    const v = stateRef.current.sparkleIntensity;
    groupRef.current.scale.setScalar(0.8 + v * 0.2);
  });

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>
      {/* Warm sparkles near the character */}
      <Sparkles
        count={60}
        scale={[6, 4, 6]}
        size={2.2}
        speed={0.25}
        opacity={0.85}
        color="#ffd29a"
      />
      {/* Distant orange dust further back */}
      <Sparkles
        count={40}
        scale={[12, 6, 12]}
        size={1.4}
        speed={0.12}
        opacity={0.5}
        color="#ff9460"
      />
    </group>
  );
}
