#!/usr/bin/env python3
"""Simple contrast auditor: parses CSS variables in styles.css and reports contrast ratios.
If a contrast ratio is below WCAG AA (4.5:1 for normal text), it will suggest a darker primary color
and optionally patch the CSS with a slightly darker value (20% darker luminance).
"""
import re
from pathlib import Path

CSS = Path('styles.css').read_text()

def hex_to_rgb(h):
    h = h.strip().lstrip('#')
    if len(h) == 8:  # handle AARRGGBB or RRGGBBAA
        h = h[:6]
    if len(h) == 3:
        r,g,b = [int(c*2,16) for c in h]
    else:
        r = int(h[0:2],16); g = int(h[2:4],16); b = int(h[4:6],16)
    return (r,g,b)

def rel_luminance(rgb):
    srgb = [c/255.0 for c in rgb]
    def lin(c):
        return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4
    r,g,b = [lin(c) for c in srgb]
    return 0.2126*r + 0.7152*g + 0.0722*b

def contrast_ratio(a,b):
    la = rel_luminance(a); lb = rel_luminance(b)
    L1,L2 = max(la,lb), min(la,lb)
    return (L1+0.05)/(L2+0.05)

vars = dict(re.findall(r'--([a-zA-Z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6,8})', CSS))

bg = vars.get('background-light', '#efe9e0')
primary = vars.get('primary-color', vars.get('rust-brown', '#8f4013'))
text_light = vars.get('text-light', '#ffffff')

bg_rgb = hex_to_rgb(bg)
primary_rgb = hex_to_rgb(primary)
text_rgb = hex_to_rgb(text_light)

print('Contrast report:')
print(f'- primary ({primary}) vs background ({bg}): {contrast_ratio(primary_rgb,bg_rgb):.2f}:1')
print(f'- text-light ({text_light}) vs background ({bg}): {contrast_ratio(text_rgb,bg_rgb):.2f}:1')

bad = []
if contrast_ratio(primary_rgb,bg_rgb) < 4.5:
    bad.append(('primary-color', primary))
if contrast_ratio(text_rgb,bg_rgb) < 4.5:
    bad.append(('text-light', text_light))

if not bad:
    print('\nNo palette contrast issues found for main combinations (>= 4.5).')
else:
    print('\nPalette issues found:')
    for k,v in bad:
        print(f' - {k}: {v}')
    # Propose simple fix: darken primary by 20%
    def darken(rgb, factor=0.8):
        return tuple(max(0, int(c*factor)) for c in rgb)
    if any(k=='primary-color' for k,_ in bad):
        new_rgb = darken(primary_rgb, 0.75)
        new_hex = '#%02x%02x%02x' % new_rgb
        print(f"Suggested darker primary-color: {new_hex}")
        # Patch styles.css safely: replace the primary-color hex with new_hex
        patched = re.sub(r'(--primary-color:\s*)(#[0-9a-fA-F]{6,8})', rf"\1{new_hex}", CSS)
        Path('styles.css.bak').write_text(CSS)
        Path('styles.css').write_text(patched)
        print('Applied suggested color to styles.css (backup -> styles.css.bak)')
