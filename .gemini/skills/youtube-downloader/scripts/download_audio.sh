#!/bin/bash

# Usage: ./download_audio.sh <YOUTUBE_URL> [OUTPUT_DIR]

URL="$1"
OUTPUT_DIR="${2:-output/audio}"

if [ -z "$URL" ]; then
  echo "Usage: $0 <YOUTUBE_URL> [OUTPUT_DIR]"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "⏳ Downloading audio from: $URL"
yt-dlp -x --audio-format mp3 -o "$OUTPUT_DIR/%(title)s.%(ext)s" "$URL"

echo "✅ Download complete!"
