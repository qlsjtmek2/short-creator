/**
 * 밈 Provider 테스트 스크립트
 *
 * 사용법:
 * npm run test:meme
 */

import * as dotenv from 'dotenv';
import { RedditMemeProvider } from '../src/providers/RedditMemeProvider';
import { ImgflipMemeProvider } from '../src/providers/ImgflipMemeProvider';

dotenv.config();

async function testRedditMeme() {
  console.log('\n=== Reddit Meme Provider Test ===\n');

  const provider = new RedditMemeProvider();

  try {
    // 1. 랜덤 밈 다운로드
    console.log('📥 Test 1: Download random meme from Reddit\n');
    const result = await provider.downloadRandomMeme();
    console.log('\n✅ Success!');
    console.log(`  Path: ${result.path}`);
    console.log(`  Title: ${result.title}`);
    console.log(`  Source: ${result.source}`);

    // 2. 특정 서브레딧에서 다운로드
    console.log('\n📥 Test 2: Download from r/wholesomememes\n');
    const result2 = await provider.downloadRandomMeme('wholesomememes');
    console.log('\n✅ Success!');
    console.log(`  Path: ${result2.path}`);
    console.log(`  Title: ${result2.title}`);
    console.log(`  Source: ${result2.source}`);
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

async function testImgflipMeme() {
  console.log('\n=== Imgflip Meme Provider Test ===\n');

  const username = process.env.IMGFLIP_USERNAME;
  const password = process.env.IMGFLIP_PASSWORD;

  if (!username || !password) {
    console.log(
      '⚠️  Imgflip credentials not found in .env file. Skipping Imgflip tests.',
    );
    console.log(
      'To test Imgflip:\n1. Sign up at https://imgflip.com/signup\n2. Add IMGFLIP_USERNAME and IMGFLIP_PASSWORD to .env',
    );
    return;
  }

  const provider = new ImgflipMemeProvider(username, password);

  try {
    // 1. 밈 템플릿 목록 가져오기
    console.log('📋 Test 1: Fetch meme templates\n');
    const templates = await provider.getMemeTemplates();
    console.log(`\n✅ Found ${templates.length} templates`);
    console.log('\nTop 5 popular templates:');
    templates.slice(0, 5).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name} (ID: ${t.id})`);
    });

    // 2. 랜덤 밈 템플릿 다운로드
    console.log('\n📥 Test 2: Download random meme template\n');
    const result = await provider.downloadRandomMeme();
    console.log('\n✅ Success!');
    console.log(`  Path: ${result.path}`);
    console.log(`  Title: ${result.title}`);
    console.log(`  Source: ${result.source}`);

    // 3. 키워드 검색
    console.log('\n🔍 Test 3: Search memes with keyword "Drake"\n');
    const searchResults = await provider.searchMeme('Drake');
    console.log(`\n✅ Found ${searchResults.length} matching templates:`);
    searchResults.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name} (ID: ${t.id})`);
    });

    // 4. 밈 생성 (Drake Hotline Bling 템플릿 사용)
    const drakeTemplate = templates.find((t) => t.name.includes('Drake'));
    if (drakeTemplate) {
      console.log(`\n🎨 Test 4: Generate meme using "${drakeTemplate.name}"\n`);
      const generated = await provider.generateMeme(
        drakeTemplate.id,
        'Using paid APIs',
        'Using free meme APIs',
      );
      console.log('\n✅ Success!');
      console.log(`  Path: ${generated.path}`);
      console.log(`  URL: ${generated.url}`);
    } else {
      console.log('\n⚠️  Drake template not found, skipping generation test');
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

async function main() {
  console.log('🎭 Meme Provider Test Suite\n');
  console.log('This script tests Reddit and Imgflip meme providers.');

  // Reddit Meme Provider 테스트 (항상 실행)
  await testRedditMeme();

  // Imgflip Meme Provider 테스트 (자격증명이 있을 때만)
  await testImgflipMeme();

  console.log('\n✨ All tests completed!\n');
}

main();
