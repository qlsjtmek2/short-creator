import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { IImageProvider, ITTSProvider } from '../../types/interfaces';
import { getAudioDuration } from '../utils/audio';

export interface AssetPaths {
  imagePath: string;
  audioPath: string;
  duration: number;
}

/**
 * 영상 제작에 필요한 에셋(이미지, 오디오)의 다운로드 및 관리를 전담합니다.
 */
export class AssetManager {
  constructor(
    private imageProvider: IImageProvider,
    private ttsProvider: ITTSProvider,
    private outputDir: string,
  ) {
    this.ensureDirectory(path.join(this.outputDir, 'images'));
    this.ensureDirectory(path.join(this.outputDir, 'audio'));
  }

  /**
   * 키워드로 이미지를 검색하거나 직접 다운로드하여 로컬에 저장합니다.
   */
  async prepareImage(keyword: string, imageUrl?: string, id?: string): Promise<string> {
    const uniqueId = id || `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const targetPath = path.join(this.outputDir, 'images', `img_${uniqueId}.jpg`);

    if (imageUrl) {
      return this.downloadUrlToFile(imageUrl, targetPath);
    } else {
      const downloadedPath = await this.imageProvider.downloadImage(keyword);
      fs.copyFileSync(downloadedPath, targetPath);
      return targetPath;
    }
  }

  /**
   * 텍스트를 오디오로 변환하여 로컬에 저장하고 길이를 반환합니다.
   */
  async prepareAudio(text: string, id?: string): Promise<{ path: string; duration: number }> {
    const uniqueId = id || `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const targetPath = path.join(this.outputDir, 'audio', `aud_${uniqueId}.mp3`);

    const generatedPath = await this.ttsProvider.generateAudio(text, 'neutral');
    fs.copyFileSync(generatedPath, targetPath);

    const duration = await getAudioDuration(targetPath);
    return { path: targetPath, duration };
  }

  /**
   * URL의 파일을 로컬 경로로 다운로드합니다.
   */
  private async downloadUrlToFile(url: string, targetPath: string): Promise<string> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(targetPath, response.data);
    return targetPath;
  }

  private ensureDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
