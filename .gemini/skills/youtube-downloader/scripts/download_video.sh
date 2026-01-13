#!/bin/bash

# Usage: ./download_video.sh <YOUTUBE_URL> [OUTPUT_DIR]

URL="$1"
OUTPUT_DIR="${2:-output/video}"

if [ -z "$URL" ]; then
  echo "Usage: $0 <YOUTUBE_URL> [OUTPUT_DIR]"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "⏳ Downloading video from: $URL"
yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "$OUTPUT_DIR/%(title)s.%(ext)s" "$URL"

echo "✅ Download complete!"
