"""Deloitte-chapter voxel assets: glass office tower, revolving entrance door,
desk monitor, an award trophy, and a lanyard/ID overlay for voxel-Om.

COORDINATE CONVENTION (see _voxlib): (x=width, y=depth, z=HEIGHT/up).
Front face = y = 0. Author the VERTICAL extent in z.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def build_deloitte_tower():
    """A tall blue-glass facade (front face +Z toward the plaza), with a window
    mullion grid, a green accent band and a green Deloitte 'dot' near the top."""
    W, D, H = 110, 22, 140
    m = new_model(W, D, H)
    # solid massing
    m.fill_box(0, 0, 0, W - 1, D - 1, H - 1, C("glass_blue_dk"))
    # glossy front glass skin
    m.fill_box(2, 0, 2, W - 3, 0, H - 3, C("glass_blue"))
    # vertical mullions every 8
    for x in range(2, W - 2, 8):
        m.fill_box(x, 0, 2, x, 0, H - 3, C("glass_blue_dk"))
    # horizontal floor lines every 10
    for z in range(6, H - 3, 10):
        m.fill_box(2, 0, z, W - 3, 0, z, C("glass_blue_dk"))
    # green accent band near the base (entrance level)
    m.fill_box(2, 0, 3, W - 3, 0, 5, C("deloitte_green"))
    # Deloitte green "dot" near the top-right
    m.fill_box(W - 22, 0, H - 18, W - 14, 0, H - 10, C("deloitte_green"))
    save_and_preview(m, "deloitte_tower", preview=False)


def build_revolving_door():
    """Cylindrical revolving-door pavilion: stone canopy ring + dark frame +
    glass quadrant panels + a centre post."""
    W, D, H = 30, 30, 34
    m = new_model(W, D, H)
    cx, cy, r = 15, 15, 13
    # base ring + glass cylinder walls
    for x in range(W):
        for y in range(D):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if (r - 2) ** 2 <= d2 <= r * r:
                m.fill_box(x, y, 0, x, y, 26, C("glass_blue"))
                m.fill_box(x, y, 0, x, y, 1, C("steel"))      # threshold
            if (r - 1) ** 2 <= d2 <= r * r:
                # mullion posts at the cardinal points
                if abs(x - cx) <= 1 or abs(y - cy) <= 1:
                    m.fill_box(x, y, 0, x, y, 26, C("monitor_dark"))
    # rotating cross panels (the actual door wings)
    m.fill_box(cx, cy - r + 2, 1, cx, cy + r - 2, 24, C("glass_blue"))
    m.fill_box(cx - r + 2, cy, 1, cx + r - 2, cy, 24, C("glass_blue"))
    m.fill_box(cx, cy, 1, cx, cy, 25, C("monitor_dark"))      # centre post
    # stone canopy ring on top
    for x in range(W):
        for y in range(D):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if (r - 3) ** 2 <= d2 <= (r + 1) ** 2:
                m.fill_box(x, y, 27, x, y, 30, C("cream_shadow"))
    save_and_preview(m, "revolving_door", preview=False)


def build_monitor():
    """A desktop monitor — dark screen recess in a thin bezel on a stand."""
    W, D, H = 34, 3, 26
    m = new_model(W, D, H)
    m.fill_box(0, 1, 6, W - 1, 2, H - 1, C("laptop_silver"))  # bezel shell
    m.fill_box(2, 1, 8, W - 3, 1, H - 3, C("monitor_dark"))   # screen recess (front y=1)
    m.fill_box(15, 1, 2, 18, 2, 7, C("laptop_silver"))        # neck
    m.fill_box(11, 0, 0, 22, 4, 1, C("laptop_silver"))        # foot
    save_and_preview(m, "monitor", preview=False)


def build_trophy():
    """A gold award cup: base, stem, bowl with handles."""
    W, D, H = 16, 16, 28
    m = new_model(W, D, H)
    cx, cy = 8, 8
    m.fill_box(4, 4, 0, 11, 11, 1, C("monitor_dark"))         # dark plinth
    m.fill_box(5, 5, 2, 10, 10, 3, C("grad_gold"))            # base
    m.fill_box(7, 7, 4, 8, 8, 10, C("grad_gold"))             # stem
    # bowl
    for x in range(W):
        for y in range(D):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if d2 <= 36:
                m.fill_box(x, y, 11, x, y, 20, C("grad_gold"))
            if 25 <= d2 <= 36:
                m.fill_box(x, y, 18, x, y, 22, C("grad_gold"))  # rim lip
    # handles
    m.fill_box(1, 6, 13, 2, 9, 19, C("grad_gold"))
    m.fill_box(13, 6, 13, 14, 9, 19, C("grad_gold"))
    save_and_preview(m, "trophy", preview=False)


def build_lanyard():
    """Blue lanyard V + white ID badge with a green stripe — overlays Om's chest."""
    W, D, H = 8, 2, 12
    m = new_model(W, D, H)
    # V-straps over the shoulders meeting at the chest
    for i in range(6):
        m.fill_box(1 + i, 0, 11 - i, 1 + i, 0, 11 - i, C("lanyard_blue"))
        m.fill_box(6 - i, 0, 11 - i, 6 - i, 0, 11 - i, C("lanyard_blue"))
    m.fill_box(3, 0, 4, 4, 0, 6, C("lanyard_blue"))           # clip
    m.fill_box(2, 0, 0, 5, 0, 4, C("cloud_white"))            # badge card
    m.fill_box(2, 0, 3, 5, 0, 3, C("deloitte_green"))         # badge stripe
    save_and_preview(m, "lanyard", preview=False)


if __name__ == "__main__":
    build_deloitte_tower()
    build_revolving_door()
    build_monitor()
    build_trophy()
    build_lanyard()
    print("DELOITTE BUILD OK")
