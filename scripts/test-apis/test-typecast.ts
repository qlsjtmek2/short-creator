import axios, { AxiosError } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function testTypecast() {
  const apiKey = process.env.TYPECAST_API_KEY;
  if (!apiKey) {
    console.error('❌ TYPECAST_API_KEY is missing in .env');
    return;
  }

  try {
    console.log('⏳ Testing Typecast API (Actor List)...');
    // Typecast API는 보통 오디오 생성 요청을 보내야 하지만,
    // 연결 확인을 위해 성우 목록이나 계정 정보를 조회하는 엔드포인트를 시도합니다.
    const response = await axios.get('https://typecast.ai/api/actor', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ Typecast Connection Successful!');
    console.log(
      '🎙️ Available Actors Count:',
      response.data.actors?.length || 0,
    );
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError;
      // 401이면 키 문제, 404면 엔드포인트 문제
      console.error(
        '❌ Typecast API Error:',
        err.response?.status,
        err.response?.data || err.message,
      );
    } else {
      console.error('❌ Unknown Error:', error);
    }
  }
}

testTypecast();
