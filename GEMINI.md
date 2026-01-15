# Short Creator - Project Context

## Project Overview

**Short Creator** is an automated tool for generating "Would You Rather" and "Storytelling" shorts videos. It leverages AI to generate content, source assets, and synthesize voiceovers, culminating in a rendered video ready for social media platforms.

The project now features an **Interactive Director Mode**, a web-based GUI that allows users to refine scripts and select assets before rendering, ensuring high-quality output through a human-in-the-loop process.

### Key Features
*   **AI Content Generation:** Uses Google Gemini to create engaging scripts and relevant image keywords.
*   **Interactive Director Mode (GUI):** Web interface for script editing, asset selection, and real-time preview.
*   **Automated Asset Sourcing:** Fetches high-quality images from Pexels, Memes from Reddit/Imgflip/Klipy.
*   **Voice Synthesis:** Supports ElevenLabs and Typecast for high-quality TTS.
*   **Dynamic Visuals:** Uses Node.js Canvas for layout and FFmpeg for video rendering with effects (Zoom-in, Pop-in subtitles).
*   **Batch Processing:** Capable of generating multiple videos via CLI.

### Tech Stack
*   **Frontend:** Next.js, Tailwind CSS (Interactive Mode)
*   **Backend:** Node.js, Express (API Server)
*   **Language:** TypeScript
*   **AI/API:** Google Gemini, Pexels, ElevenLabs, Typecast, Reddit, Imgflip, Klipy
*   **Media Processing:** Canvas (Images), FFmpeg (Video/Audio)

## Architecture

*   **Web UI (`web-ui/`):** Next.js application for the Interactive Director Mode.
*   **API Server (`src/server/`):** Express server providing endpoints for draft generation, asset search, and rendering.
*   **Orchestrator (`src/StoryOrchestrator.ts`):** Manages the storytelling pipeline (Script -> Assets -> Render).
*   **Generators (`src/generators/`):** Modules for creating text content and subtitles.
*   **Providers (`src/providers/`):** Modules for external assets (Images, TTS).
*   **Renderers (`src/renderers/`):** Modules for video encoding via FFmpeg.

## Building and Running

### Prerequisites
*   Node.js v18+
*   FFmpeg installed (`brew install ffmpeg`)
*   API Keys in `.env` (Gemini, Pexels, ElevenLabs/Typecast)

### Running Interactive Mode (GUI)
1.  Start Backend Server:
    ```bash
    npm run server
    ```
2.  Start Frontend Client:
    ```bash
    cd web-ui && npm run dev
    ```
3.  Open `http://localhost:3000`

### Running CLI Mode
*   **Story Mode:** `npm run story -- --topic "주제"`
*   **Would You Rather:** `npm run wyr -- --count 5`

## Directory Structure

```
/
├── .gemini/          # Gemini agent configuration
├── assets/           # Static assets (fonts, music)
├── config/           # Configuration files
├── output/           # Generated artifacts (ignored)
├── scripts/          # Utility scripts
├── src/              # Backend source code
│   ├── composers/    # Frame generation logic
│   ├── generators/   # Content generation logic
│   ├── providers/    # External service providers
│   ├── renderers/    # Video rendering logic
│   ├── server/       # Express API server
│   ├── StoryOrchestrator.ts
│   └── index.ts
├── web-ui/           # Next.js Frontend
│   ├── src/app/      # Pages
│   ├── src/components/ # UI Components
│   └── src/lib/      # API Client
└── types/            # TypeScript type definitions
```