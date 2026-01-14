import * as fs from 'fs';
import * as path from 'path';
import { IMemeProvider, IImageProvider } from '../../types/interfaces';

/**
 * Imgflip API를 사용하여 밈을 제공하고 생성합니다.
 * - 무료 티어: 밈 템플릿 조회, 기본 밈 생성
 * - 100+ 인기 밈 템플릿 제공
 * - 상업적 사용 가능
 *
 * API 문서: https://imgflip.com/api
 * 계정 생성: https://imgflip.com/signup (무료)
 */
export class ImgflipMemeProvider implements IMemeProvider, IImageProvider {
  private apiUrl = 'https://api.imgflip.com';
  private username: string;
  private password: string;
  private outputDir = 'output/memes';
  private templatesCache: Array<{
    id: string;
    name: string;
    url: string;
  }> | null = null;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;

    // 출력 디렉토리 생성
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 인기 밈 템플릿 목록을 가져옵니다.
   */
  async getMemeTemplates(): Promise<
    Array<{ id: string; name: string; url: string }>
  > {
    // 캐시가 있으면 재사용
    if (this.templatesCache) {
      return this.templatesCache;
    }

    try {
      const response = await fetch(`${this.apiUrl}/get_memes`);
      if (!response.ok) {
        throw new Error(`Imgflip API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        success: boolean;
        data: {
          memes: Array<{
            id: string;
            name: string;
            url: string;
            width: number;
            height: number;
            box_count: number;
          }>;
        };
      };

      if (!data.success) {
        throw new Error('Failed to fetch meme templates');
      }

      this.templatesCache = data.data.memes.map((meme) => ({
        id: meme.id,
        name: meme.name,
        url: meme.url,
      }));

      return this.templatesCache;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch Imgflip templates: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 랜덤 밈 템플릿을 다운로드합니다.
   */
  async downloadRandomMeme(): Promise<{
    path: string;
    title: string;
    source: string;
  }> {
    try {
      console.log('  🎲 Fetching random meme template from Imgflip...');

      const templates = await this.getMemeTemplates();
      const randomTemplate =
        templates[Math.floor(Math.random() * templates.length)];

      console.log(`  ✓ Selected: "${randomTemplate.name}"`);

      // 이미지 다운로드
      const imageResponse = await fetch(randomTemplate.url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const buffer = Buffer.from(await imageResponse.arrayBuffer());

      // 파일 저장
      const filename = `imgflip_${randomTemplate.id}_${Date.now()}.jpg`;
      const filepath = path.join(this.outputDir, filename);
      fs.writeFileSync(filepath, buffer);

      console.log(`  ✓ Meme saved: ${filename}`);

      return {
        path: filepath,
        title: randomTemplate.name,
        source: `Imgflip (Template ID: ${randomTemplate.id})`,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Imgflip download failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 키워드로 밈 템플릿을 검색합니다.
   */
  async searchMeme(keyword: string): Promise<
    Array<{
      id: string;
      name: string;
      url: string;
    }>
  > {
    const templates = await this.getMemeTemplates();

    // 간단한 키워드 필터링
    return templates.filter((t) =>
      t.name.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  /**
   * 밈 템플릿에 텍스트를 추가하여 생성합니다.
   * @param templateId 밈 템플릿 ID (getMemeTemplates()에서 확인 가능)
   * @param topText 상단 텍스트
   * @param bottomText 하단 텍스트
   */
  async generateMeme(
    templateId: string,
    topText: string,
    bottomText: string,
  ): Promise<{ path: string; url: string }> {
    try {
      console.log(
        `  🎨 Generating meme (Template: ${templateId}, Top: "${topText}", Bottom: "${bottomText}")...`,
      );

      // FormData 생성
      const formData = new URLSearchParams();
      formData.append('template_id', templateId);
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('text0', topText);
      formData.append('text1', bottomText);

      const response = await fetch(`${this.apiUrl}/caption_image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`Imgflip API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        success: boolean;
        data?: {
          url: string;
          page_url: string;
        };
        error_message?: string;
      };

      if (!data.success || !data.data) {
        throw new Error(
          `Imgflip API error: ${data.error_message || 'Unknown error'}`,
        );
      }

      console.log(`  ✓ Meme generated: ${data.data.url}`);

      // 생성된 밈 다운로드
      const imageResponse = await fetch(data.data.url);
      if (!imageResponse.ok) {
        throw new Error(
          `Failed to download generated meme: ${imageResponse.status}`,
        );
      }

      const buffer = Buffer.from(await imageResponse.arrayBuffer());

      // 파일 저장
      const filename = `imgflip_generated_${Date.now()}.jpg`;
      const filepath = path.join(this.outputDir, filename);
      fs.writeFileSync(filepath, buffer);

      console.log(`  ✓ Generated meme saved: ${filename}`);

      return {
        path: filepath,
        url: data.data.url,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Imgflip meme generation failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * IImageProvider 인터페이스 구현: 키워드를 무시하고 랜덤 밈 템플릿을 다운로드합니다.
   * @param keyword 키워드 (사용되지 않음)
   */
  async downloadImage(keyword: string): Promise<string> {
    const result = await this.downloadRandomMeme();
    console.log(
      `  ℹ️  Keyword "${keyword}" ignored - using random meme template instead`,
    );
    return result.path;
  }
}
