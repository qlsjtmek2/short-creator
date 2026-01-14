import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, registerFont, CanvasRenderingContext2D } from 'canvas';
import { SubtitleEvent } from '../../types/common';
import { ISubtitleGenerator } from '../../types/interfaces';
import { getStoryConfig } from '../../config/shorts.config';

export class SubtitleGenerator implements ISubtitleGenerator {
  private config = getStoryConfig().subtitle;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(fontPath?: string, fontSize?: number) {
    // 생성자 파라미터로 오버라이드 가능 (하위 호환성)
    if (fontPath) this.config.fontPath = fontPath;
    if (fontSize) this.config.fontSize = fontSize;
  }

  /**
   * 폰트 파일 경로에서 폰트 이름 추출
   * 예: "assets/fonts/Pretendard-Bold.ttf" → "Pretendard Bold"
   */
  private getFontName(): string {
    const fontPath = this.config.fontPath;
    const fileName = path.basename(fontPath, path.extname(fontPath));
    // 파일명에서 하이픈을 공백으로 변경
    return fileName.replace(/-/g, ' ');
  }

  /**
   * Canvas Context를 싱글톤으로 초기화합니다.
   * @returns CanvasRenderingContext2D 또는 null (실패 시)
   */
  private getCanvasContext(): CanvasRenderingContext2D | null {
    if (this.ctx) return this.ctx;

    try {
      const canvas = createCanvas(100, 100); // 더미 캔버스

      if (fs.existsSync(this.config.fontPath)) {
        const fontFamily = this.getFontName();
        registerFont(this.config.fontPath, { family: fontFamily });

        const ctx = canvas.getContext('2d');
        ctx.font = `${this.config.fontSize}px "${fontFamily}"`;
        this.ctx = ctx;
        return ctx;
      }
    } catch {
      console.warn('⚠️ Canvas not available, using fallback');
    }

    return null;
  }

