import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

async function downloadBgm() {
  const outputDir = 'assets/music';
  const outputPath = path.join(outputDir, 'bgm.mp3');

  // 확실하게 오픈된 샘플 MP3 URL
  const bgmUrl =
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`⏳ Downloading background music...`);

  try {
    const response = await axios.get(bgmUrl, {
      responseType: 'arraybuffer',
    });

    fs.writeFileSync(outputPath, response.data);
    console.log(`✅ BGM downloaded successfully: ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to download BGM:', error);
  }
}

downloadBgm();
