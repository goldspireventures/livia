#!/usr/bin/env python3
"""Extract G1 trade-card hero photos from g1-wedge-web.target.png (locked northstar)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/design/assets/w2-gateway/demo/g1-wedge-web.target.png"
OUT_DIR = ROOT / "artifacts/livia-dashboard/public/w2-gateway/cards"

# Photo wells inside each card on the 1536×1024 mock (x, y, w, h).
PHOTO_WELLS: dict[str, tuple[int, int, int, int]] = {
    "tattoo": (132, 286, 188, 332),
    "barber": (368, 286, 178, 332),
    "medspa": (584, 286, 188, 332),
    "hair": (810, 286, 188, 332),
    "beauty": (1036, 286, 188, 332),
    "wellness": (1262, 286, 188, 332),
}

OUT_SIZE = (600, 900)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    im = Image.open(SOURCE).convert("RGB")
    for key, box in PHOTO_WELLS.items():
        left, top, width, height = box
        crop = im.crop((left, top, left + width, top + height))
        crop = crop.resize(OUT_SIZE, Image.Resampling.LANCZOS)
        out = OUT_DIR / f"{key}.jpg"
        crop.save(out, "JPEG", quality=88, optimize=True)
        print(f"wrote {out}")


if __name__ == "__main__":
    main()
