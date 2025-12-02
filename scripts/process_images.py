#!/usr/bin/env python3
"""
Process images in Media/ to generate thumbnails, WebP variants, and a gallery JSON

Usage:
  python3 scripts/process_images.py

Outputs:
  - data/gallery.json
  - data/images/<category>/thumb-...   (thumbnails)
  - data/images/<category>/webp-...    (webp converted images)

Requires Pillow: `pip install Pillow`
"""
import os
import json
from PIL import Image, ExifTags

ROOT = os.path.dirname(os.path.dirname(__file__))
MEDIA = os.path.join(ROOT, 'Media')
OUT_DIR = os.path.join(ROOT, 'data')
IMG_OUT = os.path.join(OUT_DIR, 'images')

THUMB_SIZE = (800, 800)
THUMB_QUIALITY = 80

ALLOWED = {'.jpg', '.jpeg', '.png', '.webp'}

def ensure(path):
    if not os.path.exists(path):
        os.makedirs(path)

def get_exif(image):
    try:
        raw = image._getexif() or {}
        exif = {}
        def sanitize(v):
            # Convert bytes and other non-serializable types to strings
            if isinstance(v, bytes):
                try:
                    return v.decode('utf8', errors='ignore')
                except Exception:
                    return str(v)
            if isinstance(v, (str, int, float, bool)) or v is None:
                return v
            if isinstance(v, (list, tuple)):
                return [sanitize(x) for x in v]
            if isinstance(v, dict):
                return {str(k): sanitize(val) for k, val in v.items()}
            return str(v)

        for k, v in raw.items():
            name = ExifTags.TAGS.get(k, k)
            exif[name] = sanitize(v)
        return exif
    except Exception:
        return {}

def process():
    ensure(OUT_DIR)
    ensure(IMG_OUT)
    gallery = {}
    for category in sorted(os.listdir(MEDIA)):
        cat_path = os.path.join(MEDIA, category)
        if not os.path.isdir(cat_path):
            continue
        out_cat = os.path.join(IMG_OUT, category)
        ensure(out_cat)
        gallery[category] = []
        for fname in sorted(os.listdir(cat_path)):
            ext = os.path.splitext(fname)[1].lower()
            if ext not in ALLOWED:
                continue
            src = os.path.join(cat_path, fname)
            try:
                im = Image.open(src)
            except Exception as e:
                print('Skipping', src, 'error', e)
                continue
            base = os.path.splitext(fname)[0]
            thumb_name = f'thumb-{base}.jpg'
            webp_name = f'webp-{base}.webp'
            thumb_path = os.path.join(out_cat, thumb_name)
            webp_path = os.path.join(out_cat, webp_name)

            # create thumbnail
            im_thumb = im.copy()
            im_thumb.thumbnail(THUMB_SIZE)
            im_thumb.save(thumb_path, 'JPEG', quality=THUMB_QUIALITY)

            # create webp
            try:
                im.save(webp_path, 'WEBP', quality=85)
            except Exception:
                # fallback: convert and save
                im.convert('RGB').save(webp_path, 'WEBP', quality=85)

            width, height = im.size
            exif = get_exif(im)

            gallery[category].append({
                'file': os.path.relpath(src, ROOT).replace('\\', '/'),
                'thumb': os.path.relpath(thumb_path, ROOT).replace('\\', '/'),
                'webp': os.path.relpath(webp_path, ROOT).replace('\\', '/'),
                'name': fname,
                'width': width,
                'height': height,
                'exif': exif
            })

    out_json = os.path.join(OUT_DIR, 'gallery.json')
    with open(out_json, 'w') as fh:
        json.dump(gallery, fh, indent=2)
    print('Wrote', out_json)

if __name__ == '__main__':
    process()
