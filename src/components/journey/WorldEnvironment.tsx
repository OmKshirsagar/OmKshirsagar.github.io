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
const DUSK_KEY = new THREE.Color('#ffdcab'); // warm golden light on surfaces
const INTERIOR_BG = new THREE.Color('#140d07'); // dark warm room (lamp does the lighting)
const INTERIOR_AMB = new THREE.Color('#3a2410');
const DAY_BG = new THREE.Color('#aacdec'); // bright blue daytime sky (Deloitte day)
const DAY_AMB = new THREE.Color('#667890');
const DAY_KEY = new THREE.Color('#fffaf2');

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
    const i = stateRef.current.interior; // 0 = outdoor, 1 = dark warm room
    const d = stateRef.current.dayBlue;  // 0 = (warmth-based), 1 = bright blue day
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(SPACE_BG).lerp(DUSK_BG, w).lerp(DAY_BG, d).lerp(INTERIOR_BG, i);
    }
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(SPACE_BG).lerp(DUSK_BG, w).lerp(DAY_BG, d).lerp(INTERIOR_BG, i);
      // Light haze only — keep the city + ocean clear (was a thick orange soup).
      scene.fog.near = THREE.MathUtils.lerp(45, 55, w);
      scene.fog.far = THREE.MathUtils.lerp(240, 230, w);
      // Indoors: pull fog in tight so the surrounding void reads as a dark room.
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, 8, i);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, 26, i);
    }
    if (ambient.current) {
      ambient.current.color.copy(SPACE_AMB).lerp(DUSK_AMB, w).lerp(DAY_AMB, d).lerp(INTERIOR_AMB, i);
      ambient.current.intensity = THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.35, 0.42, w), 0.55, d),
        0.22, i,
      );
    }
    if (key.current) {
      key.current.color.copy(SPACE_KEY).lerp(DUSK_KEY, w).lerp(DAY_KEY, d);
      key.current.intensity = THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(THREE.MathUtils.lerp(2.0, 2.7, w), 3.1, d),
        0.12, i,
      );
    }
    if (rim.current) {
      rim.current.intensity = THREE.MathUtils.lerp(0, 1.2, w) * (1 - i) * (1 - d);
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
