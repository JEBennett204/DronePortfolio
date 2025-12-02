Gallery generation
==================

This repo includes a small helper to generate a JSON listing of images under `Media/`.

Usage:

1. Install Python (3.8+ recommended).
2. From the repository root run:

```bash
python3 scripts/generate_gallery.py
```

This will create `data/gallery.json` which the site will fetch to populate the Photos gallery dynamically. If you add or remove images, rerun the script.

Notes:
- The script only looks for files under `Media/` with extensions `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.
- The JSON groups images by the immediate subfolder under `Media/` (e.g. `the-village`, `Table Rock`).
