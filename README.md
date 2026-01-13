# Would You Rather 쇼츠 자동 생성기

> 한국어 Would You Rather 쇼츠를 자동으로 생성하는 시스템

## 📋 프로젝트 개요

한국 20-30대를 타겟으로 하는 Would You Rather 쇼츠를 자동으로 생성하여 높은 조회수와 참여율을 달성하는 것을 목표로 합니다.

### 핵심 기능

- ✅ **질문 자동 생성** - ChatGPT API로 재미있는 현실적 질문 생성
- ✅ **이미지 자동 소싱** - Pexels API로 무료 스톡 이미지 다운로드
- ✅ **음성 합성** - 타입캐스트로 한국어 캐릭터 음성 (박창수/개나리)
- ✅ **분할 화면 생성** - Canvas로 빨강 vs 파랑 대비 레이아웃
- ✅ **영상 렌더링** - FFmpeg로 60초 1080x1920 쇼츠 생성

## 🏗️ 기술 스택

- **언어**: TypeScript, Node.js
- **API**: OpenAI (ChatGPT), 타입캐스트 (TTS), Pexels (이미지)
- **라이브러리**: Canvas (프레임 생성), FFmpeg (영상 렌더링)
- **폰트**: Pretendard (한글 최적화)

## 📊 예상 성과

- **생성 시간**: 10개 영상 / 10분
- **영상당 비용**: $0.12
- **자동화율**: 95%

## 📁 프로젝트 구조

```
short-creator/
├── docs/
│   └── plans/
│       └── 2026-01-14-would-you-rather-shorts-design.md
├── src/                    # 소스 코드 (구현 예정)
├── lib/                    # 라이브러리 및 유틸리티
├── output/                 # 생성된 영상 (gitignore)
├── PROJECT_TODOLIST.md     # 개발 계획
└── README.md
```

## 🚀 개발 상태

**현재 상태**: 🟡 설계 완료, 구현 준비 중

### 완료된 작업
- ✅ 전체 시스템 설계
- ✅ 인터페이스 정의
- ✅ 개발 todolist 작성 (60개 작업)

### 다음 작업
- ⏳ 프로젝트 환경 설정
- ⏳ 5개 핵심 모듈 구현
- ⏳ 통합 및 테스트

## 📝 문서

- [설계 문서](docs/plans/2026-01-14-would-you-rather-shorts-design.md) - 전체 시스템 아키텍처 및 설계
- [개발 Todolist](PROJECT_TODOLIST.md) - 상세 작업 계획 (13 Phase, 60개 작업)

## 💡 핵심 설계 원칙

### 인터페이스 기반 설계
각 모듈은 표준 인터페이스로 분리되어 교체 가능:
- `IQuestionGenerator` - 질문 생성
- `IImageProvider` - 이미지 제공
- `ITTSProvider` - 음성 합성
- `IFrameComposer` - 프레임 생성
- `IVideoRenderer` - 영상 렌더링

### 의존성 최소화
- 각 모듈은 독립적으로 개발 및 테스트 가능
- 한 서비스를 다른 서비스로 교체 시 인터페이스만 맞추면 됨
- 예: 타입캐스트 → ElevenLabs로 교체 가능

## 🔧 설치 및 사용 (구현 예정)

```bash
# 설치
npm install

# API 키 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 영상 생성
npm run generate 10
```

## 📊 비용 분석

### 운영 비용 (월간, 300개 영상 기준)
- ChatGPT API: $1.50 (~$0.005/영상)
- 타입캐스트: $11/월 (20분 플랜)
- Pexels: 무료
- **총**: ~$12.50/월

### 영상당 단가
- $0.04/영상 (300개 기준)

## 🎯 로드맵

### Phase 1: MVP (3일)
- 기본 영상 생성 기능 구현
- 10개 테스트 영상 생성

### Phase 2: 최적화 (1주)
- 성능 최적화
- 에러 처리 강화
- 배치 생성 자동화

### Phase 3: 확장 (1개월)
- 다른 포맷 추가 (가상 대화, 충격 반전)
- YouTube API 자동 업로드
- 분석 대시보드

## 📄 라이선스

MIT License

## 🤝 기여

현재 개인 프로젝트입니다.

## 📧 문의

이슈 트래커를 통해 문의해주세요.

---

**프로젝트 시작일**: 2026-01-14
**개발자**: shinhuigon
**상태**: 🟡 진행 중
