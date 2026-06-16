"""Meeting-room + war-room people for the journey.

Two builds:
  attendee(...) — SEATED upper body (torso+head+forearms). Legs omitted because
                  the conference table hides them. Used in the Training scene.
  stander(...)  — FULL standing figure (legs+torso+head+hair). Used in the War
                  Room where colleagues stand up and their legs are visible.

COORDINATE CONVENTION (see _voxlib): x=width, y=depth (front=y=0), z=up.
Run via the MagicaVoxel-MCP venv.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def attendee(name: str, shirt: str, hair: str = "hair_black"):
    # Seated upper body, ~12 tall (legs hidden by the conference table).
    m = new_model(6, 4, 12)
    m.fill_box(0, 0, 0, 5, 3, 7, C(shirt))       # torso/shoulders
    m.fill_box(1, 0, 8, 4, 3, 10, C("skin"))     # head
    m.fill_box(1, 0, 11, 4, 3, 11, C(hair))      # hair cap (top)
    m.fill_box(1, 3, 8, 4, 3, 11, C(hair))       # hair back
    m.set_voxel(1, 0, 9, C(hair))                # side hair
    m.set_voxel(4, 0, 9, C(hair))
    m.fill_box(0, 0, 4, 1, 0, 4, C("skin"))      # forearms on the table
    m.fill_box(4, 0, 4, 5, 0, 4, C("skin"))
    save_and_preview(m, name)


def stander(name: str, shirt: str, hair: str = "hair_black"):
    # Full standing figure, ~20 tall (legs + torso + head + hair + simple face).
    m = new_model(6, 4, 20)
    m.fill_box(1, 1, 0, 2, 2, 7, C("pants_charcoal"))   # left leg
    m.fill_box(3, 1, 0, 4, 2, 7, C("pants_charcoal"))   # right leg
    m.fill_box(0, 0, 0, 0, 2, 0, C("hair_black"))       # left shoe
    m.fill_box(3, 0, 0, 4, 2, 0, C("hair_black"))       # right shoe
    m.fill_box(0, 0, 8, 5, 3, 15, C(shirt))             # torso
    m.fill_box(1, 0, 16, 4, 3, 18, C("skin"))           # face block
    m.fill_box(1, 0, 19, 4, 3, 19, C(hair))             # hair cap (top)
    m.fill_box(1, 3, 16, 4, 3, 19, C(hair))             # hair back
    m.set_voxel(1, 0, 18, C(hair))                      # temple L
    m.set_voxel(4, 0, 18, C(hair))                      # temple R
    m.set_voxel(1, 0, 17, C("hair_black"))              # eye L
    m.set_voxel(4, 0, 17, C("hair_black"))              # eye R
    save_and_preview(m, name)


if __name__ == "__main__":
    # seated (Training conference table)
    attendee("att_blue", "npc_blue")
    attendee("att_red", "npc_red")
    attendee("att_green", "npc_green")
    attendee("att_cream", "cream")
    attendee("att_steel", "steel")
    # standing (War Room colleagues)
    stander("att_stand_blue", "npc_blue")
    stander("att_stand_green", "npc_green")
    print("MEETING + WAR-ROOM PEOPLE OK")
