#!/usr/bin/env python3
"""
Scan the Media/ directory and produce data/gallery.json describing available images.
Run this from the repo root: python3 scripts/generate_gallery.py
"""
import os
import json

ROOT = os.path.dirname(os.path.dirname(__file__))
MEDIA_DIR = os.path.join(ROOT, 'Media')
OUT_DIR = os.path.join(ROOT, 'data')
OUT_FILE = os.path.join(OUT_DIR, 'gallery.json')

ALLOWED_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

if not os.path.exists(MEDIA_DIR):
    print('Media directory not found:', MEDIA_DIR)
    raise SystemExit(1)

if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

gallery = {}
for root, dirs, files in os.walk(MEDIA_DIR):
    # category is first-level folder under Media
    rel = os.path.relpath(root, MEDIA_DIR)
    if rel == '.':
        continue
    category = rel.replace('\\', '/').split('/')[0]
    gallery.setdefault(category, [])
    for f in sorted(files):
        if os.path.splitext(f)[1].lower() in ALLOWED_EXT:
            path = os.path.join(root, f)
            # create a web path relative to the site root
            webpath = os.path.relpath(path, ROOT).replace('\\', '/')
            gallery[category].append({
                'file': webpath,
                'name': f
            })

with open(OUT_FILE, 'w') as fh:
    json.dump(gallery, fh, indent=2)

print('Wrote', OUT_FILE)
