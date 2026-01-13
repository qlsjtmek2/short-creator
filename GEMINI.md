# Short Creator - Project Context

## Project Overview

**Short Creator** is an automated tool for generating "Would You Rather" shorts videos. It leverages AI to generate content, source assets, and synthesize voiceovers, culminating in a rendered video ready for social media platforms.

### Key Features
*   **AI Content Generation:** Uses Google Gemini to create engaging "Would You Rather" questions and relevant image search keywords.
*   **Automated Asset Sourcing:** Fetches high-quality images from Pexels API based on generated keywords.
*   **Voice Synthesis:** Supports ElevenLabs and Typecast for high-quality TTS, with a Mock fallback for testing.
*   **Dynamic Visuals:** Uses Node.js Canvas to generate split-screen layouts with gradient backgrounds and typography.
*   **Video Rendering:** Utilizes FFmpeg to combine frames, voiceovers, and background music into a final MP4 video.
*   **Batch Processing:** Capable of generating multiple videos in a single run via CLI arguments.

### Tech Stack
*   **Runtime:** Node.js (v18+)
*   **Language:** TypeScript
*   **AI/API:** Google Gemini, Pexels, ElevenLabs, Typecast
*   **Media Processing:** Canvas (Images), FFmpeg (Video/Audio)
*   **Tools:** ESLint, Prettier, GitHub Actions

## Architecture

The project follows a modular architecture defined by interfaces in `types/interfaces.ts`.

*   **Entry Point:** `src/index.ts` - Bootstrap, dependency injection, and CLI argument parsing.
*   **Orchestrator:** `src/ShortsGenerator.ts` - Manages the workflow: Question -> Assets -> Frame -> Render.
*   **Generators:** `src/generators/` - Modules for generating text content (e.g., `GeminiQuestionGenerator`).
*   **Providers:** `src/providers/` - Modules for external assets (e.g., `PexelsImageProvider`, `ElevenLabsTTSProvider`).
*   **Composers:** `src/composers/` - Modules for creating visual frames (e.g., `CanvasFrameComposer`).
*   **Renderers:** `src/renderers/` - Modules for video encoding (e.g., `FFmpegVideoRenderer`).

## Building and Running

### Prerequisites
*   Node.js v18 or higher
*   FFmpeg installed and available in system PATH (`brew install ffmpeg` on macOS)
*   API Keys setup in `.env` (Gemini, Pexels, ElevenLabs/Typecast)

### Key Commands

| Command | Description |
| :--- | :--- |
| `npm install` | Install project dependencies |
| `npm start` | Generate a single video (default) |
| `npm start -- --count <n>` | Batch generate `<n>` videos |
| `npm run clean` | Remove all generated files in `output/` |
| `npm run download:bgm` | Download sample background music to `assets/music/` |
| `npm run lint` | Run ESLint (configured for legacy mode compatibility) |
| `npm run type-check` | Run TypeScript compiler to check for errors |

### Testing
The project includes scripts to test individual modules in isolation:

*   `npm run test:generator`: Test question generation with Gemini.
*   `npm run test:image`: Test image downloading with Pexels.
*   `npm run test:frame`: Test frame composition with Canvas.
*   `npm run test:video`: Test video rendering with FFmpeg.

## Development Conventions

*   **Interfaces:** All core modules implement interfaces defined in `types/interfaces.ts`. New implementations should adhere to these contracts.
*   **Configuration:** Environment variables are managed via `dotenv`. See `.env.example` for required keys.
*   **Assets:**
    *   Fonts: Place `.ttf` files in `assets/fonts/` (e.g., `Pretendard-Bold.ttf`).
    *   Music: Place background music as `assets/music/bgm.mp3`.
*   **Outputs:** All generated content (images, audio, frames, videos) is saved to the `output/` directory, which is git-ignored.
*   **Linting:** The project uses ESLint. Note that `ESLINT_USE_FLAT_CONFIG=false` is currently set in scripts for compatibility.

## Directory Structure

```
/
├── .gemini/          # Gemini agent configuration and skills
├── .github/          # GitHub Actions workflows
├── assets/           # Static assets (fonts, music)
├── output/           # Generated artifacts (ignored by git)
├── scripts/          # Utility and test scripts
├── src/              # Source code
│   ├── composers/    # Frame generation logic
│   ├── generators/   # Content generation logic
│   ├── providers/    # External service providers
│   ├── renderers/    # Video rendering logic
│   └── index.ts      # Application entry point
├── types/            # TypeScript type definitions
└── ...config files
```
