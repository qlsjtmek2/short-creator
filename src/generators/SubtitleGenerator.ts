import * as fs from 'fs';
import * as path from 'path';
import { SubtitleEvent } from '../../types/common';
import { ISubtitleGenerator } from '../../types/interfaces';

export class SubtitleGenerator implements ISubtitleGenerator {
  private fontName = 'Pretendard ExtraBold';
  private fontSize = 60;

  constructor(fontName?: string, fontSize?: number) {
    if (fontName) this.fontName = fontName;
    if (fontSize) this.fontSize = fontSize;
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
Style: Default,${this.fontName},${this.fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,3,5,100,100,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const body = events
      .map((event) => {
        // 애니메이션 효과 추가: {\fscx0\fscy0\t(0,200,\fscx120\fscy120)\t(200,400,\fscx100\fscy100)} -> 뿅 하고 튀어나오는 효과
        const animatedText = `{\\fscx0\\fscy0\\t(0,200,\\fscx120\\fscy120)\\t(200,400,\\fscx100\\fscy100)}${event.text}`;
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
