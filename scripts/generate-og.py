#!/usr/bin/env python3
"""
Generate public/og.png — the OpenGraph social-card image (1200×630).
Brand-matched: dark navy bg, peach/orange accent, voxel-style decorative
shapes top-right.

Run:
    python3 scripts/generate-og.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "public" / "og.png"

W, H = 1200, 630

# Brand palette (from tokens.css)
BG_TOP = (10, 10, 20)        # #0a0a14
BG_BOT = (8, 8, 13)          # #08080d
WARM = (255, 210, 154)       # #ffd29a
ORANGE = (255, 148, 96)      # #ff9460
DUSK = (90, 72, 112)         # #5a4870
CREAM = (244, 241, 234)      # #f4f1ea
SEC = (196, 181, 152)        # #c4b598
MUTED = (136, 128, 148)      # #888094

# Macos system fonts (sans-serif, bold available)
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REG = "/System/Library/Fonts/Helvetica.ttc"
FONT_ITAL = "/System/Library/Fonts/Supplemental/Arial Italic.ttf"
FONT_MONO = "/System/Library/Fonts/Monaco.ttf"


def gradient_bg() -> Image.Image:
    """Top-to-bottom dark navy gradient with a soft warm glow top-center."""
    img = Image.new("RGB", (W, H), BG_BOT)
    px = img.load()
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] * (1 - t) + BG_BOT[0] * t)
        g = int(BG_TOP[1] * (1 - t) + BG_BOT[1] * t)
        b = int(BG_TOP[2] * (1 - t) + BG_BOT[2] * t)
        for x in range(W):
            px[x, y] = (r, g, b)

    # Soft radial glow top-center
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, -100
    for radius, alpha in [(700, 25), (550, 35), (400, 50), (250, 70)]:
        gd.ellipse(
            (cx - radius, cy - radius, cx + radius, cy + radius),
            fill=(WARM[0], WARM[1], WARM[2], alpha),
        )
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    return img


def voxel_cluster(draw: ImageDraw.ImageDraw, ox: int, oy: int) -> None:
    """A small voxel-style decorative cube cluster (top-right of OG card)."""
    s = 60  # cube side
    # Cube anchored at (ox, oy) — draw 3 visible faces
    def cube(x: int, y: int, top: tuple, left: tuple, right: tuple) -> None:
        # Top face
        draw.polygon(
            [(x, y - s), (x + s, y - s // 2 - s // 2), (x + s + s, y - s),
             (x + s, y - s // 2)],
            fill=top, outline=(0, 0, 0, 80),
        )
        # Left face
        draw.polygon(
            [(x, y - s), (x + s, y - s // 2), (x + s, y + s // 2), (x, y)],
            fill=left, outline=(0, 0, 0, 80),
        )
        # Right face
        draw.polygon(
            [(x + s, y - s // 2), (x + s + s, y - s), (x + s + s, y),
             (x + s, y + s // 2)],
            fill=right, outline=(0, 0, 0, 80),
        )

    # Stack 3 cubes (bottom→top) with diff colors
    cube(ox, oy, WARM, ORANGE, (180, 90, 58))                     # bottom
    cube(ox, oy - s, (255, 230, 192), WARM, ORANGE)               # middle
    cube(ox, oy - 2 * s, (255, 245, 220), (255, 230, 192), WARM)  # top


def main() -> None:
    img = gradient_bg().convert("RGB")
    draw = ImageDraw.Draw(img, "RGBA")

    # Decorative voxel cluster top-right
    voxel_cluster(draw, ox=860, oy=240)

    # ---- Typography ----
    # Kicker (orange, small mono-ish)
    kicker_font = ImageFont.truetype(FONT_BOLD, 22)
    draw.text((80, 130), "// FULL STACK AI ENGINEER · MUMBAI", font=kicker_font, fill=ORANGE)

    # Name (huge bold + italic accent)
    name_font = ImageFont.truetype(FONT_BOLD, 120)
    italic_font = ImageFont.truetype(FONT_ITAL, 120)
    draw.text((80, 170), "Om", font=name_font, fill=CREAM)
    # measure "Om" width to position italic "Kshirsagar" after
    om_w = draw.textlength("Om", font=name_font)
    draw.text((80 + om_w + 28, 170), "Kshirsagar", font=italic_font, fill=WARM)

    # Role line
    role_font = ImageFont.truetype(FONT_BOLD, 32)
    role_reg = ImageFont.truetype(FONT_REG, 32)
    draw.text((80, 320), "Software Engineer I", font=role_font, fill=CREAM)
    role_w = draw.textlength("Software Engineer I", font=role_font)
    draw.text((80 + role_w + 14, 320), "@ Deloitte", font=role_reg, fill=SEC)

    # Promoted badge
    badge_font = ImageFont.truetype(FONT_BOLD, 14)
    badge_text = "PROMOTED · JUN 2026"
    badge_w = draw.textlength(badge_text, font=badge_font)
    bx, by = 80 + role_w + 14 + draw.textlength("@ Deloitte", font=role_reg) + 18, 326
    draw.rectangle(
        (bx, by, bx + badge_w + 16, by + 26),
        fill=(255, 210, 154, 50),
    )
    draw.text((bx + 8, by + 5), badge_text, font=badge_font, fill=WARM)

    # Tagline
    tag_font = ImageFont.truetype(FONT_REG, 26)
    tagline_lines = [
        "I build AI-powered products, real-time systems,",
        "and the platforms other engineers build on.",
    ]
    y = 400
    for line in tagline_lines:
        draw.text((80, y), line, font=tag_font, fill=SEC)
        y += 36

    # Bottom bar — accents
    accent_font = ImageFont.truetype(FONT_BOLD, 18)
    draw.text((80, 540), "★ omkshirsagar.github.io", font=accent_font, fill=WARM)
    draw.text((W - 80 - 280, 540), "·  HEALTHCARE  ·  VOICE  ·  AGENTS", font=accent_font, fill=MUTED)

    # Save
    OUT.parent.mkdir(exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT.relative_to(REPO)}  ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
