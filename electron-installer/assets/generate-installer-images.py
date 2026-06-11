#!/usr/bin/env python3
# electron/assets/generate-installer-images.py
# Run this once to generate installer banner images
# Requirements: pip install Pillow

from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT = os.path.dirname(os.path.abspath(__file__))

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

# ── Header banner: 150 x 57 px ────────────────────────────────────────────────
def make_header():
    w, h = 150, 57
    img = Image.new('RGB', (w, h), hex_to_rgb('0d0e11'))
    d = ImageDraw.Draw(img)

    # Gradient top line (cyan accent)
    for x in range(w):
        t = x / w
        r = int(6   + (129-6)   * t)
        g = int(182 + (140-182) * t)
        b = int(212 + (248-212) * t)
        d.line([(x, 0), (x, 2)], fill=(r, g, b))

    # Subtle grid dots
    for gx in range(0, w, 12):
        for gy in range(6, h, 12):
            d.point((gx, gy), fill=hex_to_rgb('1f2128'))

    # App name text
    try:
        font_large = ImageFont.truetype("arial.ttf", 16)
        font_small = ImageFont.truetype("arial.ttf", 9)
    except:
        font_large = ImageFont.load_default()
        font_small = font_large

    d.text((12, 14), "AxiomPips", fill=hex_to_rgb('06b6d4'), font=font_large)
    d.text((12, 34), "Precision Tools for Smarter Trading", fill=hex_to_rgb('71717a'), font=font_small)

    # Right accent glow simulation
    for i in range(20):
        alpha = int(40 * (1 - i/20))
        d.ellipse([(w-30+i, 10), (w+30-i, h-10)],
                  outline=(6, 182, 212, alpha) if hasattr(d, 'alpha') else hex_to_rgb('0e7490'))

    path = os.path.join(OUTPUT, 'installerHeader.bmp')
    img.save(path, 'BMP')
    print(f"Created: {path}")

# ── Sidebar image: 164 x 314 px ───────────────────────────────────────────────
def make_sidebar():
    w, h = 164, 314
    img = Image.new('RGB', (w, h), hex_to_rgb('0a0b0e'))
    d = ImageDraw.Draw(img)

    # Gradient background — dark to slightly lighter
    for y in range(h):
        t = y / h
        val = int(10 + 8 * t)
        d.line([(0, y), (w, y)], fill=(val, val+1, val+3))

    # Cyan left accent bar
    for y in range(h):
        t = y / h
        alpha = int(255 * (0.6 + 0.4 * (1 - abs(t - 0.5) * 2)))
        r = int(6   * alpha / 255)
        g = int(182 * alpha / 255)
        b = int(212 * alpha / 255)
        d.line([(0, y), (2, y)], fill=(r, g, b))

    # Grid pattern
    for gx in range(0, w, 16):
        for gy in range(0, h, 16):
            d.point((gx, gy), fill=hex_to_rgb('1a1b1f'))

    # Candlestick icon (simplified)
    cx, cy = w // 2, 80
    # Three candles
    candles = [
        (cx-20, cy+10, cx-12, cy+30, True),   # left — bearish
        (cx-4,  cy-10, cx+4,  cy+20, False),  # center — bullish
        (cx+12, cy+5,  cx+20, cy+25, True),   # right — bearish
    ]
    for x1, y1, x2, y2, bear in candles:
        color = hex_to_rgb('ef4444') if bear else hex_to_rgb('22c55e')
        # Wick
        d.line([(x1+4, y1-8), (x1+4, y2+8)], fill=color, width=1)
        # Body
        d.rectangle([x1, y1, x2, y2], fill=color)

    # App name
    try:
        font_name = ImageFont.truetype("arialbd.ttf", 15)
        font_tag  = ImageFont.truetype("arial.ttf", 8)
    except:
        font_name = ImageFont.load_default()
        font_tag  = font_name

    # Center text
    d.text((w//2 - 38, 120), "AxiomPips", fill=hex_to_rgb('06b6d4'), font=font_name)
    d.text((w//2 - 42, 140), "Precision Forex Tools", fill=hex_to_rgb('52525b'), font=font_tag)

    # Bottom version
    d.text((12, h - 20), "axiompips.com", fill=hex_to_rgb('3f3f46'), font=font_tag)

    # Bottom cyan line
    d.line([(0, h-1), (w, h-1)], fill=hex_to_rgb('06b6d4'), width=1)

    path = os.path.join(OUTPUT, 'installerSidebar.bmp')
    img.save(path, 'BMP')
    print(f"Created: {path}")

if __name__ == '__main__':
    make_header()
    make_sidebar()
    print("Done! Installer images generated.")
