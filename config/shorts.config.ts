import { ShortsConfig } from '../types/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * JSON 설정 파일 로더
 *
 * config/shorts.config.json 파일을 읽어서 설정값을 제공합니다.
 * 상대 경로는 프로젝트 루트 기준으로 절대 경로로 변환됩니다.
 */
let cachedConfig: ShortsConfig | null = null;

function loadConfig(): ShortsConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // 프로젝트 루트에서 설정 파일 읽기
  const projectRoot = path.join(__dirname, '..');
  const configPath = path.join(projectRoot, 'shorts.config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `설정 파일을 찾을 수 없습니다: ${configPath}\n` +
        'shorts.config.example.json 파일을 복사하여 shorts.config.json으로 이름을 변경하세요.',
    );
  }

  try {
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData) as ShortsConfig;

    // 상대 경로를 절대 경로로 변환
    const projectRoot = path.join(__dirname, '..');

    // Would You Rather BGM 경로
    if (config.wouldYouRather.audio.bgmPath) {
      config.wouldYouRather.audio.bgmPath = path.resolve(
        projectRoot,
        config.wouldYouRather.audio.bgmPath,
      );
    }

    // Storytelling BGM 경로
    if (config.storytelling.audio.bgmPath) {
      config.storytelling.audio.bgmPath = path.resolve(
        projectRoot,
        config.storytelling.audio.bgmPath,
      );
    }

    cachedConfig = config;
    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `설정 파일을 읽는 중 오류가 발생했습니다: ${error.message}\n` +
          '설정 파일의 JSON 형식을 확인하세요.',
      );
    }
    throw error;
  }
}

export const shortsConfig: ShortsConfig = loadConfig();

/**
 * 설정값 Getter 함수들
 */
export const getWYRConfig = () => shortsConfig.wouldYouRather;
export const getStoryConfig = () => shortsConfig.storytelling;
