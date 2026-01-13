import { GeminiStoryGenerator } from './generators/GeminiStoryGenerator';
import {
  SubtitleGenerator,
  SubtitleEvent,
} from './generators/SubtitleGenerator';
import * as path from 'path';
import * as fs from 'fs';

async function testStoryGeneration() {
  const storyGenerator = new GeminiStoryGenerator();
  const subtitleGenerator = new SubtitleGenerator();

  console.log('🚀 Generating Story...');
  const script =
    await storyGenerator.generateStory('인류 역사상 가장 황당한 전쟁');
  console.log('📜 Generated Script:', JSON.stringify(script, null, 2));

  // 더미 타이밍 생성 (실제로는 오디오 길이 추출 필요)
  let currentTime = 0;
  const events: SubtitleEvent[] = script.sentences.map((s) => {
    const duration = 3.5; // 문장당 3.5초 가정
    const event = {
      start: subtitleGenerator.formatTime(currentTime),
      end: subtitleGenerator.formatTime(currentTime + duration),
      text: s.text,
    };
    currentTime += duration;
    return event;
  });

  const assPath = path.join('output', 'test_story.ass');
  if (!fs.existsSync('output')) fs.mkdirSync('output');

  subtitleGenerator.generateASS(events, assPath);
  console.log(`✅ ASS Subtitle generated: ${assPath}`);
}

testStoryGeneration().catch(console.error);
