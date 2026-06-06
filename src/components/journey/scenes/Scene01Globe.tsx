import { Suspense, useEffect, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Group, Mesh, MeshStandardMaterial, MeshBasicMaterial } from 'three';
import type { SceneState } from '../lib/state';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

const GLOBE_RADIUS = 2;

// Mumbai: 19.07°N, 72.87°E
const MUMBAI_LAT = 19.07;
const MUMBAI_LON = 72.87;

/**
 * Map a real-world (lat, lon) onto a Three.js SphereGeometry that uses the
 * standard equirectangular Blue Marble texture.
 *
 * Three.js SphereGeometry vertex at (theta, phi) is:
 *   x = -r · cos(theta) · sin(phi)
 *   y =  r · cos(phi)
 *   z =  r · sin(theta) · sin(phi)
 *
 * The texture's u=0 lives at theta=0, which on the geometry is the -X axis.
 * In equirectangular Earth maps u=0 means lon = -180° (Pacific seam).
 * Therefore lon = 0° (Greenwich) lives at theta = π, which on the geometry
 * is the +X axis.
 *
 * Putting that all together, real-world (lat, lon) maps to:
 *   x =  r · cos(lat) · cos(lon)
 *   y =  r · sin(lat)
 *   z = -r · cos(lat) · sin(lon)
 *
 * Verified: Greenwich/equator → (+r, 0, 0); Mumbai (lat 19.07, lon 72.87)
 * lands at ≈ (0.56, 0.65, -1.80) which exactly matches where the texture
 * paints Mumbai (Maharashtra coast).
 */
function latLonToXYZ(lat: number, lon: number, radius = GLOBE_RADIUS): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = -radius * Math.cos(latRad) * Math.sin(lonRad);
  return [x, y, z];
}

/**
 * Resting rotation of the globe so Mumbai faces the camera (+Z direction).
 *
 * Derivation — using Three.js's Y-rotation matrix
 *   new_x = local_x·cos(α) + local_z·sin(α)
 *   new_z = -local_x·sin(α) + local_z·cos(α)
 *
 *  Mumbai's local position on the unrotated sphere is
 *      (cos(lat)·cos(lon)·r, sin(lat)·r, -cos(lat)·sin(lon)·r)
 *
 *  We want new_x = 0 (Mumbai horizontally centred) AND new_z > 0 (Mumbai on
 *  the visible front hemisphere). Plugging in:
 *
 *     cos(lon)·cos(α) − sin(lon)·sin(α) = 0
 *     cos(lon + α) = 0
 *     lon + α = π/2  →  α = π/2 − lon   (gives new_z negative — Mumbai BEHIND)
 *     lon + α = 3π/2 →  α = 3π/2 − lon  (gives new_z positive — Mumbai IN FRONT ✓)
 *
 *  Exported so the timeline knows the exact resting value to tween to.
 */
export const MUMBAI_FACING_ROTATION_Y =
  (3 * Math.PI) / 2 - (MUMBAI_LON * Math.PI) / 180;

export default function Scene01Globe({ stateRef }: Props) {
  return (
    <Suspense fallback={null}>
      <Globe stateRef={stateRef} />
      {/* Star field — full sky of distant background stars */}
      <Stars
        radius={80}
        depth={30}
        count={4000}
        factor={3}
        saturation={0}
        fade
        speed={0.4}
      />
    </Suspense>
  );
}

function Globe({ stateRef }: Props) {
  const groupRef = useRef<Group>(null);
  const fadeMats = useRef<(MeshStandardMaterial | MeshBasicMaterial)[]>([]);

  const [earthMap, bumpMap] = useTexture([
    '/textures/earth-blue-marble.jpg',
    '/textures/earth-topology.png',
  ]);
  // Crisp colour in linear space
  earthMap.colorSpace = THREE.SRGBColorSpace;
  earthMap.anisotropy = 4;

  useFrame(() => {
    if (!groupRef.current) return;
    const s = stateRef.current;
    groupRef.current.visible = s.globeVisible > 0.001;
    if (!groupRef.current.visible) return;

    // Direct rotation from timeline-driven state — no race, no ease lag.
    groupRef.current.rotation.y = s.globeRotationY;

    // Fade the whole scene with globeVisible
    for (const m of fadeMats.current) m.opacity = s.globeVisible;
  });

  const collect = (m: MeshStandardMaterial | MeshBasicMaterial | null): void => {
    if (m && !fadeMats.current.includes(m)) fadeMats.current.push(m);
  };

  return (
    <group ref={groupRef} position={[0, 1.6, 0]}>
      {/* ===== Earth itself ===== */}
      <mesh castShadow>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial
          ref={collect}
          map={earthMap}
          bumpMap={bumpMap}
          bumpScale={0.04}
          roughness={0.7}
          metalness={0.02}
          transparent
        />
      </mesh>

      {/* No atmosphere shells — they read as a hard cyan ring when drawn
          with flat material on BackSide. The starfield supplies enough
          space atmosphere on its own. We can revisit with a proper
          fresnel-falloff shader later if we want a real atmosphere glow. */}

      {/* ===== Mumbai pin (elegant sonar-ping marker) ===== */}
      <MumbaiPin
        position={latLonToXYZ(MUMBAI_LAT, MUMBAI_LON, GLOBE_RADIUS + 0.005)}
        onMaterial={collect}
      />
    </group>
  );
}

