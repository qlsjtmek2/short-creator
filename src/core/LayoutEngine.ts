import { createCanvas, registerFont } from 'canvas';
import * as path from 'path';
import * as fs from 'fs';
import { RENDER_CONFIG } from '../config/render-config';
import { StoryScriptWithAssets, StorySentenceWithAssets } from '../../types/common';
import { EditorSegment } from '../../types/interfaces';
import { 
  RenderManifest, 
  ImageElement, 
  TitleElement, 
  SubtitleChunk, 
  AudioElement,
  TitleLine,
  TitleSegment
} from '../../types/rendering';

export class LayoutEngine {
  private config = { ...RENDER_CONFIG };
  private fps = 60; // Default FPS

  constructor() {
    this.registerFonts();
  }

  private registerFonts() {
    const fontDir = path.resolve(process.cwd(), 'assets/fonts');
    const fonts = [
      'Pretendard-Black.ttf',
      'Pretendard-Bold.ttf',
      'Pretendard-ExtraBold.ttf',
      'Pretendard-SemiBold.ttf',
      'Pretendard-Regular.ttf'
    ];

    fonts.forEach(fontFile => {
      const fontPath = path.join(fontDir, fontFile);
      if (fs.existsSync(fontPath)) {
        const family = path.basename(fontFile, '.ttf');
        registerFont(fontPath, { family });
      }
    });
  }

  /**
   * 스토리 스크립트와 에디터 설정을 기반으로 RenderManifest를 생성합니다.
   */
  public generateManifest(
    script: StoryScriptWithAssets,
    editorSegments: EditorSegment[]
  ): RenderManifest {
    const elements: (ImageElement | TitleElement | SubtitleChunk | AudioElement)[] = [];
    let currentFrame = 0;

    // 1. 이미지 및 오디오 세그먼트 계산
    script.sentences.forEach((sentence, idx) => {
      const editorSeg = editorSegments[idx];
      const delay = editorSeg?.delay || 0;
      const duration = (sentence.duration || 3) + delay;
      const durationInFrames = Math.floor(duration * this.fps);
      
      const startFrame = currentFrame;
      const endFrame = currentFrame + durationInFrames;

      // 이미지 엘리먼트
      elements.push({
        type: 'image',
        id: `img_${idx}`,
        src: sentence.imagePath || '',
        startFrame,
        endFrame,
        vfx: editorSeg?.vfx || 'zoom-in',
        kenBurns: this.calculateKenBurns(editorSeg?.vfx || 'zoom-in')
      } as ImageElement);

      // TTS 오디오 엘리먼트
      elements.push({
        type: 'audio',
        id: `tts_${idx}`,
        src: sentence.audioPath || '',
        startFrame,
        endFrame: startFrame + Math.floor((sentence.duration || 0) * this.fps),
        volume: this.config.audio.ttsVolume
      } as AudioElement);

      // 자막 청크 (문장을 단어 단위로 쪼갬)
      const chunks = this.splitSubtitleIntoChunks(sentence.text, startFrame, endFrame);
      elements.push(...chunks);

      currentFrame = endFrame;
    });

    // 2. 타이틀 엘리먼트
    const titleElement = this.calculateTitleLayout(script.title);
    elements.push(titleElement);

    // 3. BGM (전체 길이에 맞춤)
    elements.push({
      type: 'audio',
      id: 'bgm',
      src: 'assets/music/bgm2.mp3', // Config에서 가져오도록 수정 가능
      startFrame: 0,
      endFrame: currentFrame,
      volume: this.config.audio.bgmVolume
    } as AudioElement);

    // 4. SFX (에디터 설정 기반)
    editorSegments.forEach((seg, idx) => {
      if (seg.sfx) {
        const sentence = script.sentences[idx];
        const sfxStartFrame = Math.floor((sentence.startTime || 0) * this.fps);
        elements.push({
          type: 'audio',
          id: `sfx_${idx}`,
          src: `assets/sfx/${seg.sfx}.mp3`,
          startFrame: sfxStartFrame,
          endFrame: sfxStartFrame + 60, // 대략 1초 (실제 길이는 렌더러에서 처리)
          volume: this.config.audio.sfxVolume
        } as AudioElement);
      }
    });

    return {
      version: '1.0.0',
      canvas: this.config.canvas,
      elements,
      metadata: {
        totalFrames: currentFrame,
        fps: this.fps,
        title: script.title
      }
    };
  }

  private calculateKenBurns(vfx: string) {
    const kb = this.config.kenBurns;
    switch (vfx) {
      case 'zoom-in':
        return { fromScale: kb.startZoom, toScale: kb.endZoom, fromX: 0, toX: 0, fromY: 0, toY: 0 };
      case 'zoom-out':
        return { fromScale: kb.endZoom, toScale: kb.startZoom, fromX: 0, toX: 0, fromY: 0, toY: 0 };
      case 'pan-left':
        return { fromScale: kb.endZoom, toScale: kb.endZoom, fromX: 50, toX: -50, fromY: 0, toY: 0 };
      case 'pan-right':
        return { fromScale: kb.endZoom, toScale: kb.endZoom, fromX: -50, toX: 50, fromY: 0, toY: 0 };
      default:
        return { fromScale: 1.0, toScale: 1.0, fromX: 0, toX: 0, fromY: 0, toY: 0 };
    }
  }

