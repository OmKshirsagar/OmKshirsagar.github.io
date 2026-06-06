"""Mumbai cityscape + sky voxel assets for the Earth->clouds->city->college dive.

COORDINATE CONVENTION (verified): (x=width, y=depth, z=HEIGHT/up).
Vertical extent is the z coord. These get instanced/placed by SceneMumbai.
"""
import random
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


def _windows(m, x0, y0, x1, y1, z0, z1, seed, step_z=4, step_u=3, lit=0.12):
    """Punch a window grid into the 4 outer faces of a box, with a few lit ones."""
    rnd = random.Random(seed)
    glow, dark = C("window_glow"), C("window_dark")

    def col():
        return glow if rnd.random() < lit else dark

    for z in range(z0, z1 - 1, step_z):
        for x in range(x0 + 1, x1 - 1, step_u):
            m.fill_box(x, y0, z, x, y0, z + 1, col())          # front (y0)
            m.fill_box(x, y1, z, x, y1, z + 1, col())          # back (y1)
        for yy in range(y0 + 1, y1 - 1, step_u):
            m.fill_box(x0, yy, z, x0, yy, z + 1, col())         # left (x0)
            m.fill_box(x1, yy, z, x1, yy, z + 1, col())         # right (x1)


def _cornices(m, x0, y0, x1, y1, z0, z1, every):
    """Horizontal floor/cornice shadow lines for structure + depth."""
    for z in range(z0, z1, every):
        m.fill_box(x0, y0, z, x1, y1, z, C("tower_shadow"))


def build_tower():
    """Slim Art Deco spire — the iconic skyscraper. (tower.vox)"""
    W, D, H = 10, 10, 54
    m = new_model(W, D, H)
    m.fill_box(0, 0, 0, W - 1, D - 1, H - 10, C("tower_cream"))
    m.fill_box(0, 0, 0, W - 1, D - 1, 2, C("tower_shadow"))            # darker base
    # corner pilasters (full height) for vertical Art Deco emphasis
    for cx, cy in [(0, 0), (0, D - 1), (W - 1, 0), (W - 1, D - 1)]:
        m.fill_box(cx, cy, 3, cx, cy, H - 11, C("tower_warm"))
    _windows(m, 1, 1, W - 2, D - 2, 5, H - 12, seed=11, step_z=4, step_u=3)
    # stepped crown -> spire
    m.fill_box(1, 1, H - 10, W - 2, D - 2, H - 9, C("tower_shadow"))   # cornice cap
    m.fill_box(2, 2, H - 8, W - 3, D - 3, H - 6, C("tower_cream"))
    m.fill_box(3, 3, H - 5, W - 4, D - 4, H - 3, C("tower_warm"))
    m.fill_box(4, 4, H - 2, 5, 5, H - 1, C("tower_shadow"))            # spire tip
    save_and_preview(m, "tower")


def build_tower_block():
    """Solid mid-rise apartment block with a flat cornice cap. (tower_block.vox)"""
    W, D, H = 14, 12, 30
    m = new_model(W, D, H)
    m.fill_box(0, 0, 0, W - 1, D - 1, H - 2, C("tower_warm"))
    m.fill_box(0, 0, 0, W - 1, D - 1, 3, C("tower_shadow"))            # ground floor
    _cornices(m, 0, 0, W - 1, D - 1, 7, H - 3, every=5)               # floor lines
    _windows(m, 1, 1, W - 2, D - 2, 5, H - 4, seed=22, step_z=5, step_u=3, lit=0.14)
    # overhanging flat cornice cap
    m.fill_box(0, 0, H - 2, W - 1, D - 1, H - 2, C("tower_cream"))
    m.fill_box(1, 1, H - 1, W - 2, D - 2, H - 1, C("tower_shadow"))
    save_and_preview(m, "tower_block")


def build_tower_step():
    """Stepped 'wedding-cake' Art Deco tower with three setbacks. (tower_step.vox)"""
    W, D, H = 16, 16, 46
    m = new_model(W, D, H)
    tiers = [(0, 0, 15, 15, 0, 18), (2, 2, 13, 13, 18, 32), (4, 4, 11, 11, 32, 42)]
    for ti, (x0, y0, x1, y1, z0, z1) in enumerate(tiers):
        m.fill_box(x0, y0, z0, x1, y1, z1, C("tower_cream"))
        m.fill_box(x0, y0, z1, x1, y1, z1, C("tower_shadow"))         # tier cornice
        _windows(m, x0 + 1, y0 + 1, x1 - 1, y1 - 1, z0 + 3, z1 - 1, seed=33 + ti, step_z=4)
    m.fill_box(0, 0, 0, W - 1, D - 1, 2, C("tower_shadow"))           # base
    m.fill_box(7, 7, 42, 8, 8, 45, C("tower_warm"))                  # crown
    save_and_preview(m, "tower_step")


