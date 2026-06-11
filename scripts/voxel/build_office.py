"""Open-plan office assets for the TRAINING scene (SHOT 11), matching the
`training-video` / `om-working` reference clips: an ergonomic mesh office
chair, a clean laminate workstation desk, and a fresh notebook.

Authored DENSE (small voxels, lots of detail) for the GTA-ish fidelity bar;
pick the display scale per-asset in the React scene.

COORDINATE CONVENTION (see _voxlib): x=width, y=depth (front face = y=0),
z=HEIGHT/up. Run via the MagicaVoxel-MCP venv:
    cd ".../pet/voxel/magicavoxel-mcp" && .venv/bin/python <this>
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def cyl(m, cx, cy, z0, z1, r, color, r_in=-1.0):
    """Filled (or hollow ring) vertical cylinder, z0..z1 inclusive."""
    r2, ri2 = r * r, r_in * r_in
    for z in range(z0, z1 + 1):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            for y in range(int(cy - r - 1), int(cy + r + 2)):
                d2 = (x - cx) ** 2 + (y - cy) ** 2
                if d2 <= r2 and (r_in < 0 or d2 >= ri2):
                    if x >= 0 and y >= 0 and z >= 0:
                        m.set_voxel(x, y, z, color)


def thick_dot(m, x, y, z0, z1, color, rad=1):
    for z in range(z0, z1 + 1):
        for dx in range(-rad, rad + 1):
            for dy in range(-rad, rad + 1):
                if x + dx >= 0 and y + dy >= 0 and z >= 0:
                    m.set_voxel(x + dx, y + dy, z, color)


def build_office_chair():
    """Ergonomic mesh task chair: 5-star castor base, gas lift, contoured seat,
    reclined mesh backrest with lumbar + headrest, padded armrests."""
    W, D, H = 26, 28, 52
    m = new_model(W, D, H)
    cx, cy = 13, 14

    # ---- 5-star base with castors (z 0..3) ----
    R = 12
    for k in range(5):
        a = math.radians(90 + k * 72)
        dx, dy = math.cos(a), math.sin(a)
        for r in range(0, R + 1):
            x = int(round(cx + dx * r))
            y = int(round(cy + dy * r))
            # 2-wide tapering arm, sitting at z=2..3
            m.fill_box(x, y, 2, x + 1, y + 1, 3, C("chair_metal"))
            if r >= R - 1:  # castor head + wheel at the tip
                m.fill_box(x, y, 1, x + 1, y + 1, 3, C("chair_dark"))
                thick_dot(m, x, y, 0, 1, C("chair_wheel"), rad=1)

    # ---- gas-lift column (z 3..19) ----
    cyl(m, cx, cy, 3, 8, 3.2, C("chair_dark"))           # bell housing
    cyl(m, cx, cy, 8, 19, 2.2, C("chair_metal"))          # polished piston
    cyl(m, cx, cy, 12, 13, 2.6, C("chair_dark"))          # seam ring

    # ---- seat pan (z 19..24): contoured dish, rounded front corners ----
    sx0, sx1, sy0, sy1 = cx - 8, cx + 8, cy - 8, cy + 8
    for x in range(sx0, sx1 + 1):
        for y in range(sy0, sy1 + 1):
            # round the front (low-y) corners
            if y <= sy0 + 1 and (x <= sx0 + 1 or x >= sx1 - 1):
                continue
            m.fill_box(x, y, 19, x, y, 20, C("chair_metal"))   # underframe
            edge = (x in (sx0, sx1)) or (y in (sy0, sy1))
            m.fill_box(x, y, 21, x, y, 23, C("chair_mid"))     # cushion body
            m.set_voxel(x, y, 24 if edge else 23, C("chair_mid"))  # dished top
    # darker seam piping around the seat rim
    for x in range(sx0, sx1 + 1):
        m.set_voxel(x, sy0, 23, C("chair_dark"))
        m.set_voxel(x, sy1, 23, C("chair_dark"))
    for y in range(sy0, sy1 + 1):
        m.set_voxel(sx0, y, 23, C("chair_dark"))
        m.set_voxel(sx1, y, 23, C("chair_dark"))

    # ---- backrest (z 26..49): NARROW contoured mesh, 2 deep, lumbar+headrest ----
    back_y = sy1 - 1       # back sits just inside the rear of the seat
    for z in range(26, 50):
        t = (z - 26) / 23.0
        recline = int(round(t * 5))           # lean back as it rises
        y = back_y + recline
        if z < 33:
            hw = 5                              # lumbar / waist (narrow)
        elif z < 44:
            hw = 7                              # shoulder span
        elif z < 47:
            hw = 5                              # neck taper
        else:
            hw = 4                              # headrest cap
        # 2-voxel-deep panel: front face = mesh (rib pattern), back = frame
        for x in range(cx - hw, cx + hw + 1):
            on_edge = x in (cx - hw, cx + hw)
            face = C("chair_dark") if (on_edge or x % 3 == 0) else C("chair_mid")
            m.set_voxel(x, y, z, face)              # front (mesh) face
            m.set_voxel(x, y + 1, z, C("chair_dark"))  # rear frame
        # polished side rails
        m.set_voxel(cx - hw, y + 1, z, C("chair_metal"))
        m.set_voxel(cx + hw, y + 1, z, C("chair_metal"))
    # lumbar bump pushes the waist mesh forward for support
    for z in range(29, 33):
        for x in range(cx - 4, cx + 5):
            m.set_voxel(x, back_y - 1, z, C("chair_mid"))

    # ---- armrests (z 24..30) both sides, padded tops ----
    for sgn in (-1, 1):
        ax = cx + sgn * 9
        m.fill_box(ax, cy - 5, 24, ax, cy + 3, 29, C("chair_metal"))     # upright
        m.fill_box(ax - 1, cy - 6, 30, ax + 1, cy + 4, 31, C("chair_dark"))  # pad

    save_and_preview(m, "office_chair")


def build_notebook():
    """A fresh closed notebook with a pen resting on top (first-day desk prop)."""
    W, D, H = 16, 22, 4
    m = new_model(W, D, H)
    # cover (navy) + page block (cream) sandwich
    m.fill_box(0, 0, 0, W - 1, D - 1, 0, C("gown_navy"))      # back cover
    m.fill_box(0, 0, 1, W - 1, D - 1, 2, C("cream"))          # pages
    m.fill_box(0, 0, 3, W - 1, D - 1, 3, C("gown_navy"))      # front cover
    # page striations on the open edge (front, y=0)
    for x in range(1, W - 1, 2):
        m.set_voxel(x, 0, 1, C("cream_shadow"))
        m.set_voxel(x, 0, 2, C("cream_shadow"))
    # elastic band across the cover
    m.fill_box(W - 5, 0, 3, W - 5, D - 1, 3, C("stole_red"))
    # pen lying diagonally on top
    for t in range(12):
        x = 2 + t
        y = 4 + t
        if x < W and y < D:
            m.set_voxel(x, y, 4, C("steel") if t < 9 else C("grad_gold"))
    save_and_preview(m, "notebook")


def build_ceiling_panel():
    """A recessed LED ceiling light panel (emissive look via bright color)."""
    W, D, H = 24, 24, 3
    m = new_model(W, D, H)
    m.fill_box(0, 0, 0, W - 1, D - 1, 0, C("steel"))            # housing
    m.fill_box(1, 1, 1, W - 2, D - 2, 2, C("panel_light"))     # diffuser
    save_and_preview(m, "ceiling_panel")


if __name__ == "__main__":
    build_office_chair()
    build_notebook()
    build_ceiling_panel()
