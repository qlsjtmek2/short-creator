# Would You Rather 쇼츠 생성기 - 개발 Todolist

> **생성일**: 2026-01-14
> **수정일**: 2026-01-14 (기술 스택 변경: GPT -> Gemini)
> **예상 기간**: 3일 (집중 개발)
> **목표**: 한국어 Would You Rather 쇼츠 및 스토리텔링 정보 쇼츠 자동 생성 시스템 구축

---

## 📋 프로젝트 개요

### 목적
한국 20-30대를 타겟으로 하는 Would You Rather 및 스토리텔링 기반 정보성 쇼츠를 자동으로 생성하여 높은 조회수와 참여율을 달성

### MVP Features (기본)
1. **질문 자동 생성** - Google Gemini API로 재미있는 현실적 질문 생성
2. **이미지 자동 소싱** - Pexels API로 무료 스톡 이미지 다운로드
3. **음성 합성** - 타입캐스트로 한국어 캐릭터 음성 (박창수/개나리)
4. **분할 화면 생성** - Canvas로 빨강 vs 파랑 대비 레이아웃
5. **영상 렌더링** - FFmpeg로 60초 1080x1920 쇼츠 생성

### 핵심 UI/UX (스토리텔링형 신규 추가)
- **상/하단 검은색 레터박스**
- **상단 고정 제목**
- **중앙 텍스트 맥락에 맞는 이미지 전환 (Zoom-in 효과)**
- **중앙 하단 애니메이션 자막 (Pop-in 효과)**

---

## 🎯 Phase 1: 프로젝트 초기화 및 환경 설정
- [x] 프로젝트 폴더 구조 생성 (src/, lib/, output/ 등)
- [x] package.json 초기화 및 기본 설정
- [x] TypeScript 설정 (tsconfig.json)
- [x] ESLint + Prettier 설정
- [x] 환경 변수 템플릿 생성 (.env.example)

## 🎯 Phase 2: GitHub 프로젝트 분석 및 적응
- [x] GitHub 원본 프로젝트 clone 및 코드 분석
- [x] 기존 코드에서 재사용 가능한 부분 식별

## 🎯 Phase 3: 인터페이스 정의
- [x] 인터페이스 정의 파일 작성 (types/interfaces.ts)
- [x] 공통 타입 정의 (types/common.ts)

## 🎯 Phase 4: CI/CD 파이프라인 구축
- [x] GitHub Actions 워크플로우 생성 (.github/workflows/ci.yml)
- [x] Pull Request 시 Lint/Test/Build 자동 실행 설정
- [x] 워크플로우 동작 테스트

## 🎯 Phase 5: API 키 발급 및 테스트
- [x] Google AI Studio (Gemini) API 키 발급 및 .env 설정
- [x] Pexels API 키 발급
- [x] 각 API 연결 테스트 스크립트 작성

## 🎯 Phase 6: 질문 생성 모듈 (IQuestionGenerator)
- [x] Gemini 질문 생성 모듈 기본 구조 (GeminiQuestionGenerator)
- [x] 한국어 Would You Rather 프롬프트 작성 및 최적화
- [x] 생성된 질문 검증 로직 추가 (JSON 파싱 및 유효성 검사)

## 🎯 Phase 7: TTS 모듈 (ITTSProvider)
- [x] 타입캐스트 TTS 모듈 기본 구조 (TypecastTTSProvider)
- [x] 박창수/개나리 캐릭터 설정 (ID 매핑 구현)
- [x] ElevenLabs TTS 모듈 추가 구현 (ElevenLabsTTSProvider)

## 🎯 Phase 8: 이미지 제공 모듈 (IImageProvider)
- [x] Pexels 이미지 제공 모듈 (PexelsImageProvider)
- [x] 키워드 기반 이미지 검색 및 다운로드 로직
- [x] 이미지 캐싱 로직 및 중복 방지

## 🎯 Phase 9: 프레임 생성 모듈 (IFrameComposer)
- [x] Node.js Canvas 레이아웃 설정 (1080x1920)
- [x] 빨강/파랑 배경 및 이미지 배치 (Cover 모드)
- [x] 한글 텍스트 렌더링 및 자동 줄바꿈

## 🎯 Phase 10: 영상 렌더링 모듈 (IVideoRenderer)
- [x] 영상 렌더러 기본 구조 (FFmpegVideoRenderer)
- [x] 프레임 + 오디오 합성 로직 구현

## 🎯 Phase 11: 메인 오케스트레이터
- [x] ShortsGenerator 메인 클래스 작성
- [x] 병렬 처리 로직 구현 (이미지/TTS 병렬 다운로드)

## 🎯 Phase 12: 통합 테스트
- [x] 첫 테스트 영상 생성 및 품질 확인

## 🎯 Phase 13: 배치 생성 및 최적화
- [x] CLI 인터페이스 구현 및 배치 생성 스크립트
- [x] 10개 영상 배치 생성 테스트

## 🎯 Phase 14: 문서화 및 마무리
- [x] README.md 및 사용 가이드 작성

---

## 🎯 Phase 15: 스토리텔링 쇼츠 고도화 (Advanced UI/UX) - [완료 ✅]

### 1. 자막 및 애니메이션 (ASS 자막 도입)
- [x] 임팩트 있는 고딕체 폰트 확인 (Pretendard ExtraBold 활용)
- [x] `.ass` 파일 생성기 (`SubtitleGenerator`) 구현
- [x] 자막 애니메이션 태그 (Pop-in, Scale Up) 적용 및 테스트

### 2. 오디오-비주얼 동기화 엔진
- [x] 문장별 TTS 생성 및 정확한 길이(Duration) 추출 로직 (FFprobe 활용)
- [x] 타임스탬프 기반 이미지-자막 매핑 데이터 구조 설계
- [x] 상황별 키워드 추출 및 이미지 시퀀스 구성 (Gemini 프롬프트 고도화)

### 3. 고도화된 영상 렌더링 (FFmpeg 필터)
- [x] 이미지 전환 효과 (Ken Burns/Zoom-in) 필터 체인 구현
- [x] 상/하단 레터박스(Drawbox) 및 상단 타이틀 합성 레이아웃 적용
- [x] ASS 자막 오버레이 통합 렌더링

### 4. 콘텐츠 엔진 확장
- [x] 스토리텔링형 대본 생성을 위한 `GeminiStoryGenerator` 구현
- [x] StoryOrchestrator로 독립 파이프라인 분리
- [x] CLI 인터페이스 구현 (npm run story)

- [ ] 효과음도 넣고
- [ ] 짤방 또는 Ai영상 사용하도록 하고
- [ ] 다양한 영상 효과들도 적재적소에 넣도록 하고
- [ ] 프롬프트 개선하고
- [ ] 대본 잘 짜도록 만들게 하고
- [ ] 제목 짤린거 수정하고
- [ ] 글자 문장 끊기

---

## 📊 진행 상황

### 전체 진행률
- **완료**: Phase 1~15 완료

---

**프로젝트 시작일**: 2026-01-14
**상태**: 🟢 **Phase 15 완료 - 추가 개선 작업 준비 중**