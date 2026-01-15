import { ITTSProvider } from '../../types/interfaces';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export class MockTTSProvider implements ITTSProvider {
  private outputDir: string;
  public speed: number = 1.0; // 1.0 = Normal (0.2s per char)

  constructor(outputDir: string = 'output/audio') {
    this.outputDir = outputDir;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateAudio(text: string, character: string): Promise<string> {
    const fileName = `mock_audio_${Date.now()}.mp3`;
    const filePath = path.join(this.outputDir, fileName);

    console.log(
      `🎙️ Mock TTS (Character: ${character}): "${text}" (Speed: ${this.speed})`,
    );

    // 글자 수 기반 길이 계산 (기본 0.2초/자 * 속도 배율 역수)
    // Speed 2.0 -> 2배 빠름 -> 시간 0.5배
    const baseCharDuration = 0.2;
    const duration = Math.max(
      1,
      (text.replace(/\s/g, '').length * baseCharDuration) / this.speed,
    );

    // 무음 오디오 파일 생성
    try {
      execSync(
        `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} -acodec libmp3lame "${filePath}"`,
        { stdio: 'ignore' },
      );
      return filePath;
    } catch (e) {
      console.error('Failed to generate mock audio:', e);
      throw e;
    }
  }
}
