import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { VoxModel } from '../voxel/VoxModel';
import type { SceneState } from '../lib/state';

const V = '/vox/';

// Asset heights (vox) for ground-sitting lift math (models are centered).
const TOWER_H = 46;
const MOUNTAIN_H = 30;

// Skyline towers behind/around the college (facade at z=-9). [x, z, scale]
const TOWERS: Array<[number, number, number]> = [
  [-22, -20, 0.34], [-14, -26, 0.4], [-26, -34, 0.46], [-10, -40, 0.5],
  [-18, -46, 0.42], [0, -30, 0.44], [8, -24, 0.36], [16, -30, 0.46],
  [24, -22, 0.34], [12, -40, 0.5], [22, -44, 0.44], [-4, -48, 0.48],
  [30, -34, 0.4], [-30, -44, 0.4], [4, -54, 0.46], [18, -54, 0.42],
];

// Distant mountain ridge. [x, z, scale]
const MOUNTAINS: Array<[number, number, number]> = [
  [-40, -72, 0.7], [-18, -82, 0.8], [6, -76, 0.75],
  [28, -84, 0.8], [48, -74, 0.7], [-58, -80, 0.65],
];

// Cloud field. [x, y, z, scale] — high-altitude + a few low "dive" clouds.
const CLOUDS: Array<[number, number, number, number]> = [
  [-20, 16, -10, 0.4], [10, 18, -20, 0.45], [-8, 20, -30, 0.35],
  [24, 17, -12, 0.4], [-30, 22, -34, 0.5], [0, 24, -44, 0.45],
  [16, 21, -40, 0.4], [-16, 19, -50, 0.45], [34, 20, -30, 0.4],
  [-38, 18, -20, 0.35], [8, 26, -58, 0.5], [28, 24, -50, 0.45],
  // low "dive-through" clouds near the descent path (camera comes from high +y/+z)
  [0, 50, 22, 0.6], [-14, 46, 10, 0.55], [13, 44, 15, 0.6],
  [6, 56, 4, 0.5], [-8, 52, -4, 0.55], [20, 48, 6, 0.5],
];

// Ocean slabs to the right (Marine Drive sea). [x, y, z, scale]
const OCEAN: Array<[number, number, number, number]> = [
  [42, 0.05, -22, 0.18], [42, 0.05, -56, 0.18],
];

/**
 * The voxel Mumbai context that surrounds the Jai Hind college scene:
 * a cloud field (cloudsVisible) and the city skyline + mountains + ocean
 * (cityVisible). Sits in the same world as SceneJaiHind so the camera can
 * dive from the clouds, fly over the skyline, then settle on the college.
 */
export default function SceneMumbai({
  stateRef,
}: {
  stateRef: MutableRefObject<SceneState>;
}) {
  const clouds = useRef<Group>(null);
  const city = useRef<Group>(null);

  useFrame(() => {
    const s = stateRef.current;
    if (clouds.current) clouds.current.visible = s.cloudsVisible > 0.01;
    if (city.current) city.current.visible = s.cityVisible > 0.01;
  });

  return (
    <group>
      <group ref={city}>
        {/* large land slab so the skyline + college sit on ground during flyover */}
        <VoxModel url={`${V}ground.vox`} position={[-12, 0, -44]} scale={0.42} />
        {OCEAN.map(([x, y, z, sc], i) => (
          <VoxModel key={`o${i}`} url={`${V}ocean.vox`} position={[x, y, z]} scale={sc} />
        ))}
        {MOUNTAINS.map(([x, z, sc], i) => (
          <VoxModel
            key={`m${i}`}
            url={`${V}mountain.vox`}
            position={[x, (MOUNTAIN_H * sc) / 2, z]}
            scale={sc}
          />
        ))}
        {TOWERS.map(([x, z, sc], i) => (
          <VoxModel
            key={`t${i}`}
            url={`${V}tower.vox`}
            position={[x, (TOWER_H * sc) / 2, z]}
            scale={sc}
            rotation={[0, (i % 4) * 0.4, 0]}
          />
        ))}
      </group>

      <group ref={clouds}>
        {CLOUDS.map(([x, y, z, sc], i) => (
          <VoxModel key={`c${i}`} url={`${V}cloud.vox`} position={[x, y, z]} scale={sc} />
        ))}
      </group>
    </group>
  );
}
