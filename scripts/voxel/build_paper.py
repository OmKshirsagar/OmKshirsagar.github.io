"""Publish-paper interior assets: an open laptop (base + hinged screen) and a
desk lamp. The laptop's live screen content (the "PUBLISHED PAPER / JETIR"
browser card) is rendered in three (drei <Text> + a mini Om head), not baked
into the .vox — the .vox is just the cream shell + dark screen recess.

COORDINATE CONVENTION (see _voxlib): (x=width, y=depth, z=HEIGHT/up).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def build_laptop_base():
    """Keyboard deck — cream/aluminium with a dark key area + trackpad."""
    W, D, H = 28, 20, 2
    m = new_model(W, D, H)
    m.fill_box(0, 0, 0, W - 1, D - 1, 1, C("laptop_silver"))   # deck slab
    # recessed dark keyboard area (back two-thirds) — charcoal keys, not a void
    m.fill_box(3, 2, 1, W - 4, 12, 1, C("pants_charcoal"))
    # key rows: thin silver gaps so it reads as a keyboard, not a screen
    for ky in range(3, 12, 2):
        m.fill_box(3, ky, 1, W - 4, ky, 1, C("laptop_silver"))
    # trackpad (front centre, lighter)
    m.fill_box(11, 14, 1, 16, 18, 1, C("laptop_silver"))
    save_and_preview(m, "laptop_base", preview=False)


def build_laptop_screen():
    """Screen panel built standing up (front face y=0). Cream bezel with a
    dark recessed screen the live three content sits in front of."""
    W, D, H = 28, 2, 18
    m = new_model(W, D, H)
    m.fill_box(0, 0, 0, W - 1, D - 1, H - 1, C("laptop_silver"))  # shell
    m.fill_box(2, 0, 2, W - 3, 0, H - 2, C("screen_bezel"))       # screen recess (front)
    save_and_preview(m, "laptop_screen", preview=False)


def build_desk_lamp():
    """Architect-style desk lamp: base + upright arm + tilted shade + bulb."""
    W, D, H = 9, 9, 26
    m = new_model(W, D, H)
    m.fill_box(2, 2, 0, 6, 6, 1, C("lamp_metal"))      # weighted base
    m.fill_box(4, 4, 1, 5, 5, 18, C("lamp_metal"))     # upright arm
    m.fill_box(2, 4, 18, 5, 5, 20, C("lamp_metal"))    # elbow toward desk
    # shade (open underside facing down/forward over the desk)
    m.fill_box(0, 2, 19, 3, 7, 23, C("lamp_metal"))    # shade shell
    m.fill_box(1, 3, 19, 2, 6, 19, C("lamp_warm"))     # glowing bulb underside
    save_and_preview(m, "desk_lamp", preview=False)


if __name__ == "__main__":
    build_laptop_base()
    build_laptop_screen()
    build_desk_lamp()
    print("PAPER BUILD OK")
