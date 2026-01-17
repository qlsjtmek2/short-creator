import * as fs from 'fs';
import * as path from 'path';
import {
  IStoryGenerator,
  IImageProvider,
  ITTSProvider,
  ISubtitleGenerator,
  IStoryVideoRenderer,
  EditorSegment,
} from '../types/interfaces';
import { StorySentence, StoryScriptWithAssets } from '../types/common';
import { AssetManager } from './services/AssetManager';
import { SubtitleService } from './services/SubtitleService';
import { LayoutEngine } from './core/LayoutEngine';

/**
 * 스토리 파이프라인 전용 오케스트레이터
 * 서비스를 조립하여 최종 영상 렌더링 과정을 관리합니다.
 */
export class StoryOrchestrator {
  private assetManager: AssetManager;
  private subtitleService: SubtitleService;
  private layoutEngine: LayoutEngine;

  constructor(
    private storyGenerator: IStoryGenerator,
    imageProvider: IImageProvider,
    ttsProvider: ITTSProvider,
    private subtitleGenerator: ISubtitleGenerator,
    private videoRenderer: IStoryVideoRenderer,
    outputDir: string,
  ) {
    this.assetManager = new AssetManager(imageProvider, ttsProvider, outputDir);
    this.subtitleService = new SubtitleService();
    this.layoutEngine = new LayoutEngine();
  }

  /**
   * 주제를 받아 스토리텔링 쇼츠를 생성합니다. (CLI/Auto 모드)
   */
  async generateStoryShorts(topic: string, outputDir: string): Promise<string> {
    console.log(`\n📖 Generating story shorts for topic: "${topic}"`);

    const script = await this.storyGenerator.generateStory(topic);
    const sentencesWithAssets = await this.prepareAllAssets(script.sentences);

    return this.render(script.title, sentencesWithAssets, outputDir);
  }

  /**
   * (Interactive Mode) 확정된 대본과 에셋 정보를 기반으로 영상을 생성합니다.
   */
  async generateStoryFromAssets(
    title: string,
    segments: { text: string; imageKeyword: string }[],
    imageUrls: string[],
    outputDir: string,
    options?: {
      editorSegments?: EditorSegment[];
      bgmFile?: string;
      titleFont?: string;
      subtitleFont?: string;
    },
  ): Promise<string> {
    console.log(`\n🎬 Generating interactive story shorts: "${title}"`);

    const sentencesWithAssets = await this.prepareAllAssets(
      segments.map((s) => ({ text: s.text, keyword: s.imageKeyword })),
      imageUrls,
    );

    return this.render(title, sentencesWithAssets, outputDir, options);
  }

  /**
   * 공통 렌더링 로직: Manifest 생성 -> FFmpeg 렌더링
   */
  private async render(
    title: string,
    sentences: StorySentence[],
    outputDir: string,
    options?: { editorSegments?: EditorSegment[]; bgmFile?: string },
  ): Promise<string> {
    // 1. 타임라인 계산
    let currentTime = 0;
    const sentencesWithTimestamps = sentences.map((s, idx) => {
      const delay = options?.editorSegments?.[idx]?.delay || 0;
      const startTime = currentTime;
      const endTime = currentTime + (s.duration || 3) + delay;
      currentTime = endTime;
      return { ...s, startTime, endTime };
    });

    const scriptWithAssets: StoryScriptWithAssets = {
      title,
      sentences: sentencesWithTimestamps,
      totalDuration: currentTime,
    };

    // 2. Manifest 생성 (LayoutEngine 활용)
    console.log('📦 Generating RenderManifest...');
    const manifest = this.layoutEngine.generateManifest(
      scriptWithAssets,
      options?.editorSegments || [],
    );

    // 3. 자막 정밀 분할 적용 (SubtitleService 활용)
    // LayoutEngine의 기본 분할 대신 SubtitleService의 정교한 분할 결과를 Manifest에 반영
    const subtitleChunks = this.subtitleService.createSubtitleChunks(sentencesWithTimestamps);
    manifest.elements = [
      ...manifest.elements.filter((e) => e.type !== 'subtitle_chunk'),
      ...subtitleChunks,
    ];

    // 4. 최종 영상 렌더링
    const outputPath = path.join(outputDir, 'videos', `story_${Date.now()}.mp4`);
    console.log('🚀 Starting final render...');
    
    return this.videoRenderer.renderFromManifest(manifest, outputPath);
  }

  /**
   * (Phase 21) Manifest 기반 직접 렌더링
   */
  async renderWithManifest(
    manifest: any,
    outputDir: string,
    options?: { titleFont?: string },
  ): Promise<string> {
    console.log('🎬 Rendering video directly from Manifest...');
    const outputPath = path.join(outputDir, 'videos', `manifest_${Date.now()}.mp4`);
    return this.videoRenderer.renderFromManifest(manifest, outputPath, options?.titleFont);
  }

  /**
   * 모든 문장에 대해 이미지와 TTS를 준비합니다.
   */
  private async prepareAllAssets(
    sentences: { text: string; keyword: string }[],
    imageUrls?: string[],
  ): Promise<StorySentence[]> {
    console.log('🚚 Preparing images and TTS...');
    return Promise.all(
      sentences.map(async (s, i) => {
        const id = `${Date.now()}_${i}`;
        const imagePath = await this.assetManager.prepareImage(s.keyword, imageUrls?.[i], id);
        const { path: audioPath, duration } = await this.assetManager.prepareAudio(s.text, id);

        return {
          ...s,
          imagePath,
          audioPath,
          duration,
        } as StorySentence;
      }),
    );
  }
}
