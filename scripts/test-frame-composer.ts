import { PexelsImageProvider } from '../src/providers/PexelsImageProvider';
import { CanvasFrameComposer } from '../src/composers/CanvasFrameComposer';
import { WouldYouRatherQuestion } from '../types/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.error('❌ PEXELS_API_KEY missing');
    return;
  }

  const imageProvider = new PexelsImageProvider(apiKey);
  const frameComposer = new CanvasFrameComposer();

  try {
    console.log('⏳ Downloading test images...');
    // 병렬로 이미지 2장 다운로드
    const [imgAPath, imgBPath] = await Promise.all([
      imageProvider.downloadImage('fire'), // 빨강 느낌
      imageProvider.downloadImage('ocean'), // 파랑 느낌
    ]);

    const sampleQuestion: WouldYouRatherQuestion = {
      id: 'test-frame-001',
      optionA: '평생 불맛 나는 음식만 먹기 (매운맛 포함)',
      optionB: '평생 차가운 바다 음식만 먹기 (해산물, 회)',
    };

    console.log('⏳ Composing frame...');
    const framePath = await frameComposer.composeFrame(
      sampleQuestion,
      imgAPath,
      imgBPath,
    );

    console.log('🎉 Frame created successfully at:', framePath);
  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

main();
