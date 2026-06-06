# Voxel Cinematic Journey — Plan 3 (Scene 02 Vertical Slice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abstract/photoreal `/journey` scaffold with a fully voxel/Minecraft-style cinematic, proven end-to-end on ONE hero sequence: voxel-Om walking toward the Jai Hind College Art Deco façade, golden-hour lit, scroll-scrubbed.

**Architecture:** Build `.vox` assets with Python (`vox_utils` from the MagicaVoxel-MCP project) driven from Bash, render 6-angle PNG previews for visual verification, serve the `.vox` files from `public/vox/`, load them at runtime with Three.js's built-in `VOXLoader`, compose them in React-Three-Fiber, and drive camera + character-walk via the existing Lenis + GSAP scroll timeline (plain-ref bridge, no React re-renders during scroll).

**Tech Stack:** Astro 4 + `@astrojs/react` (React 18) · `three@0.184` (built-in `VOXLoader`) · `@react-three/fiber@^8.18` · `@react-three/drei@^9.122` · `lenis@1.3` · `gsap@3.15` + `@gsap/react@2.1` · Python 3 + `vox_utils` (venv at the MagicaVoxel-MCP project) · Vitest.

**Why a vertical slice:** Scene 02 is the most asset-dense beat (building + signage + windows + walkway + NPC crowd + walking hero). If the voxel pipeline + loader + walk-cycle + cinematic lighting all work here, every remaining scene (Plan 4) is a reskin of the same primitives. We prove the hardest thing first.

**Scope boundary:** This plan delivers Scene 02 ONLY as a standalone, testable `/journey` page. Scene 01 (Mumbai aerial dive), graduation, paper, Deloitte arrival are Plan 4. The old Earth/college/abstract-prop scaffold is archived (not deleted) so nothing is lost.

---

## Reference Material (the visual target)

- Reference frames: `/tmp/journey-frames/<name>/frame_00001..8.jpg` (extracted from the 6 user videos).
- Source videos: `video/*.mp4` (zoom-into-college, entering-college, around-the-college, publishing-paper, graduating, joining-deloitte).
- Locked aesthetic from frames:
  - Pure voxel cubes for ALL geometry. Golden-hour warm grading.
  - Jai Hind = cream Art Deco façade, central stone arched entrance, **glowing "JAI HIND COLLEGE" voxel-text sign** on the roofline, window grid with darker insets.
  - Voxel-Om: black voluminous hair, full dark beard, cream shirt, dark pants. Walks with leg/arm swing. Golden rim-light "hero outline".
  - Voxel student NPCs (varied shirt colors) around the courtyard. Voxel trees in the lawn. Walkway leading to entrance.

## Pipeline Facts (verified before planning)

- `vox_utils` imports ONLY when CWD = the MCP project dir. Canonical invocation:
  ```
  cd "/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/voxel/magicavoxel-mcp" && .venv/bin/python <script>
  ```
- `VoxelModel(size_x, size_y, size_z)` methods available: `set_voxel(x,y,z,color_index)`, `fill_box(x1,y1,z1,x2,y2,z2,color_index)`, `create_stairs`, `create_cylinder`, `create_sphere`, `union_with_model`, `set_palette_color(i,r,g,b,a)`, `get_voxel_count`, `get_bounds`, plus boolean/morph ops.
- `read_vox_file(path)` / `write_vox_file(path, model)` round-trip `.vox`. `render_model_all_angles(model, base_path)` writes 6 PNGs (needs Pillow — installed).
- **Coordinate convention:** MagicaVoxel `.vox` is Z-up. Three.js `VOXLoader` returns a `Group` of `Mesh` objects already converted to **Y-up** (it bakes a rotation). We position/scale at the Group level in R3F; we do NOT hand-convert axes.
- `VOXLoader` returns `chunk.data` per model; `VOXMesh` (also in three) builds an `InstancedMesh`. We will use `VOXLoader` + manual mesh build (one `InstancedMesh` per file) for control over material (needed for rim-light + grading).
- Three.js `VOXLoader` path in repo: `node_modules/three/examples/jsm/loaders/VOXLoader.js` (import via `three/examples/jsm/loaders/VOXLoader.js`).

---

## File Structure

