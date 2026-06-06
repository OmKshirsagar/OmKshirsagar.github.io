import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { VoxModel } from '../voxel/VoxModel';
import type { SceneState } from '../lib/state';

const V = '/vox/';

// vox heights for ground-sitting lift (models are centered): y = h*scale/2
const TOWER_H = 46;
const MOUNTAIN_H = 30;
const PALM_H = 18;
const LAMP_H = 16;
const CAR_H = 5;

/** Deterministic PRNG (mulberry32) so the city is identical every render. */
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dense skyline: towers fill the city behind/around the college (origin),
// avoiding the immediate college footprint. [x, z, scale, rotY]
const TOWERS: Array<[number, number, number, number]> = (() => {
  const r = rng(1337);
  const out: Array<[number, number, number, number]> = [];
  for (let i = 0; i < 52; i++) {
    const x = -40 + r() * 58; // -40..18 (city to the left/centre of the bay)
    const z = -12 - r() * 50; // -12..-62
    if (Math.abs(x) < 9 && z > -17) continue; // keep the college + path clear
    const depth = (-z - 12) / 50; // 0..1, deeper = taller
    const s = 0.26 + r() * 0.12 + depth * 0.16;
    out.push([x, z, s, Math.floor(r() * 4) * 0.4]);
  }
  return out;
})();

// Distant mountain ridge. [x, z, scale]
const MOUNTAINS: Array<[number, number, number]> = (() => {
  const r = rng(99);
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i < 8; i++) {
    out.push([-62 + r() * 124, -68 - r() * 28, 0.6 + r() * 0.32]);
  }
  return out;
})();

// Marine Drive arc — the "Queen's Necklace" curve hugging the bay on the +x
// (sea) side. Concave toward the city. [x, z, angleRad, index]
const ARC_CX = 58;
const ARC_CZ = -28;
const ARC_R = 40;
const PROMENADE: Array<[number, number, number, number]> = (() => {
  const out: Array<[number, number, number, number]> = [];
  const N = 28;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const ang = ((118 + t * 124) * Math.PI) / 180;
    out.push([ARC_CX + ARC_R * Math.cos(ang), ARC_CZ + ARC_R * Math.sin(ang), ang, i]);
  }
  return out;
})();

// Cloud field. [x, y, z, scale] — high-altitude cover + low "dive" clouds.
const CLOUDS: Array<[number, number, number, number]> = (() => {
  const r = rng(7);
  const out: Array<[number, number, number, number]> = [];
  for (let i = 0; i < 22; i++) {
    out.push([-44 + r() * 88, 15 + r() * 12, -10 - r() * 56, 0.34 + r() * 0.2]);
  }
  // low dive-through clouds near the descent path (camera comes from high +y/+z)
  for (let i = 0; i < 7; i++) {
    out.push([-14 + r() * 30, 44 + r() * 14, -6 + r() * 26, 0.5 + r() * 0.12]);
  }
  return out;
})();

// Ocean slabs covering the +x (sea) side. [x, y, z, scale]
const OCEAN: Array<[number, number, number, number]> = [
  [70, 0.05, -10, 0.22], [70, 0.05, -55, 0.22], [95, 0.05, -32, 0.22],
];

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
        {/* large land slab so the skyline + college sit on ground */}
        <VoxModel url={`${V}ground.vox`} position={[-14, 0, -44]} scale={0.46} />
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
        {TOWERS.map(([x, z, sc, rot], i) => (
          <VoxModel
            key={`t${i}`}
            url={`${V}tower.vox`}
            position={[x, (TOWER_H * sc) / 2, z]}
            scale={sc}
            rotation={[0, rot, 0]}
          />
        ))}
        {/* Marine Drive promenade: street lamps everywhere, palms alternating,
            a car on the road every few slots. */}
        {PROMENADE.map(([x, z, ang, i]) => {
          const lampS = 0.13;
          const items = [
            <VoxModel
              key={`l${i}`}
              url={`${V}streetlamp.vox`}
              position={[x, (LAMP_H * lampS) / 2, z]}
              scale={lampS}
            />,
          ];
          if (i % 2 === 0) {
            const palmS = 0.14;
            items.push(
              <VoxModel
                key={`p${i}`}
                url={`${V}palm.vox`}
                position={[x - 1.4, (PALM_H * palmS) / 2, z]}
                scale={palmS}
              />,
            );
          }
          if (i % 4 === 1) {
            const carS = 0.13;
            // car sits on the road, just toward the sea side (+x along the arc normal)
            items.push(
              <VoxModel
                key={`c${i}`}
                url={`${V}car.vox`}
                position={[x + 1.6, (CAR_H * carS) / 2, z]}
                scale={carS}
                rotation={[0, ang + Math.PI / 2, 0]}
              />,
            );
          }
          return <group key={`pr${i}`}>{items}</group>;
        })}
      </group>

      <group ref={clouds}>
        {CLOUDS.map(([x, y, z, sc], i) => (
          <VoxModel key={`c${i}`} url={`${V}cloud.vox`} position={[x, y, z]} scale={sc} />
        ))}
      </group>
    </group>
  );
}
