#!/usr/bin/env python3
"""
Wellness G2 wedge mocks — reproducible PIL renders only (no AI screenshots).

3 presets × 3 surfaces:
  - web/inbox-thread.sample.png
  - web/dashboard-owner-solo.sample.png  (Today)
  - mobile/book-mobile.sample.png        (W5 /b)

Run: python scripts/generate-wellness-wedge-mocks.py

Outputs:
  docs/design/assets/w4-tenant/wellness/presets/{preset}/...
  docs/design/assets/w5-public/wellness/presets/{preset}/...
  artifacts/livia-dashboard/public/w2-gateway/beats/wellness/{preset}/...
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WEB = (1440, 900)
PHONE = (390, 844)

PRESETS = ("spa-calm", "zen-light", "retreat-dark")

BUSINESS = "Harbour Wellness"
LOCATION = "Cork"


@dataclass(frozen=True)
class Theme:
    id: str
    label: str
    bg: tuple[int, int, int]
    surface: tuple[int, int, int]
    card: tuple[int, int, int]
    border: tuple[int, int, int]
    text: tuple[int, int, int]
    muted: tuple[int, int, int]
    accent: tuple[int, int, int]
    accent_soft: tuple[int, int, int]
    serif: bool
    dark: bool


THEMES: dict[str, Theme] = {
    "spa-calm": Theme(
        id="spa-calm",
        label="Spa Calm",
        bg=(244, 248, 246),
        surface=(255, 255, 255),
        card=(250, 252, 251),
        border=(203, 221, 214),
        text=(22, 48, 42),
        muted=(92, 118, 110),
        accent=(13, 148, 136),
        accent_soft=(204, 236, 229),
        serif=True,
        dark=False,
    ),
    "zen-light": Theme(
        id="zen-light",
        label="Zen Light",
        bg=(252, 252, 250),
        surface=(255, 255, 255),
        card=(255, 255, 255),
        border=(229, 231, 235),
        text=(31, 41, 55),
        muted=(107, 114, 128),
        accent=(75, 85, 99),
        accent_soft=(243, 244, 246),
        serif=False,
        dark=False,
    ),
    "retreat-dark": Theme(
        id="retreat-dark",
        label="Retreat Dark",
        bg=(14, 20, 18),
        surface=(22, 30, 27),
        card=(28, 38, 34),
        border=(48, 62, 56),
        text=(232, 240, 236),
        muted=(148, 168, 158),
        accent=(94, 184, 158),
        accent_soft=(36, 58, 50),
        serif=True,
        dark=True,
    ),
}


def font(size: int, bold: bool = False, serif: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if serif:
        for p in ("C:/Windows/Fonts/georgiab.ttf", "C:/Windows/Fonts/georgiai.ttf", "C:/Windows/Fonts/times.ttf"):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                pass
    for p, b in (
        ("C:/Windows/Fonts/segoeuib.ttf", True),
        ("C:/Windows/Fonts/segoeui.ttf", False),
    ):
        if bold != b:
            continue
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()


def soft_glow(w: int, h: int, theme: Theme) -> Image.Image:
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse((int(w * 0.55), -int(h * 0.15), int(w * 1.05), int(h * 0.45)), fill=(*theme.accent, 28 if theme.dark else 18))
    if theme.dark:
        d.ellipse((-int(w * 0.2), int(h * 0.5), int(w * 0.5), int(h * 1.1)), fill=(212, 196, 168, 12))
    return layer.filter(ImageFilter.GaussianBlur(radius=48))


def draw_shell_header(d: ImageDraw.ImageDraw, w: int, theme: Theme, title: str, subtitle: str) -> int:
    y = 0
    d.rectangle((0, 0, w, 64), fill=theme.surface)
    d.line((0, 64, w, 64), fill=theme.border, width=1)
    d.text((28, 18), "Livia", font=font(18, serif=theme.serif), fill=theme.text)
    d.text((28, 40), subtitle, font=font(11), fill=theme.muted)
    d.text((w - 28, 32), title, font=font(12, True), fill=theme.accent, anchor="rm")
    return 72


def draw_sidebar(d: ImageDraw.ImageDraw, h: int, theme: Theme, active: str) -> None:
    sw = 220
    d.rectangle((0, 64, sw, h), fill=theme.card)
    d.line((sw, 64, sw, h), fill=theme.border, width=1)
    items = [("Today", "◆"), ("Inbox", "✉"), ("Bookings", "▣"), ("Guests", "◎")]
    y = 96
    for label, icon in items:
        on = label == active
        if on:
            d.rounded_rectangle((14, y - 6, sw - 14, y + 34), 10, fill=theme.accent_soft, outline=theme.accent, width=1)
        d.text((32, y + 10), icon, font=font(12), fill=theme.accent if on else theme.muted)
        d.text((56, y + 10), label, font=font(13, bold=on), fill=theme.text if on else theme.muted)
        y += 48
    d.text((28, h - 40), BUSINESS, font=font(11, serif=theme.serif), fill=theme.muted)
    d.text((28, h - 22), LOCATION, font=font(10), fill=theme.muted)


def render_inbox(theme: Theme) -> Image.Image:
    w, h = WEB
    img = Image.new("RGB", (w, h), theme.bg)
    glow = soft_glow(w, h, theme)
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)
    draw_shell_header(d, w, theme, "Inbox", f"{BUSINESS} · {LOCATION}")
    draw_sidebar(d, h, theme, "Inbox")

    x0, top = 240, 88
    list_w = 360
    d.rectangle((x0, top, x0 + list_w, h - 24), fill=theme.surface, outline=theme.border, width=1)
    d.text((x0 + 20, top + 16), "Threads", font=font(14, True), fill=theme.text)
    threads = [
        ("Maeve O'Connor", "Couples ritual — gift voucher?", "2m"),
        ("James & Aileen", "Float session reschedule", "18m"),
        ("Corporate retreat", "6 guests · Saturday block", "1h"),
    ]
    ty = top + 52
    for i, (name, preview, age) in enumerate(threads):
        if i == 0:
            d.rectangle((x0 + 8, ty - 4, x0 + list_w - 8, ty + 58), fill=theme.accent_soft)
        d.text((x0 + 20, ty), name, font=font(13, bold=i == 0), fill=theme.text)
        d.text((x0 + 20, ty + 20), preview, font=font(11), fill=theme.muted)
        d.text((x0 + list_w - 20, ty + 4), age, font=font(10), fill=theme.muted, anchor="rm")
        ty += 68

    rx = x0 + list_w + 16
    d.rectangle((rx, top, w - 24, h - 24), fill=theme.surface, outline=theme.border, width=1)
    d.text((rx + 24, top + 20), "Maeve O'Connor", font=font(20, serif=theme.serif), fill=theme.text)
    d.text((rx + 24, top + 48), "Gift voucher · Couples ritual", font=font(12), fill=theme.muted)
    bubbles = [
        ("Guest", "Hi — can we use our voucher for the couples ritual next Friday?"),
        ("Liv", "Yes — I found voucher WK-2041. Friday has 14:00 or 16:30 in the Serenity room."),
        ("Guest", "16:30 works. Can we add a float add-on?"),
    ]
    by = top + 88
    for who, msg in bubbles:
        guest = who == "Guest"
        bw = int((w - rx - 80) * 0.72)
        bh = 56
        bx = rx + 24 if guest else rx + (w - rx - 48) - bw - 24
        fill = theme.card if guest else theme.accent_soft
        d.rounded_rectangle((bx, by, bx + bw, by + bh), 14, fill=fill, outline=theme.border, width=1)
        d.text((bx + 14, by + 10), who.upper(), font=font(9, True), fill=theme.accent if not guest else theme.muted)
        d.text((bx + 14, by + 26), msg, font=font(11), fill=theme.text)
        by += bh + 14

    chip_y = h - 120
    d.rounded_rectangle((rx + 24, chip_y, w - 48, chip_y + 72), 12, fill=theme.accent_soft, outline=theme.accent, width=1)
    d.text((rx + 40, chip_y + 12), "Liv · suggested reply", font=font(10, True), fill=theme.accent)
    d.text(
        (rx + 40, chip_y + 32),
        "Book Serenity room 16:30 + float add-on — send payment link on /b",
        font=font(11),
        fill=theme.text,
    )
    return img


def render_today(theme: Theme) -> Image.Image:
    w, h = WEB
    img = Image.new("RGB", (w, h), theme.bg)
    glow = soft_glow(w, h, theme)
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)
    draw_shell_header(d, w, theme, "Today", f"{BUSINESS} · {LOCATION}")
    draw_sidebar(d, h, theme, "Today")

    x0, top = 240, 96
    d.text((x0, top), "Good afternoon, Sinead", font=font(28, serif=theme.serif), fill=theme.text)
    d.text((x0, top + 40), "Tuesday · 6 sessions · 2 rooms", font=font(13), fill=theme.muted)

    bx, by = x0, top + 88
    bw, bh = w - x0 - 32, 96
    d.rounded_rectangle((bx, by, bx + bw, by + bh), 16, fill=theme.accent_soft, outline=theme.accent, width=1)
    d.text((bx + 20, by + 16), "Liv · briefing", font=font(11, True), fill=theme.accent)
    d.text((bx + 20, by + 38), "Serenity room turnover buffer respected — Maeve at 16:30 confirmed.", font=font(13), fill=theme.text)
    d.text((bx + 20, by + 62), "Voucher WK-2041 applied · float add-on pending payment link.", font=font(12), fill=theme.muted)

    grid_y = by + bh + 28
    cards = [
        ("14:00", "Float session", "Stillness · Liam"),
        ("16:30", "Couples ritual", "Serenity · Maeve"),
        ("18:00", "Massage 90", "Garden · Orla"),
    ]
    cw = (bw - 32) // 3
    for i, (time, svc, room) in enumerate(cards):
        cx = bx + i * (cw + 16)
        d.rounded_rectangle((cx, grid_y, cx + cw, grid_y + 140), 14, fill=theme.surface, outline=theme.border, width=1)
        d.text((cx + 16, grid_y + 16), time, font=font(18, True), fill=theme.accent)
        d.text((cx + 16, grid_y + 48), svc, font=font(13, bold=True), fill=theme.text)
        d.text((cx + 16, grid_y + 72), room, font=font(11), fill=theme.muted)
        if i == 1:
            d.rounded_rectangle((cx + 16, grid_y + 100, cx + cw - 16, grid_y + 124), 8, fill=theme.accent_soft)
            d.text((cx + 24, grid_y + 108), "Voucher guest", font=font(10, True), fill=theme.accent)

    d.rounded_rectangle((bx, grid_y + 168, bx + bw, grid_y + 248), 14, fill=theme.surface, outline=theme.border, width=1)
    d.text((bx + 20, grid_y + 188), "Room utilisation", font=font(14, True), fill=theme.text)
    d.rectangle((bx + 20, grid_y + 218, bx + int(bw * 0.62), grid_y + 228), fill=theme.accent)
    d.rectangle((bx + int(bw * 0.62) + 8, grid_y + 218, bx + int(bw * 0.82), grid_y + 228), fill=theme.accent_soft)
    d.text((bx + bw - 20, grid_y + 212), "78%", font=font(12, True), fill=theme.accent, anchor="rm")
    return img


def render_book_mobile(theme: Theme) -> Image.Image:
    w, h = PHONE
    img = Image.new("RGB", (w, h), theme.bg)
    glow = soft_glow(w, h, theme)
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)

    d.rounded_rectangle((0, 0, w, 56), 0, fill=theme.surface)
    d.text((w // 2, 22), BUSINESS, font=font(16, serif=theme.serif), fill=theme.text, anchor="mm")
    d.text((w // 2, 42), "Book a session", font=font(11), fill=theme.muted, anchor="mm")

    hero_h = 200
    hero = Image.new("RGB", (w, hero_h), theme.accent_soft)
    hd = ImageDraw.Draw(hero)
    for y in range(hero_h):
        t = y / max(1, hero_h - 1)
        c = tuple(int(theme.accent_soft[i] * (1 - t * 0.35) + theme.bg[i] * t * 0.35) for i in range(3))
        hd.line((0, y, w, y), fill=c)
    hd.text((24, 28), "Harbour Wellness", font=font(20, serif=theme.serif), fill=theme.text)
    hd.text((24, 56), "Mind · body · calm", font=font(12), fill=theme.muted)
    img.paste(hero, (0, 56))

    y = 56 + hero_h + 20
    d.text((24, y), "Choose a treatment", font=font(14, True), fill=theme.text)
    y += 32
    services = [
        ("Massage 90 min", "€120 · Serenity room"),
        ("Float session", "€85 · Stillness suite"),
        ("Couples ritual", "€240 · 2 guests"),
    ]
    for name, meta in services:
        d.rounded_rectangle((20, y, w - 20, y + 72), 14, fill=theme.surface, outline=theme.border, width=1)
        d.text((36, y + 14), name, font=font(14, bold=True, serif=theme.serif), fill=theme.text)
        d.text((36, y + 38), meta, font=font(11), fill=theme.muted)
        d.ellipse((w - 52, y + 28, w - 32, y + 48), outline=theme.accent, width=2)
        y += 84

    d.rounded_rectangle((20, h - 88, w - 20, h - 28), 14, fill=theme.accent)
    d.text((w // 2, h - 58), "Continue", font=font(14, True), fill=(255, 255, 255) if not theme.dark else theme.bg, anchor="mm")
    d.text((w // 2, h - 18), "No account required", font=font(9), fill=theme.muted, anchor="mm")
    return img


def write_png(path: Path, img: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True)
    print(f"Wrote {path.relative_to(ROOT)}")


def main() -> None:
    for preset in PRESETS:
        theme = THEMES[preset]
        w4_web = ROOT / "docs/design/assets/w4-tenant/wellness/presets" / preset / "web"
        w5_mob = ROOT / "docs/design/assets/w5-public/wellness/presets" / preset / "mobile"
        beats = ROOT / "artifacts/livia-dashboard/public/w2-gateway/beats/wellness" / preset

        inbox = render_inbox(theme)
        today = render_today(theme)
        book = render_book_mobile(theme)

        write_png(w4_web / "inbox-thread.sample.png", inbox)
        write_png(w4_web / "dashboard-owner-solo.sample.png", today)
        write_png(w5_mob / "book-mobile.sample.png", book)

        write_png(beats / "inbox.png", inbox)
        write_png(beats / "today.png", today)
        write_png(beats / "book-mobile.png", book)

    readme = ROOT / "docs/design/assets/w4-tenant/wellness/README.md"
    readme.write_text(
        "\n".join(
            [
                "# wellness — W4/W5 target mocks",
                "",
                "Default preset: `spa-calm`",
                "",
                "Alt presets: `zen-light`, `retreat-dark`",
                "",
                "## Regenerate (code-only)",
                "",
                "```bash",
                "python scripts/generate-wellness-wedge-mocks.py",
                "```",
                "",
                "3 surfaces per preset: `inbox-thread`, `dashboard-owner-solo` (Today), `book-mobile` (W5).",
                "",
                "Wedge runtime crops: `artifacts/livia-dashboard/public/w2-gateway/beats/wellness/{preset}/`.",
                "",
                "Review `.sample.png` → delete rejects → rename to `.target.png`.",
                "",
                "**Unlock** `wellness` in `MARKETING_DEMO_WEDGE_UNLOCK_ORDER` only after founder signs off targets.",
                "",
                "See [`../../VERTICAL-TARGET-MOCK-PROGRAM.md`](../../VERTICAL-TARGET-MOCK-PROGRAM.md).",
                "",
            ]
        ),
        encoding="utf-8",
    )
    beats_readme = ROOT / "artifacts/livia-dashboard/public/w2-gateway/beats/wellness/README.md"
    beats_readme.parent.mkdir(parents=True, exist_ok=True)
    beats_readme.write_text(
        "\n".join(
            [
                "# Wellness G2 wedge beats (PIL-generated)",
                "",
                "Regenerate: `python scripts/generate-wellness-wedge-mocks.py`",
                "",
                "| Preset | Files |",
                "|--------|-------|",
                "| spa-calm | inbox.png, today.png, book-mobile.png |",
                "| zen-light | inbox.png, today.png, book-mobile.png |",
                "| retreat-dark | inbox.png, today.png, book-mobile.png |",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print("Done — 9 sample sets (3 presets × 3 surfaces).")


if __name__ == "__main__":
    main()
