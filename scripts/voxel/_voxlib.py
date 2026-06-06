"""Shared helpers for building the journey voxel assets.

Run builders with CWD = the MagicaVoxel-MCP project so `vox_utils` imports:
    cd ".../pet/voxel/magicavoxel-mcp" && .venv/bin/python <builder>
Each builder injects this file's dir onto sys.path (see builder header).

COORDINATE CONVENTION (verified end-to-end against three's buildMesh):
    vox_utils VoxelModel(sx, sy, sz) maps to three-space as:
        x (1st, "width")  -> three X (left/right)
        y (2nd, "depth")  -> three Z (depth, forward/back)
        z (3rd, "height") -> three Y (UP / vertical)
    => Author the VERTICAL extent in the z coord. Front face = y = 0.
    buildMesh also centers each model at its own origin in three-space.
"""
import os
import sys
from pathlib import Path

# vox_utils lives in the MagicaVoxel-MCP project. Add it to sys.path so the
# builders run from ANY working directory. Override with VOX_MCP_DIR if needed.
_DEFAULT_MCP_DIR = (
    "/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)"
    "/Documents/projects/pet/voxel/magicavoxel-mcp"
)
_MCP_DIR = os.getenv("VOX_MCP_DIR", _DEFAULT_MCP_DIR)
if _MCP_DIR not in sys.path:
    sys.path.insert(0, _MCP_DIR)

from vox_utils import VoxelModel, write_vox_file, render_model_all_angles  # noqa: E402

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
    # --- Mumbai cityscape + sky (Plan 3.1) ---
    "cloud_white": (17, 245, 244, 238),
    "cloud_shadow": (18, 206, 210, 222),
    "mountain_green": (19, 86, 128, 72),
    "mountain_rock": (20, 128, 98, 140),
    "ocean_blue": (21, 44, 102, 144),
    "sand": (22, 214, 196, 150),
    "tower_cream": (23, 226, 214, 188),
    "tower_shadow": (24, 196, 182, 152),
    "palm_green": (25, 64, 150, 84),
    "car_red": (26, 176, 64, 58),
    "car_silver": (27, 198, 204, 212),
    "road_dark": (28, 52, 52, 60),
    # --- realism pass ---
    "leaf_dark": (29, 44, 92, 50),
    "leaf_light": (30, 110, 168, 92),
    "foam_white": (31, 234, 238, 236),
    "water_shallow": (32, 104, 170, 182),
    "wet_sand": (33, 188, 168, 124),
    "tower_warm": (34, 214, 196, 162),
    "car_blue": (35, 70, 104, 168),
    "crest_blue": (36, 38, 64, 128),
}


def C(name: str) -> int:
    """Voxel color index to author with for a palette name.

    NOTE the +1: vox_utils writes the RGBA chunk one slot below what three's
    VOXLoader (which follows the .vox 1-based-palette spec) reads back. Probed
    end-to-end: a voxel authored with index `i+1` renders three's palette[i+1],
    which holds the color set_palette_color(i) wrote. So we set palette at `idx`
    (in new_model) but author voxels at `idx+1` to land on the right color.
    """
    return PALETTE[name][0] + 1


def new_model(sx: int, sy: int, sz: int) -> VoxelModel:
    """Create a model and stamp the full project palette into it.

    Remember: sz is the VERTICAL (up) extent. See module docstring.
    """
    m = VoxelModel(sx, sy, sz)
    for _name, (idx, r, g, b) in PALETTE.items():
        m.set_palette_color(idx, r, g, b, 255)
    return m


def save_and_preview(model: VoxelModel, name: str, preview: bool = True) -> Path:
    """Write <name>.vox to public/vox and render 6-angle PNGs to docs/voxel-previews.

    Also writes <name>_sheet.png: a 3x2 contact sheet, each angle upscaled
    (nearest-neighbor) to a readable size, since the raw renders are 1px/voxel.
    """
    vox_path = VOX_OUT / f"{name}.vox"
    write_vox_file(vox_path, model)
    count = model.get_voxel_count()
    bounds = model.get_bounds()
    print(f"[vox] {name}.vox  voxels={count}  bounds={bounds}")
    if preview:
        try:
            results = render_model_all_angles(model, PREVIEW_OUT / name)
            _contact_sheet(name, results)
            print(f"[preview] {name} -> docs/voxel-previews/{name}_sheet.png")
        except Exception as e:  # noqa: BLE001
            print(f"[preview] skipped ({e})")
    return vox_path


def _contact_sheet(name: str, results: dict) -> None:
    """Tile the 6 angle PNGs into one upscaled, labeled contact sheet."""
    from PIL import Image, ImageDraw  # local import; Pillow is a builder dep

    cell = 200          # upscaled cell size (px)
    pad = 8
    label_h = 16
    order = ["front", "back", "left", "right", "top", "bottom"]
    cols, rows = 3, 2
    sheet_w = cols * cell + (cols + 1) * pad
    sheet_h = rows * (cell + label_h) + (rows + 1) * pad
    # Neutral mid-gray so BOTH near-black (hair) and cream voxels stay legible.
    sheet = Image.new("RGB", (sheet_w, sheet_h), (122, 122, 130))
    draw = ImageDraw.Draw(sheet)

    for i, angle in enumerate(order):
        path = results.get(angle) if isinstance(results, dict) else None
        if path is None:
            path = PREVIEW_OUT / f"{name}_{angle}.png"
        if not Path(path).exists():
            continue
        img = Image.open(path).convert("RGBA")
        # Fit into cell preserving aspect, nearest-neighbor (crisp voxels)
        scale = min(cell / img.width, cell / img.height)
        nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
        img = img.resize((nw, nh), Image.NEAREST)
        cx = pad + (i % cols) * (cell + pad)
        cy = pad + (i // cols) * (cell + label_h + pad)
        draw.text((cx, cy), angle, fill=(255, 210, 154))
        ox = cx + (cell - nw) // 2
        oy = cy + label_h + (cell - nh) // 2
        sheet.paste(img, (ox, oy), img)  # use alpha as mask -> empty = gray

    sheet.save(PREVIEW_OUT / f"{name}_sheet.png")
