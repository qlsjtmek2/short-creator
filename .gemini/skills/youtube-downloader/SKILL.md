---
name: youtube-downloader
description: This skill should be used when the user asks to "download youtube video", "extract audio from youtube", "download music from youtube", or mentions "yt-dlp", "youtube download".
version: 1.0.0
---

# YouTube Downloader Skill

## 🎯 Purpose

This skill provides a reliable way to download high-quality video and audio from YouTube using `yt-dlp`. It handles installation, best quality selection, and format conversion.

## 🛠 Prerequisites

Before using this skill, ensure `yt-dlp` and `ffmpeg` are installed.

### macOS

```bash
brew install yt-dlp ffmpeg
```

### Windows

Download `yt-dlp.exe` and `ffmpeg` binaries and add them to PATH.

## 🚀 Usage

### 1. Download Highest Quality Audio (MP3)

To extract audio from a YouTube video and save it as MP3:

```bash
yt-dlp -x --audio-format mp3 -o "output/audio/%(title)s.%(ext)s" "YOUTUBE_URL"
```

- `-x`: Extract audio
- `--audio-format mp3`: Convert to MP3
- `-o`: Output template

### 2. Download Highest Quality Video (MP4)

To download the best video and audio streams and merge them into MP4:

```bash
yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "output/video/%(title)s.%(ext)s" "YOUTUBE_URL"
```

### 3. Download Playlist

To download an entire playlist:

```bash
yt-dlp -x --audio-format mp3 -o "playlist/%(playlist_index)s - %(title)s.%(ext)s" "PLAYLIST_URL"
```

## 📂 Bundled Scripts

Use the provided scripts for simplified execution.

### Scripts

- **`scripts/download_audio.sh`**: Download audio as MP3
- **`scripts/download_video.sh`**: Download best quality video

## ⚠️ Troubleshooting

### 403 Forbidden / Sign in to confirm you're not a bot

YouTube frequently updates its anti-bot protection.

1. Update `yt-dlp`: `yt-dlp -U`
2. Use cookies: Export cookies from your browser (using "Get cookies.txt" extension) and use `--cookies cookies.txt`.

### FFmpeg not found

Ensure `ffmpeg` is installed and in your system PATH. `yt-dlp` relies on it for merging and conversion.