  /**
   * 픽셀 너비 기반으로 텍스트를 줄바꿈합니다.
   * @param text 원본 텍스트
   * @param ctx Canvas Rendering Context
   * @param maxWidth 최대 픽셀 너비
   * @returns 줄바꿈이 적용된 텍스트
   */
  private wrapTextByPixelWidth(
    text: string,
    ctx: CanvasRenderingContext2D,
    maxWidth: number,
  ): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth) {
        // 현재 줄이 비어있지 않으면 줄바꿈
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        }

        // 단어 자체가 너무 긴 경우 글자 단위로 분할
        const wordWidth = ctx.measureText(word).width;
        if (wordWidth > maxWidth) {
          // 현재 줄에 내용이 있으면 저장
          if (currentLine && currentLine !== word) {
            lines.push(currentLine);
          }
          const splitLines = this.splitLongWord(word, ctx, maxWidth);
          lines.push(...splitLines.slice(0, -1));
          currentLine = splitLines[splitLines.length - 1];
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // 디버그 로그: 각 줄의 픽셀 너비 출력
    lines.forEach((line, i) => {
      const width = ctx.measureText(line).width;
      const scaledWidth = width * 1.2; // 120% 스케일 적용
      console.log(
        `  Line ${i + 1}: "${line}" (${width.toFixed(1)}px → ${scaledWidth.toFixed(1)}px @ 120%)`,
      );
    });

    return lines.join('\\N');
  }

  /**
   * 긴 단어를 글자 단위로 강제 분할합니다.
   * @param word 긴 단어
   * @param ctx Canvas Rendering Context
   * @param maxWidth 최대 픽셀 너비
   * @returns 분할된 줄 배열
   */
  private splitLongWord(
    word: string,
    ctx: CanvasRenderingContext2D,
    maxWidth: number,
  ): string[] {
    const lines: string[] = [];
    let currentLine = '';

    for (const char of word) {
      const testLine = currentLine + char;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [word];
  }

  /**
   * 글자 수 기반으로 텍스트를 줄바꿈합니다 (폴백용).
   * @param text 원본 텍스트
   * @param maxCharsPerLine 한 줄 최대 글자 수
   * @returns 줄바꿈이 적용된 텍스트
   */
  private wrapTextByCharCount(text: string, maxCharsPerLine: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length > maxCharsPerLine) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
          currentLine = '';
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\\N');
  }

  /**
   * 텍스트를 자동 줄바꿈합니다.
   * 픽셀 기반 줄바꿈이 활성화되어 있으면 픽셀 기반으로, 그렇지 않으면 글자 수 기반으로 처리합니다.
   * @param text 원본 텍스트
   * @param maxCharsPerLine 한 줄 최대 글자 수 (폴백용, 기본값: 15)
   * @returns 줄바꿈이 적용된 텍스트
   */
  private wrapText(text: string, maxCharsPerLine: number = 15): string {
    const wrappingConfig = this.config.wrapping;

    // 픽셀 기반 줄바꿈이 비활성화되었으면 기존 로직 사용
    if (!wrappingConfig?.enabled) {
      return this.wrapTextByCharCount(text, maxCharsPerLine);
    }

    const ctx = this.getCanvasContext();
    if (!ctx) {
      console.warn('⚠️ Canvas not available, using fallback');
      return this.wrapTextByCharCount(
        text,
        wrappingConfig.fallbackCharsPerLine,
      );
    }

    // 최대 허용 너비 계산
    const playResX = 1080; // ASS PlayResX
    const maxScaleFactor = wrappingConfig.maxScalePercent / 100;
    const maxAllowedWidth =
      playResX -
      wrappingConfig.marginL -
      wrappingConfig.marginR -
      wrappingConfig.safetyPadding;

    const maxOriginalWidth = maxAllowedWidth / maxScaleFactor;

    console.log(
      `📏 Max width: ${maxAllowedWidth}px (original: ${maxOriginalWidth.toFixed(1)}px @ 100%)`,
    );

    return this.wrapTextByPixelWidth(text, ctx, maxOriginalWidth);
  }

  async generateASS(
    events: SubtitleEvent[],
    outputPath: string,
  ): Promise<string> {
    const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${this.getFontName()},${this.config.fontSize},${this.config.primaryColor},&H000000FF,${this.config.outlineColor},${this.config.backColor},-1,0,0,0,100,100,0,0,1,${this.config.outline},${this.config.shadow},${this.config.alignment},100,100,${this.config.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const anim = this.config.animation;
    const maxChars = this.config.maxCharsPerLine || 15;
    const body = events
      .map((event) => {
        // 텍스트 자동 줄바꿈 처리
        const wrappedText = this.wrapText(event.text, maxChars);
        // 애니메이션 효과: Pop-in + Scale up/down
        const animatedText = `{\\fscx${anim.scaleUpStart}\\fscy${anim.scaleUpStart}\\t(0,${anim.popInDuration},\\fscx${anim.scaleUpEnd}\\fscy${anim.scaleUpEnd})\\t(${anim.scaleDownStart},${anim.scaleDownEnd},\\fscx${anim.finalScale}\\fscy${anim.finalScale})}${wrappedText}`;
        const start = this.formatTime(event.start);
        const end = this.formatTime(event.end);
        return `Dialogue: 0,${start},${end},Default,,0,0,0,,${animatedText}`;
      })
      .join('\n');

    const content = header + body;

    // 디렉토리가 없으면 생성
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    return outputPath;
  }

  // 초 단위를 ASS 시간 포맷으로 변환 (e.g. 1.5 -> "0:00:01.50")
  formatTime(seconds: number): string {
    const date = new Date(0);
    date.setSeconds(seconds);
    const ms = Math.floor((seconds % 1) * 100);
    const timeStr = date.toISOString().substr(11, 8);
    return `${timeStr}.${ms.toString().padStart(2, '0')}`;
  }
}
