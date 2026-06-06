"""Smoke test: prove the pipeline writes a .vox and renders previews."""
import sys
from pathlib import Path

# Allow `import _voxlib` regardless of CWD
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _voxlib import new_model, save_and_preview, C  # noqa: E402

# z is UP. Build a small grass floor + cream block + glowing cap.
m = new_model(8, 8, 6)
m.fill_box(0, 0, 0, 7, 7, 0, C("grass"))       # floor (z=0)
m.fill_box(2, 2, 1, 5, 5, 4, C("cream"))        # block
m.fill_box(3, 3, 5, 4, 4, 5, C("window_glow"))  # glowing cap (top)
out = save_and_preview(m, "smoke_test")
assert out.exists(), "vox file not written"
print("SMOKE OK")
