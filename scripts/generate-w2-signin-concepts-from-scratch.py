from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    # Windows-friendly fallbacks
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
    return ImageFont.load_default()


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def gradient_vertical(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", (w, h), top)
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(lerp(top[0], bottom[0], t))
        g = int(lerp(top[1], bottom[1], t))
        b = int(lerp(top[2], bottom[2], t))
        for x in range(w):
            px[x, y] = (r, g, b)
    return img


def add_starfield(img: Image.Image, density: int = 240) -> Image.Image:
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    # deterministic pseudo-random without importing random: LCG
    seed = 1337

    def rnd() -> float:
        nonlocal seed
        seed = (1103515245 * seed + 12345) % (2**31)
        return seed / (2**31)

    for _ in range(density):
        x = int(rnd() * w)
        y = int(rnd() * h)
        r = 1 if rnd() < 0.82 else 2
        a = int(140 + rnd() * 110)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(235, 245, 250, a))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=0.6))
    return Image.alpha_composite(img.convert("RGBA"), overlay)


def glow_blob(w: int, h: int, cx: float, cy: float, r: float, rgba: tuple[int, int, int, int]) -> Image.Image:
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rad = int(min(w, h) * r)
    x = int(w * cx)
    y = int(h * cy)
    d.ellipse((x - rad, y - rad, x + rad, y + rad), fill=rgba)
    return img.filter(ImageFilter.GaussianBlur(radius=max(18, int(rad * 0.12))))


def aurora_layer(w: int, h: int, tilt: float, color: tuple[int, int, int], alpha: int) -> Image.Image:
    # Simple tilted aurora ribbon using polygons + blur.
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    mid = h * 0.38
    amp = h * 0.16
    points = []
    for i in range(0, 15):
        x = (w / 14) * i
        y = mid + math.sin(i / 2.3) * amp + (x - w / 2) * tilt
        points.append((x, y))
    # thick ribbon (offset copy)
    points2 = [(x, y + h * 0.20) for x, y in reversed(points)]
    d.polygon(points + points2, fill=(color[0], color[1], color[2], alpha))
    return layer.filter(ImageFilter.GaussianBlur(radius=36))


def vignette(w: int, h: int, strength: int = 120) -> Image.Image:
    v = Image.new("L", (w, h), 0)
    frame = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(frame)
    d.rectangle((0, 0, w, h), outline=strength, width=int(min(w, h) * 0.10))
    frame = frame.filter(ImageFilter.GaussianBlur(radius=int(min(w, h) * 0.06)))
    v = ImageChops.lighter(v, frame)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.putalpha(v)
    return out


def rounded_rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], r: int, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def glass_panel(size: tuple[int, int], r: int = 28, fill=(255, 255, 255, 22), outline=(255, 255, 255, 60)) -> Image.Image:
    w, h = size
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rounded_rect(d, (0, 0, w - 1, h - 1), r, fill=fill, outline=outline, width=1)
    # inner highlight
    rounded_rect(d, (2, 2, w - 3, h - 3), r - 2, fill=(0, 0, 0, 0), outline=(255, 255, 255, 28), width=1)
    return img


def draw_wordmark(draw: ImageDraw.ImageDraw, w: int, y: int) -> None:
    font = load_font(54, bold=False)
    text = "L I V I A"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (w - tw) // 2
    draw.text((x, y), text, font=font, fill=(235, 245, 250, 215))
    # Cyan slash accent near end (evokes existing mark without needing SVG)
    ax = x + tw - 16
    draw.line((ax, y + 12, ax + 18, y + 44), fill=(34, 211, 238, 230), width=4)


