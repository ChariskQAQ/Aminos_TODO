"""
Generate Aminos TODO app icon — bold geometric checkmark design.
Deep gradient squircle + two overlapping rounded bars forming a checkmark.
"""
import math
from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024
R = SIZE // 2


def gradient_bg(size, color_top, color_bot):
    """Vertical gradient image."""
    r1, g1, b1 = int(color_top[1:3], 16), int(color_top[3:5], 16), int(color_top[5:7], 16)
    r2, g2, b2 = int(color_bot[1:3], 16), int(color_bot[3:5], 16), int(color_bot[5:7], 16)
    img = Image.new("RGBA", (size, size))
    for y in range(size):
        t = y / size
        rr = int(r1 + (r2 - r1) * t)
        gg = int(g1 + (g2 - g1) * t)
        bb = int(b1 + (b2 - b1) * t)
        for x in range(size):
            img.putpixel((x, y), (rr, gg, bb, 255))
    return img


def squircle_mask(size, radius):
    """Squircle alpha mask."""
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    r = radius
    s = size
    d.rectangle((r, 0, s - r, s), fill=255)
    d.rectangle((0, r, s, s - r), fill=255)
    d.pieslice((0, 0, r * 2, r * 2), 180, 270, fill=255)
    d.pieslice((s - r * 2, 0, s, r * 2), 270, 360, fill=255)
    d.pieslice((0, s - r * 2, r * 2, s), 90, 180, fill=255)
    d.pieslice((s - r * 2, s - r * 2, s, s), 0, 90, fill=255)
    return mask


def rounded_bar(draw, cx, cy, width, height, angle_deg, color, bar_radius):
    """Draw a thick rounded bar (pill shape) rotated by angle_deg."""
    w2, h2 = width / 2, height / 2
    pts = [
        (-w2 + bar_radius, -h2), (w2 - bar_radius, -h2),
        (w2, -h2 + bar_radius), (w2, h2 - bar_radius),
        (w2 - bar_radius, h2), (-w2 + bar_radius, h2),
        (-w2, h2 - bar_radius), (-w2, -h2 + bar_radius),
    ]
    angle = -angle_deg * math.pi / 180
    cos_a, sin_a = math.cos(angle), math.sin(angle)
    rp = [(cx + x * cos_a - y * sin_a, cy + x * sin_a + y * cos_a) for x, y in pts]

    base = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    bd = ImageDraw.Draw(base)
    bd.polygon(rp, fill=color)
    for px, py in [
        (-w2 + bar_radius, -h2), (w2 - bar_radius, -h2),
        (-w2 + bar_radius, h2), (w2 - bar_radius, h2),
    ]:
        rx, ry = px * cos_a - py * sin_a, px * sin_a + py * cos_a
        bd.ellipse(
            (cx + rx - bar_radius, cy + ry - bar_radius,
             cx + rx + bar_radius, cy + ry + bar_radius),
            fill=color
        )
    return base


def create_icon():
    size = SIZE
    margin = int(size * 0.06)
    bg_size = size - margin * 2

    # Background gradient
    bg_grad = gradient_bg(bg_size, "#2d3ea0", "#4a6cf7")
    mask = squircle_mask(bg_size, int(bg_size * 0.23))
    bg = Image.new("RGBA", (bg_size, bg_size), (0, 0, 0, 0))
    bg.paste(bg_grad, (0, 0), mask)

    # Subtle inner glow ring
    ring = Image.new("RGBA", (bg_size, bg_size), (0, 0, 0, 0))
    ring_d = ImageDraw.Draw(ring)
    ring_r = int(bg_size * 0.23)
    ring_d.rectangle((ring_r + 3, 3, bg_size - ring_r - 3, bg_size - 3), fill=(255, 255, 255, 25))
    ring_d.rectangle((3, ring_r + 3, bg_size - 3, bg_size - ring_r - 3), fill=(255, 255, 255, 25))
    ring_d.pieslice((3, 3, ring_r * 2 + 3, ring_r * 2 + 3), 180, 270, fill=(255, 255, 255, 25))
    ring_d.pieslice((bg_size - ring_r * 2 - 3, 3, bg_size - 3, ring_r * 2 + 3), 270, 360, fill=(255, 255, 255, 25))
    ring_d.pieslice((3, bg_size - ring_r * 2 - 3, ring_r * 2 + 3, bg_size - 3), 90, 180, fill=(255, 255, 255, 25))
    ring_d.pieslice((bg_size - ring_r * 2 - 3, bg_size - ring_r * 2 - 3, bg_size - 3, bg_size - 3), 0, 90, fill=(255, 255, 255, 25))
    bg.paste(ring, (0, 0), ring)

    # Composite background onto canvas
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(bg, (margin, margin), bg)

    # ── Checkmark: two overlapping rounded bars ──
    draw = ImageDraw.Draw(canvas)
    cx, cy = size // 2, size // 2
    bar_w = int(size * 0.48)
    bar_h = int(size * 0.11)
    bar_r = bar_h // 2

    # Bar 1: short diagonal (bottom part of checkmark) — angle ~45°
    bar1 = rounded_bar(draw, int(cx - size * 0.05), int(cy + size * 0.02),
                       int(size * 0.35), bar_h, -50,
                       (255, 255, 255, 255), bar_r)

    # Bar 2: long diagonal (top part of checkmark) — angle ~-30°
    bar2 = rounded_bar(draw, int(cx - size * 0.08), int(cy - size * 0.06),
                       int(size * 0.62), bar_h, 28,
                       (255, 255, 255, 245), bar_r)

    canvas.paste(bar1, (0, 0), bar1)
    canvas.paste(bar2, (0, 0), bar2)

    # ── Subtle highlight dot ──
    dot_r = int(size * 0.03)
    dot_x, dot_y = int(size * 0.78), int(size * 0.20)
    for i in range(3):
        rad = dot_r + i * int(size * 0.015)
        alpha = 50 - i * 15
        draw.ellipse(
            (dot_x - rad, dot_y - rad, dot_x + rad, dot_y + rad),
            fill=(255, 255, 255, max(0, alpha))
        )

    return canvas


def save_all_sizes(img):
    out = "src-tauri/icons"

    img.save(f"{out}/icon.png", "PNG")

    for name, sz in {"32x32.png": 32, "128x128.png": 128, "128x128@2x.png": 256}.items():
        img.resize((sz, sz), Image.LANCZOS).save(f"{out}/{name}", "PNG")

    for name, sz in {"Square30x30Logo.png": 30, "Square44x44Logo.png": 44,
                     "Square71x71Logo.png": 71, "Square89x89Logo.png": 89,
                     "Square107x107Logo.png": 107, "Square142x142Logo.png": 142,
                     "Square150x150Logo.png": 150, "Square284x284Logo.png": 284,
                     "Square310x310Logo.png": 310, "StoreLogo.png": 100}.items():
        img.resize((sz, sz), Image.LANCZOS).save(f"{out}/{name}", "PNG")

    ico_sizes = [(16, 16), (32, 32), (48, 48), (256, 256)]
    imgs_ico = [img.resize(s, Image.LANCZOS) for s in ico_sizes]
    imgs_ico[0].save(f"{out}/icon.ico", format="ICO", sizes=ico_sizes)
    img.resize((256, 256), Image.LANCZOS).save(f"{out}/icon.icns", "PNG")
    print("All icon sizes saved.")


if __name__ == "__main__":
    icon = create_icon()
    save_all_sizes(icon)
    print("Done!")
