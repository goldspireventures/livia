from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont


@dataclass(frozen=True)
class Concept:
    id: str
    title: str


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    # Best-effort fonts on Windows; fall back to default.
    candidates = [
        ("C:/Windows/Fonts/segoeui.ttf", False),
        ("C:/Windows/Fonts/segoeuib.ttf", True),
        ("C:/Windows/Fonts/arial.ttf", False),
        ("C:/Windows/Fonts/arialbd.ttf", True),
    ]
    for path, is_bold in candidates:
        if bold != is_bold:
            continue
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        return ImageFont.load_default()


def crop_signin_card(gateway: Image.Image) -> Image.Image:
    """Crop the Clerk card area from the current approved screenshot."""
    w, h = gateway.size
    # Tuned for 1536x1024 gateway-default.target.png
    # Include subtle outer glow and keep the card readable.
    x0 = int(w * 0.33)
    y0 = int(h * 0.20)
    x1 = int(w * 0.67)
    y1 = int(h * 0.90)
    return gateway.crop((x0, y0, x1, y1)).convert("RGBA")


def vignette(w: int, h: int, strength: int = 120) -> Image.Image:
    v = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(v)
    d.rectangle((0, 0, w, h), fill=0)
    # soft dark frame
    frame = Image.new("L", (w, h), 0)
    fd = ImageDraw.Draw(frame)
    fd.rectangle((0, 0, w, h), outline=strength, width=int(min(w, h) * 0.08))
    frame = frame.filter(ImageFilter.GaussianBlur(radius=int(min(w, h) * 0.06)))
    v = ImageChops.lighter(v, frame)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.putalpha(v)
    return out


def glow_blob(w: int, h: int, cx: float, cy: float, r: float, rgba: tuple[int, int, int, int]) -> Image.Image:
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rad = int(min(w, h) * r)
    x = int(w * cx)
    y = int(h * cy)
    d.ellipse((x - rad, y - rad, x + rad, y + rad), fill=rgba)
    return img.filter(ImageFilter.GaussianBlur(radius=max(16, int(rad * 0.12))))


def make_background(base: Image.Image, mode: str) -> Image.Image:
    """Create distinct gateway-ish backgrounds from the same source."""
    w, h = base.size
    if mode == "split":
        # Zoom + blur background for right side; keep left darker.
        zoom = base.resize((int(w * 1.25), int(h * 1.25)), Image.LANCZOS)
        zx = int((zoom.size[0] - w) * 0.55)
        zy = int((zoom.size[1] - h) * 0.40)
        bg = zoom.crop((zx, zy, zx + w, zy + h)).filter(ImageFilter.GaussianBlur(radius=2))
        bg = ImageEnhance.Contrast(bg).enhance(1.08)
        bg = ImageEnhance.Color(bg).enhance(1.06)
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        overlay = Image.alpha_composite(overlay, glow_blob(w, h, 0.78, 0.40, 0.52, (6, 182, 212, 40)))
        overlay = Image.alpha_composite(overlay, glow_blob(w, h, 0.18, 0.30, 0.55, (0, 0, 0, 130)))
        return Image.alpha_composite(bg, overlay)

    if mode == "orbit":
        # Darker, higher contrast, with a central halo.
        bg = base.filter(ImageFilter.GaussianBlur(radius=1))
        bg = ImageEnhance.Contrast(bg).enhance(1.14)
        bg = ImageEnhance.Color(bg).enhance(0.95)
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        overlay = Image.alpha_composite(overlay, glow_blob(w, h, 0.52, 0.44, 0.36, (34, 211, 238, 42)))
        overlay = Image.alpha_composite(overlay, glow_blob(w, h, 0.52, 0.44, 0.22, (255, 255, 255, 18)))
        overlay = Image.alpha_composite(overlay, glow_blob(w, h, 0.85, 0.30, 0.40, (139, 92, 246, 26)))
        return Image.alpha_composite(bg, overlay)

    # minimal
    bg = base.filter(ImageFilter.GaussianBlur(radius=6))
    bg = ImageEnhance.Color(bg).enhance(0.75)
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    overlay = Image.alpha_composite(overlay, glow_blob(w, h, 0.75, 0.55, 0.58, (6, 182, 212, 24)))
    overlay = Image.alpha_composite(overlay, glow_blob(w, h, 0.30, 0.20, 0.50, (0, 0, 0, 120)))
    overlay = Image.alpha_composite(overlay, Image.new("RGBA", (w, h), (10, 12, 18, 28)))
    return Image.alpha_composite(bg, overlay)


