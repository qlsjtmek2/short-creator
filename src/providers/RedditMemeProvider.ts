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
  private usedMemeUrls: Set<string> = new Set(); // 중복 추적
  private maxRetries = 10; // 최대 재시도 횟수

  // 키워드→서브레딧 매핑 테이블
  private keywordToSubredditMap: Record<string, string[]> = {
    // 과학/기술
    science: ['science', 'Damnthatsinteresting', 'educationalgifs'],
    technology: ['technology', 'tech', 'gadgets'],
    space: ['space', 'Astronomy', 'nasa'],
    physics: ['Physics', 'science'],
    biology: ['biology', 'awwnature'],

    // 게임
    game: ['gaming', 'gamingmemes', 'pcmasterrace'],
    gaming: ['gaming', 'gamingmemes', 'GamePhysics'],

    // 음식
    food: ['food', 'foodporn', 'shittyfoodporn'],
    cooking: ['Cooking', 'recipes'],

    // 일상/감정
    happy: ['wholesomememes', 'MadeMeSmile'],
    sad: ['depression_memes', 'me_irl'],
    work: ['antiwork', 'WorkReform', 'officehumor'],
    relationship: ['relationship_memes', 'Tinder'],

    // 동물
    cat: ['catmemes', 'cats', 'Catswithjobs'],
    dog: ['dogpictures', 'rarepuppers'],
    animal: ['AnimalsBeingBros', 'aww'],

    // 엔터테인먼트
    movie: ['MovieDetails', 'moviememes'],
    music: ['Music', 'musicmemes'],
    art: ['Art', 'drawing'],

    // 기본값 (매칭 실패 시)
    default: ['memes', 'dankmemes', 'me_irl'],
  };

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
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        // API 호출
        const endpoint = subreddit ? `${this.apiUrl}/${subreddit}` : this.apiUrl;

        console.log(
          `  🎲 Fetching random meme from Reddit (attempt ${retries + 1}/${this.maxRetries})...`,
        );
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

        // NSFW 필터링
        if (meme.nsfw) {
          console.log('  ⚠️  NSFW content detected, fetching another...');
          retries++;
          continue;
        }

        // 중복 체크
        if (this.usedMemeUrls.has(meme.url)) {
          console.log(
            `  ⚠️  Duplicate meme detected: "${meme.title}", fetching another...`,
          );
          retries++;
          continue;
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
        const filename = `reddit_meme_${Date.now()}_${retries}${ext}`;
        const filepath = path.join(this.outputDir, filename);
        fs.writeFileSync(filepath, buffer);

        // 사용된 URL 기록
        this.usedMemeUrls.add(meme.url);

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

    throw new Error(
      `Failed to fetch unique meme after ${this.maxRetries} attempts. Consider using a different image provider.`,
    );
  }

  /**
   * IImageProvider 인터페이스 구현: 키워드 기반으로 서브레딧을 매핑하여 밈을 다운로드합니다.
   * @param keyword 키워드 (서브레딧 매핑에 사용)
   */
  async downloadImage(keyword: string): Promise<string> {
    // 키워드를 소문자로 변환하여 매칭
    const lowerKeyword = keyword.toLowerCase();

    // 키워드에 맞는 서브레딧 찾기
    let targetSubreddit: string | undefined;

    for (const [key, subreddits] of Object.entries(
      this.keywordToSubredditMap,
    )) {
      if (lowerKeyword.includes(key)) {
        // 해당 카테고리의 서브레딧 중 랜덤 선택
        targetSubreddit =
          subreddits[Math.floor(Math.random() * subreddits.length)];
        console.log(
          `  🎯 Keyword "${keyword}" mapped to subreddit: r/${targetSubreddit}`,
        );
        break;
      }
    }

    // 매칭 실패 시 기본 서브레딧 사용
    if (!targetSubreddit) {
      const defaultSubreddits = this.keywordToSubredditMap.default;
      targetSubreddit =
        defaultSubreddits[Math.floor(Math.random() * defaultSubreddits.length)];
      console.log(
        `  ℹ️  Keyword "${keyword}" not mapped, using default subreddit: r/${targetSubreddit}`,
      );
    }

    const result = await this.downloadRandomMeme(targetSubreddit);
    return result.path;
  }

  /**
   * 중복 추적을 초기화합니다. (새로운 쇼츠 생성 시 호출)
   */
  resetUsedMemes(): void {
    this.usedMemeUrls.clear();
    console.log('  🔄 Reset used memes tracking');
  }
}
