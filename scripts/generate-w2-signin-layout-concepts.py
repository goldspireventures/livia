#!/usr/bin/env python3
"""Three bold W2 gateway sign-in *layouts* — same aurora skin, different composition."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont

SIZE = (1536, 1024)
CYAN = (34, 211, 238)
TEAL = (6, 182, 212)
INK = (235, 245, 250)


def load_font(size: int, bold: bool = False, serif: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if serif:
        for path in ("C:/Windows/Fonts/georgiab.ttf", "C:/Windows/Fonts/timesbd.ttf", "C:/Windows/Fonts/times.ttf"):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                pass
    for path, is_bold in (
        ("C:/Windows/Fonts/segoeuib.ttf", True),
        ("C:/Windows/Fonts/segoeui.ttf", False),
        ("C:/Windows/Fonts/arialbd.ttf", True),
        ("C:/Windows/Fonts/arial.ttf", False),
    ):
        if bold != is_bold:
            continue
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        col = tuple(int(lerp(top[i], bottom[i], t)) for i in range(3))
        for x in range(w):
            px[x, y] = col
    return img


def glow(w: int, h: int, cx: float, cy: float, r: float, rgba: tuple[int, int, int, int]) -> Image.Image:
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rad = int(min(w, h) * r)
    x, y = int(w * cx), int(h * cy)
    d.ellipse((x - rad, y - rad, x + rad, y + rad), fill=rgba)
    return layer.filter(ImageFilter.GaussianBlur(radius=max(20, rad // 8)))


def aurora_band(w: int, h: int, y_frac: float, height_frac: float, alpha: int) -> Image.Image:
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    y0 = int(h * y_frac)
    y1 = int(h * (y_frac + height_frac))
    pts = []
    for i in range(20):
        x = (w / 19) * i
        wave = math.sin(i / 2.1) * h * 0.04
        pts.append((x, y0 + wave))
    pts2 = [(x, y1 + h * 0.08) for x, _ in reversed(pts)]
    d.polygon(pts + pts2, fill=(TEAL[0], TEAL[1], TEAL[2], alpha))
    d.polygon(pts + pts2, fill=(CYAN[0], CYAN[1], CYAN[2], alpha // 2))
    return layer.filter(ImageFilter.GaussianBlur(radius=28))


def procedural_landscape(w: int, h: int) -> Image.Image:
    """Left-panel full-bleed aurora landscape (procedural, not a reused screenshot)."""
    base = gradient((w, h), (4, 8, 14), (8, 22, 32))
    out = base.convert("RGBA")
    out = Image.alpha_composite(out, aurora_band(w, h, 0.22, 0.28, 140))
    out = Image.alpha_composite(out, glow(w, h, 0.55, 0.35, 0.55, (*CYAN, 90)))
    out = Image.alpha_composite(out, glow(w, h, 0.25, 0.55, 0.45, (*TEAL, 70)))

  # Mountain silhouette
    d = ImageDraw.Draw(out)
    horizon = int(h * 0.62)
    peaks = [
        (0, horizon),
        (int(w * 0.08), int(h * 0.48)),
        (int(w * 0.22), int(h * 0.55)),
        (int(w * 0.38), int(h * 0.38)),
        (int(w * 0.52), int(h * 0.50)),
        (int(w * 0.68), int(h * 0.42)),
        (int(w * 0.82), int(h * 0.52)),
        (w, int(h * 0.58)),
        (w, h),
        (0, h),
    ]
    d.polygon(peaks, fill=(4, 6, 10, 240))
    # Water reflection
    d.rectangle((0, horizon, w, h), fill=(6, 12, 18, 200))
    reflect = glow(w, h, 0.5, 0.72, 0.35, (*CYAN, 45))
    out = Image.alpha_composite(out, reflect)
    return out


def glass_card(w: int, h: int, radius: int = 24) -> Image.Image:
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=(255, 255, 255, 24), outline=(255, 255, 255, 55), width=1)
    return card


def draw_clerk(panel: Image.Image, compact: bool = False) -> None:
    w, h = panel.size
    d = ImageDraw.Draw(panel)
    f_h = load_font(22 if compact else 26, bold=True)
    f_p = load_font(13 if compact else 14)
    f_l = load_font(11 if compact else 12)
    f_btn = load_font(13, bold=True)

    cy = int(h * (0.14 if compact else 0.16))
    cx = w // 2
    d.ellipse((cx - 22, cy - 22, cx + 22, cy + 22), fill=(12, 18, 24, 200), outline=(255, 255, 255, 60))
    d.text((cx - 7, cy - 12), "L", font=load_font(16, bold=True), fill=(*CYAN, 230))

    y = int(h * (0.26 if compact else 0.28))
    title = "Sign in to your shop"
    bb = d.textbbox((0, 0), title, font=f_h)
    d.text(((w - bb[2] + bb[0]) // 2, y), title, font=f_h, fill=(*INK, 230))
    y += 34 if compact else 38
    sub = "Access your shop with Livia."
    bb = d.textbbox((0, 0), sub, font=f_p)
    d.text(((w - bb[2] + bb[0]) // 2, y), sub, font=f_p, fill=(*INK, 140))

    y = int(h * (0.48 if compact else 0.50))
    d.text((int(w * 0.10), y), "Email address", font=f_l, fill=(*INK, 170))
    field = (int(w * 0.10), y + 22, int(w * 0.90), y + 54)
    d.rounded_rectangle(field, radius=10, fill=(8, 12, 16, 180), outline=(255, 255, 255, 40))
    d.text((field[0] + 12, field[1] + 10), "you@yourshop.com", font=f_l, fill=(*INK, 110))

    btn = (int(w * 0.10), y + 68, int(w * 0.90), y + 108)
    d.rounded_rectangle(btn, radius=11, fill=(*CYAN, 215), outline=(255, 255, 255, 30))
    d.text((w // 2 - 36, btn[1] + 12), "Continue →", font=f_btn, fill=(0, 0, 0, 210))

    if not compact:
        d.line((int(w * 0.18), y + 120, int(w * 0.82), y + 120), fill=(255, 255, 255, 30))
        gbtn = (int(w * 0.10), y + 132, int(w * 0.90), y + 172)
        d.rounded_rectangle(gbtn, radius=11, fill=(255, 255, 255, 12), outline=(255, 255, 255, 45))
        d.text((w // 2 - 72, gbtn[1] + 12), "Continue with Google", font=f_p, fill=(*INK, 150))


def wordmark(d: ImageDraw.ImageDraw, w: int, x: int, y: int, size: int = 44) -> None:
    font = load_font(size)
    text = "L I V I A"
    d.text((x, y), text, font=font, fill=(*INK, 210))
    bb = d.textbbox((x, y), text, font=font)
    d.line((bb[2] - 8, y + 10, bb[2] + 10, y + 38), fill=(*CYAN, 220), width=3)


def concept_fullbleed_left() -> Image.Image:
    w, h = SIZE
    out = Image.new("RGBA", (w, h), (6, 8, 12, 255))

    left_w = int(w * 0.52)
    landscape = procedural_landscape(left_w, h)
    out.alpha_composite(landscape, (0, 0))

    # Fade edge into right pane
    fade = Image.new("L", (int(w * 0.12), h), 0)
    fd = ImageDraw.Draw(fade)
    for x in range(fade.size[0]):
        t = x / max(1, fade.size[0] - 1)
        col = int(255 * t)
        fd.line((x, 0, x, h), fill=col)
    fade = fade.filter(ImageFilter.GaussianBlur(radius=8))
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    overlay.paste(Image.new("RGBA", fade.size, (6, 8, 12, 255)), (left_w - fade.size[0], 0), fade)
    out = Image.alpha_composite(out, overlay)

    # Right: clean dark, no stars
    right = Image.new("RGBA", (w - left_w, h), (6, 8, 12, 255))
    right = Image.alpha_composite(right, glow(w - left_w, h, 0.6, 0.2, 0.5, (*TEAL, 35)))
    out.alpha_composite(right, (left_w, 0))

    d = ImageDraw.Draw(out)
    wordmark(d, w, left_w + int((w - left_w) * 0.08), int(h * 0.08), 40)

    # Caption on left image
    lf = load_font(15)
    d.text((int(w * 0.06), int(h * 0.78)), "Operator OS for appointment businesses", font=lf, fill=(*INK, 180))

    card_w, card_h = int(w * 0.34), int(h * 0.58)
    bx = left_w + int((w - left_w - card_w) * 0.5)
    by = int(h * 0.28)
    backdrop = out.crop((bx, by, bx + card_w, by + card_h)).filter(ImageFilter.GaussianBlur(radius=12))
    backdrop.putalpha(200)
    out.alpha_composite(backdrop, (bx, by))
    out.alpha_composite(glass_card(card_w, card_h, 26), (bx, by))
    clerk = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    draw_clerk(clerk, compact=True)
    out.alpha_composite(clerk, (bx, by))
    return out


def concept_typographic() -> Image.Image:
    w, h = SIZE
    base = gradient((w, h), (5, 8, 14), (10, 16, 24)).convert("RGBA")
    out = Image.alpha_composite(base, aurora_band(w, h, 0.55, 0.12, 50))
    out = Image.alpha_composite(out, glow(w, h, 0.85, 0.15, 0.35, (*CYAN, 30)))

    d = ImageDraw.Draw(out)
    wordmark(d, w, int(w * 0.08), int(h * 0.07), 38)

    # Giant editorial type — dominant left
    serif_h = load_font(72, bold=True, serif=True)
    serif_sub = load_font(28, serif=True)
    x = int(w * 0.08)
    y = int(h * 0.22)
    d.text((x, y), "One thread.", font=serif_h, fill=(*INK, 235))
    y += 82
    d.text((x, y), "From first DM", font=serif_sub, fill=(*INK, 170))
    y += 40
    d.text((x, y), "to day-of.", font=serif_sub, fill=(*INK, 170))
    y += 56
    d.rectangle((x, y, x + 120, y + 4), fill=(*CYAN, 220))

    body = load_font(17)
    d.text((x, y + 24), "Sign in to run your shop on Livia — inbox, bookings, team.", font=body, fill=(*INK, 130))

    # Compact sign-in anchored bottom-right (not centered hero card)
    card_w, card_h = int(w * 0.30), int(h * 0.52)
    bx, by = int(w * 0.62), int(h * 0.38)
    out.alpha_composite(glass_card(card_w, card_h, 22), (bx, by))
    clerk = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    draw_clerk(clerk, compact=True)
    out.alpha_composite(clerk, (bx, by))

    d.text((int(w * 0.08), int(h * 0.92)), "Gateway · Platform skin · Not tenant preset", font=load_font(12), fill=(*INK, 90))
    return out


def concept_ultra_minimal() -> Image.Image:
    w, h = SIZE
    out = Image.new("RGBA", (w, h), (4, 5, 8, 255))
    # Single thin aurora strip at top only
    strip = aurora_band(w, h, 0.06, 0.10, 85)
    out = Image.alpha_composite(out, strip)

    d = ImageDraw.Draw(out)
    wordmark(d, w, (w - 200) // 2, int(h * 0.12), 36)

    card_w, card_h = 420, int(h * 0.52)
    bx = (w - card_w) // 2
    by = int(h * 0.30)
    out.alpha_composite(glass_card(card_w, card_h, 20), (bx, by))
    clerk = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    draw_clerk(clerk)
    out.alpha_composite(clerk, (bx, by))

    d.text((w // 2, int(h * 0.86)), "Secured sign-in · Livia Inc", font=load_font(12), fill=(*INK, 80), anchor="ma")
    return out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "docs/design/assets/w2-gateway/sign-in"
    out_dir.mkdir(parents=True, exist_ok=True)

    concepts = [
        ("w2-signin-layout-fullbleed", concept_fullbleed_left),
        ("w2-signin-layout-typographic", concept_typographic),
        ("w2-signin-layout-ultra-minimal", concept_ultra_minimal),
    ]

    for name, fn in concepts:
        path = out_dir / f"{name}.sample.png"
        fn().convert("RGB").save(path, format="PNG", optimize=True)
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()
