import { StorySentence, SubtitleEvent } from '../../types/common';
import { SubtitleChunk } from '../../types/rendering';

/**
 * 자막의 타이밍 계산 및 분할을 전담합니다.
 */
export class SubtitleService {
  /**
   * 문장 리스트를 Manifest용 자막 청크 리스트로 변환합니다.
   */
  createSubtitleChunks(
    sentences: StorySentence[],
    fps: number = 60,
  ): SubtitleChunk[] {
    const chunks: SubtitleChunk[] = [];

    sentences.forEach((sentence, sIdx) => {
      const events = this.splitSentenceIntoEvents(sentence);
      events.forEach((event, eIdx) => {
        chunks.push({
          type: 'subtitle_chunk',
          id: `sub_${sIdx}_${eIdx}`,
          text: event.text,
          startFrame: Math.floor(event.start * fps),
          endFrame: Math.floor(event.end * fps),
        });
      });
    });

    return chunks;
  }

  /**
   * 문장을 더 작은 단위(청크)로 나누어 자막 이벤트를 생성합니다.
   */
  private splitSentenceIntoEvents(sentence: StorySentence): SubtitleEvent[] {
    const text = sentence.text.trim();
    const duration = (sentence.endTime || 0) - (sentence.startTime || 0);
    const words = text.split(/\s+/);

    if (words.length === 0) return [];

    const resultChunks: string[] = [];
    let currentChunk: string[] = [];
    const wordsPerChunk = words.length > 10 ? 2 : 3;

    for (const word of words) {
      currentChunk.push(word);
      if (currentChunk.length >= wordsPerChunk || /[.?!,]$/.test(word)) {
        resultChunks.push(currentChunk.join(' '));
        currentChunk = [];
      }
    }

    if (currentChunk.length > 0) {
      resultChunks.push(currentChunk.join(' '));
    }

    const totalChars = text.replace(/\s/g, '').length;
    let currentStartTime = sentence.startTime || 0;

    return resultChunks.map((chunkText) => {
      const chunkChars = chunkText.replace(/\s/g, '').length;
      const chunkDuration =
        totalChars > 0 ? (chunkChars / totalChars) * duration : duration;

      const event: SubtitleEvent = {
        start: currentStartTime,
        end: currentStartTime + chunkDuration,
        text: chunkText,
      };

      currentStartTime += chunkDuration;
      return event;
    });
  }
}