**New — asset build scripts (Python, live in the resume repo so they're versioned with the site):**
- `scripts/voxel/_voxlib.py` — shared helpers: project palette constants, `new_model()`, `save_and_preview()` wrapper that writes `.vox` to `public/vox/` AND renders preview PNGs to `docs/voxel-previews/`.
- `scripts/voxel/build_om.py` — emits 6 part files: `om_head.vox`, `om_torso.vox`, `om_upperarm_L.vox`, `om_upperarm_R.vox`, `om_thigh_L.vox`, `om_thigh_R.vox` (split for limb animation).
- `scripts/voxel/build_jaihind.py` — emits `jaihind_facade.vox` (building + arch + sign + windows baked in).
- `scripts/voxel/build_props.py` — emits `tree.vox`, `lamp.vox`, and ONE baked `ground.vox` (lawn slab with a warm path stripe down the middle — a single mesh, not tiles, so the ground is 1 draw call).
- `scripts/voxel/build_npc.py` — emits `npc_base.vox` (single neutral student; shirt color recolored at runtime via material, not per-file).
- `scripts/voxel/build_all.sh` — runs all builders in order; one command to regenerate every asset.

**New — runtime voxel-loading layer (TypeScript/React):**
- `src/components/journey/lib/useVox.ts` — React hook: loads a `.vox` URL via `VOXLoader`, returns a memoized `THREE.InstancedMesh` (suspense-friendly, cached per URL).
- `src/components/journey/voxel/VoxModel.tsx` — `<VoxModel url position rotation scale />` thin wrapper around `useVox`.
- `src/components/journey/voxel/VoxelOmRig.tsx` — assembles the 6 Om parts into an animatable rig; exposes `setWalkPhase(t)` + `setRimLight(on)` via ref.

**New — the hero scene:**
- `src/components/journey/scenes/SceneJaiHind.tsx` — composes lawn + walkway + façade + trees + lamps + NPC crowd + `VoxelOmRig`; reads visibility/positions from scene state.

**Modified:**
- `src/components/journey/lib/state.ts` — REUSE existing `characterX/characterY/characterZ/characterScale/characterRotationY/characterOpacity` (Om position) + `collegeVisible` (façade gate). ADD only 4 new fields: `omWalkPhase`, `omRimLight`, `signGlow`, `crowdVisible`. Do NOT touch `BEAT_CAPTIONS`/`BEAT_NAMES` (index 1 is already `'2024 · JAI HIND COLLEGE · CHURCHGATE'` — we force `beat=1`).
- `src/components/journey/lib/useJourneyTimeline.ts` — **remove the `import { MUMBAI_FACING_ROTATION_Y } from '../scenes/Scene01Globe'` line (line 7)** since Scene01Globe is archived; replace the SCENE 01..12 timeline body with the single Jai Hind approach (camera dolly + Om walk-phase tween). KEEP the Lenis + ScrollTrigger setup block (lines 44-71) unchanged except `onUpdate` (force `beat=1`).
- `src/components/journey/Stage.tsx` — mount `SceneJaiHind` (default export, `stateRef` prop); remove old scene/beat/`VoxelOm` mounts + the old `Ground`; keep light rig (retuned for golden hour).
- `src/components/journey/JourneyMovie.tsx` — no structural change required; the 3 dormant `HeroTitle` overlays stay at opacity 0 (harmless), caption reads `BEAT_CAPTIONS[1]` via the existing rAF loop. Optionally retune HUD copy.
- `astro.config.mjs` — ensure `.vox` served as static (Astro serves `public/` verbatim; confirm no Vite transform needed — add `assetsInclude: ['**/*.vox']` to be safe).

**Archived (moved, not deleted) — so the old work is recoverable:**
- `src/components/journey/scenes/Scene01Globe.tsx` → `src/components/journey/_archive/Scene01Globe.tsx`
- `src/components/journey/scenes/Scene02College.tsx` → `src/components/journey/_archive/Scene02College.tsx`
- `src/components/journey/VoxelOm.tsx` → `src/components/journey/_archive/VoxelOm.tsx`
- `src/components/journey/beats/*` → `src/components/journey/_archive/beats/*`

**New — generated assets (gitignored source PNGs, committed .vox):**
- `public/vox/*.vox` — committed (small, needed at runtime).
- `docs/voxel-previews/*.png` — gitignored (verification artifacts only).

---

## Coordinate convention (VERIFIED — do not deviate)

Probed end-to-end with three's `buildMesh`. `vox_utils` `VoxelModel(sx, sy, sz)` axes map to three-space as:

| vox_utils arg | three-space axis |
|---|---|
| `x` (1st, "width") | X — left/right |
| `y` (2nd, "depth") | **Z — depth (forward/back)** |
| `z` (3rd, "height") | **Y — UP (vertical)** |

**Therefore every builder authors the VERTICAL extent in the `z` coordinate** (the 3rd constructor arg and the 3rd `fill_box` coord). The "front face" of buildings/heads is the `y = 0` plane. `buildMesh` also centers each model at its own origin in three-space, so the rig/scene position values address each model's CENTER.

---

## Palette (shared across all builders — define once in `_voxlib.py`)

| idx | name | RGB | use |
|----|------|-----|-----|
| 1 | cream | 236,222,193 | façade walls, Om shirt |
| 2 | cream_shadow | 205,188,156 | façade insets |
| 3 | stone | 170,150,120 | arch, carved trim |
| 4 | window_dark | 40,46,60 | window glass |
| 5 | window_glow | 255,210,140 | lit windows / sign |
| 6 | skin | 205,150,110 | Om + NPC faces/hands |
| 7 | hair_black | 28,24,26 | Om hair + beard |
| 8 | pants_charcoal | 52,54,62 | Om legs |
| 9 | grass | 96,150,74 | lawn |
| 10 | path_warm | 198,170,128 | walkway |
| 11 | trunk | 110,78,52 | tree trunk |
| 12 | leaf | 70,128,66 | tree canopy |
| 13 | npc_red | 196,86,72 | NPC shirt variant |
| 14 | npc_blue | 78,116,176 | NPC shirt variant |
| 15 | npc_green | 96,160,96 | NPC shirt variant |
| 16 | lamp_metal | 70,70,80 | lamp posts |

---

## Task 1: Asset pipeline foundation + smoke test

**Files:**
- Create: `scripts/voxel/_voxlib.py`
- Create: `scripts/voxel/smoke_test.py`
- Create: `.gitignore` entry for `docs/voxel-previews/`

- [ ] **Step 1: Write `_voxlib.py` with palette + helpers**

```python
# scripts/voxel/_voxlib.py
"""Shared helpers for building the journey voxel assets.

Run builders with CWD = the MagicaVoxel-MCP project so `vox_utils` imports:
    cd ".../pet/voxel/magicavoxel-mcp" && .venv/bin/python <builder>
Each builder imports this file by absolute path injection (see builder header).
"""
from pathlib import Path

from vox_utils import VoxelModel, write_vox_file, render_model_all_angles

# Resume repo root (this file lives at <repo>/scripts/voxel/_voxlib.py)
REPO_ROOT = Path(__file__).resolve().parents[2]
VOX_OUT = REPO_ROOT / "public" / "vox"
PREVIEW_OUT = REPO_ROOT / "docs" / "voxel-previews"
VOX_OUT.mkdir(parents=True, exist_ok=True)
PREVIEW_OUT.mkdir(parents=True, exist_ok=True)

# (index, r, g, b)
PALETTE = {
    "cream": (1, 236, 222, 193),
    "cream_shadow": (2, 205, 188, 156),
    "stone": (3, 170, 150, 120),
    "window_dark": (4, 40, 46, 60),
    "window_glow": (5, 255, 210, 140),
    "skin": (6, 205, 150, 110),
    "hair_black": (7, 28, 24, 26),
    "pants_charcoal": (8, 52, 54, 62),
    "grass": (9, 96, 150, 74),
    "path_warm": (10, 198, 170, 128),
    "trunk": (11, 110, 78, 52),
    "leaf": (12, 70, 128, 66),
    "npc_red": (13, 196, 86, 72),
    "npc_blue": (14, 78, 116, 176),
    "npc_green": (15, 96, 160, 96),
    "lamp_metal": (16, 70, 70, 80),
}


def C(name: str) -> int:
    """Color index for a palette name."""
    return PALETTE[name][0]


def new_model(sx: int, sy: int, sz: int) -> VoxelModel:
    """Create a model and stamp the full project palette into it."""
    m = VoxelModel(sx, sy, sz)
    for _name, (idx, r, g, b) in PALETTE.items():
        m.set_palette_color(idx, r, g, b, 255)
    return m


def save_and_preview(model: VoxelModel, name: str, preview: bool = True) -> Path:
    """Write <name>.vox to public/vox and render 6-angle PNGs to docs/voxel-previews."""
    vox_path = VOX_OUT / f"{name}.vox"
    write_vox_file(vox_path, model)
    count = model.get_voxel_count()
    bounds = model.get_bounds()
    print(f"[vox] {name}.vox  voxels={count}  bounds={bounds}")
    if preview:
        try:
            render_model_all_angles(model, PREVIEW_OUT / name)
            print(f"[preview] {name} -> docs/voxel-previews/{name}_*.png")
        except Exception as e:  # noqa: BLE001
            print(f"[preview] skipped ({e})")
    return vox_path
```

- [ ] **Step 2: Write a smoke test that builds a 3-color cube and previews it**

```python
# scripts/voxel/smoke_test.py
"""Smoke test: prove the pipeline writes a .vox and renders previews."""
import sys
from pathlib import Path

# Allow `import _voxlib` regardless of CWD
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402

m = new_model(8, 8, 8)
m.fill_box(0, 0, 0, 7, 0, 7, C("grass"))      # floor
m.fill_box(2, 1, 2, 5, 4, 5, C("cream"))      # block
m.fill_box(3, 5, 3, 4, 5, 4, C("window_glow"))  # cap
out = save_and_preview(m, "smoke_test")
assert out.exists(), "vox file not written"
print("SMOKE OK")
```

- [ ] **Step 3: Run the smoke test**

Run:
```bash
cd "/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/voxel/magicavoxel-mcp" && .venv/bin/python "/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/self/resume/scripts/voxel/smoke_test.py"
```
Expected: prints `[vox] smoke_test.vox voxels=...`, `[preview] smoke_test -> ...`, `SMOKE OK`. Creates `public/vox/smoke_test.vox` + `docs/voxel-previews/smoke_test_*.png`.

- [ ] **Step 4: Visually verify the preview**

Use the Read tool on `docs/voxel-previews/smoke_test_front.png` (or whichever angle names `render_model_all_angles` emits — list the dir first). Confirm a green floor + cream block + glowing cap. This validates color mapping before we build anything complex.

- [ ] **Step 5: Gitignore preview PNGs**

Add to `.gitignore`:
```
# Voxel preview renders (verification only; .vox files are committed)
docs/voxel-previews/
```

- [ ] **Step 6: Commit**

```bash
ALLOW_DELOITTE_COMMIT not needed (personal email). From repo root:
git add scripts/voxel/_voxlib.py scripts/voxel/smoke_test.py public/vox/smoke_test.vox .gitignore
git commit -m "feat(voxel): asset build pipeline + smoke test"
```

---

## Task 2: VOXLoader runtime hook + R3F wrapper

**Files:**
- Create: `src/components/journey/lib/useVox.ts`
- Create: `src/components/journey/voxel/VoxModel.tsx`
- Modify: `astro.config.mjs`
- Test: `tests/journey/useVox.test.ts`

- [ ] **Step 1: Ensure Astro serves `.vox` as an asset**

Modify `astro.config.mjs` — inside the `vite` config block add `assetsInclude`:

```js
// astro.config.mjs (vite section)
vite: {
  assetsInclude: ['**/*.vox'],
  // ...existing config
},
```
(Files in `public/` are served verbatim by Astro, so `/vox/foo.vox` resolves at runtime. `assetsInclude` guards against Vite trying to parse a `.vox` import in tests.)

- [ ] **Step 2: Write the `useVox` hook**

The three 0.184 `VOXLoader` exports `buildMesh(chunk)`, which greedy-meshes a chunk into ONE `Mesh` (vertex colors from the palette), already converts VOX Z-up → three Y-up, and **centers the model at its own origin**. We use it directly — no hand-rolled meshing.

```typescript
// src/components/journey/lib/useVox.ts
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { VOXLoader, buildMesh } from 'three/examples/jsm/loaders/VOXLoader.js';

const cache = new Map<string, Promise<THREE.Mesh>>();

function load(url: string): Promise<THREE.Mesh> {
  if (cache.has(url)) return cache.get(url)!;
  const p = new Promise<THREE.Mesh>((resolve, reject) => {
    new VOXLoader().load(
      url,
      (result: { chunks: unknown[] }) => {
        if (!result.chunks.length) return reject(new Error(`empty vox: ${url}`));
        // Single-model files -> first chunk. buildMesh returns a centered, Y-up Mesh.
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

/** React hook: returns a cloned Mesh once loaded, else null. Clones share
 *  geometry+material with the cached original (cheap; many trees reuse one). */
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
```

- [ ] **Step 3: Write a unit test for `buildMesh` centering (our integration assumption)**

We depend on `buildMesh` returning a Y-up Mesh centered at origin. Test that against the real library so a future three upgrade can't silently break the rig pivots.

```typescript
// tests/journey/useVox.test.ts
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
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/journey/useVox.test.ts`
Expected: 2 passed. (If `buildMesh` is not exported, the import fails — that surfaces a three-version mismatch immediately; fall back to `result.scene` from `VOXLoader.parse`.)

- [ ] **Step 5: Write the `VoxModel` wrapper**

```tsx
// src/components/journey/voxel/VoxModel.tsx
import { useVox } from '../lib/useVox';

type Props = {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

export function VoxModel({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: Props) {
  const mesh = useVox(url);
  if (!mesh) return null;
  return <primitive object={mesh} position={position} rotation={rotation} scale={scale} />;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/journey/lib/useVox.ts src/components/journey/voxel/VoxModel.tsx tests/journey/useVox.test.ts astro.config.mjs
git commit -m "feat(voxel): VOXLoader hook + R3F VoxModel wrapper"
```

---

## Task 3: Build voxel-Om (6 animatable parts)

**Files:**
- Create: `scripts/voxel/build_om.py`
- Output: `public/vox/om_head.vox`, `om_torso.vox`, `om_upperarm_L.vox`, `om_upperarm_R.vox`, `om_thigh_L.vox`, `om_thigh_R.vox`

Design (matches user photo + reference voxel-Om): black voluminous hair, full beard, cream shirt, charcoal pants, no glasses. Parts are modeled around their own pivot origin so the rig can rotate limbs cleanly.

- [ ] **Step 1: Write `build_om.py`**

```python
# scripts/voxel/build_om.py
"""Build voxel-Om as 6 separate part files for limb animation.

COORDINATE CONVENTION (verified): axes are (x=width, y=depth, z=HEIGHT/up).
The vertical extent is ALWAYS the z coord. Front face = y = 0.
Parts are authored upright; buildMesh converts vox-z -> three-Y and centers
each model, so the rig (which works in three Y-up space) pivots cleanly.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def build_torso():
    # x=6 wide, y=3 deep, z=8 tall — cream shirt
    m = new_model(6, 3, 8)
    m.fill_box(0, 0, 0, 5, 2, 7, C("cream"))
    save_and_preview(m, "om_torso")


def build_head():
    # x=6, y=6 deep, z=7 tall. Face on front plane y=0; hair on top (high z),
    # back (y=5) and sides (x=0,5); beard low-front; eyes mid-front.
    m = new_model(6, 6, 7)
    m.fill_box(0, 0, 0, 5, 5, 5, C("skin"))            # face/skull block (z 0..5)
    m.fill_box(0, 0, 6, 5, 5, 6, C("hair_black"))       # hair cap (top, z=6)
    m.fill_box(0, 5, 1, 5, 5, 6, C("hair_black"))       # hair back slab (y=5)
    m.fill_box(0, 0, 1, 0, 5, 6, C("hair_black"))       # hair left side (x=0)
    m.fill_box(5, 0, 1, 5, 5, 6, C("hair_black"))       # hair right side (x=5)
    m.fill_box(1, 0, 5, 2, 0, 5, C("hair_black"))       # asymmetric front bang
    # beard: lower-front band (low z, front + a little wrap)
    m.fill_box(1, 0, 0, 4, 0, 1, C("hair_black"))
    m.fill_box(0, 0, 0, 5, 1, 0, C("hair_black"))
    # eyes (dark) on front face y=0 at mid height z=3
    m.set_voxel(1, 0, 3, C("hair_black"))
    m.set_voxel(4, 0, 3, C("hair_black"))
    save_and_preview(m, "om_head")


def build_arm(suffix: str):
    # x=2, y=2 deep, z=6 tall. Cream sleeve top (high z), skin hand bottom.
    m = new_model(2, 2, 6)
    m.fill_box(0, 0, 3, 1, 1, 5, C("cream"))   # sleeve (top = shoulder region)
    m.fill_box(0, 0, 0, 1, 1, 2, C("skin"))    # forearm/hand (bottom)
    save_and_preview(m, f"om_upperarm_{suffix}")


def build_thigh(suffix: str):
    # x=2, y=2 deep, z=7 tall — charcoal pants
    m = new_model(2, 2, 7)
    m.fill_box(0, 0, 0, 1, 1, 6, C("pants_charcoal"))
    save_and_preview(m, f"om_thigh_{suffix}")


if __name__ == "__main__":
    build_torso()
    build_head()
    build_arm("L")
    build_arm("R")
    build_thigh("L")
    build_thigh("R")
    print("OM BUILD OK")
```

- [ ] **Step 2: Run the builder**

Run:
```bash
cd "/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/voxel/magicavoxel-mcp" && .venv/bin/python "/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/self/resume/scripts/voxel/build_om.py"
```
Expected: 6 `[vox]` lines + `OM BUILD OK`. Creates 6 `.vox` files in `public/vox/`.

- [ ] **Step 3: Visually verify the head + torso previews**

List `docs/voxel-previews/` then Read `om_head_front.png` and `om_torso_front.png`. Confirm: head reads as black-hair + beard + skin face; torso is a clean cream block. Iterate on `build_om.py` voxel coords if the silhouette is wrong, re-run Step 2, re-check.

- [ ] **Step 4: Commit**

```bash
git add scripts/voxel/build_om.py public/vox/om_*.vox
git commit -m "feat(voxel): voxel-Om 6-part character assets"
```

---

## Task 4: VoxelOmRig — assemble + walk-cycle

**Files:**
- Create: `src/components/journey/voxel/VoxelOmRig.tsx`
- Test: `tests/journey/walkPhase.test.ts`

The rig assembles the 6 parts into a hierarchy and animates limbs from a single `walkPhase` scalar (0..1 loops one stride). GSAP tweens `walkPhase` during scroll; `useFrame` applies it to limb rotations.

- [ ] **Step 1: Write the pure walk-pose math + test it first**

```typescript
// tests/journey/walkPhase.test.ts
import { describe, it, expect } from 'vitest';
import { walkPose } from '../../src/components/journey/voxel/walkPose';

describe('walkPose', () => {
  it('phase 0: limbs neutral (near zero swing)', () => {
    const p = walkPose(0);
    expect(Math.abs(p.thighL)).toBeLessThan(0.05);
    expect(Math.abs(p.thighR)).toBeLessThan(0.05);
  });
  it('legs are in counter-phase (opposite signs at quarter stride)', () => {
    const p = walkPose(0.25);
    expect(Math.sign(p.thighL)).toBe(-Math.sign(p.thighR));
  });
  it('arms counter-swing to legs (armL opposes thighL)', () => {
    const p = walkPose(0.25);
    expect(Math.sign(p.armL)).toBe(-Math.sign(p.thighL));
  });
  it('bob is non-negative and small', () => {
    for (const t of [0, 0.25, 0.5, 0.75]) {
      const p = walkPose(t);
      expect(p.bob).toBeGreaterThanOrEqual(0);
      expect(p.bob).toBeLessThan(0.2);
    }
  });
});
```

- [ ] **Step 2: Write `walkPose.ts` to pass it**

```typescript
// src/components/journey/voxel/walkPose.ts
export type Pose = {
  thighL: number; thighR: number;
  armL: number; armR: number;
  bob: number;
};

const SWING = 0.6; // radians peak leg swing

/** t in [0,1) = one full stride cycle. */
export function walkPose(t: number): Pose {
  const a = t * Math.PI * 2;
  const thighL = Math.sin(a) * SWING;
  const thighR = Math.sin(a + Math.PI) * SWING;
  return {
    thighL,
    thighR,
    armL: -thighL,            // arms counter-swing legs
    armR: -thighR,
    bob: Math.abs(Math.sin(a * 2)) * 0.12, // 2x freq vertical bob
  };
}
```

- [ ] **Step 3: Run the walk test**

Run: `npx vitest run tests/journey/walkPhase.test.ts`
Expected: 4 passed.

- [ ] **Step 4: Write `VoxelOmRig.tsx`**

```tsx
// src/components/journey/voxel/VoxelOmRig.tsx
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVox } from '../lib/useVox';
import { walkPose } from './walkPose';

export type OmRigHandle = {
  setWalkPhase: (t: number) => void;
  group: THREE.Group | null;
};

const V = '/vox/'; // public path

/** Renders a loaded vox InstancedMesh as a child (pivot at part origin). */
function Part({ url, position }: { url: string; position: [number, number, number] }) {
  const mesh = useVox(url);
  if (!mesh) return null;
  return <primitive object={mesh} position={position} />;
}

export const VoxelOmRig = forwardRef<OmRigHandle, { scale?: number }>(
  function VoxelOmRig({ scale = 0.1 }, ref) {
    const root = useRef<THREE.Group>(null);
    const thighL = useRef<THREE.Group>(null);
    const thighR = useRef<THREE.Group>(null);
    const armL = useRef<THREE.Group>(null);
    const armR = useRef<THREE.Group>(null);
    const phase = useRef(0);

    useImperativeHandle(ref, () => ({
      setWalkPhase: (t: number) => (phase.current = t),
      group: root.current,
    }));

    useFrame(() => {
      const p = walkPose(phase.current % 1);
      if (thighL.current) thighL.current.rotation.x = p.thighL;
      if (thighR.current) thighR.current.rotation.x = p.thighR;
      if (armL.current) armL.current.rotation.x = p.armL;
      if (armR.current) armR.current.rotation.x = p.armR;
      if (root.current) root.current.position.y = p.bob;
    });

    // Each part mesh is CENTERED at its own origin by buildMesh. Part sizes
    // (from build_om.py): torso 6x8x3, head 6x7x6, arm 2x6x2, thigh 2x7x2.
    // We place parts so FEET sit at y=0 and limbs pivot from shoulder/hip:
    //   hips  at y=7  (legs 7 tall hang down to y=0)
    //   torso spans y 7..15  -> center y=11
    //   head  sits on y=15   -> center y=18.5
    //   shoulders at y=14
    // A pivot <group> sits AT the joint; the centered child mesh is offset so
    // its TOP edge meets the group origin, so group.rotation.x swings the limb
    // from the joint (not the limb's middle).
    return (
      <group ref={root} scale={scale}>
        <Part url={`${V}om_torso.vox`} position={[0, 11, 0]} />
        <Part url={`${V}om_head.vox`} position={[0, 18.5, 0]} />
        <group ref={armL} position={[-4, 14, 0]}>
          <Part url={`${V}om_upperarm_L.vox`} position={[0, -3, 0]} />
        </group>
        <group ref={armR} position={[4, 14, 0]}>
          <Part url={`${V}om_upperarm_R.vox`} position={[0, -3, 0]} />
        </group>
        <group ref={thighL} position={[-1.5, 7, 0]}>
          <Part url={`${V}om_thigh_L.vox`} position={[0, -3.5, 0]} />
        </group>
        <group ref={thighR} position={[1.5, 7, 0]}>
          <Part url={`${V}om_thigh_R.vox`} position={[0, -3.5, 0]} />
        </group>
      </group>
    );
  },
);
```

(Note: the exact part `position` offsets are first-pass estimates; Step 5 is visual tuning.)

- [ ] **Step 5: Mount Om alone in the scene and visually tune the rig**

Temporarily (will be replaced in Task 7) render `<VoxelOmRig />` in `Stage.tsx` at origin with a static camera. Start dev server:
```bash
lsof -ti :4321 | xargs -r kill; cd "<repo>"; npm run dev > /tmp/astro-dev.log 2>&1 &
```
Open `http://localhost:4321/journey/`, confirm the parts assemble into a recognizable standing Om (head on shoulders, arms at sides, legs below hips). Adjust `position` offsets in `VoxelOmRig.tsx` until the silhouette is correct. No commit until it looks right.

- [ ] **Step 6: Commit**

```bash
git add src/components/journey/voxel/VoxelOmRig.tsx src/components/journey/voxel/walkPose.ts tests/journey/walkPhase.test.ts
git commit -m "feat(voxel): VoxelOmRig assembly + walk-cycle"
```

---

## Task 5: Build Jai Hind façade

**Files:**
- Create: `scripts/voxel/build_jaihind.py`
- Output: `public/vox/jaihind_facade.vox`

Art Deco cream façade. Authored Z-up: `x`=width 60, `y`=depth 12, `z`=height 40. Front face = `y = 0`. Central stone arched entrance, symmetric window grid (dark glass with a few `window_glow`), stepped Art Deco roofline, and a "JAI HIND COLLEGE" sign band in `window_glow` voxels across the top.

- [ ] **Step 1: Write `build_jaihind.py`**

```python
# scripts/voxel/build_jaihind.py
"""Jai Hind College Art Deco facade (single baked .vox).

COORDINATE CONVENTION (verified): (x=width, y=depth, z=HEIGHT/up).
Front face = y = 0. Vertical extent is the z coord.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402

W, D, H = 60, 12, 40  # width(x), depth(y), height(z)


def build():
    m = new_model(W, D, H)
    # Main mass (full footprint, up to z = H-6)
    m.fill_box(0, 0, 0, W - 1, D - 1, H - 6, C("cream"))
    # Recessed vertical pilaster shadows on the front face (y=0), every 8 cols
    for x in range(4, W - 4, 8):
        m.fill_box(x, 0, 2, x + 1, 0, H - 8, C("cream_shadow"))
    # Window grid: rows up the height (z), columns across width (x), on front face y=0
    for row_z in range(6, H - 10, 8):
        for col_x in range(6, W - 6, 8):
            m.fill_box(col_x, 0, row_z, col_x + 3, 0, row_z + 4, C("window_dark"))
    # Light a few windows warm
    for col_x in (14, 30, 46):
        m.fill_box(col_x, 0, 14, col_x + 3, 0, 18, C("window_glow"))
    # Central arched entrance (stone frame slab on the front, 2 deep)
    ex1, ex2 = W // 2 - 6, W // 2 + 6
    m.fill_box(ex1 - 2, 0, 0, ex2 + 2, 1, 14, C("stone"))
    # arch top (stair-stepped to fake a curve)
    for i, z in enumerate(range(14, 18)):
        inset = i + 1
        m.fill_box(ex1 - 2 + inset, 0, z, ex2 + 2 - inset, 1, z, C("stone"))
    # doorway opening (dark) on the front face
    m.fill_box(ex1, 0, 0, ex2, 0, 12, C("window_dark"))
    # Stepped Art Deco roofline (stacked toward higher z)
    m.fill_box(0, 0, H - 6, W - 1, D - 1, H - 5, C("cream_shadow"))
    m.fill_box(6, 2, H - 4, W - 7, D - 3, H - 3, C("cream"))
    m.fill_box(14, 3, H - 2, W - 15, D - 4, H - 1, C("cream"))
    # "JAI HIND COLLEGE" sign band (glow) across the upper front (y=0)
    m.fill_box(8, 0, H - 8, W - 9, 0, H - 7, C("window_glow"))
    save_and_preview(m, "jaihind_facade")
    print("JAIHIND BUILD OK")


if __name__ == "__main__":
    build()
```

- [ ] **Step 2: Run the builder**

Run:
```bash
cd "/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/voxel/magicavoxel-mcp" && .venv/bin/python "/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/self/resume/scripts/voxel/build_jaihind.py"
```
Expected: `[vox] jaihind_facade.vox ...` + `JAIHIND BUILD OK`.

- [ ] **Step 3: Visually verify**

Read `docs/voxel-previews/jaihind_facade_front.png`. Confirm: cream façade, central arched stone entrance, window grid with 3 lit windows, glowing sign band, stepped roof. Iterate coords + re-run until it reads as an Art Deco college building.

- [ ] **Step 4: Commit**

```bash
git add scripts/voxel/build_jaihind.py public/vox/jaihind_facade.vox
git commit -m "feat(voxel): Jai Hind College facade asset"
```

---

## Task 6: Build props + NPC

**Files:**
- Create: `scripts/voxel/build_props.py`
- Create: `scripts/voxel/build_npc.py`
- Create: `scripts/voxel/build_all.sh`
- Output: `tree.vox`, `lamp.vox`, `ground.vox`, `npc_base.vox`

- [ ] **Step 1: Write `build_props.py`**

```python
# scripts/voxel/build_props.py
"""Environment props: tree, lamp, and a single baked ground slab.

COORDINATE CONVENTION (verified): (x=width, y=depth, z=HEIGHT/up).
`ground.vox` is ONE model (1 draw call) — a grass plane (1 voxel tall in z)
with a warm path stripe down the middle. Sized to span the full Om walk:
200 wide (x) x 256 deep (y) x 1 tall (z). Path stripe = middle 24 cols of x.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def build_tree():
    # x=7, y=7 deep, z=12 tall
    m = new_model(7, 7, 12)
    m.fill_box(3, 3, 0, 3, 3, 6, C("trunk"))         # trunk (vertical in z)
    m.create_sphere(3, 3, 9, 3, C("leaf"))           # canopy (center high in z)
    save_and_preview(m, "tree")


def build_lamp():
    # x=3, y=3 deep, z=10 tall
    m = new_model(3, 3, 10)
    m.fill_box(1, 1, 0, 1, 1, 8, C("lamp_metal"))    # post (vertical)
    m.fill_box(0, 0, 8, 2, 2, 9, C("window_glow"))   # lamp head (top)
    save_and_preview(m, "lamp")


def build_ground():
    GW, GDEEP = 200, 256
    m = new_model(GW, GDEEP, 1)                       # 1 tall in z = flat slab
    m.fill_box(0, 0, 0, GW - 1, GDEEP - 1, 0, C("grass"))     # lawn
    px1, px2 = GW // 2 - 12, GW // 2 + 12
    m.fill_box(px1, 0, 0, px2, GDEEP - 1, 0, C("path_warm"))  # center path stripe
    save_and_preview(m, "ground", preview=False)  # too big to preview cheaply


if __name__ == "__main__":
    build_tree()
    build_lamp()
    build_ground()
    print("PROPS BUILD OK")
```

- [ ] **Step 2: Write `build_npc.py`**

```python
# scripts/voxel/build_npc.py
"""Neutral student NPC (single blue-shirt build).

COORDINATE CONVENTION (verified): (x=width, y=depth, z=HEIGHT/up).
Color variety across NPCs is a Plan 4 refinement (separate .vox variants);
this slice uses one shared build for all crowd members.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def build():
    # x=6, y=4 deep, z=20 tall
    m = new_model(6, 4, 20)
    m.fill_box(1, 1, 0, 2, 2, 7, C("pants_charcoal"))   # left leg
    m.fill_box(3, 1, 0, 4, 2, 7, C("pants_charcoal"))   # right leg
    m.fill_box(0, 0, 8, 5, 3, 15, C("npc_blue"))        # torso
    m.fill_box(1, 0, 16, 4, 3, 19, C("skin"))           # head
    save_and_preview(m, "npc_base")
    print("NPC BUILD OK")


if __name__ == "__main__":
    build()
```

- [ ] **Step 3: Write `build_all.sh`**

```bash
#!/usr/bin/env bash
# scripts/voxel/build_all.sh — regenerate every journey voxel asset.
set -euo pipefail
MCP="/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/voxel/magicavoxel-mcp"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$MCP"
for b in build_om build_jaihind build_props build_npc; do
  echo "=== $b ==="
  .venv/bin/python "$HERE/$b.py"
done
echo "ALL VOXEL ASSETS BUILT"
```

- [ ] **Step 4: Run all builders**

Run:
```bash
chmod +x "/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/self/resume/scripts/voxel/build_all.sh" && "/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/self/resume/scripts/voxel/build_all.sh"
```
Expected: ends with `ALL VOXEL ASSETS BUILT`. Creates tree/lamp/ground/npc_base `.vox`.

- [ ] **Step 5: Verify props + npc previews**

Read `docs/voxel-previews/tree_front.png`, `lamp_front.png`, `npc_base_front.png` (ground skips preview — too large). Confirm tree = trunk+canopy, lamp = post+glow head, npc = simple humanoid. Iterate if needed.

- [ ] **Step 6: Commit**

```bash
git add scripts/voxel/build_props.py scripts/voxel/build_npc.py scripts/voxel/build_all.sh public/vox/tree.vox public/vox/lamp.vox public/vox/ground.vox public/vox/npc_base.vox
git commit -m "feat(voxel): props (tree/lamp/ground) + NPC base assets"
```

---

## Task 7: Compose SceneJaiHind + scene state

**Files:**
- Modify: `src/components/journey/lib/state.ts`
- Create: `src/components/journey/scenes/SceneJaiHind.tsx`
- Modify: `src/components/journey/Stage.tsx`

- [ ] **Step 1: Add the 4 new voxel fields to scene state**

In `src/components/journey/lib/state.ts`, add these fields to the `SceneState` interface (we REUSE the existing `characterX/characterY/characterZ/characterScale/characterRotationY/characterOpacity` for Om's position/visibility and `collegeVisible` for the façade gate — only 4 fields are genuinely new):

```typescript
  /** ===== Jai Hind voxel scene (Plan 3 slice) ===== */
  omWalkPhase: number;   // stride cycles (GSAP increments this; rig reads it)
  omRimLight: number;    // 0..1 rim highlight strength on the hero
  signGlow: number;      // 0..1 "JAI HIND COLLEGE" sign emissive strength
  crowdVisible: number;  // 0..1 NPC crowd gate
```

Add the matching defaults to `initialSceneState`:
```typescript
  omWalkPhase: 0,
  omRimLight: 1,
  signGlow: 1,
  crowdVisible: 1,
```

Do **not** modify `BEAT_CAPTIONS` / `BEAT_NAMES` — they stay `string[]`. Index 1 (`'2024 · JAI HIND COLLEGE · CHURCHGATE'`) is already correct; the timeline forces `beat = 1` so the existing caption + HUD entries render unchanged.

- [ ] **Step 2: Write `SceneJaiHind.tsx`**

```tsx
// src/components/journey/scenes/SceneJaiHind.tsx
import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { VoxModel } from '../voxel/VoxModel';
import { VoxelOmRig, type OmRigHandle } from '../voxel/VoxelOmRig';
import type { SceneState } from '../lib/state';

const V = '/vox/';

function Crowd({ visible }: { visible: number }) {
  // NPC 20 tall @0.08 = 1.6 -> lift y=0.8; spots kept within ground bounds.
  const spots: Array<[number, number, number]> = [
    [-3, 0.8, 5], [3, 0.8, 3], [-4, 0.8, -1], [4, 0.8, 1], [-2, 0.8, -5], [2.5, 0.8, -3],
  ];
  if (visible < 0.5) return null;
  return (
    <group>
      {spots.map((p, i) => (
        <VoxModel key={i} url={`${V}npc_base.vox`} position={p} scale={0.08} rotation={[0, i % 2 ? 0.6 : -0.4, 0]} />
      ))}
    </group>
  );
}

export default function SceneJaiHind({ stateRef }: { stateRef: MutableRefObject<SceneState> }) {
  const omRig = useRef<OmRigHandle>(null);
  const omGroup = useRef<Group>(null);

  useFrame(() => {
    const s = stateRef.current;
    if (omRig.current) omRig.current.setWalkPhase(s.omWalkPhase);
    if (omGroup.current) {
      omGroup.current.position.x = s.characterX;
      omGroup.current.position.z = s.characterZ;
      omGroup.current.visible = s.characterOpacity > 0.01;
    }
  });

  return (
    <group>
      {/* Single baked ground mesh (1 draw call), centered at origin.
          200x256x1 vox @0.1 -> X[-10,10], Z[-12.8,12.8], ~flat at y=0. */}
      <VoxModel url={`${V}ground.vox`} position={[0, 0, 0]} scale={0.1} />
      {/* Facade at far -Z; front face (windows/door) faces +Z toward Om.
          40 tall @0.1 = 4 units -> lift y=2 so base sits on ground. */}
      <VoxModel url={`${V}jaihind_facade.vox`} position={[0, 2, -9]} scale={0.1} />
      {/* Trees flanking the path (12 tall @0.12 = 1.44 -> lift y=0.72) */}
      <VoxModel url={`${V}tree.vox`} position={[-5, 0.72, 4]} scale={0.12} />
      <VoxModel url={`${V}tree.vox`} position={[5, 0.72, 6]} scale={0.12} />
      <VoxModel url={`${V}tree.vox`} position={[-6, 0.72, -2]} scale={0.12} />
      {/* Lamps along the path (10 tall @0.1 = 1.0 -> lift y=0.5) */}
      <VoxModel url={`${V}lamp.vox`} position={[-2, 0.5, 2]} scale={0.1} />
      <VoxModel url={`${V}lamp.vox`} position={[2, 0.5, -4]} scale={0.1} />
      <Crowd visible={stateRef.current.crowdVisible} />
      {/* Hero Om — feet at y=0 by rig construction; X/Z driven by state */}
      <group ref={omGroup}>
        <VoxelOmRig ref={omRig} scale={0.1} />
      </group>
    </group>
  );
}
```

- [ ] **Step 3: Mount in `Stage.tsx`, remove old scene/beat mounts**

In `src/components/journey/Stage.tsx`: remove the imports + JSX for `VoxelOm`, `Scene01Globe`, `Scene02College`, all `beats/*` (Atmosphere/Trophy/StarterKit/PhoneAndPipeline/Hands/Desktop/RecognitionStack/Badge), and the local `Ground` function (SceneJaiHind owns the ground now). Add `import SceneJaiHind from './scenes/SceneJaiHind';` (default export) and mount it as the only scene, passing the existing `stateRef`:

```tsx
import { type MutableRefObject } from 'react';
import type { SceneState } from './lib/state';
import SceneJaiHind from './scenes/SceneJaiHind';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

export default function Stage({ stateRef }: Props) {
  return (
    <>
      {/* light rig retuned for golden hour in Task 8 Step 1 */}
      <ambientLight intensity={0.5} color="#2a2418" />
      {/* ...key/fill/rim lights (Task 8 Step 1)... */}
      <SceneJaiHind stateRef={stateRef} />
    </>
  );
}
```
(Keep `<CameraRig>` where it is — it's mounted in `JourneyMovie.tsx`, not `Stage.tsx`, so no change there.)

- [ ] **Step 4: Run dev server + smoke-check the composition**

```bash
lsof -ti :4321 | xargs -r kill; cd "<repo>"; npm run dev > /tmp/astro-dev.log 2>&1 &
```
Open `http://localhost:4321/journey/`. Confirm (static, pre-animation): façade at far end, lawn+walkway ground, trees, lamps, NPC crowd, Om standing on the path. Check `/tmp/astro-dev.log` for load errors (404 on `.vox` = path/Astro config issue).

- [ ] **Step 5: Commit**

```bash
git add src/components/journey/lib/state.ts src/components/journey/scenes/SceneJaiHind.tsx src/components/journey/Stage.tsx
git commit -m "feat(journey): compose voxel Jai Hind scene"
```

---

## Task 8: Cinematic camera + golden-hour lighting + scroll timeline

**Files:**
- Modify: `src/components/journey/lib/useJourneyTimeline.ts`
- Modify: `src/components/journey/Stage.tsx` (light rig)
- Modify: `src/components/journey/JourneyMovie.tsx` (HUD/caption)

- [ ] **Step 1: Retune the light rig for golden hour**

Replace the light rig in `Stage.tsx` with a golden-hour setup:
```tsx
<ambientLight intensity={0.5} color="#2a2418" />
{/* warm key, low angle from front-right */}
<directionalLight position={[6, 5, 8]} intensity={2.4} color="#ffd29a" castShadow shadow-mapSize={[2048, 2048]} />
{/* cool fill from back-left */}
<directionalLight position={[-6, 4, -4]} intensity={0.5} color="#6c7c9c" />
{/* warm rim/back light behind the façade to backlight Om */}
<directionalLight position={[-4, 6, -10]} intensity={1.4} color="#ff9460" />
```

Also warm up the scene background + fog. These currently live in `JourneyMovie.tsx` (lines 89-90: `<color attach="background" args={['#060609']} />` and `<fog attach="fog" args={['#060609', 10, 26]} />`). Change them to dusk warmth:
```tsx
<color attach="background" args={['#d8a06a']} />
<fog attach="fog" args={['#d8a06a', 12, 60]} />
```

- [ ] **Step 2: Replace the scroll timeline with the Jai Hind approach**

In `src/components/journey/lib/useJourneyTimeline.ts`:

1. **Delete line 7:** `import { MUMBAI_FACING_ROTATION_Y } from '../scenes/Scene01Globe';` (Scene01Globe is archived — leaving this import breaks the build).
2. **Keep** the Lenis setup + `gsap.timeline({...scrollTrigger...})` block (lines 44-71) EXCEPT change `onUpdate` to force the Jai Hind beat:

```typescript
          onUpdate: (self) => {
            sceneRef.current.progress = self.progress;
            sceneRef.current.beat = 1; // single Jai Hind scene -> caption/HUD index 1
          },
```
3. **Replace everything** from `const cam = cameraRef.current;` (line 73) down to just before the `return () => {` cleanup (line 330) with this single-scene body:

```typescript
      const cam = cameraRef.current;
      const scene = sceneRef.current;

      // ====================================================================
      // SCENE · Jai Hind College approach (voxel)
      // World units: ground spans X[-10,10] Z[-12.8,12.8]; facade at z=-9
      // (front faces +Z). Om walks the path from z=+9 (far, near camera) to
      // z=-3 (near the entrance). Camera follows from behind/side.
      // CameraState fields: x,y,z,lookAtX,lookAtY,lookAtZ,fov
      // ====================================================================

      // Initial state (also set so reverse-scroll to 0 is correct)
      gsap.set(cam, { x: 0, y: 4.5, z: 12, lookAtX: 0, lookAtY: 1.5, lookAtZ: -4, fov: 50 });
      scene.characterX = 0;
      scene.characterZ = 9;
      scene.characterOpacity = 1;
      scene.collegeVisible = 1;
      scene.crowdVisible = 1;
      scene.omWalkPhase = 0;
      scene.signGlow = 1;
      scene.captionOpacity = 0;

      tl.addLabel('jh-start', 0)
        // Establishing descent + push-in toward the building
        .to(cam, { y: 2.2, z: 8, lookAtY: 1.4, fov: 45, duration: 2, ease: 'power2.inOut' }, 0)
        // Caption fades up
        .to(scene, { captionOpacity: 1, duration: 0.6 }, 0.4)
        // Om walks: drive walk-cycle (8 strides) + advance position z9 -> z-3
        .to(scene, { omWalkPhase: 8, duration: 6, ease: 'none' }, 0)
        .to(scene, { characterZ: -3, duration: 6, ease: 'power1.inOut' }, 0)
        // Camera tracks Om to a 3/4 hero framing (move to his side)
        .to(
          cam,
          { x: 4, z: 2, y: 1.8, lookAtX: 0, lookAtY: 1.2, lookAtZ: -6, duration: 4, ease: 'power1.inOut' },
          2,
        )
        // Sign glow pulse near arrival
        .to(scene, { signGlow: 1.4, duration: 1, yoyo: true, repeat: 1 }, 5)
        // Settle on the entrance arch
        .to(
          cam,
          { x: 0, z: -2, y: 1.8, lookAtX: 0, lookAtY: 1.8, lookAtZ: -9, fov: 38, duration: 2, ease: 'power2.inOut' },
          6,
        );
```

(Field names `x/y/z/lookAtX/lookAtY/lookAtZ/fov` match `CameraState`; `characterX/characterZ/characterOpacity/collegeVisible/captionOpacity` already exist; `omWalkPhase/signGlow/crowdVisible/omRimLight` were added in Task 7 Step 1. The `cleanup return` and the `useGSAP(..., { scope, dependencies })` wrapper stay unchanged.)

- [ ] **Step 2b: Apply omRimLight + signGlow to materials**

In `SceneJaiHind.tsx` `useFrame`, drive the façade sign emissive and Om rim via material/emissive intensity from `s.signGlow` / `s.omRimLight`. Minimal version: scale the sign InstancedMesh's material `emissiveIntensity` — since `useVox` uses `MeshStandardMaterial`, set `material.emissive` to warm and `emissiveIntensity = s.signGlow` on the façade mesh, and add a thin back-light already covers Om's rim. (If per-mesh emissive control is awkward this pass, keep `signGlow` as a no-op and rely on the lit-window `window_glow` voxels + rim light; note it as a Plan 4 refinement.)

- [ ] **Step 3: (Optional) tidy `JourneyMovie.tsx`**

No structural change is required — the rAF loop already renders `BEAT_CAPTIONS[s.beat]` and the timeline forces `beat = 1`, so the caption reads `'2024 · JAI HIND COLLEGE · CHURCHGATE'` automatically. The 3 `HeroTitle` overlays stay dormant at opacity 0 (nothing tweens `hero02/07/12Opacity` in this slice) — harmless. Leave the dev HUD as-is; it now reports the Jai Hind camera + `beat 1`. (You MAY repoint the `hero02Ref` HeroTitle copy to a Jai Hind title later, but that's polish, not required for this task.)

- [ ] **Step 4: Run dev server + scrub the whole scene**

```bash
lsof -ti :4321 | xargs -r kill; cd "<repo>"; npm run dev > /tmp/astro-dev.log 2>&1 &
```
Open `http://localhost:4321/journey/`, scroll slowly start→end. Verify: camera descends + pushes in, Om walks (legs/arms swing, slight bob) from far path to near the entrance, camera tracks to a hero 3/4 then settles on the arch, golden-hour warmth + fog reads cinematic. Scrub backward — everything reverses smoothly (no drift, since state is tweened not eased).

- [ ] **Step 5: Tune values until it matches the reference feel**

Compare against `/tmp/journey-frames/entering-college/` + `around-the-college/`. Adjust camera keys, walk speed (`omWalkPhase` target + `omPosZ` range), fog distances, light intensities. Re-scrub. Iterate. No commit until it reads like the references.

- [ ] **Step 6: Commit**

```bash
git add src/components/journey/lib/useJourneyTimeline.ts src/components/journey/Stage.tsx src/components/journey/JourneyMovie.tsx
git commit -m "feat(journey): cinematic camera + golden-hour lighting for Jai Hind scene"
```

---

## Task 9: Archive old scaffold + final verification

**Files:**
- Move: old scenes/beats/VoxelOm → `src/components/journey/_archive/`
- Modify: any lingering imports
- Run: full test + build

- [ ] **Step 1: Move old files to `_archive/`**

```bash
cd "<repo>/src/components/journey"
mkdir -p _archive/beats
git mv scenes/Scene01Globe.tsx _archive/Scene01Globe.tsx
git mv scenes/Scene02College.tsx _archive/Scene02College.tsx
git mv VoxelOm.tsx _archive/VoxelOm.tsx
git mv beats/*.tsx _archive/beats/ 2>/dev/null || true
```

- [ ] **Step 2: Grep for dangling imports of archived files**

Run: `grep -rn "Scene01Globe\|Scene02College\|/VoxelOm\|journey/beats" src/ --include=*.tsx --include=*.ts`
Expected: no results outside `_archive/`. Fix any that remain (should already be removed in Task 7).

- [ ] **Step 3: Run the full journey test suite**

Run: `npx vitest run tests/journey/`
Expected: all pass (`useVox` conversion + `walkPose` tests).

- [ ] **Step 4: Production build check**

Run: `npm run build`
Expected: build succeeds, `/journey` page emitted, no missing-module errors. Confirm `.vox` files are copied to `dist/vox/` (Astro copies `public/` verbatim).

- [ ] **Step 5: Remove the smoke_test asset (no longer needed)**

```bash
git rm public/vox/smoke_test.vox
git commit -m "chore(voxel): drop smoke_test asset"
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "refactor(journey): archive pre-voxel scaffold; Jai Hind slice is the live scene"
```

---

## Testing Strategy

- **Pure logic → unit tests (Vitest):** VOX Z-up→Y-up conversion (Task 2), walk-cycle pose math (Task 4). These are the only deterministic, non-visual pieces and they're the ones most likely to silently break.
- **Voxel assets → 6-angle PNG previews:** every builder calls `save_and_preview`; we Read the PNGs and eyeball them before integration. This catches "the head is inside-out" before it ever reaches the browser.
- **Scene composition + animation → manual dev-server verification:** R3F scenes + GSAP scroll are inherently visual/temporal; we verify by scrubbing `/journey` and comparing to reference frames. The dev HUD (camera + beat readout) is the instrument.
- **Build integrity → `npm run build`:** guarantees the `.vox` runtime loading path and Astro static-copy work in production, not just dev.

## Risks & Mitigations

- **`VOXLoader` chunk shape differs from assumed `{data,size,palette}`:** Task 2 Step 4 (the test) + Step on dev verify will surface this immediately; if the API differs, read `VOXLoader.js` (already located) and adapt `chunkToInstancedMesh`. Fallback: use three's bundled `VOXMesh` directly.
- **Per-instance color not supported on the InstancedMesh material path:** if `instanceColor` doesn't render, switch material to `MeshStandardMaterial({ vertexColors: true })` or set `mesh.instanceColor` explicitly (already in code). Worst case: one `.vox` → one mesh with a flat material per dominant color (acceptable for this style).
- **Perf with many meshes:** ground is one baked `ground.vox` (1 draw call). Remaining `VoxModel`s: façade + 3 trees + 2 lamps + 6 NPCs + 6 Om parts ≈ 18 InstancedMeshes — well within budget. If a later scene adds many props, batch repeated props into a single `.vox`.
- **Rig pivot offsets wrong:** Task 4 Step 5 is explicit visual tuning time; don't commit until the silhouette is right.

## Out of Scope (→ Plan 4)

Scene 01 Mumbai aerial dive (voxel clouds + Marine Drive + Art Deco skyline + voxel mountains), publishing-paper interior, graduation ceremony (gown + mortarboard + fireworks + letterbox), Deloitte arrival (glass tower + revolving door + lanyard). All reuse the Plan 3 primitives (loader, rig, builders, lighting, timeline pattern).
