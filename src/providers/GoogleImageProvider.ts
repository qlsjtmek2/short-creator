import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { IImageProvider } from '../../types/interfaces';

export class GoogleImageProvider implements IImageProvider {
  private apiKey: string;
  private cx: string;
  private outputDir: string;

  constructor(apiKey: string, cx: string, outputDir: string = 'output/images') {
    this.apiKey = apiKey;
    this.cx = cx;
    this.outputDir = outputDir;

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async searchImages(keyword: string, count: number = 4): Promise<string[]> {
    if (!this.apiKey || !this.cx) {
      console.warn('⚠️ Google Search API Key or CX is missing.');
      return [];
    }

    console.log(`🔍 Searching Google Images for: ${keyword}`);
    try {
      const response = await axios.get(
        'https://www.googleapis.com/customsearch/v1',
        {
          params: {
            key: this.apiKey,
            cx: this.cx,
            q: keyword,
            searchType: 'image',
            num: count, // Max 10
            safe: 'active',
          },
        },
      );

      if (!response.data.items) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.data.items.map((item: any) => item.link);
    } catch (error) {
      console.error('Failed to search Google Images:', error);
      return [];
    }
  }

  async downloadImage(keyword: string): Promise<string> {
    // 1. 검색
    const urls = await this.searchImages(keyword, 1);
    if (urls.length === 0) {
      throw new Error(`No images found on Google for: ${keyword}`);
    }

    const imageUrl = urls[0];

    // 2. 다운로드
    try {
      console.log(`⏳ Downloading image from Google: ${imageUrl}`);
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      });

      // 확장자 추출 (URL이나 Content-Type에서)
      const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
      const filename = `google_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
      const filepath = path.join(this.outputDir, filename);

      fs.writeFileSync(filepath, response.data);
      console.log(`✅ Image saved to: ${filepath}`);

      return filepath;
    } catch (error) {
      console.error(`Failed to download image: ${imageUrl}`, error);
      throw error;
    }
  }
}
