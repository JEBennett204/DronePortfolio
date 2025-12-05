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

# Responsive thumbnail sizes (width values)
THUMB_SIZES = [480, 800, 1280]
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
            width, height = im.size
            exif = get_exif(im)

            # Generate responsive thumbnails and webp variants
            srcset_parts = []
            webp_variants = {}
            thumb_default = None
            for w in THUMB_SIZES:
                thumb_name = f'thumb-{base}-{w}.jpg'
                webp_name = f'webp-{base}-{w}.webp'
                thumb_path = os.path.join(out_cat, thumb_name)
                webp_path = os.path.join(out_cat, webp_name)

                # create resized thumbnail while keeping aspect ratio
                im_thumb = im.copy()
                target_w = w
                # compute target height maintaining aspect ratio
                target_h = int((target_w / width) * height) if width else THUMB_SIZES[0]
                try:
                    im_resized = im_thumb.resize((target_w, target_h), Image.LANCZOS)
                except Exception:
                    im_resized = im_thumb.copy()
                    im_resized.thumbnail((target_w, target_h))

                # save jpeg
                try:
                    im_resized.save(thumb_path, 'JPEG', quality=THUMB_QUIALITY)
                except Exception:
                    im_resized.convert('RGB').save(thumb_path, 'JPEG', quality=THUMB_QUIALITY)

                # save webp
                try:
                    im_resized.save(webp_path, 'WEBP', quality=85)
                except Exception:
                    try:
                        im_resized.convert('RGB').save(webp_path, 'WEBP', quality=85)
                    except Exception:
                        pass

                rel_thumb = os.path.relpath(thumb_path, ROOT).replace('\\', '/')
                rel_webp = os.path.relpath(webp_path, ROOT).replace('\\', '/')
                srcset_parts.append(f"{rel_thumb} {w}w")
                webp_variants[str(w)] = rel_webp
                if w == 800:
                    thumb_default = rel_thumb

            if not thumb_default:
                thumb_default = src

            gallery[category].append({
                'file': os.path.relpath(src, ROOT).replace('\\', '/'),
                'thumb': thumb_default,
                'srcset': ', '.join(srcset_parts),
                'webp_variants': webp_variants,
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
