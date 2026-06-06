import { useFrame, useThree } from '@react-three/fiber';
import { type MutableRefObject } from 'react';
import type { PerspectiveCamera } from 'three';
import type { CameraState } from './lib/state';

interface Props {
  /** Mutable camera state written by the GSAP scroll timeline. */
  stateRef: MutableRefObject<CameraState>;
}

/**
 * Reads the camera state ref every frame and copies it into the actual
 * Three.js camera. Sits inside <Canvas>. Returns null — no JSX.
 *
 * GSAP writes to stateRef.current.x/y/z/fov on scroll. We read it here and
 * push to the real camera + call updateProjectionMatrix() when fov changes.
 * No React re-renders during scroll = buttery 60fps.
 */
export default function CameraRig({ stateRef }: Props): null {
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    const s = stateRef.current;
    camera.position.set(s.x, s.y, s.z);
    camera.lookAt(s.lookAtX, s.lookAtY, s.lookAtZ);

    // Perspective cameras need an explicit projection-matrix refresh on fov change
    if ((camera as PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as PerspectiveCamera;
      if (persp.fov !== s.fov) {
        persp.fov = s.fov;
        persp.updateProjectionMatrix();
      }
    }
  });

  return null;
}
