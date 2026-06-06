"""Graduation voxel assets: mortarboard cap, gown overlay, diploma scroll,
and a grad NPC for the ceremony crowd.

COORDINATE CONVENTION (verified): (x=width, y=depth, z=HEIGHT/up).
The gown/cap are sized to overlay voxel-Om's rig (parts in ~vox units).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def build_mortarboard():
    """Graduation cap — flat navy board + small base + gold tassel."""
    m = new_model(11, 11, 4)
    m.fill_box(3, 3, 0, 7, 7, 1, C("gown_navy"))         # cap base (sits on head)
    m.fill_box(0, 0, 2, 10, 10, 2, C("gown_navy"))       # flat square board
    m.fill_box(5, 5, 3, 5, 5, 3, C("grad_gold"))         # button
    # gold tassel hanging off one corner
    m.fill_box(9, 9, 0, 9, 9, 2, C("grad_gold"))
    save_and_preview(m, "mortarboard", preview=False)


def build_gown():
    """Navy gown that drapes over the torso + hips, with a red stole.
    Sized to overlay the rig around y 5..19 (centered model -> place at y~12)."""
    W, D, H = 10, 6, 16
    m = new_model(W, D, H)
    # gown body, slightly flared toward the bottom
    for z in range(H):
        flare = 0 if z > 5 else (5 - z) // 2
        m.fill_box(1 - 0 + flare * 0, 0, z, W - 1, D - 1, z, C("gown_navy"))
        m.fill_box(max(0, 1 - flare), 0, z, min(W - 1, W - 2 + flare), D - 1, z, C("gown_navy"))
    # red stole: two vertical strips down the front (y=0)
    m.fill_box(3, 0, 4, 3, 0, H - 1, C("stole_red"))
    m.fill_box(6, 0, 4, 6, 0, H - 1, C("stole_red"))
    # cream collar / shirt V at the top front
    m.fill_box(4, 0, H - 2, 5, 0, H - 1, C("cloud_white"))
    save_and_preview(m, "gown", preview=False)


def build_diploma():
    """A rolled diploma scroll — cream cylinder with a red ribbon."""
    m = new_model(3, 3, 8)
    m.fill_box(0, 0, 0, 2, 2, 7, C("cloud_white"))       # scroll
    m.fill_box(0, 0, 3, 2, 2, 4, C("stole_red"))         # ribbon
    save_and_preview(m, "diploma", preview=False)


def build_grad_npc():
    """A graduate for the ceremony crowd — navy gown body, skin head, cap."""
    m = new_model(6, 5, 22)
    m.fill_box(1, 1, 0, 2, 3, 7, C("gown_navy"))         # legs (under gown)
    m.fill_box(3, 1, 0, 4, 3, 7, C("gown_navy"))
    m.fill_box(0, 0, 8, 5, 4, 16, C("gown_navy"))        # gown torso
    m.fill_box(2, 0, 9, 2, 0, 15, C("stole_red"))        # stole
    m.fill_box(1, 0, 17, 4, 3, 19, C("skin"))            # head
    # mortarboard
    m.fill_box(0, 0, 20, 5, 4, 20, C("gown_navy"))       # board
    m.fill_box(4, 4, 20, 4, 4, 20, C("grad_gold"))       # tassel
    save_and_preview(m, "grad_npc", preview=False)


if __name__ == "__main__":
    build_mortarboard()
    build_gown()
    build_diploma()
    build_grad_npc()
    print("GRAD BUILD OK")
