import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ITTSProvider } from '../../types/interfaces';

export class TypecastTTSProvider implements ITTSProvider {
  private apiKey: string;
  private outputDir: string;

  // 캐릭터 ID 매핑 (예시 ID이므로 실제 ID로 교체 필요)
  private actors: { [key: string]: string } = {
    박창수: '603f27f069577e0007801c36',
    개나리: '5f042e9714392f0007883b58',
    default: '603f27f069577e0007801c36', // 기본값 박창수
  };

  constructor(apiKey: string, outputDir: string = 'output/audio') {
    this.apiKey = apiKey;
    this.outputDir = outputDir;

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateAudio(text: string, character: string): Promise<string> {
    const fileName = `tts_typecast_${Date.now()}.mp3`;
    const filePath = path.join(this.outputDir, fileName);
    const actorId = this.actors[character] || this.actors['default'];

    console.log(
      `🎙️ Generating TTS (Typecast - ${character}): "${text.substring(0, 20)}..."`,
    );

    try {
      // 1. 음성 합성 요청 (Speak)
      const speakResponse = await axios.post(
        'https://typecast.ai/api/speak',
        {
          text: text,
          lang: 'auto',
          actor_id: actorId,
          xapi_hd: true,
          model_version: 'latest',
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const downloadUrl = speakResponse.data.result?.audio_url;
      if (!downloadUrl) {
        // Polling이 필요한 경우 여기서 대기 로직이 필요할 수 있음
        // Typecast API 버전에 따라 바로 URL을 줄 수도 있고, polling 해야 할 수도 있음
        // 여기서는 바로 URL을 준다고 가정 (또는 speakResponse.data.result.download_url 등)
        throw new Error(
          'Audio URL not returned immediately. Polling implementation might be required.',
        );
      }

      // 2. 오디오 다운로드
      const audioResponse = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
      });

      fs.writeFileSync(filePath, audioResponse.data);
      console.log(`✅ Audio saved to: ${filePath}`);
      return filePath;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const err = error as AxiosError;
        console.error(
          '❌ Failed to generate audio via Typecast:',
          err.response?.data || err.message,
        );
      } else {
        console.error('❌ Unknown Error:', error);
      }
      throw error;
    }
  }
}