def draw_wordmark(d: ImageDraw.ImageDraw, w: int, y: int) -> None:
    font = load_font(56, bold=False)
    text = "L I V I A"
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    d.text(((w - tw) // 2, y), text, font=font, fill=(235, 245, 250, 210))
    # Accent stroke on final "A" area (simple slash)
    ax = (w + tw) // 2 - 10
    d.line((ax, y + 12, ax + 18, y + 44), fill=(34, 211, 238, 220), width=4)


def concept_split(base: Image.Image, card: Image.Image) -> Image.Image:
    w, h = base.size
    bg = make_background(base, "split")
    out = bg.copy()
    d = ImageDraw.Draw(out)
    draw_wordmark(d, w, int(h * 0.10))

    # Left brand panel
    panel_w = int(w * 0.34)
    left = Image.new("RGBA", (panel_w, h), (10, 12, 18, 180))
    left = Image.alpha_composite(left, glow_blob(panel_w, h, 0.45, 0.25, 0.55, (6, 182, 212, 24)))
    out.alpha_composite(left, (0, 0))

    font_h = load_font(30, bold=True)
    font_p = load_font(18, bold=False)
    x = int(panel_w * 0.12)
    y = int(h * 0.26)
    d.text((x, y), "People-business OS", font=font_h, fill=(235, 245, 250, 225))
    y += 46
    d.text((x, y), "Inbox → bookings → deposits.\nOne continuity line.", font=font_p, fill=(235, 245, 250, 160))
    y += 74
    bullets = ["Fast sign-in (Clerk)", "Staging + production safe", "No tenant skin bleed"]
    font_b = load_font(16, bold=False)
    for b in bullets:
        d.ellipse((x, y + 7, x + 10, y + 17), fill=(34, 211, 238, 200))
        d.text((x + 18, y), b, font=font_b, fill=(235, 245, 250, 150))
        y += 28

    # Place Clerk card on right
    card_w = int(w * 0.38)
    card_h = int(card_w * (card.size[1] / card.size[0]))
    c = card.resize((card_w, card_h), Image.LANCZOS)
    out.alpha_composite(c, (int(w * 0.56), int(h * 0.20)))

    out = Image.alpha_composite(out, vignette(w, h, 110))
    return out


def concept_orbit(base: Image.Image, card: Image.Image) -> Image.Image:
    w, h = base.size
    bg = make_background(base, "orbit")
    out = bg.copy()
    d = ImageDraw.Draw(out)
    draw_wordmark(d, w, int(h * 0.09))

    # Orbital dots around center to make it feel distinct.
    cx, cy = int(w * 0.50), int(h * 0.49)
    for i, a in enumerate([0, 38, 78, 122, 165, 210, 248, 290]):
        import math

        r = int(min(w, h) * 0.22)
        x = cx + int(r * math.cos(math.radians(a)))
        y = cy + int(r * math.sin(math.radians(a)))
        dot = 7 if i % 2 == 0 else 5
        col = (34, 211, 238, 170) if i % 3 else (139, 92, 246, 140)
        d.ellipse((x - dot, y - dot, x + dot, y + dot), fill=col)

    # Center card slightly higher (hero)
    card_w = int(w * 0.40)
    card_h = int(card_w * (card.size[1] / card.size[0]))
    c = card.resize((card_w, card_h), Image.LANCZOS)
    out.alpha_composite(c, (int(w * 0.30), int(h * 0.18)))

    # Bottom micro-copy row (distinct from other concepts)
    font = load_font(14, bold=False)
    d.text((int(w * 0.34), int(h * 0.90)), "Secure sign-in · No marketplace · Your data stays yours", font=font, fill=(235, 245, 250, 120))

    out = Image.alpha_composite(out, vignette(w, h, 125))
    return out


def concept_minimal_sheet(base: Image.Image, card: Image.Image) -> Image.Image:
    w, h = base.size
    bg = make_background(base, "minimal")
    out = bg.copy()
    d = ImageDraw.Draw(out)
    draw_wordmark(d, w, int(h * 0.08))

    # Add a faint top nav line
    d.line((int(w * 0.18), int(h * 0.18), int(w * 0.82), int(h * 0.18)), fill=(255, 255, 255, 35), width=1)

    # Bottom sheet container (rounded)
    sheet_y = int(h * 0.46)
    sheet_h = int(h * 0.50)
    sheet = Image.new("RGBA", (w, sheet_h), (255, 255, 255, 10))
    sd = ImageDraw.Draw(sheet)
    sd.rounded_rectangle((int(w * 0.14), 0, int(w * 0.86), sheet_h - 6), radius=26, fill=(255, 255, 255, 16), outline=(255, 255, 255, 40), width=1)
    sheet = sheet.filter(ImageFilter.GaussianBlur(radius=0))
    out.alpha_composite(sheet, (0, sheet_y))

    # Place card inside sheet, but scaled down a bit and aligned left for a different feel.
    card_w = int(w * 0.34)
    card_h = int(card_w * (card.size[1] / card.size[0]))
    c = card.resize((card_w, card_h), Image.LANCZOS)
    out.alpha_composite(c, (int(w * 0.22), sheet_y + int(sheet_h * 0.08)))

    # Right-side copy inside sheet
    font_h = load_font(28, bold=True)
    font_p = load_font(16, bold=False)
    tx = int(w * 0.58)
    ty = sheet_y + int(sheet_h * 0.14)
    d.text((tx, ty), "Welcome back.", font=font_h, fill=(235, 245, 250, 220))
    ty += 42
    d.text((tx, ty), "Platform gateway skin.\nTenant presets load after sign-in.", font=font_p, fill=(235, 245, 250, 150))
    ty += 56
    pill = (tx, ty, tx + 230, ty + 30)
    d.rounded_rectangle(pill, radius=15, fill=(6, 182, 212, 40), outline=(34, 211, 238, 90), width=1)
    d.text((tx + 12, ty + 7), "Continue to dashboard →", font=load_font(14, False), fill=(235, 245, 250, 170))

    out = Image.alpha_composite(out, vignette(w, h, 120))
    return out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    src = root / "docs/design/assets/w2-gateway/sign-in/gateway-default.target.png"
    out_dir = root / "docs/design/assets/w2-gateway/sign-in"
    out_dir.mkdir(parents=True, exist_ok=True)

    base = Image.open(src).convert("RGBA")
    card = crop_signin_card(base)

    concepts = [
        ("concept-split-panel", "Split panel gateway"),
        ("concept-orbit-halo", "Orbit halo gateway"),
        ("concept-minimal-sheet", "Minimal bottom sheet"),
    ]

    renders = [
        (concepts[0][0], concept_split(base, card)),
        (concepts[1][0], concept_orbit(base, card)),
        (concepts[2][0], concept_minimal_sheet(base, card)),
    ]

    for cid, img in renders:
        path = out_dir / f"{cid}.sample.png"
        img.convert("RGB").save(path, format="PNG", optimize=True)
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()

