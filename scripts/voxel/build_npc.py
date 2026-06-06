"""Neutral student NPC (single blue-shirt build).

COORDINATE CONVENTION (verified): (x=width, y=depth, z=HEIGHT/up).
Color variety across NPCs is a Plan 4 refinement (separate .vox variants);
this slice uses one shared build for all crowd members.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def build():
    # x=6, y=4 deep, z=20 tall
    m = new_model(6, 4, 20)
    m.fill_box(1, 1, 0, 2, 2, 7, C("pants_charcoal"))   # left leg
    m.fill_box(3, 1, 0, 4, 2, 7, C("pants_charcoal"))   # right leg
    m.fill_box(0, 0, 8, 5, 3, 15, C("npc_blue"))        # torso
    m.fill_box(1, 0, 16, 4, 3, 19, C("skin"))           # head
    save_and_preview(m, "npc_base")
    print("NPC BUILD OK")


if __name__ == "__main__":
    build()
