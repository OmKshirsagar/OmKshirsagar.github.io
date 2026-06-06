import { type MutableRefObject, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import type { SceneState } from './lib/state';

interface Props {
  /** GSAP writes character placement / fade here every scroll tick. */
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Voxel-Om character.
 *
 * Right now this is a CODE-BUILT chibi figure (~17 box meshes) sized to match
 * the photo reference: medium-brown skin, full dark hair swept up, full beard
 * + mustache, soft-pink button-down shirt, dark charcoal slacks, dark shoes.
 *
 * When the MagicaVoxel-built .glb is ready, drop the file at
 * `public/voxel-om.glb` and replace the body of this component with:
 *
 *   import { useGLTF } from '@react-three/drei';
 *   const { scene } = useGLTF('/voxel-om.glb');
 *   return <primitive object={scene} scale={0.1} />;
 *
 * The outer <group> + ref + useFrame state-binding stays the same, so all
 * beat animations keep working.
 */

// Palette — skin / hair / beard match the photo; shirt and pants keep the
// original cream + charcoal scheme from the static-page VoxelOmSketch so the
// character feels consistent across both routes.
const C = {
  skinMid: '#c89571',     // medium South-Asian brown
  skinDark: '#a07449',    // shadow side of skin
  hair: '#1a1410',        // near-black hair
  beard: '#1a1410',       // same as hair (full beard)
  shirt: '#fff5e8',       // off-white shirt, matching the SVG voxel-Om
  shirtShade: '#d8d3c5',  // shaded side
  pocket: '#d8d3c5',      // chest pocket flap
  pants: '#2a2e3a',       // dark charcoal slacks (kept matching photo)
  pantsShade: '#1e2230',
  shoes: '#161318',       // dark dress shoes
  eye: '#1a1410',
  mouth: '#7a4a32',
} as const;

export default function VoxelOm({ stateRef }: Props) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const s = stateRef.current;
    groupRef.current.visible = s.characterOpacity > 0.001;
    if (!groupRef.current.visible) return;
    groupRef.current.position.set(s.characterX, s.characterY, s.characterZ);
    groupRef.current.scale.setScalar(s.characterScale);
    groupRef.current.rotation.y = s.characterRotationY;
    // Apply fade to every material in the character. Cheaper than collecting
    // refs since the character has ~25 meshes and traverse is once per frame.
    groupRef.current.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.isMesh) {
        const mat = mesh.material as MeshStandardMaterial;
        if (mat) {
          mat.transparent = true;
          mat.opacity = s.characterOpacity;
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} dispose={null}>
      {/* ===================== LEGS ===================== */}
      <mesh position={[-0.18, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.23, 0.5, 0.23]} />
        <meshStandardMaterial color={C.pants} flatShading roughness={0.85} />
      </mesh>
      <mesh position={[0.18, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.23, 0.5, 0.23]} />
        <meshStandardMaterial color={C.pantsShade} flatShading roughness={0.85} />
      </mesh>

      {/* ===================== SHOES ===================== */}
      <mesh position={[-0.18, 0.06, 0.07]} castShadow>
        <boxGeometry args={[0.28, 0.12, 0.36]} />
        <meshStandardMaterial color={C.shoes} flatShading roughness={0.5} />
      </mesh>
      <mesh position={[0.18, 0.06, 0.07]} castShadow>
        <boxGeometry args={[0.28, 0.12, 0.36]} />
        <meshStandardMaterial color={C.shoes} flatShading roughness={0.5} />
      </mesh>

      {/* ===================== TORSO (shirt) ===================== */}
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.7, 0.36]} />
        <meshStandardMaterial color={C.shirt} flatShading roughness={0.85} />
      </mesh>
      {/* Subtle shaded side strip so the shirt isn't a flat white panel */}
      <mesh position={[0.18, 0.95, 0.182]}>
        <boxGeometry args={[0.26, 0.7, 0.005]} />
        <meshStandardMaterial color={C.shirtShade} flatShading roughness={0.85} />
      </mesh>
      {/* Chest pocket flap on the right side */}
      <mesh position={[0.16, 1.0, 0.19]}>
        <boxGeometry args={[0.14, 0.18, 0.02]} />
        <meshStandardMaterial color={C.pocket} flatShading roughness={0.85} />
      </mesh>
      {/* Button placket — thin vertical strip down the centre */}
      <mesh position={[0, 0.95, 0.184]}>
        <boxGeometry args={[0.025, 0.62, 0.005]} />
        <meshStandardMaterial color={C.shirtShade} flatShading roughness={0.85} />
      </mesh>

      {/* ===================== ARMS ===================== */}
      {/* Sleeves (shirt color) — pink upper portion */}
      <mesh position={[-0.4, 1.12, 0]} castShadow>
        <boxGeometry args={[0.2, 0.36, 0.2]} />
        <meshStandardMaterial color={C.shirt} flatShading roughness={0.85} />
      </mesh>
      <mesh position={[0.4, 1.12, 0]} castShadow>
        <boxGeometry args={[0.2, 0.36, 0.2]} />
        <meshStandardMaterial color={C.shirt} flatShading roughness={0.85} />
      </mesh>
      {/* Lower arms (skin) */}
      <mesh position={[-0.4, 0.78, 0]} castShadow>
        <boxGeometry args={[0.18, 0.36, 0.18]} />
        <meshStandardMaterial color={C.skinMid} flatShading roughness={0.85} />
      </mesh>
      <mesh position={[0.4, 0.78, 0]} castShadow>
        <boxGeometry args={[0.18, 0.36, 0.18]} />
        <meshStandardMaterial color={C.skinDark} flatShading roughness={0.85} />
      </mesh>

      {/* ===================== NECK ===================== */}
      <mesh position={[0, 1.36, 0]}>
        <boxGeometry args={[0.26, 0.16, 0.26]} />
        <meshStandardMaterial color={C.skinDark} flatShading roughness={0.85} />
      </mesh>

      {/* ===================== HEAD ===================== */}
      <mesh position={[0, 1.74, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.62, 0.62]} />
        <meshStandardMaterial color={C.skinMid} flatShading roughness={0.85} />
      </mesh>

      {/* ===================== BEARD ===================== */}
      {/* Main beard mass — wraps the lower jaw / chin / lower cheeks.
          Sits slightly larger than the head's lower half so it reads as a
          beard layer overlapping the skin. */}
      <mesh position={[0, 1.52, 0]} castShadow>
        <boxGeometry args={[0.66, 0.28, 0.66]} />
        <meshStandardMaterial color={C.beard} flatShading roughness={0.7} />
      </mesh>
      {/* Mustache strip — directly above mouth, connects to beard */}
      <mesh position={[0, 1.66, 0.315]}>
        <boxGeometry args={[0.32, 0.06, 0.02]} />
        <meshStandardMaterial color={C.beard} flatShading roughness={0.7} />
      </mesh>

      {/* ===================== HAIR =====================
       *  "Overgrown effortless dev" — no styled quiff, no symmetrical swept
       *  shape. Just a thick cap up top with heavy uneven bangs falling
       *  forward over the forehead. Slight asymmetry sells the "haven't
       *  been to the barber in a while" look. */}
      {/* Main cap — thick, sits over the whole top of the head */}
      <mesh position={[0, 2.12, -0.02]} castShadow>
        <boxGeometry args={[0.72, 0.32, 0.68]} />
        <meshStandardMaterial color={C.hair} flatShading roughness={0.65} />
      </mesh>
      {/* Top-front messy layer — slightly forward, slightly to the left for asymmetry */}
      <mesh position={[-0.05, 2.22, 0.18]} castShadow>
        <boxGeometry args={[0.5, 0.16, 0.28]} />
        <meshStandardMaterial color={C.hair} flatShading roughness={0.65} />
      </mesh>
      {/* Heavy forehead bangs — main curtain across the forehead, sitting just
          above the eyebrows. Leaves the brows / eyes visible below. */}
      <mesh position={[0, 2.00, 0.31]} castShadow>
        <boxGeometry args={[0.58, 0.18, 0.04]} />
        <meshStandardMaterial color={C.hair} flatShading roughness={0.7} />
      </mesh>
      {/* Asymmetric left-side strand — falls a bit lower, touches the brow.
          This is what makes the cut read as "messy / overgrown" not "styled". */}
      <mesh position={[-0.18, 1.93, 0.31]} castShadow>
        <boxGeometry args={[0.20, 0.14, 0.045]} />
        <meshStandardMaterial color={C.hair} flatShading roughness={0.7} />
      </mesh>
      {/* Right-side temple wisp — shorter, more contained */}
      <mesh position={[0.27, 1.97, 0.30]} castShadow>
        <boxGeometry args={[0.12, 0.10, 0.04]} />
        <meshStandardMaterial color={C.hair} flatShading roughness={0.7} />
      </mesh>
      {/* Side hair wraps — covers the side of the head behind the ears */}
      <mesh position={[-0.33, 1.85, -0.05]}>
        <boxGeometry args={[0.05, 0.3, 0.5]} />
        <meshStandardMaterial color={C.hair} flatShading roughness={0.7} />
      </mesh>
      <mesh position={[0.33, 1.85, -0.05]}>
        <boxGeometry args={[0.05, 0.3, 0.5]} />
        <meshStandardMaterial color={C.hair} flatShading roughness={0.7} />
      </mesh>

      {/* ===================== EYES ===================== */}
      {/* No glasses — sits on the head's front face directly. Slight gap
          between the eyes matches photo proportions. */}
      <mesh position={[-0.13, 1.78, 0.32]}>
        <boxGeometry args={[0.06, 0.05, 0.01]} />
        <meshStandardMaterial color={C.eye} flatShading />
      </mesh>
      <mesh position={[0.13, 1.78, 0.32]}>
        <boxGeometry args={[0.06, 0.05, 0.01]} />
        <meshStandardMaterial color={C.eye} flatShading />
      </mesh>

      {/* Eyebrows — thin dark bars just above each eye */}
      <mesh position={[-0.13, 1.86, 0.32]}>
        <boxGeometry args={[0.12, 0.025, 0.01]} />
        <meshStandardMaterial color={C.hair} flatShading />
      </mesh>
      <mesh position={[0.13, 1.86, 0.32]}>
        <boxGeometry args={[0.12, 0.025, 0.01]} />
        <meshStandardMaterial color={C.hair} flatShading />
      </mesh>

      {/* ===================== MOUTH ===================== */}
      {/* Subtle smile peeking through the beard */}
      <mesh position={[0, 1.6, 0.33]}>
        <boxGeometry args={[0.12, 0.02, 0.005]} />
        <meshStandardMaterial color={C.mouth} flatShading />
      </mesh>
    </group>
  );
}
