"""Environment props: tree, lamp, and a single baked ground slab.

COORDINATE CONVENTION (verified): (x=width, y=depth, z=HEIGHT/up).
`ground.vox` is ONE model (1 draw call) — a grass plane (1 voxel tall in z)
with a warm path stripe down the middle. Sized to span the full Om walk:
200 wide (x) x 256 deep (y) x 1 tall (z). Path stripe = middle 24 cols of x.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def build_tree():
    # x=11, y=11 deep, z=16 tall — fuller layered canopy on a sturdier trunk
    m = new_model(11, 11, 16)
    m.fill_box(5, 5, 0, 5, 5, 7, C("trunk"))          # trunk (vertical in z)
    # layered canopy: overlapping spheres, darker core + lighter top for depth
    m.create_sphere(5, 5, 9, 4, C("leaf_dark"))
    m.create_sphere(3, 6, 10, 3, C("leaf"))
    m.create_sphere(7, 4, 10, 3, C("leaf"))
    m.create_sphere(5, 5, 12, 3, C("leaf_light"))
    m.create_sphere(6, 7, 11, 2, C("leaf"))
    save_and_preview(m, "tree")


def build_lamp():
    # x=3, y=3 deep, z=10 tall
    m = new_model(3, 3, 10)
    m.fill_box(1, 1, 0, 1, 1, 8, C("lamp_metal"))    # post (vertical)
    m.fill_box(0, 0, 8, 2, 2, 9, C("window_glow"))   # lamp head (top)
    save_and_preview(m, "lamp")


def build_ground():
    GW, GDEEP = 200, 256
    m = new_model(GW, GDEEP, 1)                       # 1 tall in z = flat slab
    m.fill_box(0, 0, 0, GW - 1, GDEEP - 1, 0, C("grass"))     # lawn
    px1, px2 = GW // 2 - 12, GW // 2 + 12
    m.fill_box(px1, 0, 0, px2, GDEEP - 1, 0, C("path_warm"))  # center path stripe
    save_and_preview(m, "ground", preview=False)  # too big to preview cheaply


if __name__ == "__main__":
    build_tree()
    build_lamp()
    build_ground()
    print("PROPS BUILD OK")
