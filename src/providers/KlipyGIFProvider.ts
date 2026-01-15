import * as fs from 'fs';
import * as path from 'path';
import { IImageProvider } from '../../types/interfaces';

/**
 * KLIPY GIF API를 사용하여 키워드 기반 GIF/밈을 제공합니다.
 * - 완전 무료 (평생 무료 API 제공)
 * - 키워드 검색 네이티브 지원
 * - Tenor 호환 API (마이그레이션 용이)
 * - 무제한 API 호출 (프로덕션 키 승인 후)
 *
 * API 문서: https://docs.klipy.com/
 * API 키 발급: https://docs.klipy.com/ (테스트 키: 분당 100 호출)
 * GitHub: https://github.com/KLIPY-com/Klipy-GIF-API
 *
 * 주의사항:
 * - NSFW 필터링 메타데이터 제한적 (contentfilter=high 사용 권장)
 * - 테스트 키: 분당 100 호출 제한
 * - 프로덕션 키: Publisher Admin Panel에서 신청 (무제한)
 */
export class KlipyGIFProvider implements IImageProvider {
  private apiUrl = 'https://api.klipy.com/v2';
  private apiKey: string;
  private outputDir = 'output/memes';
  private usedGifUrls: Set<string> = new Set();
  private maxRetries = 10;

  constructor(apiKey: string) {
    this.apiKey = apiKey;

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 키워드로 GIF를 검색하고 다운로드합니다.
   * @param keyword 검색 키워드 (영어 또는 한국어)
   */
  async downloadImage(keyword: string): Promise<string> {
    // 검색 후보군 생성 (원본 키워드 + 분할 키워드)
    const candidates = [keyword];
    if (keyword.includes('_')) candidates.push(...keyword.split('_'));
    if (keyword.includes(' ')) candidates.push(...keyword.split(' '));

    for (const searchKey of candidates) {
      if (!searchKey || searchKey.length < 2) continue; // 너무 짧은 키워드 스킵

      let retries = 0;
      // 중복 방지를 위한 재시도 루프
      while (retries < this.maxRetries) {
        try {
          console.log(
            `  🔍 Searching KLIPY for: "${searchKey}" (attempt ${retries + 1}/${this.maxRetries})...`,
          );

          // KLIPY Search API 호출
          const searchUrl = `${this.apiUrl}/search?q=${encodeURIComponent(searchKey)}&key=${this.apiKey}&limit=50&contentfilter=high`;
          const response = await fetch(searchUrl);

          if (!response.ok) {
            console.warn(
              `  ⚠️  KLIPY API error: ${response.status} ${response.statusText}`,
            );
            break; // API 에러 시 다음 후보군으로 이동
          }

          const data = (await response.json()) as {
            results: Array<{
              id: string;
              content_description: string;
              media_formats: {
                gif: { url: string };
              };
            }>;
          };

          if (!data.results || data.results.length === 0) {
            console.log(`  ⚠️  No GIFs found for "${searchKey}"`);
            break; // 결과 없으면 다음 후보군으로 이동
          }

          // 랜덤 선택
          const randomGif =
            data.results[Math.floor(Math.random() * data.results.length)];
          const gifUrl = randomGif.media_formats.gif.url;

          // 중복 체크
          if (this.usedGifUrls.has(gifUrl)) {
            console.log(`  ⚠️  Duplicate GIF detected, retrying...`);
            retries++;
            continue;
          }

          console.log(`  ✓ Found: "${randomGif.content_description}"`);

          // GIF 다운로드
          const imageResponse = await fetch(gifUrl);
          if (!imageResponse.ok) {
            throw new Error(`Download failed: ${imageResponse.status}`);
          }

          const buffer = Buffer.from(await imageResponse.arrayBuffer());

          // 파일 저장
          const filename = `klipy_${randomGif.id}_${Date.now()}_${retries}.gif`;
          const filepath = path.join(this.outputDir, filename);
          fs.writeFileSync(filepath, buffer);

          // 사용된 URL 기록
          this.usedGifUrls.add(gifUrl);

          console.log(`  ✓ GIF saved: ${filename}`);

          return filepath;
        } catch (error) {
          console.warn(
            `  ⚠️  Error during download for "${searchKey}":`,
            error instanceof Error ? error.message : error,
          );
          // 치명적 에러가 아니면 재시도 또는 다음 후보군으로
          retries++;
        }
      }
    }

    throw new Error(
      `KLIPY API failed: No GIFs found for keyword: "${keyword}" (and fallbacks)`,
    );
  }

  /**
   * 중복 추적을 초기화합니다.
   */
  resetUsedMemes(): void {
    this.usedGifUrls.clear();
    console.log('  🔄 Reset used GIFs tracking');
  }

  async searchImages(keyword: string, count: number = 4): Promise<string[]> {
    console.log(`⚠️ Search not implemented for Klipy, returning empty array.`);
    return [];
  }
}
