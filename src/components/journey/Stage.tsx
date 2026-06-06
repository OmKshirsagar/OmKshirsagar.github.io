import { type MutableRefObject } from 'react';
import type { SceneState } from './lib/state';
import SceneJaiHind from './scenes/SceneJaiHind';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Stage = the persistent world. Golden-hour light rig + the voxel Jai Hind
 * College scene. (Pre-voxel scaffold lives in ./_archive for reference.)
 */
export default function Stage({ stateRef }: Props) {
  return (
    <>
      {/* ===== Golden-hour light rig ===== */}
      <ambientLight intensity={0.5} color="#2a2418" />
      {/* warm key, low angle from front-right */}
      <directionalLight
        position={[6, 5, 8]}
        intensity={2.4}
        color="#ffd29a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-bias={-0.0005}
      />
      {/* cool fill from back-left */}
      <directionalLight position={[-6, 4, -4]} intensity={0.5} color="#6c7c9c" />
      {/* warm rim/back light behind the façade to backlight Om */}
      <directionalLight position={[-4, 6, -10]} intensity={1.4} color="#ff9460" />

      <SceneJaiHind stateRef={stateRef} />
    </>
  );
}
