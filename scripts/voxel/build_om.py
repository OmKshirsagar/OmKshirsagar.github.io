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
