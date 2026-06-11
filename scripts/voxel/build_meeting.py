"""Meeting-room attendees for the TRAINING scene (SHOT 11 reimagined as a
frontend-training session): seated colleagues in assorted shirt colors.

Seated form = torso + head + hair + forearms resting forward; legs are omitted
because the conference table hides them (cheaper + reads as 'seated').

COORDINATE CONVENTION (see _voxlib): x=width, y=depth (front=y=0), z=up.
Run via the MagicaVoxel-MCP venv.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402


def attendee(name: str, shirt: str, hair: str = "hair_black"):
    # x=6 wide, y=4 deep, z=12 tall — a seated upper body facing +Y? No: faces
    # FRONT (y=0). Torso z0..7, head z8..11, hair cap + back, forearms forward.
    m = new_model(6, 4, 12)
    m.fill_box(0, 0, 0, 5, 3, 7, C(shirt))       # torso/shoulders
    m.fill_box(1, 0, 8, 4, 3, 10, C("skin"))     # head
    m.fill_box(1, 0, 11, 4, 3, 11, C(hair))      # hair cap (top)
    m.fill_box(1, 3, 8, 4, 3, 11, C(hair))       # hair back
    m.set_voxel(1, 0, 9, C(hair))                # side hair
    m.set_voxel(4, 0, 9, C(hair))
    # forearms resting forward onto the table (front, low)
    m.fill_box(0, 0, 4, 1, 0, 4, C("skin"))
    m.fill_box(4, 0, 4, 5, 0, 4, C("skin"))
    save_and_preview(m, name)


if __name__ == "__main__":
    attendee("att_blue", "npc_blue")
    attendee("att_red", "npc_red")
    attendee("att_green", "npc_green")
    attendee("att_cream", "cream")
    attendee("att_steel", "steel")
    print("MEETING ATTENDEES OK")
