import * as fs from 'fs';
import * as path from 'path';
import { IMemeProvider, IImageProvider } from '../../types/interfaces';

/**
 * Reddit Meme API (D3vd/Meme_Api)를 사용하여 밈을 제공합니다.
 * - 완전 무료 (인증 불필요)
 * - Reddit의 r/memes, r/dankmemes, r/me_irl 등에서 실시간 크롤링
 * - 랜덤 밈 제공
 *
 * API 문서: https://github.com/D3vd/Meme_Api
 * 주의: Reddit ToS가 적용되므로 상업적 사용 시 주의 필요
 */
export class RedditMemeProvider implements IMemeProvider, IImageProvider {
  private apiUrl = 'https://meme-api.com/gimme';
  private outputDir = 'output/memes';

  constructor() {
    // 출력 디렉토리 생성
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 랜덤 밈을 다운로드합니다.
   * @param subreddit 특정 서브레딧 지정 (선택사항)
   */
  async downloadRandomMeme(
    subreddit?: string,
  ): Promise<{ path: string; title: string; source: string }> {
    try {
      // API 호출
      const endpoint = subreddit ? `${this.apiUrl}/${subreddit}` : this.apiUrl;

      console.log(`  🎲 Fetching random meme from Reddit...`);
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(
          `Reddit Meme API error: ${response.status} ${response.statusText}`,
        );
      }

      const meme = (await response.json()) as {
        postLink: string;
        subreddit: string;
        title: string;
        url: string;
        nsfw: boolean;
        spoiler: boolean;
        author: string;
        ups: number;
      };

      // NSFW 필터링 (선택적)
      if (meme.nsfw) {
        console.log('  ⚠️  NSFW content detected, fetching another...');
        return this.downloadRandomMeme(subreddit);
      }

      console.log(`  ✓ Found: "${meme.title}" from r/${meme.subreddit}`);

      // 이미지 다운로드
      const imageResponse = await fetch(meme.url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const buffer = Buffer.from(await imageResponse.arrayBuffer());

      // 파일 확장자 추출
      const urlObj = new URL(meme.url);
      const ext = path.extname(urlObj.pathname) || '.jpg';

      // 파일 저장
      const filename = `reddit_meme_${Date.now()}${ext}`;
      const filepath = path.join(this.outputDir, filename);
      fs.writeFileSync(filepath, buffer);

      console.log(`  ✓ Meme saved: ${filename}`);

      return {
        path: filepath,
        title: meme.title,
        source: `r/${meme.subreddit} by u/${meme.author} (${meme.ups} upvotes)`,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Reddit Meme API failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * IImageProvider 인터페이스 구현: 키워드를 무시하고 랜덤 밈을 다운로드합니다.
   * @param keyword 키워드 (사용되지 않음)
   */
  async downloadImage(keyword: string): Promise<string> {
    const result = await this.downloadRandomMeme();
    console.log(
      `  ℹ️  Keyword "${keyword}" ignored - using random meme instead`,
    );
    return result.path;
  }
}
