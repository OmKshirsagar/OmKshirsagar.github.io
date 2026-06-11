"""Dense desk props for the office scene — matches the `om-working` and
`fastapi-2` reference clips: a blue-backlit mechanical keyboard, a coffee mug,
a small potted plant, and a pen holder.

COORDINATE CONVENTION (verified): axes are (x=width, y=depth, z=HEIGHT/up).
Vertical extent is ALWAYS the z coord. Front face = y = 0.

These are authored DENSE (many small voxels) on purpose; pick the display
scale per-prop in the React scene. Run via the MagicaVoxel-MCP venv:
    cd ".../pet/voxel/magicavoxel-mcp" && .venv/bin/python <this>
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


# ---- small self-contained solid helpers (no reliance on optional vox API) ----
def disk(m, cx, cy, z, r, color, r_in=-1.0):
    """Stamp a filled (or ring, if r_in>=0) disk in the XY plane at height z."""
    r2, ri2 = r * r, r_in * r_in
    x0, x1 = int(cx - r - 1), int(cx + r + 1)
    y0, y1 = int(cy - r - 1), int(cy + r + 1)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if d2 <= r2 and (r_in < 0 or d2 >= ri2):
                m.set_voxel(x, y, z, color)


def cyl(m, cx, cy, z0, z1, r, color, r_in=-1.0):
    for z in range(z0, z1 + 1):
        disk(m, cx, cy, z, r, color, r_in)


def ball(m, cx, cy, cz, r, color):
    r2 = r * r
    for x in range(int(cx - r - 1), int(cx + r + 2)):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for z in range(int(cz - r - 1), int(cz + r + 2)):
                if (x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2 <= r2:
                    if min(x, y, z) >= 0:
                        m.set_voxel(x, y, z, color)


def build_keyboard():
    # Wide, low mechanical keyboard. x=40 wide, y=15 deep, z=5 tall.
    W, D, H = 40, 15, 5
    m = new_model(W, D, H)
    # chassis
    m.fill_box(0, 0, 0, W - 1, D - 1, 1, C("key_dark"))
    # blue backlight strip glowing out from under the keys (front + perimeter)
    m.fill_box(0, 0, 1, W - 1, 0, 1, C("key_glow"))          # front lip glow
    m.fill_box(0, 0, 2, W - 1, D - 1, 2, C("key_glow"))      # under-key glow bed
    # key grid: 1x1 keycaps with 1-vox gaps on top of the glow bed (z=3..4)
    for kx in range(2, W - 2, 2):
        for ky in range(2, D - 1, 2):
            m.fill_box(kx, ky, 3, kx, ky, 4, C("key_dark"))
    save_and_preview(m, "keyboard")


def build_mug():
    # Coffee mug: hollow cylinder + handle + coffee surface. x=y=12, z=12.
    S, H = 12, 12
    m = new_model(S, S, H)
    cx = cy = S / 2 - 0.5
    cyl(m, cx, cy, 0, H - 2, 5.0, C("mug_white"), r_in=3.6)  # walls
    disk(m, cx, cy, 0, 5.0, C("mug_white"))                  # base
    disk(m, cx, cy, H - 3, 3.8, C("coffee"))                 # coffee surface
    # handle (right side, a C-shape in the x/z plane at mid-depth)
    hy = int(cy)
    for (hx, hz) in [(10, 3), (11, 4), (11, 5), (11, 6), (11, 7), (10, 8), (9, 9)]:
        m.set_voxel(hx, hy, hz, C("mug_white"))
        m.set_voxel(hx, hy + 1, hz, C("mug_white"))
    save_and_preview(m, "mug")


def build_plant():
    # Small potted plant. x=y=12 pot, foliage up to z~20.
    S, H = 12, 22
    m = new_model(S, S, H)
    cx = cy = S / 2 - 0.5
    # tapered terracotta pot (z 0..6)
    for z in range(0, 7):
        r = 3.4 + (6 - z) * 0.25
        disk(m, cx, cy, z, r, C("pot_clay"))
    disk(m, cx, cy, 6, 3.0, C("coffee"))  # soil
    # foliage: a few overlapping leaf balls (two greens for depth)
    ball(m, cx, cy, 13, 4.6, C("plant_leaf"))
    ball(m, cx - 2, cy + 1, 11, 3.0, C("plant_leaf_dk"))
    ball(m, cx + 2, cy - 1, 12, 3.0, C("plant_leaf_dk"))
    ball(m, cx, cy, 18, 3.2, C("plant_leaf"))
    save_and_preview(m, "plant")


def build_penholder():
    # Pen cup + a few pens sticking up. x=y=9, z=16.
    S, H = 9, 16
    m = new_model(S, S, H)
    cx = cy = S / 2 - 0.5
    cyl(m, cx, cy, 0, 6, 3.4, C("steel"), r_in=2.2)  # cup wall
    disk(m, cx, cy, 0, 3.4, C("steel"))              # base
    # pens (thin columns) in assorted colors
    pens = [(3, 4, "npc_red", 14), (5, 4, "lanyard_blue", 15), (4, 5, "grad_gold", 13), (4, 3, "deloitte_green", 14)]
    for (px, py, col, top) in pens:
        m.fill_box(px, py, 4, px, py, top, C(col))
    save_and_preview(m, "penholder")


if __name__ == "__main__":
    build_keyboard()
    build_mug()
    build_plant()
    build_penholder()
    print("DESK PROPS BUILD OK")