def build_mountain():
    """A voxel mountain — green lower slopes, purple-rock upper. Instanced
    along the far horizon as a ridge backdrop."""
    BASE, H = 44, 30
    m = new_model(BASE, BASE, H)
    for z in range(H):
        t = z / (H - 1)
        inset = int(t * (BASE // 2 - 2))
        if z < H * 0.55:
            color = C("mountain_green")            # green lower slopes
        elif z < H * 0.8:
            color = C("leaf_dark")                 # darker forested mid
        else:
            color = C("mountain_rock")             # rocky/purple peaks
        m.fill_box(inset, inset, z, BASE - 1 - inset, BASE - 1 - inset, z, color)
    save_and_preview(m, "mountain", preview=False)


def build_ocean():
    """A large flat ocean slab (1 voxel tall). Placed as the sea beside the city."""
    SZ = 256
    m = new_model(SZ, SZ, 1)
    m.fill_box(0, 0, 0, SZ - 1, SZ - 1, 0, C("ocean_blue"))
    save_and_preview(m, "ocean", preview=False)


def build_palm():
    """A palm tree — slightly curved trunk + drooping frond crown."""
    m = new_model(11, 11, 22)
    # curved trunk (leans a little as it rises)
    for z in range(15):
        x = 5 + int(z / 7)
        m.fill_box(x, 5, z, x, 5, z, C("trunk"))
    tx, ty, tz = 7, 5, 15
    # 8 drooping fronds radiating from the crown
    for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)]:
        for r in range(1, 5):
            m.fill_box(tx + dx * r, ty + dy * r, tz + 1 - (r // 3), tx + dx * r, ty + dy * r, tz + 1 - (r // 3), C("palm_green"))
    m.fill_box(tx - 1, ty - 1, tz + 1, tx + 1, ty + 1, tz + 2, C("leaf_dark"))  # crown core
    save_and_preview(m, "palm", preview=False)


def build_streetlamp():
    """A tall street lamp with a bright glowing head — lines the roads."""
    m = new_model(3, 3, 16)
    m.fill_box(1, 1, 0, 1, 1, 13, C("lamp_metal"))       # post
    m.fill_box(0, 0, 14, 2, 2, 15, C("window_glow"))     # glowing head
    save_and_preview(m, "streetlamp", preview=False)


def build_car():
    """A small voxel car — body + cabin. Sits on the promenade road."""
    m = new_model(6, 12, 6)                              # x=width, y=length, z=height
    m.fill_box(0, 0, 0, 5, 11, 2, C("car_red"))          # body
    m.fill_box(1, 2, 3, 4, 8, 4, C("car_silver"))        # cabin
    m.fill_box(0, 1, 0, 5, 1, 1, C("road_dark"))         # front bumper (dark)
    save_and_preview(m, "car", preview=False)


def build_shore():
    """A cross-shore strip: dry sand -> wet sand -> foam -> shallow water.
    Tiled along the coast (local x = seaward) so the beach reads as a real
    waterline. The deep ocean plane sits beyond the shallow band."""
    W, D, H = 44, 30, 2
    m = new_model(W, D, H)
    m.fill_box(0, 0, 0, 19, D - 1, 1, C("sand"))             # dry sand (raised)
    m.fill_box(20, 0, 0, 25, D - 1, 0, C("wet_sand"))        # wet sand
    m.fill_box(26, 0, 0, 28, D - 1, 0, C("foam_white"))      # foam waterline
    m.fill_box(29, 0, 0, W - 1, D - 1, 0, C("water_shallow"))  # shallow water
    save_and_preview(m, "shore", preview=False)


if __name__ == "__main__":
    build_cloud()
    build_tower()
    build_tower_block()
    build_tower_step()
    build_mountain()
    build_ocean()
    build_palm()
    build_streetlamp()
    build_car()
    build_shore()
    print("MUMBAI BUILD OK")
