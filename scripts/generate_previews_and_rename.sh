#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Creating previews directory..."
mkdir -p Media/previews

# Helper to make URL-safe names: replace spaces with hyphens, remove double hyphens
safe_name() {
  local name="$1"
  # replace spaces with hyphens, remove characters that are unsafe in URLs
  # escape hyphen inside character class
  echo "$name" | sed -E 's/\s+/-/g; s/[^A-Za-z0-9._/\-]/-/g; s/-+/-/g'
}

echo "Renaming Media/Table Rock -> Media/Table-Rock if present"
if [ -d "Media/Table Rock" ]; then
  mv -v "Media/Table Rock" "Media/Table-Rock"
fi

echo "Renaming data/images/Table Rock -> data/images/Table-Rock if present"
if [ -d "data/images/Table Rock" ]; then
  mv -v "data/images/Table Rock" "data/images/Table-Rock"
fi

echo "Finding video files to rename and create previews"
# Find mp4 files under Media (top 2 levels)
find Media -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.webm' -o -iname 'poster-*.jpg' \) | while read -r f; do
  dir=$(dirname "$f")
  base=$(basename "$f")
  safe=$(safe_name "$base")
  if [ "$base" != "$safe" ]; then
    echo "Renaming: $f -> $dir/$safe"
    mv -v "$f" "$dir/$safe"
    f="$dir/$safe"
  fi

  # Create short preview clips for mp4 files only
  if [[ "$f" =~ \.(mp4|mov)$ ]]; then
    name=$(basename "$f")
    base_noext="${name%.*}"
    preview_mp4="Media/previews/${base_noext}-preview.mp4"
    preview_webm="Media/previews/${base_noext}-preview.webm"
    # skip if preview already exists
    if [ ! -f "$preview_mp4" ]; then
      echo "Generating preview MP4 for $f -> $preview_mp4"
      # use -ss 1 to skip possible black frames, limit 3s, small bitrate for previews
      ffmpeg -y -ss 1 -i "$f" -t 3 -c:v libx264 -preset veryfast -crf 28 -c:a aac -b:a 64k -movflags +faststart "$preview_mp4" < /dev/null
    fi
    if [ ! -f "$preview_webm" ]; then
      echo "Generating preview WEBM for $f -> $preview_webm"
      # webm preview (mute to reduce size)
      ffmpeg -y -ss 1 -i "$f" -t 3 -an -c:v libvpx-vp9 -crf 32 -b:v 0 "$preview_webm" < /dev/null
    fi
  fi
done

echo "Updating references in HTML, JS and gallery JSON to use hyphenated Table-Rock paths"
# Replace folder references for Table Rock to Table-Rock
sed -i 's|Table Rock|Table-Rock|g' index.html script.js data/gallery.json || true

echo "Renaming thumbnails in data/images (replace spaces with hyphens)"
find data/images -type f | while read -r f; do
  dir=$(dirname "$f")
  base=$(basename "$f")
  safe=$(safe_name "$base")
  if [ "$base" != "$safe" ]; then
    echo "Renaming: $f -> $dir/$safe"
    mv -v "$f" "$dir/$safe"
  fi
done || true

echo "Updating data/gallery.json references to hyphenated filenames"
# Simple replacements for common patterns (safe for this repo structure)
sed -i 's|CraneUp Table Rock|CraneUp-Table-Rock|g' data/gallery.json || true
sed -i 's|Table Rock Flyover|Table-Rock-Flyover|g' data/gallery.json || true
sed -i 's|thumb-poster-Table Rock Flyover|thumb-poster-Table-Rock-Flyover|g' data/gallery.json || true
sed -i 's|thumb-poster-CraneUp Table Rock|thumb-poster-CraneUp-Table-Rock|g' data/gallery.json || true

echo "Done. Previews created in Media/previews. Please review changes and run the site.
Note: some manual checks may be needed for any remaining filenames with special characters."
