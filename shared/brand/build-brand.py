#!/usr/bin/env python3
"""Erzeugt die Logo-Dateien von Cruizy (SVG) — Symbol, Wortmarke, Logo.
Aufruf: python3 shared/brand/build-brand.py  (danach PNGs: node backend/scripts/brand-png.mjs)

Symbol: ein offenes C — der Weg, den man geht (cruisen) — mit einem Punkt in der Öffnung:
„du bist hier“, ohne genauen Ort. Wortmarke: Monolinie mit runden Enden, alles klein,
als Pfade gezeichnet (keine Schrift nötig, sieht überall gleich aus)."""
import math, os

ACC = '#5aa9ff'    # Akzent
DARK = '#11141a'   # Grund
LIGHT = '#e8ecf2'  # Text hell
here = os.path.dirname(os.path.abspath(__file__))

def arcpt(cx, cy, r, deg):
    a = math.radians(deg)
    return (cx + r * math.cos(a), cy + r * math.sin(a))

def symbol_paths(dot):
    cx, cy, r = 64, 64, 34
    x1, y1 = arcpt(cx, cy, r, -38)
    x2, y2 = arcpt(cx, cy, r, 38)
    return (f'<path d="M{x1:.2f} {y1:.2f} A{r} {r} 0 1 0 {x2:.2f} {y2:.2f}" fill="none" stroke="{ACC}" stroke-width="15" stroke-linecap="round"/>'
            f'<circle cx="{cx + r:.2f}" cy="{cy}" r="8.5" fill="{dot}"/>')

def symbol_svg(bg):
    rect = f'<rect width="128" height="128" rx="30" fill="{DARK}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">{rect}{symbol_paths(LIGHT if bg else DARK)}</svg>\n'

def wordmark_paths(color, sw=9):
    parts = []
    def st(d):
        parts.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>')
    x = 0
    a1 = arcpt(x + 20, 40, 20, -42); a2 = arcpt(x + 20, 40, 20, 42)
    st(f'M{a1[0]:.2f} {a1[1]:.2f} A20 20 0 1 0 {a2[0]:.2f} {a2[1]:.2f}'); x += 48          # c
    st(f'M{x} 60 V20 M{x} 38 Q{x} 20 {x + 22} 20'); x += 34                                 # r
    st(f'M{x} 20 V42 A18 18 0 0 0 {x + 36} 42 M{x + 36} 20 V60'); x += 50                  # u
    st(f'M{x} 20 V60'); parts.append(f'<circle cx="{x}" cy="4" r="{sw * 0.62:.2f}" fill="{ACC}"/>'); x += 14  # i
    st(f'M{x} 20 H{x + 32} L{x} 60 H{x + 32}'); x += 46                                    # z
    st(f'M{x} 20 L{x + 18} 52 M{x + 36} 20 L{x + 10} 80'); x += 36                          # y
    return ''.join(parts), x

def wordmark_svg(color):
    p, w = wordmark_paths(color)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 {w + 12} 92" width="{w + 12}" height="92">{p}</svg>\n'

def logo_svg(color, dot):
    p, w = wordmark_paths(color)
    W = 128 + 24 + w + 8
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 128" width="{W}" height="128">'
            f'{symbol_paths(dot)}<g transform="translate(152 26)">{p}</g></svg>\n')

files = {
    'cruizy-symbol.svg': symbol_svg(True),
    'cruizy-symbol-transparent.svg': symbol_svg(False),
    'cruizy-wortmarke-hell.svg': wordmark_svg(LIGHT),
    'cruizy-wortmarke-dunkel.svg': wordmark_svg(DARK),
    'cruizy-logo-hell.svg': logo_svg(LIGHT, LIGHT),    # auf dunklen Flächen
    'cruizy-logo-dunkel.svg': logo_svg(DARK, DARK),    # auf hellen Flächen
}
for name, svg in files.items():
    with open(os.path.join(here, name), 'w') as f:
        f.write(svg)
print(len(files), 'Logo-Dateien geschrieben')
