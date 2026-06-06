import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { VoxModel } from '../voxel/VoxModel';
import type { SceneState } from '../lib/state';

const V = '/vox/';

// vox heights for ground-sitting lift (models are centered): y = h*scale/2
const MOUNTAIN_H = 30;
const PALM_H = 22;
const LAMP_H = 16;
const CAR_H = 5;

// Tower variants: [url, height(vox)]. Mixed across the skyline for variety.
const TOWER_VARIANTS: Array<[string, number]> = [
  ['tower.vox', 54], // slim Art Deco spire
  ['tower_block.vox', 30], // mid-rise block
  ['tower_step.vox', 46], // stepped wedding-cake
];

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

// ----- The Marine Drive coast (single source of truth) -----
// Beach centre-line x at depth z. Ocean is at x > coastX (the +x sea side);
// land (city + college) is at x < coastX. The bay bulges seaward mid-curve.
const Z_NEAR = 2;
const Z_FAR = -72;
function coastX(z: number): number {
  const t = (z - Z_NEAR) / (Z_FAR - Z_NEAR); // 0..1 along the coast
  return 13 + 11 * Math.sin(t * Math.PI); // 13..24, bulging to 24 mid-bay
}

// Waterfront skyline: towers on the land side of the coast.
// [x, z, scale, rotY, variantIndex]
const TOWERS: Array<[number, number, number, number, number]> = (() => {
  const r = rng(1337);
  const out: Array<[number, number, number, number, number]> = [];
  for (let i = 0; i < 64; i++) {
    const z = -6 - r() * 64; // -6..-70
    const cx = coastX(z);
    const x = -52 + r() * (cx - 8 - -52); // land side, clear of the beach
    if (Math.abs(x) < 9 && z > -17) continue; // keep the college + path clear
    const nearCoast = (cx - 8 - x) / 44; // 0 near beach .. 1 inland
    const s = 0.3 + r() * 0.12 + (1 - nearCoast) * 0.12; // taller toward the water
    const variant = Math.floor(r() * TOWER_VARIANTS.length);
    out.push([x, z, s, Math.floor(r() * 4) * 0.4, variant]);
  }
  return out;
})();

// Curved sand beach — banded shore tiles (sand->foam->shallow) tracking the
// coast. The shore tile's local +x is seaward; foam sits ~at the coast line.
const SHORE: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  for (let z = Z_NEAR; z >= Z_FAR; z -= 9) out.push([coastX(z) - 5, z]);
  return out;
})();

// Marine Drive promenade — lamps + palms + cars on the land edge of the beach.
const PROMENADE: Array<[number, number, number]> = (() => {
  const out: Array<[number, number, number]> = [];
  let i = 0;
  for (let z = Z_NEAR; z >= Z_FAR; z -= 3.2) out.push([coastX(z) - 7, z, i++]);
  return out;
})();

// Distant mountain ridge, beyond the bay. [x, z, scale]
const MOUNTAINS: Array<[number, number, number]> = (() => {
  const r = rng(99);
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i < 9; i++) {
    out.push([-66 + r() * 150, -82 - r() * 26, 0.6 + r() * 0.34]);
  }
  return out;
})();

// Cloud field. [x, y, z, scale]
const CLOUDS: Array<[number, number, number, number]> = (() => {
  const r = rng(7);
  const out: Array<[number, number, number, number]> = [];
  for (let i = 0; i < 22; i++) {
    out.push([-44 + r() * 120, 16 + r() * 13, -6 - r() * 60, 0.34 + r() * 0.22]);
  }
  for (let i = 0; i < 6; i++) {
    out.push([-14 + r() * 34, 44 + r() * 14, -4 + r() * 26, 0.5 + r() * 0.12]);
  }
  return out;
})();

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
        {/* Big ocean plane on the +x sea side (top sits at y~0). */}
        <VoxModel url={`${V}ocean.vox`} position={[78, -0.25, -28]} scale={0.62} />
        {/* Grass land on the -x side, ending around the coast. */}
        <VoxModel url={`${V}ground.vox`} position={[-26, 0, -32]} scale={0.4} />
        {/* Banded shore (sand -> foam -> shallow) tracking the coast. */}
        {SHORE.map(([x, z], i) => (
          <VoxModel key={`b${i}`} url={`${V}shore.vox`} position={[x, 0.2, z]} scale={0.6} />
        ))}
        {MOUNTAINS.map(([x, z, sc], i) => (
          <VoxModel
            key={`m${i}`}
            url={`${V}mountain.vox`}
            position={[x, (MOUNTAIN_H * sc) / 2, z]}
            scale={sc}
          />
        ))}
        {TOWERS.map(([x, z, sc, rot, vi], i) => {
          const [url, h] = TOWER_VARIANTS[vi];
          return (
            <VoxModel
              key={`t${i}`}
              url={`${V}${url}`}
              position={[x, (h * sc) / 2, z]}
              scale={sc}
              rotation={[0, rot, 0]}
            />
          );
        })}
        {/* Promenade: a lamp at every slot, palms alternating, a car every few. */}
        {PROMENADE.map(([x, z, i]) => {
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
                position={[x - 1.6, (PALM_H * palmS) / 2, z]}
                scale={palmS}
              />,
            );
          }
          if (i % 3 === 1) {
            const carS = 0.13;
            items.push(
              <VoxModel
                key={`c${i}`}
                url={`${V}car.vox`}
                position={[x + 2, (CAR_H * carS) / 2, z]}
                scale={carS}
                rotation={[0, Math.PI / 2, 0]}
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
