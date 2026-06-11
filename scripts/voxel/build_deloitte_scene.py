"""Dense hero assets for the `entering-deloitte` plaza recreation:
  - tower_round.vox  : the cylindrical glass tower (hero backdrop)
  - tower_office.vox : a rectangular glass office tower (flanking buildings)
  - revolving_door.vox (rebuilt) : bronze revolving-door drum + flat roof canopy

COORDINATE CONVENTION (see _voxlib): (x=width, y=depth, z=HEIGHT/up).
Author the VERTICAL extent in z. Run via the MagicaVoxel-MCP venv:
    cd ".../pet/voxel/magicavoxel-mcp" && .venv/bin/python <this>
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def ring(m, cx, cy, z0, z1, r_out, r_in, color):
    """Hollow cylinder wall between r_in and r_out, from z0..z1."""
    ro2, ri2 = r_out * r_out, r_in * r_in
    for x in range(int(cx - r_out - 1), int(cx + r_out + 2)):
        for y in range(int(cy - r_out - 1), int(cy + r_out + 2)):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if ri2 <= d2 <= ro2 and min(x, y) >= 0:
                m.fill_box(x, y, z0, x, y, z1, color)


def disk(m, cx, cy, z, r, color, r_in=-1.0):
    r2, ri2 = r * r, r_in * r_in
    for x in range(int(cx - r - 1), int(cx + r + 2)):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if d2 <= r2 and (r_in < 0 or d2 >= ri2) and min(x, y) >= 0:
                m.set_voxel(x, y, z, color)


def ball(m, cx, cy, cz, r, color):
    """Solid sphere of radius r centred at (cx,cy,cz)."""
    r2 = r * r
    for x in range(int(cx - r - 1), int(cx + r + 2)):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for z in range(int(cz - r - 1), int(cz + r + 2)):
                if (x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2 <= r2 and min(x, y, z) >= 0:
                    m.set_voxel(x, y, z, color)


def build_tower_round():
    """Cylindrical glass highrise with strong horizontal floor banding +
    vertical mullions, like the hero tower in the clip. Hollow shell."""
    R = 22
    S = R * 2 + 3
    H = 150
    m = new_model(S, S, H)
    cx = cy = S / 2 - 0.5
    # glass shell
    ring(m, cx, cy, 0, H - 1, R, R - 3, C("glass_blue"))
    # horizontal floor slabs every 7 (steel/bronze bands -> the banded look)
    for z in range(4, H, 7):
        ring(m, cx, cy, z, z, R + 0.4, R - 3.4, C("steel"))
    # vertical mullions: darken whole columns at ~16 angles around the ring
    import math
    for a in range(0, 360, 12):
        rad = math.radians(a)
        mx = round(cx + (R - 1) * math.cos(rad))
        my = round(cy + (R - 1) * math.sin(rad))
        m.fill_box(mx, my, 0, mx, my, H - 1, C("glass_blue_dk"))
    # a few warm-lit floors (sunset reflection) on one side
    for z in range(30, H - 20, 28):
        for a in range(300, 380, 12):
            rad = math.radians(a % 360)
            mx = round(cx + (R - 2) * math.cos(rad))
            my = round(cy + (R - 2) * math.sin(rad))
            m.fill_box(mx, my, z, mx, my, z + 3, C("glass_warm"))
    # solid crown cap
    ring(m, cx, cy, H - 3, H - 1, R, R - 5, C("glass_blue_dk"))
    save_and_preview(m, "tower_round")


def build_tower_office():
    """A rectangular blue-glass office tower (HOLLOW shell — just the 4 glass
    facades + a window grid, so it's ~10x lighter than a solid massing). Flanks
    the plaza. Front face = y = 0."""
    W, D, H = 46, 30, 120
    m = new_model(W, D, H)
    # 4 glass facades (1-voxel-thick shell)
    m.fill_box(0, 0, 0, W - 1, 0, H - 1, C("glass_blue"))          # front
    m.fill_box(0, D - 1, 0, W - 1, D - 1, H - 1, C("glass_blue"))  # back
    m.fill_box(0, 0, 0, 0, D - 1, H - 1, C("glass_blue"))          # left
    m.fill_box(W - 1, 0, 0, W - 1, D - 1, H - 1, C("glass_blue"))  # right
    m.fill_box(0, 0, 0, W - 1, D - 1, 0, C("glass_blue_dk"))       # base cap
    m.fill_box(0, 0, H - 1, W - 1, D - 1, H - 1, C("glass_blue_dk"))  # roof cap
    # window grid lines on front + back: mullions every 5, floors every 7
    for x in range(0, W, 5):
        m.fill_box(x, 0, 0, x, 0, H - 1, C("glass_blue_dk"))
        m.fill_box(x, D - 1, 0, x, D - 1, H - 1, C("glass_blue_dk"))
    for z in range(0, H, 7):
        m.fill_box(0, 0, z, W - 1, 0, z, C("glass_blue_dk"))
        m.fill_box(0, D - 1, z, W - 1, D - 1, z, C("glass_blue_dk"))
        m.fill_box(0, 0, z, 0, D - 1, z, C("glass_blue_dk"))
        m.fill_box(W - 1, 0, z, W - 1, D - 1, z, C("glass_blue_dk"))
    # warm-lit windows scattered (sunset)
    for (lx, lz) in [(6, 18), (16, 32), (26, 25), (36, 46), (11, 60), (31, 74), (21, 95)]:
        m.fill_box(lx, 0, lz, lx + 2, 0, lz + 3, C("glass_warm"))
    save_and_preview(m, "tower_office", preview=False)


def build_revolving_door():
    """Bronze revolving-door pavilion: bronze base ring + glass cylinder +
    bronze mullion posts + 4 glass vanes + a flat overhanging bronze roof."""
    R = 15
    S = R * 2 + 3
    H = 30
    m = new_model(S, S, H)
    cx = cy = S // 2
    import math
    ring(m, cx, cy, 0, 1, R, R - 3, C("bronze"))
    # glass drum wall
    ring(m, cx, cy, 1, 24, R - 1, R - 3, C("glass_blue"))
    # bronze vertical mullion posts at 8 points
    for a in range(0, 360, 45):
        rad = math.radians(a)
        mx = round(cx + (R - 2) * math.cos(rad))
        my = round(cy + (R - 2) * math.sin(rad))
        m.fill_box(mx, my, 1, mx, my, 25, C("bronze_dk"))
    # 4 glass revolving vanes (a cross) inside
    m.fill_box(cx, cy - R + 3, 2, cx, cy + R - 3, 23, C("glass_blue"))
    m.fill_box(cx - R + 3, cy, 2, cx + R - 3, cy, 23, C("glass_blue"))
    m.fill_box(cx, cy, 2, cx, cy, 24, C("bronze_dk"))  # centre post
    # flat overhanging bronze roof canopy
    disk(m, cx, cy, 25, R + 1, C("bronze"))
    disk(m, cx, cy, 26, R + 1, C("bronze"))
    disk(m, cx, cy, 27, R - 1, C("bronze_dk"))
    save_and_preview(m, "revolving_door")


# ---- 5x7 block font for the baked DELOITTE sign (reliable; no web font) ----
_FONT = {
    'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    'I': ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
}


def _stamp_letter(m, ch, x0, z_top, color):
    """Stamp a 5x7 letter on the front face (y=0), top row at z_top."""
    for r, row in enumerate(_FONT[ch]):
        for c, bit in enumerate(row):
            if bit == '1':
                m.set_voxel(x0 + c, 0, z_top - r, color)


def build_tree_full():
    """A tall, full plaza tree — thick trunk + a big bushy multi-ball canopy, so
    it towers over voxel-Om instead of looking like a shrub."""
    W, D, H = 15, 15, 30
    m = new_model(W, D, H)
    cx = cy = W // 2
    # thick trunk
    m.fill_box(cx - 1, cy - 1, 0, cx + 1, cy + 1, 13, C("trunk"))
    # big bushy canopy (overlapping leaf balls in two greens for depth)
    ball(m, cx, cy, 20, 7, C("leaf"))
    ball(m, cx - 4, cy + 2, 17, 5, C("leaf_dark"))
    ball(m, cx + 4, cy - 2, 17, 5, C("leaf_dark"))
    ball(m, cx + 2, cy + 4, 19, 5, C("leaf"))
    ball(m, cx - 2, cy - 4, 19, 5, C("leaf_dark"))
    ball(m, cx, cy, 26, 5, C("leaf_light"))
    save_and_preview(m, "tree_full")


def build_deloitte_sign():
    """The iconic freestanding 'DELOITTE' sign monolith — dark pylon with the
    wordmark stacked vertically in white + the green Deloitte dot. Baked voxel
    text (like the JAI HIND sign) so it always renders. Front face = y = 0."""
    word = 'DELOITTE'
    LH, GAP = 7, 1
    top = 6 + len(word) * (LH + GAP)
    W, D, SZ = 11, 4, top + 8
    m = new_model(W, D, SZ)
    m.fill_box(0, 1, 0, W - 1, D - 1, SZ - 1, C("sign_body"))   # dark monolith
    m.fill_box(0, 0, 0, W - 1, D - 1, 3, C("steel"))            # metal base
    for i, ch in enumerate(word):                              # vertical wordmark
        _stamp_letter(m, ch, 3, top - i * (LH + GAP), C("cloud_white"))
    m.fill_box(4, 0, 5, 6, 0, 7, C("deloitte_dot"))            # green dot
    save_and_preview(m, "deloitte_sign")


def build_tower_deloitte():
    """The real La Tour Deloitte vibe: a tall ANGULAR dark-blue glass prism with
    vertical mullions, an angled crown, and a second taller offset blade behind
    (the building's signature twin angular peaks). Front face = y = 0."""
    W, D = 54, 36
    SZ = 168
    m = new_model(W, D, SZ)
    # main prism body up to z=118
    m.fill_box(0, 0, 0, W - 1, D - 1, 118, C("dnavy"))
    # angled crown z=118.. sloping down to the right (150 at x=0 -> 120 at x=W-1)
    for x in range(W):
        top = 150 - round((x / (W - 1)) * 30)
        m.fill_box(x, 0, 118, x, D - 1, top, C("dnavy"))
    # vertical mullions on front + back faces every 3 columns
    for x in range(2, W - 2, 3):
        m.fill_box(x, 0, 1, x, 0, 146, C("dnavy_mull"))
        m.fill_box(x, D - 1, 1, x, D - 1, 146, C("dnavy_mull"))
    # subtle horizontal floor lines every 8 (front + back)
    for z in range(6, 146, 8):
        m.fill_box(1, 0, z, W - 2, 0, z, C("dnavy_mull"))
        m.fill_box(1, D - 1, z, W - 2, D - 1, z, C("dnavy_mull"))
    # sun-reflecting lit windows: warm gradient up the right third (front)
    for z in range(10, 138, 6):
        for x in range(W - 20, W - 4, 3):
            m.fill_box(x, 0, z, x + 1, 0, z + 3, C("dnavy_lit"))
    # second taller angular blade offset to the right-back (twin-peak look)
    bx0, bx1 = W - 24, W - 4
    for x in range(bx0, bx1):
        top = 164 - round(((x - bx0) / (bx1 - bx0)) * 28)  # 164 -> 136
        m.fill_box(x, D - 9, 0, x, D - 1, top, C("dnavy"))
    for x in range(bx0 + 1, bx1, 3):
        m.fill_box(x, D - 9, 1, x, D - 9, 160, C("dnavy_mull"))
    save_and_preview(m, "tower_deloitte")


if __name__ == "__main__":
    build_tower_round()
    build_tower_office()
    build_revolving_door()
    build_tower_deloitte()
    build_deloitte_sign()
    build_tree_full()
    print("DELOITTE SCENE ASSETS BUILD OK")
