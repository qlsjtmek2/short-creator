import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { IVideoRenderer } from '../../types/interfaces';

export class FFmpegVideoRenderer implements IVideoRenderer {
  async renderVideo(
    framePath: string,
    audioPath: string,
    outputPath: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`🎬 Rendering video...`);
      console.log(`   - Frame: ${framePath}`);
      console.log(`   - Audio: ${audioPath}`);
      console.log(`   - Output: ${outputPath}`);

      const command = ffmpeg().input(framePath).loop().input(audioPath);

      // 배경음악 파일이 있으면 추가
      const bgmPath = 'assets/music/bgm.mp3';
      const hasBgm = fs.existsSync(bgmPath);

      if (hasBgm) {
        command.input(bgmPath);
        // 오디오 믹싱 필터: TTS(0번 오디오)는 1.0 볼륨, BGM(1번 오디오)은 0.15 볼륨으로 믹싱
        command.complexFilter([
          '[1:a]volume=1.0[v1]',
          '[2:a]volume=0.15[v2]',
          '[v1][v2]amix=inputs=2:duration=first[aout]',
        ]);
        command.outputOptions('-map 0:v').outputOptions('-map [aout]');
      } else {
        command.audioCodec('aac');
      }

      command
        .videoCodec('libx264')
        .outputOptions([
          '-pix_fmt yuv420p',
          '-shortest',
          '-tune stillimage',
          '-r 30',
        ])
        .save(outputPath)
        .on('end', () => {
          console.log(`✅ Video rendered successfully: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error(`❌ Error rendering video:`, err);
          reject(err);
        });
    });
  }
}
