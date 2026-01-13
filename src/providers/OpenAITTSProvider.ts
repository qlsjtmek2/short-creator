import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ITTSProvider } from '../../types/interfaces';

export class OpenAITTSProvider implements ITTSProvider {
  private apiKey: string;
  private outputDir: string;
  private defaultVoice = 'nova'; // alloy, echo, fable, onyx, nova, shimmer

  constructor(apiKey: string, outputDir: string = 'output/audio') {
    this.apiKey = apiKey;
    this.outputDir = outputDir;

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateAudio(text: string, _character: string): Promise<string> {
    const fileName = `tts_openai_${Date.now()}.mp3`;
    const filePath = path.join(this.outputDir, fileName);

    console.log(
      `🎙️ Generating TTS (OpenAI - ${this.defaultVoice}): "${text.substring(0, 20)}..."`,
    );

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          input: text,
          voice: this.defaultVoice,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        },
      );

      fs.writeFileSync(filePath, response.data);
      console.log(`✅ Audio saved to: ${filePath}`);
      return filePath;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const err = error as AxiosError;
        console.error(
          '❌ Failed to generate audio via OpenAI:',
          err.response?.data
            ? JSON.parse(err.response.data.toString())
            : err.message,
        );
      } else {
        console.error('❌ Unknown Error:', error);
      }
      throw error;
    }
  }
}
