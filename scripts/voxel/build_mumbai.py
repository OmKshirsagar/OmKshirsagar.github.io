"""Mumbai cityscape + sky voxel assets for the Earth->clouds->city->college dive.

COORDINATE CONVENTION (verified): (x=width, y=depth, z=HEIGHT/up).
Vertical extent is the z coord. These get instanced/placed by SceneMumbai.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def build_cloud():
    """A blocky cumulus puff (white), wider than tall. Instanced across the sky."""
    m = new_model(22, 16, 10)
    # lumpy overlapping spheres = cumulus (no flat base slab — reads as a tray)
    m.create_sphere(7, 8, 4, 4, C("cloud_white"))
    m.create_sphere(13, 7, 4, 4, C("cloud_white"))
    m.create_sphere(10, 9, 5, 3, C("cloud_white"))
    m.create_sphere(16, 9, 3, 3, C("cloud_white"))
    m.create_sphere(4, 7, 3, 3, C("cloud_white"))
    m.create_sphere(18, 6, 3, 2, C("cloud_white"))
    m.create_sphere(9, 6, 2, 3, C("cloud_white"))
    save_and_preview(m, "cloud")


def build_tower():
    """A cream Art Deco skyscraper with a window grid + stepped crown.
    Instanced (varied scale/position) to form the Mumbai skyline."""
    W, D, H = 10, 10, 46
    m = new_model(W, D, H)
    m.fill_box(0, 0, 0, W - 1, D - 1, H - 8, C("tower_cream"))
    # vertical pilaster shadows (front + back faces)
    for x in range(2, W - 1, 3):
        m.fill_box(x, 0, 2, x, 0, H - 12, C("tower_shadow"))
        m.fill_box(x, D - 1, 2, x, D - 1, H - 12, C("tower_shadow"))
    # window grid on all 4 faces
    for z in range(4, H - 12, 4):
        for u in range(2, 8, 3):
            m.fill_box(u, 0, z, u + 1, 0, z + 1, C("window_dark"))         # front
            m.fill_box(u, D - 1, z, u + 1, D - 1, z + 1, C("window_dark"))  # back
            m.fill_box(0, u, z, 0, u + 1, z + 1, C("window_dark"))         # left
            m.fill_box(D - 1, u, z, D - 1, u + 1, z + 1, C("window_dark"))  # right
    # stepped Art Deco crown
    m.fill_box(1, 1, H - 8, W - 2, D - 2, H - 7, C("tower_shadow"))
    m.fill_box(2, 2, H - 6, W - 3, D - 3, H - 5, C("tower_cream"))
    m.fill_box(3, 3, H - 4, W - 4, D - 4, H - 3, C("tower_cream"))
    m.fill_box(4, 4, H - 2, 5, 5, H - 1, C("tower_shadow"))  # spire
    save_and_preview(m, "tower")


def build_mountain():
    """A voxel mountain — green lower slopes, purple-rock upper. Instanced
    along the far horizon as a ridge backdrop."""
    BASE, H = 44, 30
    m = new_model(BASE, BASE, H)
    for z in range(H):
        t = z / (H - 1)
        inset = int(t * (BASE // 2 - 2))
        color = C("mountain_green") if z < H * 0.5 else C("mountain_rock")
        m.fill_box(inset, inset, z, BASE - 1 - inset, BASE - 1 - inset, z, color)
    save_and_preview(m, "mountain", preview=False)


def build_ocean():
    """A large flat ocean slab (1 voxel tall). Placed as the sea beside the city."""
    SZ = 256
    m = new_model(SZ, SZ, 1)
    m.fill_box(0, 0, 0, SZ - 1, SZ - 1, 0, C("ocean_blue"))
    save_and_preview(m, "ocean", preview=False)


if __name__ == "__main__":
    build_cloud()
    build_tower()
    build_mountain()
    build_ocean()
    print("MUMBAI BUILD OK")
