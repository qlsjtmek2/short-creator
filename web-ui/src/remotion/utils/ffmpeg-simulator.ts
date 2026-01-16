import { RENDER_CONFIG } from '../../config/render-config';

/**
 * FFmpeg 렌더러의 텍스트 로직을 시뮬레이션하기 위한 유틸리티
 */

export interface TitleSegment {
  text: string;
  isHighlight: boolean;
}

// Re-export for compatibility
export const FFMPEG_CONFIG = RENDER_CONFIG;

const isStopWord = (word: string): boolean => {
  const stopWords = [
    '것',
    '수',
    '때',
    '곳',
    '등',
    '및',
    '또는',
    '또한',
    '하지만',
    '그리고',
    '그러나',
    '에서',
    '에게',
    '으로',
    '를',
    '을',
    '가',
    '이',
    '의',
    '도',
    '만',
    '에',
    '와',
    '과',
  ];
  return stopWords.includes(word);
};

export const autoHighlightKeywords = (title: string): string => {
  const cleanTitle = title.replace(/\*/g, '');
  const patterns = [/\d+[가-힣]+/g, /[A-Za-z]+/g, /[가-힣]{2,6}/g];
  const keywords = new Set<string>();

  for (const pattern of patterns) {
    const matches = cleanTitle.match(pattern);
    if (matches) {
      matches.forEach((m) => {
        if (m.length >= 2 && !isStopWord(m)) keywords.add(m);
      });
    }
  }

  const selectedKeywords = Array.from(keywords).slice(0, 3);
  let markedTitle = cleanTitle;

  for (const keyword of selectedKeywords) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\*)${escapedKeyword}(?!\\*)`, 'g');
    markedTitle = markedTitle.replace(regex, `*${keyword}*`);
  }

  return markedTitle;
};

export const splitIntoLines = (
  text: string,
  maxCharsPerLine: number,
): string[] => {
  const plainText = text.replace(/\*/g, '');
  if (plainText.length <= maxCharsPerLine) return [text];

  const midPoint = Math.floor(plainText.length / 2);
  let splitIndex = plainText.indexOf(' ', midPoint);
  if (splitIndex === -1 || splitIndex > plainText.length * 0.7)
    splitIndex = plainText.lastIndexOf(' ', midPoint);
  if (splitIndex === -1) splitIndex = midPoint;

  let actualIndex = 0;
  let plainIndex = 0;

  while (plainIndex < splitIndex && actualIndex < text.length) {
    if (text[actualIndex] === '*') {
      actualIndex++;
      continue;
    }
    plainIndex++;
    actualIndex++;
  }

  while (actualIndex < text.length && text[actualIndex] === '*') actualIndex++;
  while (actualIndex < text.length && text[actualIndex] === ' ') actualIndex++;

  return [
    text.substring(0, actualIndex).trimEnd(),
    text.substring(actualIndex).trimStart(),
  ];
};

export const parseTitle = (title: string): TitleSegment[] => {
  const segments: TitleSegment[] = [];
  const regex = /\*([^\*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(title)) !== null) {
    if (match.index > lastIndex) {
      const normalText = title.substring(lastIndex, match.index);
      if (normalText.length > 0)
        segments.push({ text: normalText, isHighlight: false });
    }
    segments.push({ text: match[1], isHighlight: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < title.length) {
    const normalText = title.substring(lastIndex);
    if (normalText.length > 0)
      segments.push({ text: normalText, isHighlight: false });
  }

  return segments.length > 0 ? segments : [{ text: title, isHighlight: false }];
};

export interface SubtitleChunk {
  text: string;
  startRatio: number; // 0.0 ~ 1.0 (세그먼트 내 시작 비율)
  endRatio: number; // 0.0 ~ 1.0 (세그먼트 내 종료 비율)
}

/**
 * 문장을 더 작은 단위(청크)로 나누어 자막 이벤트를 생성합니다.
 * 백엔드 StoryOrchestrator.splitSentenceIntoEvents 로직과 동일하게 구현
 */
export const splitSentenceIntoChunks = (text: string): SubtitleChunk[] => {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  // 문장 길이에 따라 청크 사이즈 동적 조절
  const wordsPerChunk = words.length > 10 ? 2 : 3;

  for (const word of words) {
    currentChunk.push(word);

    if (
      currentChunk.length >= wordsPerChunk ||
      word.endsWith('.') ||
      word.endsWith('?') ||
      word.endsWith('!') ||
      word.endsWith(',')
    ) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  // 시간 배분 (글자 수 비율에 따라)
  const totalChars = text.replace(/\s/g, '').length;
  let currentStartRatio = 0;

  return chunks.map((chunkText) => {
    const chunkChars = chunkText.replace(/\s/g, '').length;
    // 비율 계산 (전체 길이 대비 청크 길이)
    const ratioDuration = chunkChars / totalChars;

    const chunk: SubtitleChunk = {
      text: chunkText,
      startRatio: currentStartRatio,
      endRatio: currentStartRatio + ratioDuration,
    };

    currentStartRatio += ratioDuration;
    return chunk;
  });
};
