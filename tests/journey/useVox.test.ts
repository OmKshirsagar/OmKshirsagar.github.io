import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildMesh } from 'three/examples/jsm/loaders/VOXLoader.js';

// Minimal synthetic chunk: one voxel at VOX (0,0,0), color index 1.
function oneVoxelChunk() {
  const palette = new Array(256).fill(0xffffffff);
  palette[1] = 0xffffffff; // ARGB white
  return {
    data: new Uint8Array([0, 0, 0, 1]),
    size: { x: 1, y: 1, z: 1 },
    palette,
  };
}

describe('VOXLoader buildMesh', () => {
  it('returns a Mesh with geometry', () => {
    const mesh = buildMesh(oneVoxelChunk() as never) as THREE.Mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.geometry.getAttribute('position')).toBeTruthy();
  });

  it('centers a 1x1x1 model at the origin', () => {
    const mesh = buildMesh(oneVoxelChunk() as never) as THREE.Mesh;
    mesh.geometry.computeBoundingBox();
    const c = new THREE.Vector3();
    mesh.geometry.boundingBox!.getCenter(c);
    expect(c.x).toBeCloseTo(0, 5);
    expect(c.y).toBeCloseTo(0, 5);
    expect(c.z).toBeCloseTo(0, 5);
  });
});
