"""Crop sidebar flower from noir-dusk northstar mock."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/design/assets/w4-tenant/beauty/presets/noir-dusk/dashboard-owner-solo.target.png"
OUT = ROOT / "artifacts/livia-dashboard/public/assets/beauty/noir-dusk-sidebar-bloom.png"

# 1536×1024 — botanical from sidebar corner (painted bloom + stem)
BOX = (0, 520, 400, 1024)

img = Image.open(SRC).convert("RGBA")
crop = img.crop(BOX)
OUT.parent.mkdir(parents=True, exist_ok=True)
crop.save(OUT, optimize=True)
print(f"Wrote {OUT} size={crop.size}")
