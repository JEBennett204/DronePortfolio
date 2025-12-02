#!/usr/bin/env python3
import re
import sys
from math import pow

CSS_PATH = 'styles.css'

# Helpers
def hex_to_rgb(hexstr):
    hexstr = hexstr.strip()
    if hexstr.startswith('#'):
        hexstr = hexstr[1:]
    if len(hexstr) == 8:
        hexstr = hexstr[:6]
    if len(hexstr) != 6:
        return None
    r = int(hexstr[0:2], 16)
    g = int(hexstr[2:4], 16)
    b = int(hexstr[4:6], 16)
    return (r, g, b)

def srgb_to_lin(c):
    c = c/255.0
    if c <= 0.03928:
        return c/12.92
    return pow((c+0.055)/1.055, 2.4)

def luminance(rgb):
    r,g,b = rgb
    return 0.2126*srgb_to_lin(r) + 0.7152*srgb_to_lin(g) + 0.0722*srgb_to_lin(b)

def contrast_ratio(rgb1, rgb2):
    L1 = luminance(rgb1)
    L2 = luminance(rgb2)
    lighter = max(L1, L2)
    darker = min(L1, L2)
    return (lighter + 0.05) / (darker + 0.05)

# Read CSS and extract variables
with open(CSS_PATH, 'r') as f:
    css = f.read()

# extract :root block content
root_match = re.search(r":root\s*{([\s\S]*?)}", css)
if not root_match:
    print('Could not find :root in', CSS_PATH)
    sys.exit(1)
root = root_match.group(1)

vars = {}
for m in re.finditer(r"--([\w-]+)\s*:\s*([^;]+);", root):
    name = m.group(1)
    value = m.group(2).strip()
    vars[name] = value

# Helper to resolve var() chains to a hex or rgb string
var_re = re.compile(r"var\(--([\w-]+)\)")

def resolve_value(val, depth=0):
    if depth > 10:
        return None
    val = val.strip()
    if val.startswith('linear-gradient') or val.startswith('radial-gradient'):
        return None
    if val.startswith('rgba('):
        # rgba(r,g,b,a) -> extract r,g,b
        inner = val[val.find('(')+1:val.rfind(')')]
        parts = [p.strip() for p in inner.split(',')]
        try:
            r = int(float(parts[0]))
            g = int(float(parts[1]))
            b = int(float(parts[2]))
            return (r,g,b)
        except Exception:
            return None
    m = var_re.search(val)
    if m:
        ref = m.group(1)
        if ref in vars:
            return resolve_value(vars[ref], depth+1)
        return None
    if val.startswith('#'):
        return hex_to_rgb(val)
    # if it's like 143,64,19
    if re.match(r'^[0-9]+\s*,\s*[0-9]+\s*,\s*[0-9]+$', val):
        parts = [int(x.strip()) for x in val.split(',')]
        return tuple(parts)
    return None

# Resolve key colors
keys = {
    'text-light': 'text-light',
    'text-dark': 'text-dark',
    'background-light': 'background-light',
    'primary-color': 'primary-color',
    'secondary-color': 'secondary-color'
}
resolved = {}
for k, varname in keys.items():
    v = vars.get(varname)
    if not v:
        resolved[k] = None
    else:
        resolved[k] = resolve_value(v)

# For header background, approximate by averaging rust-brown and dark-khaki
def average_colors(a, b):
    if not a or not b: return None
    return tuple(int((x+y)/2) for x,y in zip(a,b))

rust = resolve_value(vars.get('rust-brown',''))
dkh = resolve_value(vars.get('dark-khaki',''))
header_bg = average_colors(rust, dkh)

# Pairs to check
pairs = [
    ('text-dark','background-light'),
    ('text-light','background-light'),
    ('text-light','primary-color'),
    ('text-light','secondary-color'),
    ('text-dark','primary-color'),
]

print('Contrast audit report (WCAG 2.1, target >= 4.5 for normal text)')
print('Resolved variables:')
for k,v in resolved.items():
    print(f' - {k}: {v}')
print(' - header-bg (avg rust/dark-khaki):', header_bg)
print('')

for a,b in pairs:
    ra = resolved.get(a)
    rb = resolved.get(b)
    if ra and rb:
        cr = contrast_ratio(ra, rb)
        status = 'PASS' if cr >= 4.5 else 'FAIL'
        print(f'{a} ({ra}) vs {b} ({rb}) -> {cr:.2f} : {status}')
    else:
        print(f'{a} or {b} unresolved; skipping')

# Also check header text-light against header_bg
if resolved.get('text-light') and header_bg:
    cr = contrast_ratio(resolved.get('text-light'), header_bg)
    status = 'PASS' if cr >= 4.5 else 'FAIL'
    print(f'text-light vs header-bg -> {cr:.2f} : {status}')

print('\nNotes: Use >=4.5 for normal text, >=3.0 for large text (>=18pt or 14pt bold).')
