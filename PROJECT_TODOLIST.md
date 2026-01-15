# Would You Rather 쇼츠 생성기 - 개발 Todolist

> **생성일**: 2026-01-14
> **수정일**: 2026-01-15 (UI/UX 고도화 및 기능 확장)
> **예상 기간**: 4일
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
- [x] 10개 영상 생성 배치 테스트

## 🎯 Phase 14: 문서화 및 마무리
- [x] README.md 및 사용 가이드 작성

## 🎯 Phase 15: 스토리텔링 쇼츠 고도화 (Advanced UI/UX) - [완료 ✅]
- [x] 임팩트 있는 고딕체 폰트 확인
- [x] `.ass` 파일 생성기 구현
- [x] 자막 애니메이션 태그 적용
- [x] 문장별 TTS 생성 및 길이 추출 로직
- [x] 이미지 전환 효과 (Ken Burns) 필터 구현
- [x] 스토리텔링형 대본 생성기 구현

## 🎯 Phase 16: 레딧 짤방 문제 해결 (보류 - GUI 우선)
- [ ] GIF 길이 제한 (-loop 1, -t 옵션)
- [ ] 중복 밈 방지 (usedMemeUrls)
- [ ] 키워드-서브레딧 매핑
- [ ] Tenor GIF API 통합

## 🎯 Phase 17: Interactive Director Mode (GUI 구축) - [완료 ✅]
- [x] Backend API Layer 구축 (Express)
- [x] Frontend Setup (Next.js)
- [x] Script Editor UI (Step 1)
- [x] Asset Selector UI (Step 2)
- [x] Preview & Render UI (Step 3)
- [x] Rendering Logic Refactoring

---

## 🎯 Phase 18: UI/UX 고도화 및 기능 확장 (Interactive Mode V2) ⭐ NEW

> **목표**: 사용성을 대폭 개선하고 사용자 개입 범위를 확장 (Human-in-the-loop 강화)
> **기술 스택**: Next.js, Tailwind CSS, LocalStorage

### Phase 18-1: 메인 화면 (Step 1) 개선
- [ ] 타이틀 변경: `Short Creator` (메타데이터 포함)
- [ ] 레이아웃 변경: Step Indicator 제거, 중앙 집중형 심플 디자인
- [ ] 주제 추천 기능: 카테고리별(공포, 유머, 지식, 밸런스, 미스터리 등) 칩 버튼 구현
- [ ] 자동 완성: 추천 칩 클릭 시 입력창 자동 채움

### Phase 18-2: Sticky Header 및 네비게이션
- [ ] Step 2부터 나타나는 상단 고정 헤더(Sticky Header) 구현
- [ ] 헤더 내 기능: 진행 단계 표시, [이전]/[다음] 버튼, [설정] 아이콘
- [ ] 설정 모달 구현 (API Key, 기본 Provider 설정 - LocalStorage 연동)

### Phase 18-3: 대본 에디터 (Step 2) 강화
- [ ] Narration 라벨 제거 및 UI 간소화
- [ ] 키워드 수정 기능 제거 (Step 3로 이동)
- [ ] 문단(Scene) 추가/삭제 기능 구현
- [ ] 제목(Topic) 수정 기능 구현
- [ ] 강조/줄바꿈 문법 힌트(Tooltip) 추가

### Phase 18-4: 짤방 선택 (Step 3) 고도화
- [ ] 씬별 키워드 수정 UI 추가
- [ ] 재검색(Refresh) 기능 구현: 수정된 키워드로 해당 씬만 짤방 다시 불러오기
- [ ] 짤방 선택 UI 개선 (선택 효과 강화)

### Phase 18-5: 설정 관리 (Settings)
- [ ] API Key 설정 화면 (Gemini, Pexels, ElevenLabs 등)
- [ ] 기본 짤방 소스 선택 (Pexels, Reddit, Tenor 등)
- [ ] 설정값 LocalStorage 저장 및 불러오기 (새로고침 시 유지)

---

## 📊 진행 상황

### 전체 진행률
- **완료**: Phase 1~15, 17 완료
- **진행 중**: Phase 18 (UI/UX 고도화)