/**
 * Elegant Mumbai marker — a tiny bright core sitting on the sphere surface
 * with two concentric pulse rings that radiate outward and fade as they
 * expand. Like a sonar ping. No vertical beam (was reading as clunky).
 *
 * The whole group is oriented so that the ring meshes lie *tangent* to the
 * sphere surface — accomplished with lookAt(center) since Three.js objects
 * point their -Z toward the lookAt target by default, putting the rings'
 * XY plane flush against the surface.
 */
function MumbaiPin({
  position,
  onMaterial,
}: {
  position: [number, number, number];
  onMaterial: (m: MeshStandardMaterial | MeshBasicMaterial | null) => void;
}) {
  const groupRef = useRef<Group>(null);
  const ring1Ref = useRef<Mesh>(null);
  const ring2Ref = useRef<Mesh>(null);
  const ring1MatRef = useRef<MeshBasicMaterial | null>(null);
  const ring2MatRef = useRef<MeshBasicMaterial | null>(null);
  const coreRef = useRef<Mesh>(null);
  const coreMatRef = useRef<MeshStandardMaterial | null>(null);

  // Once on mount, orient the group's local +Z axis radially OUTWARD from
  // the sphere centre so the pulse rings lie tangent to the surface.
  // Three.js lookAt(target) points the object's -Z at the target, so
  // calling lookAt(0,0,0) makes +Z point away from origin — outward.
  useEffect(() => {
    if (groupRef.current) groupRef.current.lookAt(0, 0, 0);
  }, []);

  useFrame(() => {
    const t = performance.now() * 0.001;

    // Ring 1 — slow outward pulse
    if (ring1Ref.current && ring1MatRef.current) {
      const p = (t * 0.6) % 1; // 0..1, ~1.7s cycle
      ring1Ref.current.scale.setScalar(0.6 + p * 3.0);
      ring1MatRef.current.opacity = (1 - p) * 0.75;
    }
    // Ring 2 — half-cycle offset for staggered look
    if (ring2Ref.current && ring2MatRef.current) {
      const p = ((t * 0.6) + 0.5) % 1;
      ring2Ref.current.scale.setScalar(0.6 + p * 3.0);
      ring2MatRef.current.opacity = (1 - p) * 0.75;
    }
    // Core gently breathes
    if (coreRef.current && coreMatRef.current) {
      const breathe = 0.5 + 0.5 * Math.sin(t * 1.6);
      coreRef.current.scale.setScalar(1 + breathe * 0.25);
      coreMatRef.current.emissiveIntensity = 2.4 + breathe * 1.0;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Tiny bright core sphere (always visible, no orientation needed) */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshStandardMaterial
          ref={(m) => {
            coreMatRef.current = m;
            onMaterial(m);
          }}
          color="#fff5e8"
          emissive="#ffaa78"
          emissiveIntensity={3}
          transparent
          toneMapped={false}
        />
      </mesh>

      {/* Pulse ring 1 — warm cream, lies tangent to sphere */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[0.035, 0.05, 48]} />
        <meshBasicMaterial
          ref={(m) => {
            ring1MatRef.current = m;
            onMaterial(m);
          }}
          color="#ffd29a"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Pulse ring 2 — warmer orange, staggered */}
      <mesh ref={ring2Ref}>
        <ringGeometry args={[0.035, 0.05, 48]} />
        <meshBasicMaterial
          ref={(m) => {
            ring2MatRef.current = m;
            onMaterial(m);
          }}
          color="#ff9460"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
