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
    "glass_tint": (37, 46, 64, 82),
    # --- graduation ---
    "gown_navy": (38, 42, 56, 102),
    "grad_gold": (39, 226, 186, 74),
    "stole_red": (40, 178, 52, 52),
    # --- publish-paper / interior desk ---
    "laptop_silver": (41, 212, 210, 206),
    "screen_bezel": (42, 34, 32, 36),
    "desk_wood": (43, 150, 98, 58),
    "lamp_warm": (44, 255, 226, 158),
    # --- Deloitte (tower, office, lanyard, trophy) ---
    "deloitte_green": (45, 134, 188, 37),
    "glass_blue": (46, 150, 186, 214),
    "glass_blue_dk": (47, 92, 130, 166),
    "lanyard_blue": (48, 36, 92, 174),
    "monitor_dark": (49, 28, 30, 38),
    "steel": (50, 150, 156, 168),
    # --- dense desk props (om-working / fastapi-2 reference clips) ---
    "key_dark": (51, 36, 38, 46),       # mechanical keyboard body/keys
    "key_glow": (52, 96, 196, 236),     # blue keyboard backlight strip
    "mug_white": (53, 230, 226, 216),   # coffee mug
    "pot_clay": (54, 178, 96, 66),      # terracotta plant pot
    "plant_leaf": (55, 92, 158, 88),    # foliage
    "plant_leaf_dk": (56, 54, 112, 64), # foliage shadow
    "coffee": (57, 78, 50, 34),         # coffee liquid
    "screen_glow_grn": (58, 120, 220, 110),  # rising-chart green
    # --- Deloitte plaza (entering-deloitte clip): bronze, glass, paving ---
    "bronze": (59, 178, 138, 92),       # warm entrance/door metal
    "bronze_dk": (60, 132, 98, 62),     # bronze shadow / mullions
    "paving": (61, 214, 204, 186),      # plaza stone
    "paving_dk": (62, 190, 178, 158),   # plaza joint lines
    "mat_brown": (63, 92, 70, 50),      # entrance doormat
    "hedge": (64, 74, 120, 70),         # planter hedges
    "sun_glow": (65, 255, 240, 205),    # sunset bloom disc
    "glass_warm": (66, 196, 188, 196),  # sun-reflecting glass highlight
    # --- the real La Tour Deloitte: angular dark-blue glass tower + sign ---
    "dnavy": (67, 46, 66, 102),         # Deloitte tower dark-blue glass
    "dnavy_lit": (68, 120, 152, 196),   # lit/sun-reflecting window
    "dnavy_mull": (69, 30, 42, 66),     # vertical mullion lines
    "sign_body": (70, 38, 42, 52),      # sign monolith (dark charcoal)
    "deloitte_dot": (71, 134, 188, 37), # the green Deloitte "." dot
    # --- open-plan office (training scene): ergonomic chair, desks, ceiling ---
    "chair_dark": (72, 34, 36, 44),     # chair mesh/fabric shadow + seams
    "chair_mid": (73, 60, 64, 76),      # chair mesh/fabric face
    "chair_metal": (74, 158, 164, 178), # polished base / arms / gas lift
    "chair_wheel": (75, 26, 26, 32),    # castor wheels
    "desk_top": (76, 222, 214, 200),    # light laminate desk surface
    "desk_leg": (77, 90, 96, 108),      # steel desk leg
    "ceiling": (78, 232, 230, 224),     # office ceiling panel
    "panel_light": (79, 255, 248, 226), # recessed ceiling light glow
    "carpet": (80, 132, 120, 104),      # warm office carpet
    "wood_warm": (81, 170, 120, 70),    # warm wood accent (desk edge)
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