  private splitSubtitleIntoChunks(text: string, startFrame: number, endFrame: number): SubtitleChunk[] {
    const words = text.split(' ').filter(w => w.length > 0);
    const totalFrames = endFrame - startFrame;
    const framesPerWord = Math.floor(totalFrames / words.length);
    
    return words.map((word, i) => ({
      type: 'subtitle_chunk',
      id: `sub_${startFrame}_${i}`,
      text: word,
      startFrame: startFrame + i * framesPerWord,
      endFrame: i === words.length - 1 ? endFrame : startFrame + (i + 1) * framesPerWord
    }));
  }

  private calculateTitleLayout(title: string): TitleElement {
    const titleConfig = this.config.title;
    const markedTitle = this.autoHighlightKeywords(title);
    const lines = this.splitIntoLines(markedTitle, titleConfig.maxCharsPerLine);
    
    const baseY = lines.length > 1 
      ? titleConfig.y - titleConfig.lineSpacing / 2 
      : titleConfig.y;

    const canvas = createCanvas(100, 100);
    const ctx = canvas.getContext('2d');
    ctx.font = `${titleConfig.fontSize}px "${titleConfig.fontFamily}"`;

    const titleLines: TitleLine[] = lines.map((line, lineIndex) => {
      const segments = this.parseTitle(line);
      const lineWidths = segments.map(s => ctx.measureText(s.text).width);
      const totalWidth = lineWidths.reduce((a, b) => a + b, 0);
      
      let currentX = (this.config.canvas.width - totalWidth) / 2;
      
      const titleSegments: TitleSegment[] = segments.map((seg, i) => {
        const segWidth = lineWidths[i];
        const x = currentX;
        currentX += segWidth;
        return {
          text: seg.text,
          isHighlight: seg.isHighlight,
          x,
          width: segWidth
        };
      });

      return {
        segments: titleSegments,
        y: baseY + lineIndex * titleConfig.lineSpacing,
        totalWidth
      };
    });

    return {
      type: 'title_text',
      id: 'title',
      lines: titleLines
    };
  }

  // --- Helper methods from FFmpegStoryRenderer (SSOT를 위해 이곳으로 통합) ---

  private autoHighlightKeywords(title: string): string {
    const cleanTitle = title.replace(/\*/g, '');
    const patterns = [ /\d+[가-힣]+/g, /[A-Za-z]+/g, /[가-힣]{2,6}/g ];
    const keywords = new Set<string>();
    
    for (const pattern of patterns) {
      const matches = cleanTitle.match(pattern);
      if (matches) {
        matches.forEach((m) => {
          if (m.length >= 2 && !this.isStopWord(m)) keywords.add(m);
        });
      }
    }
    
    const selectedKeywords = Array.from(keywords).slice(0, 3);
    let markedTitle = cleanTitle;
    for (const keyword of selectedKeywords) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]/g, '\\$&');
      const regex = new RegExp(`(?<!\\*)${escapedKeyword}(?!\\*)`, 'g');
      markedTitle = markedTitle.replace(regex, `*${keyword}*`);
    }
    return markedTitle;
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['것', '수', '때', '곳', '등', '및', '또는', '또한', '하지만', '그리고', '그러나', '에서', '에게', '으로', '를', '을', '가', '이', '의', '도', '만', '에', '와', '과'];
    return stopWords.includes(word);
  }

  private parseTitle(title: string): { text: string; isHighlight: boolean }[] {
    const segments: { text: string; isHighlight: boolean }[] = [];
    const regex = /\*([^\*]+)\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(title)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: title.substring(lastIndex, match.index), isHighlight: false });
      }
      segments.push({ text: match[1], isHighlight: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < title.length) {
      segments.push({ text: title.substring(lastIndex), isHighlight: false });
    }
    return segments.length > 0 ? segments : [{ text: title, isHighlight: false }];
  }

  private splitIntoLines(text: string, maxCharsPerLine: number): string[] {
    const plainText = text.replace(/\*/g, '');
    if (plainText.length <= maxCharsPerLine) return [text];
    
    const midPoint = Math.floor(plainText.length / 2);
    let splitIndex = plainText.indexOf(' ', midPoint);
    if (splitIndex === -1 || splitIndex > plainText.length * 0.7) {
      splitIndex = plainText.lastIndexOf(' ', midPoint);
    }
    if (splitIndex === -1) splitIndex = midPoint;

    let actualIndex = 0;
    let plainIndex = 0;
    while (plainIndex < splitIndex && actualIndex < text.length) {
      if (text[actualIndex] === '*') { actualIndex++; continue; }
      plainIndex++; actualIndex++;
    }
    while (actualIndex < text.length && text[actualIndex] === '*') actualIndex++;
    while (actualIndex < text.length && text[actualIndex] === ' ') actualIndex++;

    return [text.substring(0, actualIndex).trimEnd(), text.substring(actualIndex).trimStart()];
  }
}
