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
    # Window grid: rows up the height (z), columns across width (x), front face y=0
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
