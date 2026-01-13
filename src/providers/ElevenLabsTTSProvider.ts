import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ITTSProvider } from '../../types/interfaces';

export class ElevenLabsTTSProvider implements ITTSProvider {
  private apiKey: string;
  private outputDir: string;
  // 기본 보이스 ID (Rachel - American, 예시용. 실제 한국어 보이스 ID 필요)
  // 한국어에 적합한 보이스를 찾아서 환경변수로 설정하는 것을 권장
  private defaultVoiceId = '21m00Tcm4TlvDq8ikWAM';

  constructor(apiKey: string, outputDir: string = 'output/audio') {
    this.apiKey = apiKey;
    this.outputDir = outputDir;

    if (process.env.ELEVENLABS_VOICE_ID) {
      this.defaultVoiceId = process.env.ELEVENLABS_VOICE_ID;
    }

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateAudio(text: string, character: string): Promise<string> {
    const fileName = `tts_${Date.now()}.mp3`;
    const filePath = path.join(this.outputDir, fileName);

    console.log(
      `🎙️ Generating TTS (ElevenLabs - ${character}): "${text.substring(0, 20)}..."`,
    );

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.defaultVoiceId}`,
        {
          text: text,
          model_id: 'eleven_multilingual_v2', // 한국어 지원 모델
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'arraybuffer', // 바이너리 데이터 수신 중요
        },
      );

      fs.writeFileSync(filePath, response.data);
      console.log(`✅ Audio saved to: ${filePath}`);
      return filePath;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const err = error as AxiosError;
        console.error(
          '❌ Failed to generate audio via ElevenLabs:',
          err.response?.data || err.message,
        );
      } else {
        console.error('❌ Unknown Error:', error);
      }
      throw error;
    }
  }
}
