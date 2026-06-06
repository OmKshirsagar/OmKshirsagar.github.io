import { useVox } from '../lib/useVox';

type Props = {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

/** Loads a .vox via useVox and renders the resulting Mesh at the given transform. */
export function VoxModel({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: Props) {
  const mesh = useVox(url);
  if (!mesh) return null;
  return <primitive object={mesh} position={position} rotation={rotation} scale={scale} />;
}
