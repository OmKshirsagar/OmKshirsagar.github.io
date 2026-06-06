import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { VOXLoader, buildMesh } from 'three/examples/jsm/loaders/VOXLoader.js';

const cache = new Map<string, Promise<THREE.Mesh>>();

function load(url: string): Promise<THREE.Mesh> {
  const existing = cache.get(url);
  if (existing) return existing;
  const p = new Promise<THREE.Mesh>((resolve, reject) => {
    new VOXLoader().load(
      url,
      (result: { chunks: unknown[] }) => {
        if (!result.chunks.length) {
          reject(new Error(`empty vox: ${url}`));
          return;
        }
        // Single-model files -> first chunk. buildMesh returns a centered,
        // Y-up Mesh (greedy-meshed, vertex colors from the VOX palette).
        const mesh = buildMesh(result.chunks[0] as never) as THREE.Mesh;
        resolve(mesh);
      },
      undefined,
      reject,
    );
  });
  cache.set(url, p);
  return p;
}

/**
 * React hook: returns a cloned Mesh once the .vox loads, else null.
 * Clones share geometry + material with the cached original (cheap; many
 * trees reuse one parse). Pass a `/vox/<name>.vox` public URL.
 */
export function useVox(url: string): THREE.Mesh | null {
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
  useEffect(() => {
    let alive = true;
    load(url)
      .then((m) => {
        if (alive) setMesh(m.clone() as THREE.Mesh);
      })
      .catch((e) => console.error('[useVox]', e));
    return () => {
      alive = false;
    };
  }, [url]);
  return mesh;
}
