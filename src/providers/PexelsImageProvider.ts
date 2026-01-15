import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { IImageProvider } from '../../types/interfaces';

interface PexelsPhoto {
  src: {
    large2x: string;
    original: string;
  };
}

export class PexelsImageProvider implements IImageProvider {
  private apiKey: string;
  private outputDir: string;

  constructor(apiKey: string, outputDir: string = 'output/images') {
    this.apiKey = apiKey;
    this.outputDir = outputDir;

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async downloadImage(keyword: string): Promise<string> {
    console.log(`⏳ Searching image for: ${keyword}`);

    try {
      // 1. Pexels API 검색
      const searchResponse = await axios.get(
        'https://api.pexels.com/v1/search',
        {
          params: {
            query: keyword,
            per_page: 1,
            orientation: 'portrait', // 쇼츠용이므로 세로형 우선 검색
          },
          headers: {
            Authorization: this.apiKey,
          },
        },
      );

      const photos = searchResponse.data.photos;
      if (!photos || photos.length === 0) {
        throw new Error(`No images found for keyword: ${keyword}`);
      }

      const imageUrl = photos[0].src.large2x || photos[0].src.original;
      const extension = path.extname(new URL(imageUrl).pathname) || '.jpg';
      const fileName = `${encodeURIComponent(keyword)}_${Date.now()}${extension}`;
      const filePath = path.join(this.outputDir, fileName);

      // 2. 이미지 다운로드
      console.log(`⏳ Downloading image from: ${imageUrl}`);
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      });

      // 3. 파일 저장
      fs.writeFileSync(filePath, imageResponse.data);
      console.log(`✅ Image saved to: ${filePath}`);

      return filePath;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const err = error as AxiosError;
        console.error(
          'Failed to download image from Pexels:',
          err.response?.data || err.message,
        );
      } else {
        console.error('Failed to download image from Pexels:', error);
      }
      throw error;
    }
  }

  async searchImages(keyword: string, count: number = 4): Promise<string[]> {
    console.log(
      `⏳ Searching images for preview: ${keyword} (count: ${count})`,
    );
    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: {
          query: keyword,
          per_page: count,
          orientation: 'portrait',
        },
        headers: { Authorization: this.apiKey },
      });

      const photos = response.data.photos || [];
      return photos.map(
        (photo: PexelsPhoto) => photo.src.large2x || photo.src.original,
      );
    } catch (error) {
      console.error('Failed to search images from Pexels:', error);
      return [];
    }
  }
}
