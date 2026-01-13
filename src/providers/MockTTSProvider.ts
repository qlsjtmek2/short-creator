import { ITTSProvider } from "../../types/interfaces";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export class MockTTSProvider implements ITTSProvider {
  private outputDir: string;

  constructor(outputDir: string = "output/audio") {
    this.outputDir = outputDir;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateAudio(text: string, character: string): Promise<string> {
    const fileName = `mock_audio_${Date.now()}.mp3`;
    const filePath = path.join(this.outputDir, fileName);

    console.log(`🎙️ Mock TTS (Character: ${character}): "${text}"`);
    
    // 3초짜리 무음 오디오 파일 생성 (테스트용)
    try {
      execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 3 -acodec libmp3lame "${filePath}"`, { stdio: 'ignore' });
      return filePath;
    } catch (e) {
      console.error("Failed to generate mock audio:", e);
      throw e;
    }
  }
}
