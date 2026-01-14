import { PromptsConfig } from '../types/prompts';
import * as fs from 'fs';
import * as path from 'path';

/**
 * JSON 프롬프트 파일 로더
 *
 * prompts.json 파일을 읽어서 AI 프롬프트 설정을 제공합니다.
 */
let cachedPrompts: PromptsConfig | null = null;

function loadPrompts(): PromptsConfig {
  if (cachedPrompts) {
    return cachedPrompts;
  }

  // 프로젝트 루트에서 prompts.json 읽기
  const projectRoot = path.join(__dirname, '..');
  const promptsPath = path.join(projectRoot, 'prompts.json');

  if (!fs.existsSync(promptsPath)) {
    throw new Error(
      `프롬프트 파일을 찾을 수 없습니다: ${promptsPath}\n` +
        'prompts.example.json 파일을 복사하여 prompts.json으로 이름을 변경하세요.',
    );
  }

  try {
    const promptsData = fs.readFileSync(promptsPath, 'utf-8');
    const prompts = JSON.parse(promptsData) as PromptsConfig;

    cachedPrompts = prompts;
    return prompts;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `프롬프트 파일을 읽는 중 오류가 발생했습니다: ${error.message}\n` +
          '프롬프트 파일의 JSON 형식을 확인하세요.',
      );
    }
    throw error;
  }
}

export const promptsConfig: PromptsConfig = loadPrompts();

/**
 * 프롬프트 설정 Getter 함수들
 */
export const getWYRPrompts = () => promptsConfig.wouldYouRather;
export const getStoryPrompts = () => promptsConfig.storytelling;
export const getGeminiConfig = () => promptsConfig.geminiConfig;
