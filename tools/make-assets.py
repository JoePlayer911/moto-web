# -*- coding: utf-8 -*-
"""Derives every brand asset from the source logo screenshot.
Run:  python tools/make-assets.py
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "source", "Screenshot_2026-09-07-21-26-31-557_com.instagram.android.png")
OUT  = os.path.join(ROOT, "assets")
os.makedirs(OUT, exist_ok=True)

CX, CY, R = 359, 363, 355          # badge circle located in the source screenshot
INK    = (11, 11, 12)
BRAND  = (242, 162, 43)

# ---------------------------------------------------------------- logo ------
src = Image.open(SRC).convert("RGBA")
badge = src.crop((CX - R, CY - R, CX + R, CY + R))          # 710x710
SS = 4                                                       # supersampled mask
mask = Image.new("L", (badge.width * SS, badge.height * SS), 0)
ImageDraw.Draw(mask).ellipse((0, 0, mask.width - 1, mask.height - 1), fill=255)
mask = mask.resize(badge.size, Image.LANCZOS)
badge.putalpha(mask)

logo = badge.resize((1024, 1024), Image.LANCZOS)
logo.save(os.path.join(OUT, "logo.png"))
logo.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "logo-512.png"))
logo.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, "logo-256.png"))

# ------------------------------------------------------------- favicons -----
def padded_icon(size, pad_ratio=0.0, bg=None):
    canvas = Image.new("RGBA", (size, size), bg if bg else (0, 0, 0, 0))
    inner = int(size * (1 - pad_ratio * 2))
    canvas.alpha_composite(logo.resize((inner, inner), Image.LANCZOS),
                           ((size - inner) // 2, (size - inner) // 2))
    return canvas

padded_icon(192).save(os.path.join(OUT, "icon-192.png"))
padded_icon(512).save(os.path.join(OUT, "icon-512.png"))
# maskable needs safe-zone padding on an opaque plate
padded_icon(512, 0.12, INK + (255,)).save(os.path.join(OUT, "icon-maskable-512.png"))
padded_icon(180, 0.06, INK + (255,)).save(os.path.join(OUT, "apple-touch-icon.png"))
logo.resize((32, 32), Image.LANCZOS).save(
    os.path.join(OUT, "favicon.ico"),
    sizes=[(16, 16), (32, 32), (48, 48)])

# ------------------------------------------------------------- og card ------
def font(paths, size):
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()

TC   = ["C:/Windows/Fonts/msjhbd.ttc", "C:/Windows/Fonts/msjh.ttc"]
LAT  = ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/segoeuib.ttf"]
MONO = ["C:/Windows/Fonts/consola.ttf", "C:/Windows/Fonts/cour.ttf"]

W, H = 1200, 630
og = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(og)

# warm radial glow behind the badge
glow = Image.new("RGB", (W, H), INK)
gd = ImageDraw.Draw(glow)
for i in range(140, 0, -1):
    t = i / 140
    rr = int(30 + t * 430)
    gd.ellipse((360 - rr, 315 - rr, 360 + rr, 315 + rr),
               fill=(int(INK[0] + (BRAND[0] - INK[0]) * (1 - t) * 0.30),
                     int(INK[1] + (BRAND[1] - INK[1]) * (1 - t) * 0.30),
                     int(INK[2] + (BRAND[2] - INK[2]) * (1 - t) * 0.30)))
og = Image.blend(og, glow.filter(ImageFilter.GaussianBlur(70)), 0.85)
d = ImageDraw.Draw(og)

# hairline technical grid
for x in range(0, W, 60):
    d.line([(x, 0), (x, H)], fill=(24, 24, 26), width=1)
for y in range(0, H, 60):
    d.line([(0, y), (W, y)], fill=(24, 24, 26), width=1)

og.paste(logo.resize((300, 300), Image.LANCZOS), (78, 165), logo.resize((300, 300), Image.LANCZOS))

x0 = 430
d.text((x0, 196), "TAICHUNG · SINCE 2022", font=font(MONO, 22), fill=BRAND)
d.text((x0, 238), "輪便所二手機車", font=font(TC, 74), fill=(245, 245, 242))
d.text((x0, 332), "RAY'S GARAGE", font=font(LAT, 46), fill=(245, 245, 242))
d.text((x0, 400), "買車 · 賣車 · 現金收購 · 免費估價", font=font(TC, 30), fill=(158, 158, 152))
d.line([(x0, 462), (x0 + 300, 462)], fill=BRAND, width=3)
d.text((x0, 486), "@rays_garage2022   ·   LINE @raysmotor2022", font=font(MONO, 21), fill=(158, 158, 152))

og.save(os.path.join(OUT, "og.jpg"), quality=90, optimize=True)
print("assets written ->", OUT)
for f in sorted(os.listdir(OUT)):
    p = os.path.join(OUT, f)
    if os.path.isfile(p):
        print(f"  {f:28} {os.path.getsize(p)//1024:>5} KB")
