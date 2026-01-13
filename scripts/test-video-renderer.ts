import { FFmpegVideoRenderer } from "../src/renderers/FFmpegVideoRenderer";
import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";

async function main() {
  const outputDir = "output/videos";
  const frameDir = "output/frames";
  
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir, { recursive: true });

  // 1. Prepare dummy assets
  const dummyFramePath = path.join(frameDir, "dummy_frame.png");
  const dummyAudioPath = "output/dummy_audio.mp3";

  // Create dummy image (1080x1920 red)
  if (!fs.existsSync(dummyFramePath)) {
      console.log("Creating dummy frame...");
      try {
        execSync(`ffmpeg -y -f lavfi -i color=c=red:s=1080x1920 -frames:v 1 "${dummyFramePath}"`, { stdio: 'ignore' });
      } catch (e) {
        console.error("Failed to create dummy frame via ffmpeg. Make sure ffmpeg is installed.");
        return;
      }
  }

  // Create dummy audio (5 seconds silence)
  if (!fs.existsSync(dummyAudioPath)) {
      console.log("Creating dummy audio...");
      try {
        execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 5 -acodec libmp3lame "${dummyAudioPath}"`, { stdio: 'ignore' });
      } catch (e) {
        console.error("Failed to create dummy audio via ffmpeg.");
        return;
      }
  }

  // 2. Render
  const renderer = new FFmpegVideoRenderer();
  const outputPath = path.join(outputDir, "test_video.mp4");

  try {
    await renderer.renderVideo(dummyFramePath, dummyAudioPath, outputPath);
    console.log("🎉 Test Passed! Video saved at:", outputPath);
  } catch (e) {
    console.error("❌ Test Failed:", e);
  }
}

main();
