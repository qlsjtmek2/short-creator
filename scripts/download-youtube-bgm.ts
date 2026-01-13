import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

async function downloadBgm() {
  const videoUrl = "https://www.youtube.com/watch?v=-SjOkb3kVgI"; // Kevin MacLeod - Sneaky Snitch
  const outputDir = "assets/music";
  const outputFile = path.join(outputDir, "bgm.mp3");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 기존 파일 삭제
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

  console.log(`⏳ Downloading BGM from YouTube using yt-dlp...`);
  console.log(`   URL: ${videoUrl}`);

  try {
    // yt-dlp 명령어 실행
    // -x: 오디오 추출
    // --audio-format mp3: MP3 변환
    // -o: 출력 경로 지정
    // --force-overwrites: 덮어쓰기
    execSync(`yt-dlp -x --audio-format mp3 -o "${path.join(outputDir, 'bgm.%(ext)s')}" --force-overwrites "${videoUrl}"`, { stdio: 'inherit' });
    
    console.log(`✅ BGM downloaded successfully: ${outputFile}`);
  } catch (error) {
    console.error("❌ Failed to download BGM:", error);
  }
}

downloadBgm();