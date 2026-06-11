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
    # x=6, y=6 deep, z=7 tall. Detailed face on front plane y=0: hair frames the
    # top + sides, asymmetric bang, two eyes, connected mustache, and a beard on
    # the lower third — leaving the CENTER (forehead/nose/cheeks) clearly skin.
    m = new_model(6, 6, 7)
    m.fill_box(0, 0, 0, 5, 5, 5, C("skin"))            # face/skull block (z 0..5)
    # ---- hair volume (top cap, back, both sides) — sides keep the FRONT column
    #      (y=0) as skin at eye level so the dark eyes don't merge into the hair ----
    m.fill_box(0, 0, 6, 5, 5, 6, C("hair_black"))      # top cap (z=6)
    m.fill_box(0, 5, 1, 5, 5, 6, C("hair_black"))      # back slab (y=5)
    m.fill_box(0, 1, 2, 0, 5, 6, C("hair_black"))      # left side VOLUME (depth y1..5)
    m.fill_box(5, 1, 2, 5, 5, 6, C("hair_black"))      # right side VOLUME (depth y1..5)
    m.set_voxel(0, 0, 4, C("hair_black"))              # left temple (front, above eye)
    m.set_voxel(5, 0, 4, C("hair_black"))              # right temple
    # ---- front (y=0) detail ----
    m.fill_box(0, 0, 5, 5, 0, 5, C("hair_black"))      # hairline across z5
    m.set_voxel(1, 0, 4, C("hair_black"))              # asymmetric bang on forehead
    m.set_voxel(1, 0, 3, C("hair_black"))              # left eye (skin on both sides now)
    m.set_voxel(4, 0, 3, C("hair_black"))              # right eye
    m.set_voxel(2, 0, 2, C("hair_black"))              # mustache (center-left)
    m.set_voxel(3, 0, 2, C("hair_black"))              # mustache (center-right)
    m.fill_box(0, 0, 0, 5, 0, 1, C("hair_black"))      # full beard band (z0..1)
    m.fill_box(0, 0, 0, 5, 1, 0, C("hair_black"))      # chin underside wrap (y=1)
    save_and_preview(m, "om_head")


def build_arm(suffix: str):
    # x=2, y=2 deep, z=6 tall. Cream sleeve top (high z), skin hand bottom.
    m = new_model(2, 2, 6)
    m.fill_box(0, 0, 3, 1, 1, 5, C("cream"))   # sleeve (top = shoulder region)
    m.fill_box(0, 0, 0, 1, 1, 2, C("skin"))    # forearm/hand (bottom)
    save_and_preview(m, f"om_upperarm_{suffix}")


def build_thigh(suffix: str):
    # x=2, y=3 deep, z=10 tall — longer charcoal leg (better proportion),
    # with a small skin "shoe" at the foot so the stride reads clearly.
    m = new_model(2, 3, 10)
    m.fill_box(0, 0, 1, 1, 2, 9, C("pants_charcoal"))  # leg
    m.fill_box(0, 0, 0, 1, 2, 0, C("hair_black"))      # shoe
    save_and_preview(m, f"om_thigh_{suffix}")


if __name__ == "__main__":
    build_torso()
    build_head()
    build_arm("L")
    build_arm("R")
    build_thigh("L")
    build_thigh("R")
    print("OM BUILD OK")
