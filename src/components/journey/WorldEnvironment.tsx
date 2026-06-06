import { useRef, useEffect, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { DirectionalLight, AmbientLight } from 'three';
import type { SceneState } from './lib/state';

/**
 * Owns the scene background, fog and light rig, and lerps them from
 * "deep space" (skyWarmth 0) to "golden-hour dusk" (skyWarmth 1) every frame
 * based on sceneState.skyWarmth. This is what lets the photoreal Earth opener
 * and the warm voxel ground scene share one continuous canvas.
 */
const SPACE_BG = new THREE.Color('#060810');
const DUSK_BG = new THREE.Color('#e7d6b4'); // light hazy gold (lets ocean read blue + towers white)
const SPACE_AMB = new THREE.Color('#20243a');
const DUSK_AMB = new THREE.Color('#3a3a44');
const SPACE_KEY = new THREE.Color('#fff6ec');
const DUSK_KEY = new THREE.Color('#ffe9cf'); // warm but not orange

export default function WorldEnvironment({
  stateRef,
}: {
  stateRef: MutableRefObject<SceneState>;
}) {
  const scene = useThree((s) => s.scene);
  const ambient = useRef<AmbientLight>(null);
  const key = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);

  // Own the background + fog as mutable objects we lerp each frame.
  useEffect(() => {
    scene.background = SPACE_BG.clone();
    scene.fog = new THREE.Fog(SPACE_BG.clone(), 40, 220);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    const w = stateRef.current.skyWarmth;
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(SPACE_BG).lerp(DUSK_BG, w);
    }
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(SPACE_BG).lerp(DUSK_BG, w);
      // Light haze only — keep the city + ocean clear (was a thick orange soup).
      scene.fog.near = THREE.MathUtils.lerp(45, 55, w);
      scene.fog.far = THREE.MathUtils.lerp(240, 230, w);
    }
    if (ambient.current) {
      ambient.current.color.copy(SPACE_AMB).lerp(DUSK_AMB, w);
      ambient.current.intensity = THREE.MathUtils.lerp(0.35, 0.75, w);
    }
    if (key.current) {
      key.current.color.copy(SPACE_KEY).lerp(DUSK_KEY, w);
      key.current.intensity = THREE.MathUtils.lerp(2.0, 2.2, w);
    }
    if (rim.current) {
      rim.current.intensity = THREE.MathUtils.lerp(0, 1.2, w);
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.35} color="#20243a" />
      <directionalLight
        ref={key}
        position={[6, 5, 8]}
        intensity={2.0}
        color="#fff6ec"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.5} color="#6c7c9c" />
      <directionalLight ref={rim} position={[-4, 6, -10]} intensity={0} color="#ff9460" />
    </>
  );
}
