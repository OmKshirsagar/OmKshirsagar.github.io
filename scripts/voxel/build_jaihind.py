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

    # ---- LEFT SIGNAGE PILLAR (lighter tan, full height) ----
    m.fill_box(0, 0, 0, PILL - 1, D - 1, H - 1, C("tower_warm"))
    cx = PILL // 2

    # blue eagle crest (shield: rounded top, pointed bottom)
    cz0, cz1 = H - 26, H - 9
    for z in range(cz0, cz1):
        t = (z - cz0) / (cz1 - cz0)
        if t < 0.22:
            half = 1 + int((t / 0.22) * 5)   # pointed bottom
        elif t > 0.85:
            half = 5                          # rounded top
        else:
            half = 7
        m.fill_box(cx - half, 0, z, cx + half, 0, z, C("crest_blue"))
    # cream eagle suggestion inside the shield
    m.fill_box(cx - 4, 0, cz0 + 7, cx + 4, 0, cz0 + 8, C("cloud_white"))  # wings
    m.fill_box(cx - 1, 0, cz0 + 8, cx + 1, 0, cz0 + 11, C("cloud_white"))  # body

    # "JAI HIND COLLEGE" stacked on three rows below the crest
    _text_centered(m, "JAI", cz0 - 9, C("crest_blue"))
    _text_centered(m, "HIND", cz0 - 17, C("crest_blue"))
    _text_centered(m, "COLLEGE", cz0 - 25, C("crest_blue"))
    # "SHEILA GOPAL RAHEJA BUILDING" — suggested as four short blue bars lower
    for i, z in enumerate((cz0 - 36, cz0 - 40, cz0 - 44, cz0 - 48)):
        w = (8, 8, 9, 9)[i]
        m.fill_box(cx - w // 2, 0, z, cx + w // 2, 0, z, C("crest_blue"))

    # ---- RIGHT GLASS-CURTAIN WING: horizontal dark window bands + mullions ----
    for z in range(15, H - 6, 7):
        m.fill_box(PILL + 1, 0, z, W - 2, 0, z + 4, C("window_dark"))   # glass band
        for mx in range(PILL + 1, W - 1, 8):                            # vertical mullions
            m.fill_box(mx, 0, z, mx, 0, z + 4, C("tower_cream"))
    # a few warm-lit windows
    for mx in (PILL + 6, PILL + 22, W - 8):
        m.fill_box(mx, 0, 29, mx + 3, 0, 32, C("window_glow"))

    # ---- parapet cap ----
    m.fill_box(0, 0, H - 2, W - 1, D - 1, H - 1, C("tower_shadow"))
    save_and_preview(m, "jaihind_facade")
    print("JAIHIND BUILD OK")


if __name__ == "__main__":
    build()
