/**
 * 쇼츠 생성기 설정 타입 정의
 */

/**
 * Would You Rather 쇼츠 설정
 */
export interface WouldYouRatherConfig {
  /** 캔버스 설정 */
  canvas: {
    /** 영상 너비 (px) */
    width: number;
    /** 영상 높이 (px) */
    height: number;
  };

  /** 색상 설정 */
  colors: {
    /** 옵션 A (상단) 그라데이션 색상 */
    optionA: {
      start: string;
      end: string;
    };
    /** 옵션 B (하단) 그라데이션 색상 */
    optionB: {
      start: string;
      end: string;
    };
    /** 텍스트 색상 */
    text: string;
    /** VS 배지 배경색 */
    vsBadgeBackground: string;
    /** VS 배지 테두리 색상 */
    vsBadgeBorder: string;
    /** VS 배지 텍스트 색상 */
    vsBadgeText: string;
  };

  /** 폰트 설정 */
  font: {
    /** 폰트 파일 경로 */
    path: string;
    /** 폰트 패밀리명 */
    family: string;
    /** 폰트 크기 (px) */
    size: number;
    /** 줄 간격 (px) */
    lineHeight: number;
  };

  /** 텍스트 그림자 설정 */
  textShadow: {
    /** 그림자 색상 */
    color: string;
    /** 그림자 흐림 정도 */
    blur: number;
    /** 그림자 X축 오프셋 */
    offsetX: number;
    /** 그림자 Y축 오프셋 */
    offsetY: number;
  };

  /** VS 배지 설정 */
  vsBadge: {
    /** 배지 반지름 (px) */
    radius: number;
    /** 테두리 두께 (px) */
    borderWidth: number;
    /** 폰트 크기 (px) */
    fontSize: number;
  };

  /** 레이아웃 설정 */
  layout: {
    /** 이미지 영역 여백 (텍스트 공간 확보, px) */
    imagePadding: number;
    /** 텍스트 최대 너비 여백 (px) */
    textMaxWidthPadding: number;
    /** 옵션 A 텍스트 Y 위치 (비율, 0-1) */
    optionATextY: number;
    /** 옵션 B 텍스트 Y 위치 (비율, 0-1) */
    optionBTextY: number;
  };

  /** 오디오 설정 */
  audio: {
    /** BGM 파일 경로 */
    bgmPath: string;
    /** TTS 볼륨 (0-1) */
    ttsVolume: number;
    /** BGM 볼륨 (0-1) */
    bgmVolume: number;
  };
}

/**
 * 스토리텔링 쇼츠 설정
 */
export interface StorytellingConfig {
  /** 캔버스 설정 */
  canvas: {
    /** 영상 너비 (px) */
    width: number;
    /** 영상 높이 (px) */
    height: number;
  };

  /** 레터박스 설정 */
  letterbox: {
    /** 상단 레터박스 높이 (px) */
    top: number;
    /** 하단 레터박스 높이 (px) */
    bottom: number;
    /** 레터박스 색상 */
    color: string;
  };

  /** 타이틀 설정 */
  title: {
    /** 폰트 파일 경로 (FFmpeg drawtext용) */
    fontPath: string;
    /** 폰트 크기 (px) */
    fontSize: number;
    /** 폰트 색상 */
    fontColor: string;
    /** 강조 텍스트 색상 (마크업: *텍스트*) */
    highlightColor: string;
    /** Y 위치 (px) - 한 줄일 때 */
    y: number;
    /** 테두리 두께 (px) */
    borderWidth: number;
    /** 테두리 색상 */
    borderColor: string;
    /** 한 줄 최대 글자 수 (초과 시 두 줄로 분할) */
    maxCharsPerLine: number;
    /** 줄 간격 (px) - 두 줄일 때 */
    lineSpacing: number;
  };

  /** 자막 설정 */
  subtitle: {
    /** 폰트 파일 경로 */
    fontPath: string;
    /** 폰트 크기 (px) */
    fontSize: number;
    /** 폰트 색상 (ASS 형식: &H00BBGGRR) */
    primaryColor: string;
    /** 아웃라인 색상 (ASS 형식) */
    outlineColor: string;
    /** 배경 색상 (ASS 형식) */
    backColor: string;
    /** 아웃라인 두께 */
    outline: number;
    /** 그림자 크기 */
    shadow: number;
    /** 정렬 (1-9, 5=중앙) */
    alignment: number;
    /** 하단 여백 (px) */
    marginV: number;
    /** 한 줄 최대 글자 수 (초과 시 자동 줄바꿈) */
    maxCharsPerLine?: number;
    /** 픽셀 기반 줄바꿈 설정 */
    wrapping?: {
      /** 픽셀 기반 줄바꿈 활성화 */
      enabled: boolean;
      /** ASS 좌측 여백 (px) */
      marginL: number;
      /** ASS 우측 여백 (px) */
      marginR: number;
      /** 안전 여백 (px) */
      safetyPadding: number;
      /** 최대 스케일 (애니메이션 최대값, %) */
      maxScalePercent: number;
      /** Canvas 실패 시 폴백 글자 수 */
      fallbackCharsPerLine: number;
    };
    /** 애니메이션 설정 */
    animation: {
      /** 애니메이션 지속시간 (ms) */
      popInDuration: number;
      /** Scale up 시작 배율 (%) */
      scaleUpStart: number;
      /** Scale up 끝 배율 (%) */
      scaleUpEnd: number;
      /** Scale down 시작 시간 (ms) */
      scaleDownStart: number;
      /** Scale down 끝 시간 (ms) */
      scaleDownEnd: number;
      /** 최종 배율 (%) */
      finalScale: number;
    };
  };

  /** Ken Burns 효과 설정 */
  kenBurns: {
    /** 시작 줌 배율 */
    startZoom: number;
    /** 끝 줌 배율 */
    endZoom: number;
    /** 줌 증가량 (프레임당) */
    zoomIncrement: number;
    /** FPS */
    fps: number;
  };

  /** 오디오 설정 */
  audio: {
    /** BGM 파일 경로 */
    bgmPath: string;
    /** TTS 볼륨 (0-1) */
    ttsVolume: number;
    /** BGM 볼륨 (0-1) */
    bgmVolume: number;
  };

  /** FFmpeg 렌더링 설정 */
  rendering: {
    /** 비디오 코덱 */
    videoCodec: string;
    /** 인코딩 프리셋 (ultrafast, fast, medium, slow) */
    preset: string;
    /** CRF 값 (화질, 0-51, 낮을수록 고화질) */
    crf: number;
    /** 픽셀 포맷 */
    pixelFormat: string;
    /** 오디오 코덱 */
    audioCodec: string;
    /** 오디오 비트레이트 */
    audioBitrate: string;
  };
}

/**
 * 전체 쇼츠 설정
 */
export interface ShortsConfig {
  /** Would You Rather 설정 */
  wouldYouRather: WouldYouRatherConfig;
  /** 스토리텔링 설정 */
  storytelling: StorytellingConfig;
}
