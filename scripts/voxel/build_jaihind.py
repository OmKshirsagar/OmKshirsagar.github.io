"""Jai Hind College — the Sheila Gopal Raheja Building (single baked .vox).

A TALL modern tan tower: a left signage pillar carrying the blue eagle crest
and "JAI HIND COLLEGE" voxel text, and a right glass-curtain wing with
horizontal dark window bands. Built tall so it clearly towers over voxel-Om.

COORDINATE CONVENTION (verified): (x=width, y=depth, z=HEIGHT/up).
Front face = y = 0. Vertical extent is the z coord.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402

W, D, H = 64, 22, 104  # width(x), depth(y), height(z)
PILL = 28              # signage pillar width (x 0..PILL-1)

# Minimal 3x5 uppercase voxel font (rows top->bottom) for "JAI HIND COLLEGE".
FONT = {
    "J": ["..#", "..#", "..#", "#.#", "###"],
    "A": [".#.", "#.#", "###", "#.#", "#.#"],
    "I": ["###", ".#.", ".#.", ".#.", "###"],
    "H": ["#.#", "#.#", "###", "#.#", "#.#"],
    "N": ["#.#", "##.", "#.#", "#.#", "#.#"],
    "D": ["##.", "#.#", "#.#", "#.#", "##."],
    "C": [".##", "#..", "#..", "#..", ".##"],
    "O": [".#.", "#.#", "#.#", "#.#", ".#."],
    "L": ["#..", "#..", "#..", "#..", "###"],
    "E": ["###", "#..", "##.", "#..", "###"],
    "G": [".##", "#..", "#.#", "#.#", ".##"],
    " ": ["...", "...", "...", "...", "..."],
}


def _letter(m, ch, x0, z0, color):
    rows = FONT[ch]
    for r, row in enumerate(rows):
        z = z0 + (4 - r)  # row 0 is the TOP of the glyph
        for c, px in enumerate(row):
            if px == "#":
                m.set_voxel(x0 + c, 0, z, color)


def _text_centered(m, s, z0, color, pitch=4):
    width = len(s) * pitch - 1
    x0 = (PILL - width) // 2
    cx = x0
    for ch in s:
        _letter(m, ch, cx, z0, color)
        cx += pitch


def build():
    m = new_model(W, D, H)
    # ---- main tan mass ----
    m.fill_box(0, 0, 0, W - 1, D - 1, H - 1, C("tower_cream"))
    # ground floor / podium (darker stone), with a glazed entrance recess
    m.fill_box(0, 0, 0, W - 1, D - 1, 11, C("tower_shadow"))
    m.fill_box(PILL + 2, 0, 1, W - 3, 0, 10, C("window_dark"))  # entrance glazing
    m.fill_box(PILL // 2 - 5, 0, 1, PILL // 2 + 5, 0, 9, C("window_dark"))  # pillar-base doors
    # entrance canopy (thin tan overhang above the doors)
    m.fill_box(PILL // 2 - 7, 0, 11, W - 3, 1, 11, C("tower_warm"))

    # ---- LEFT SIGNAGE PILLAR (lighter tan, full height) ----
    m.fill_box(0, 0, 0, PILL - 1, D - 1, H - 1, C("tower_warm"))
    cx = PILL // 2

    # blue eagle crest — heraldic shield (rounded top, pointed bottom) with a
    # white spread-winged eagle.
    cz0, cz1 = H - 27, H - 9
    for z in range(cz0, cz1):
        t = (z - cz0) / (cz1 - cz0)
        if t < 0.22:
            half = 1 + int((t / 0.22) * 6)    # pointed bottom
        elif t > 0.88:
            half = 5                          # rounded top
        else:
            half = 7
        m.fill_box(cx - half, 0, z, cx + half, 0, z, C("crest_blue"))
    wz = cz0 + 10
    m.fill_box(cx - 5, 0, wz, cx - 2, 0, wz, C("cloud_white"))      # left wing
    m.fill_box(cx + 2, 0, wz, cx + 5, 0, wz, C("cloud_white"))      # right wing
    m.fill_box(cx - 6, 0, wz + 1, cx - 4, 0, wz + 1, C("cloud_white"))  # left tip up
    m.fill_box(cx + 4, 0, wz + 1, cx + 6, 0, wz + 1, C("cloud_white"))  # right tip up
    m.fill_box(cx - 1, 0, wz - 3, cx + 1, 0, wz + 2, C("cloud_white"))  # body
    m.set_voxel(cx, 0, wz + 3, C("cloud_white"))                   # head

    # "JAI HIND COLLEGE" stacked on three rows below the crest
    _text_centered(m, "JAI", cz0 - 9, C("crest_blue"))
    _text_centered(m, "HIND", cz0 - 17, C("crest_blue"))
    _text_centered(m, "COLLEGE", cz0 - 25, C("crest_blue"))
    # "SHEILA GOPAL RAHEJA BUILDING" — suggested as four short blue bars lower
    for i, z in enumerate((cz0 - 36, cz0 - 40, cz0 - 44, cz0 - 48)):
        w = (8, 8, 9, 9)[i]
        m.fill_box(cx - w // 2, 0, z, cx + w // 2, 0, z, C("crest_blue"))

    # ---- RIGHT GLASS-CURTAIN WING: continuous glass, vertical piers + floor grid ----
    gx0, gx1 = PILL + 1, W - 2
    m.fill_box(gx0, 0, 13, gx1, 0, H - 5, C("glass_tint"))          # glass field
    for mx in range(gx0, gx1 + 1, 7):                              # vertical tan piers
        m.fill_box(mx, 0, 13, mx, 0, H - 5, C("tower_cream"))
    for z in range(13, H - 4, 7):                                  # horizontal floor lines
        m.fill_box(gx0, 0, z, gx1, 0, z, C("tower_cream"))
    # a few warm-lit panes
    for mx in (gx0 + 3, gx0 + 17, gx1 - 4):
        m.fill_box(mx, 0, 30, mx + 2, 0, 33, C("window_glow"))

    # ---- parapet cap ----
    m.fill_box(0, 0, H - 2, W - 1, D - 1, H - 1, C("tower_shadow"))
    save_and_preview(m, "jaihind_facade")
    print("JAIHIND BUILD OK")


if __name__ == "__main__":
    build()
