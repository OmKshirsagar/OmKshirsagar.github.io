import { type MutableRefObject, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group, MeshStandardMaterial } from 'three';
import type { SceneState } from '../lib/state';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Scene 02 · Jai Hind College, Churchgate · 2024.
 *
 * Voxel-Om walks in from screen-left and ends centered in front of the
 * college façade. A graduation cap snaps onto his head, then a "CGPA 9.89"
 * card and a "Published Paper · JETIR" artifact float up beside him.
 *
 * All four sub-elements are gated on their own visibility flags in
 * sceneState so the timeline can fade them in / out independently. The cap
 * tracks the character's world position every frame so it follows Om when
 * he walks (and stays glued to his head as he scales up / down).
 */
export default function Scene02College({ stateRef }: Props) {
  const buildingRef = useRef<Group>(null);
  const buildingMatsRef = useRef<MeshStandardMaterial[]>([]);
  // Per-window emissive materials, animated independently for "the college
  // is alive" micro-animation (lights flickering on different phases).
  const windowMatsRef = useRef<MeshStandardMaterial[]>([]);
  const capRef = useRef<Group>(null);
  const capMatsRef = useRef<MeshStandardMaterial[]>([]);
  const cardRef = useRef<Group>(null);
  const cardMatsRef = useRef<MeshStandardMaterial[]>([]);
  const paperRef = useRef<Group>(null);
  const paperMatsRef = useRef<MeshStandardMaterial[]>([]);

  useFrame(({ clock }) => {
    const s = stateRef.current;
    const t = clock.elapsedTime;

    // ===== College building / courtyard =====
    if (buildingRef.current) {
      buildingRef.current.visible = s.collegeVisible > 0.001;
      if (buildingRef.current.visible) {
        for (const m of buildingMatsRef.current) m.opacity = s.collegeVisible;

        // Per-window micro-animation: each window pulses with a phase offset
        // derived from its index, so the building looks alive (lights flicker,
        // students inside moving). Phase uses small primes for nice irregularity.
        for (let i = 0; i < windowMatsRef.current.length; i++) {
          const w = windowMatsRef.current[i];
          if (!w) continue;
          const phase = (i * 1.7) % (Math.PI * 2);
          const speed = 0.9 + ((i * 0.13) % 0.6); // varies 0.9..1.5
          const pulse = 0.5 + 0.5 * Math.sin(t * speed + phase);
          // Occasional sharp flicker — when sin is near 1, kick intensity up
          const flicker = Math.max(0, Math.sin(t * 4 + i)) ** 8 * 0.4;
          w.emissiveIntensity = (0.35 + pulse * 0.55 + flicker) * s.collegeVisible;
        }
      }
    }

    // ===== Graduation cap (tracks character head) =====
    if (capRef.current) {
      capRef.current.visible = s.gradCapVisible > 0.001;
      if (capRef.current.visible) {
        // Head top sits at local y=2.28 inside the character group, so cap
        // sits at character_y + 2.32 * scale (just above the hair).
        capRef.current.position.set(
          s.characterX,
          s.characterY + 2.32 * s.characterScale,
          s.characterZ,
        );
        capRef.current.scale.setScalar(s.characterScale * s.gradCapVisible);
        for (const m of capMatsRef.current) m.opacity = s.gradCapVisible;
      }
    }

    // ===== CGPA card (floats to character's left, gentle bob) =====
    if (cardRef.current) {
      cardRef.current.visible = s.cgpaCardVisible > 0.001;
      if (cardRef.current.visible) {
        const bob = Math.sin(clock.elapsedTime * 1.4) * 0.04;
        cardRef.current.position.set(
          s.characterX - 1.3,
          s.characterY + 1.3 + bob,
          s.characterZ + 0.2,
        );
        cardRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.7) * 0.08;
        cardRef.current.scale.setScalar(s.cgpaCardVisible);
        for (const m of cardMatsRef.current) m.opacity = s.cgpaCardVisible;
      }
    }

    // ===== Research paper (floats to character's right, gentle bob) =====
    if (paperRef.current) {
      paperRef.current.visible = s.paperVisible > 0.001;
      if (paperRef.current.visible) {
        const bob = Math.cos(clock.elapsedTime * 1.4) * 0.04;
        paperRef.current.position.set(
          s.characterX + 1.3,
          s.characterY + 1.3 + bob,
          s.characterZ + 0.2,
        );
        paperRef.current.rotation.y = -Math.sin(clock.elapsedTime * 0.7) * 0.08;
        paperRef.current.scale.setScalar(s.paperVisible);
        for (const m of paperMatsRef.current) m.opacity = s.paperVisible;
      }
    }
  });

  const collectBuilding = (m: MeshStandardMaterial | null): void => {
    if (m && !buildingMatsRef.current.includes(m)) {
      m.transparent = true;
      buildingMatsRef.current.push(m);
    }
  };
  const collectWindow = (m: MeshStandardMaterial | null): void => {
    if (m) {
      collectBuilding(m); // window also fades with the building
      if (!windowMatsRef.current.includes(m)) windowMatsRef.current.push(m);
    }
  };
  const collectCap = (m: MeshStandardMaterial | null): void => {
    if (m && !capMatsRef.current.includes(m)) {
      m.transparent = true;
      capMatsRef.current.push(m);
    }
  };
  const collectCard = (m: MeshStandardMaterial | null): void => {
    if (m && !cardMatsRef.current.includes(m)) {
      m.transparent = true;
      cardMatsRef.current.push(m);
    }
  };
  const collectPaper = (m: MeshStandardMaterial | null): void => {
    if (m && !paperMatsRef.current.includes(m)) {
      m.transparent = true;
      paperMatsRef.current.push(m);
    }
  };

  return (
    <>
      {/* ========================================================== */}
      {/* JAI HIND COLLEGE BUILDING (Art-Deco-style façade)          */}
      {/* ========================================================== */}
      <group ref={buildingRef} position={[0, 0, -6]} visible={false}>
        {/* Main building block — wide cream Art-Deco wall */}
        <mesh position={[0, 2.3, 0]} receiveShadow castShadow>
          <boxGeometry args={[11, 4.6, 1.2]} />
          <meshStandardMaterial
            ref={collectBuilding}
            color="#e8d8b0"
            roughness={0.9}
          />
        </mesh>
        {/* Roof cornice — slightly darker band on top */}
        <mesh position={[0, 4.7, 0.05]}>
          <boxGeometry args={[11.3, 0.4, 1.3]} />
          <meshStandardMaterial ref={collectBuilding} color="#c8b890" roughness={0.85} />
        </mesh>
        {/* Lintel band above central entrance — Art Deco horizontal line */}
        <mesh position={[0, 2.0, 0.62]}>
          <boxGeometry args={[5, 0.08, 0.02]} />
          <meshStandardMaterial ref={collectBuilding} color="#a89870" roughness={0.7} />
        </mesh>
        {/* Window grid — 3 rows × 7 columns of glowing windows, each
            animating independently (handled in useFrame above). */}
        {Array.from({ length: 3 }).map((_, row) =>
          Array.from({ length: 7 }).map((_, col) => {
            const x = -4 + col * 1.35;
            const y = 1.05 + row * 1.25;
            // skip middle column of bottom row to make space for the entrance
            if (row === 0 && col === 3) return null;
            // Mix two window tints so the building doesn't look monochrome
            const warm = (row + col) % 3 === 0;
            return (
              <mesh key={`${row}-${col}`} position={[x, y, 0.61]}>
                <boxGeometry args={[0.55, 0.75, 0.04]} />
                <meshStandardMaterial
                  ref={collectWindow}
                  color={warm ? '#7a6440' : '#3a5a7a'}
                  emissive={warm ? '#ffd29a' : '#88a8c8'}
                  emissiveIntensity={0.6}
                  roughness={0.45}
                  transparent
                />
              </mesh>
            );
          }),
        )}
        {/* Central entrance arch — dark recess */}
        <mesh position={[0, 0.85, 0.6]}>
          <boxGeometry args={[1.4, 1.5, 0.05]} />
          <meshStandardMaterial ref={collectBuilding} color="#1a1410" roughness={0.8} />
        </mesh>
        {/* Entrance frame highlight */}
        <mesh position={[0, 1.65, 0.62]}>
          <boxGeometry args={[1.55, 0.1, 0.02]} />
          <meshStandardMaterial ref={collectBuilding} color="#a89870" />
        </mesh>
        {/* COLLEGE NAME SIGN — large board on top */}
        <Text
          position={[0, 5.2, 0.7]}
          fontSize={0.42}
          color="#1a1410"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
          fontWeight={700}
        >
          JAI HIND COLLEGE
        </Text>
        {/* Smaller subtitle */}
        <Text
          position={[0, 4.7, 0.7]}
          fontSize={0.16}
          color="#5a4a30"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
        >
          CHURCHGATE · MUMBAI · EST. 1948
        </Text>
        {/* Stone walkway leading up to the entrance */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2.8]} receiveShadow>
          <planeGeometry args={[3, 6]} />
          <meshStandardMaterial ref={collectBuilding} color="#a89870" roughness={1} />
        </mesh>
        {/* Lawn / garden — green panels on either side */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.005, 2.8]} receiveShadow>
          <planeGeometry args={[4.5, 6]} />
          <meshStandardMaterial ref={collectBuilding} color="#3a6a3a" roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.005, 2.8]} receiveShadow>
          <planeGeometry args={[4.5, 6]} />
          <meshStandardMaterial ref={collectBuilding} color="#3a6a3a" roughness={1} />
        </mesh>
      </group>

      {/* ========================================================== */}
      {/* GRADUATION CAP (tracks Om's head position)                 */}
      {/* ========================================================== */}
      <group ref={capRef} visible={false}>
        {/* Skullcap base */}
        <mesh position={[0, -0.06, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.36, 0.16, 16]} />
          <meshStandardMaterial ref={collectCap} color="#1a1410" roughness={0.85} />
        </mesh>
        {/* Square mortarboard top — flat black square */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.85, 0.04, 0.85]} />
          <meshStandardMaterial ref={collectCap} color="#1a1410" roughness={0.7} />
        </mesh>
        {/* Button on top */}
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial
            ref={collectCap}
            color="#ffd29a"
            emissive="#ffd29a"
            emissiveIntensity={0.4}
          />
        </mesh>
        {/* Tassel — hangs off the right corner */}
        <mesh position={[0.36, -0.1, 0.05]} rotation={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.025, 0.025, 0.32, 6]} />
          <meshStandardMaterial ref={collectCap} color="#ffd29a" roughness={0.7} />
        </mesh>
        {/* Tassel pom-pom at end */}
        <mesh position={[0.39, -0.27, 0.05]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial ref={collectCap} color="#ff9460" roughness={0.7} />
        </mesh>
      </group>

      {/* ========================================================== */}
      {/* CGPA CARD (floats to character's left)                     */}
      {/* ========================================================== */}
      <group ref={cardRef} visible={false}>
        {/* Card backing */}
        <mesh castShadow>
          <boxGeometry args={[1.0, 0.7, 0.05]} />
          <meshStandardMaterial
            ref={collectCard}
            color="#fff5e8"
            roughness={0.65}
          />
        </mesh>
        {/* Top accent stripe */}
        <mesh position={[0, 0.28, 0.026]}>
          <boxGeometry args={[1.0, 0.08, 0.005]} />
          <meshStandardMaterial
            ref={collectCard}
            color="#ff9460"
            emissive="#ff9460"
            emissiveIntensity={0.25}
          />
        </mesh>
        {/* Big CGPA number */}
        <Text
          position={[0, 0.04, 0.026]}
          fontSize={0.28}
          color="#1a1410"
          anchorX="center"
          anchorY="middle"
          fontWeight={800}
        >
          9.89
        </Text>
        {/* "/ 10" smaller next to it */}
        <Text
          position={[0.27, -0.01, 0.026]}
          fontSize={0.08}
          color="#888094"
          anchorX="left"
          anchorY="middle"
        >
          / 10
        </Text>
        {/* Label below */}
        <Text
          position={[0, -0.22, 0.026]}
          fontSize={0.058}
          color="#5a4a30"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          CGPA · BSc IT · 2024
        </Text>
      </group>

      {/* ========================================================== */}
      {/* RESEARCH PAPER (floats to character's right)               */}
      {/* ========================================================== */}
      <group ref={paperRef} visible={false}>
        {/* Paper backing */}
        <mesh castShadow>
          <boxGeometry args={[0.9, 1.15, 0.05]} />
          <meshStandardMaterial
            ref={collectPaper}
            color="#fffaf0"
            roughness={0.55}
          />
        </mesh>
        {/* Top banner */}
        <mesh position={[0, 0.48, 0.026]}>
          <boxGeometry args={[0.9, 0.2, 0.005]} />
          <meshStandardMaterial
            ref={collectPaper}
            color="#5a7e9a"
            emissive="#5a7e9a"
            emissiveIntensity={0.25}
          />
        </mesh>
        <Text
          position={[0, 0.48, 0.032]}
          fontSize={0.07}
          color="#fff5e8"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
          fontWeight={700}
        >
          PUBLISHED PAPER
        </Text>
        {/* Mock paragraph lines */}
        {[0.2, 0.05, -0.1, -0.25].map((y, i) => (
          <mesh key={i} position={[0, y, 0.026]}>
            <boxGeometry args={[0.7 - i * 0.05, 0.035, 0.001]} />
            <meshStandardMaterial ref={collectPaper} color="#888094" />
          </mesh>
        ))}
        {/* JETIR credit at bottom */}
        <Text
          position={[0, -0.46, 0.026]}
          fontSize={0.08}
          color="#1a1410"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
          fontWeight={700}
        >
          JETIR · 2024
        </Text>
      </group>
    </>
  );
}
