import { PexelsImageProvider } from '../src/providers/PexelsImageProvider';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.error('❌ PEXELS_API_KEY missing');
    return;
  }

  const provider = new PexelsImageProvider(apiKey);

  try {
    console.log('🚀 Testing Image Provider...');
    const filePath = await provider.downloadImage('ramen');
    console.log('🎉 Test Success! File saved at:', filePath);
  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

main();