def draw_clerk_stub(panel: Image.Image) -> None:
    # A UI stub that resembles a Clerk sign-in card (not pixel exact).
    w, h = panel.size
    d = ImageDraw.Draw(panel)
    f_h = load_font(26, bold=True)
    f_p = load_font(14, bold=False)
    f_lbl = load_font(12, bold=False)
    f_btn = load_font(14, bold=True)

    # Avatar
    cx, cy = w // 2, int(h * 0.18)
    d.ellipse((cx - 26, cy - 26, cx + 26, cy + 26), fill=(20, 30, 40, 180), outline=(255, 255, 255, 70), width=1)
    d.text((cx - 8, cy - 14), "L", font=load_font(18, True), fill=(34, 211, 238, 220))

    title = "Sign in to your shop"
    bbox = d.textbbox((0, 0), title, font=f_h)
    d.text(((w - (bbox[2] - bbox[0])) // 2, int(h * 0.28)), title, font=f_h, fill=(235, 245, 250, 230))
    sub = "Access your shop and manage your business\nwith Livia."
    d.multiline_text((w // 2, int(h * 0.36)), sub, font=f_p, fill=(235, 245, 250, 145), anchor="ma", align="center", spacing=4)

    # Email label + field
    d.text((int(w * 0.12), int(h * 0.50)), "Email address", font=f_lbl, fill=(235, 245, 250, 170))
    field = (int(w * 0.12), int(h * 0.54), int(w * 0.88), int(h * 0.61))
    rounded_rect(d, field, 10, fill=(10, 14, 18, 160), outline=(255, 255, 255, 40), width=1)
    d.text((field[0] + 14, field[1] + 10), "you@yourshop.com", font=f_lbl, fill=(235, 245, 250, 120))

    # Continue button
    btn = (int(w * 0.12), int(h * 0.64), int(w * 0.88), int(h * 0.73))
    rounded_rect(d, btn, 12, fill=(38, 218, 240, 210), outline=(255, 255, 255, 35), width=1)
    d.text((w // 2 - 18, btn[1] + 12), "Continue", font=f_btn, fill=(0, 0, 0, 210))
    d.text((w // 2 + 64, btn[1] + 12), "→", font=f_btn, fill=(0, 0, 0, 210))

    # Divider
    d.line((int(w * 0.18), int(h * 0.77), int(w * 0.82), int(h * 0.77)), fill=(255, 255, 255, 26), width=1)
    d.text((w // 2, int(h * 0.775) - 10), "or", font=f_lbl, fill=(235, 245, 250, 90), anchor="ma")

    # Google button
    gbtn = (int(w * 0.12), int(h * 0.81), int(w * 0.88), int(h * 0.90))
    rounded_rect(d, gbtn, 12, fill=(255, 255, 255, 10), outline=(255, 255, 255, 50), width=1)
    d.text((w // 2 - 66, gbtn[1] + 12), "Continue with Google", font=f_p, fill=(235, 245, 250, 160))


def concept_a_split(size: tuple[int, int]) -> Image.Image:
    w, h = size
    bg = gradient_vertical(size, (6, 10, 16), (2, 20, 32))
    bg = add_starfield(bg, density=220)
    bg_rgba = bg.convert("RGBA")
    bg_rgba = Image.alpha_composite(bg_rgba, aurora_layer(w, h, tilt=-0.00035, color=(6, 182, 212), alpha=120))
    bg_rgba = Image.alpha_composite(bg_rgba, aurora_layer(w, h, tilt=0.00025, color=(34, 211, 238), alpha=90))
    bg_rgba = Image.alpha_composite(bg_rgba, glow_blob(w, h, 0.15, 0.55, 0.55, (0, 0, 0, 170)))

    out = bg_rgba.copy()
    d = ImageDraw.Draw(out)
    draw_wordmark(d, w, int(h * 0.08))

    # Left brand panel
    left_w = int(w * 0.36)
    left = Image.new("RGBA", (left_w, h), (8, 10, 16, 200))
    left = Image.alpha_composite(left, glow_blob(left_w, h, 0.55, 0.25, 0.55, (34, 211, 238, 26)))
    out.alpha_composite(left, (0, 0))

    fh = load_font(32, bold=True)
    fp = load_font(16, bold=False)
    fb = load_font(15, bold=False)
    x = int(left_w * 0.14)
    y = int(h * 0.26)
    d.text((x, y), "People-business OS", font=fh, fill=(235, 245, 250, 230))
    y += 48
    d.text((x, y), "Inbox → bookings → deposits.\nOne continuity line.", font=fp, fill=(235, 245, 250, 155), spacing=6)
    y += 78
    for line in ["Operator-first (not marketplace)", "EU-forward privacy + consent", "Premium calm, no clutter"]:
        d.ellipse((x, y + 7, x + 10, y + 17), fill=(34, 211, 238, 210))
        d.text((x + 18, y), line, font=fb, fill=(235, 245, 250, 150))
        y += 30

    # Right sign-in card
    card_w = int(w * 0.38)
    card_h = int(h * 0.68)
    card = glass_panel((card_w, card_h), r=30)
    # blur background behind card for glass effect
    bx, by = int(w * 0.54), int(h * 0.20)
    backdrop = out.crop((bx, by, bx + card_w, by + card_h)).filter(ImageFilter.GaussianBlur(radius=10))
    backdrop = ImageEnhance.Brightness(backdrop).enhance(1.08)
    backdrop.putalpha(210)
    out.alpha_composite(backdrop, (bx, by))
    out.alpha_composite(card, (bx, by))
    clerk = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    draw_clerk_stub(clerk)
    out.alpha_composite(clerk, (bx, by))

    out = Image.alpha_composite(out, vignette(w, h, 120))
    return out


def concept_b_centered(size: tuple[int, int]) -> Image.Image:
    w, h = size
    bg = gradient_vertical(size, (4, 8, 14), (10, 18, 28))
    bg = add_starfield(bg, density=280)
    bg_rgba = bg.convert("RGBA")
    bg_rgba = Image.alpha_composite(bg_rgba, aurora_layer(w, h, tilt=0.00015, color=(34, 211, 238), alpha=110))
    bg_rgba = Image.alpha_composite(bg_rgba, aurora_layer(w, h, tilt=-0.00008, color=(139, 92, 246), alpha=70))
    bg_rgba = Image.alpha_composite(bg_rgba, glow_blob(w, h, 0.50, 0.48, 0.40, (255, 255, 255, 18)))

    out = bg_rgba.copy()
    d = ImageDraw.Draw(out)
    draw_wordmark(d, w, int(h * 0.07))

    # Central big card + halo ring
    halo = glow_blob(w, h, 0.5, 0.50, 0.30, (34, 211, 238, 50))
    out = Image.alpha_composite(out, halo)

    card_w = int(w * 0.46)
    card_h = int(h * 0.70)
    bx, by = (w - card_w) // 2, int(h * 0.18)
    backdrop = out.crop((bx, by, bx + card_w, by + card_h)).filter(ImageFilter.GaussianBlur(radius=12))
    backdrop = ImageEnhance.Contrast(backdrop).enhance(1.05)
    backdrop.putalpha(220)
    out.alpha_composite(backdrop, (bx, by))
    out.alpha_composite(glass_panel((card_w, card_h), r=34, fill=(255, 255, 255, 20)), (bx, by))

    clerk = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    draw_clerk_stub(clerk)
    out.alpha_composite(clerk, (bx, by))

    # Bottom microcopy row (distinct)
    fp = load_font(13, False)
    d.text((w // 2, int(h * 0.92)), "Secure sign-in · Operator OS · Not a marketplace", font=fp, fill=(235, 245, 250, 120), anchor="ma")
    out = Image.alpha_composite(out, vignette(w, h, 130))
    return out


def concept_c_minimal_sheet(size: tuple[int, int]) -> Image.Image:
    w, h = size
    bg = gradient_vertical(size, (6, 10, 16), (10, 16, 24))
    bg = add_starfield(bg, density=180)
    bg_rgba = bg.convert("RGBA")
    bg_rgba = Image.alpha_composite(bg_rgba, aurora_layer(w, h, tilt=-0.00025, color=(6, 182, 212), alpha=80))
    bg_rgba = Image.alpha_composite(bg_rgba, glow_blob(w, h, 0.76, 0.52, 0.55, (6, 182, 212, 30)))
    bg_rgba = Image.alpha_composite(bg_rgba, glow_blob(w, h, 0.22, 0.18, 0.55, (0, 0, 0, 170)))

    out = bg_rgba.copy()
    d = ImageDraw.Draw(out)
    draw_wordmark(d, w, int(h * 0.07))
    d.line((int(w * 0.18), int(h * 0.17), int(w * 0.82), int(h * 0.17)), fill=(255, 255, 255, 38), width=1)

    sheet_y = int(h * 0.46)
    sheet_h = int(h * 0.50)
    sheet = Image.new("RGBA", (w, sheet_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sheet)
    rounded_rect(
        sd,
        (int(w * 0.12), 0, int(w * 0.88), sheet_h - 6),
        30,
        fill=(255, 255, 255, 14),
        outline=(255, 255, 255, 46),
        width=1,
    )
    out.alpha_composite(sheet, (0, sheet_y))

    card_w = int(w * 0.34)
    card_h = int(sheet_h * 0.74)
    bx = int(w * 0.18)
    by = sheet_y + int(sheet_h * 0.10)
    backdrop = out.crop((bx, by, bx + card_w, by + card_h)).filter(ImageFilter.GaussianBlur(radius=14))
    backdrop = ImageEnhance.Brightness(backdrop).enhance(1.06)
    backdrop.putalpha(210)
    out.alpha_composite(backdrop, (bx, by))
    out.alpha_composite(glass_panel((card_w, card_h), r=26, fill=(255, 255, 255, 18)), (bx, by))
    clerk = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    draw_clerk_stub(clerk)
    out.alpha_composite(clerk, (bx, by))

    # Right copy block (new composition)
    fh = load_font(30, True)
    fp = load_font(16, False)
    tx = int(w * 0.56)
    ty = sheet_y + int(sheet_h * 0.16)
    d.text((tx, ty), "Welcome back.", font=fh, fill=(235, 245, 250, 220))
    ty += 44
    d.multiline_text((tx, ty), "Gateway skin.\nTenant presets load after sign-in.", font=fp, fill=(235, 245, 250, 150), spacing=6)
    ty += 66
    pill = (tx, ty, tx + 240, ty + 32)
    rounded_rect(d, pill, 16, fill=(6, 182, 212, 52), outline=(34, 211, 238, 110), width=1)
    d.text((tx + 12, ty + 8), "Continue to dashboard →", font=load_font(14, False), fill=(235, 245, 250, 180))

    out = Image.alpha_composite(out, vignette(w, h, 120))
    return out


@dataclass(frozen=True)
class Concept:
    id: str
    title: str
    render: callable


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "docs/design/assets/w2-gateway/sign-in"
    out_dir.mkdir(parents=True, exist_ok=True)

    # "Platform default" = W2 gateway aurora: dark + cyan, premium glass, calm motion.
    size = (1536, 1024)
    concepts = [
        Concept("w2-signin-split-panel", "Split panel gateway", lambda: concept_a_split(size)),
        Concept("w2-signin-centered-halo", "Centered halo gateway", lambda: concept_b_centered(size)),
        Concept("w2-signin-minimal-sheet", "Minimal sheet gateway", lambda: concept_c_minimal_sheet(size)),
    ]

    for c in concepts:
        img = c.render()
        path = out_dir / f"{c.id}.sample.png"
        img.convert("RGB").save(path, format="PNG", optimize=True)
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()

