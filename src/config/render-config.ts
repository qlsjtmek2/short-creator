export const RENDER_CONFIG = {
  canvas: {
    width: 1080,
    height: 1920,
  },
  letterbox: {
    top: 350,
    bottom: 350,
    color: 'black',
  },
  title: {
    fontPath: '', // 런타임에 설정 (파일 경로)
    fontFamily: 'Pretendard-ExtraBold', // 프론트엔드용
    fontSize: 100,
    fontColor: 'white',
    highlightColor: '#FFDB58',
    y: 150,
    borderWidth: 2,
    borderColor: 'black',
    maxCharsPerLine: 15,
    lineSpacing: 120,
  },
  subtitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 100,
    primaryColor: '&H00FFFFFF',
    outlineColor: '&H00000000',
    backColor: '&H00000000',
    outline: 8,
    shadow: 4,
    alignment: 2,
    y: 1700, // 화면 상단으로부터의 절대 위치 (FFmpeg/Remotion 공용)
    maxCharsPerLine: 15,
    marginV: 100,
    animation: {
      popInDuration: 100,
      scaleUpStart: 0,
      scaleUpEnd: 110,
      scaleDownStart: 0,
      scaleDownEnd: 0,
      finalScale: 120,
    },
    wrapping: {
      enabled: true,
      marginL: 100,
      marginR: 100,
      safetyPadding: 40,
      maxScalePercent: 120,
      fallbackCharsPerLine: 13,
    },
  },
  kenBurns: {
    startZoom: 1.0,
    endZoom: 1.2,
    zoomIncrement: 0.0001,
    fps: 60,
  },
  audio: {
    bgmPath: '',
    ttsVolume: 1.0,
    bgmVolume: 0.1,
    sfxVolume: 0.8,
  },
  rendering: {
    videoCodec: 'libx264',
    preset: 'medium',
    crf: 23,
    pixelFormat: 'yuv420p',
    audioCodec: 'aac',
    audioBitrate: '192k',
  },
};
