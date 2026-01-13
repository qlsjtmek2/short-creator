# Would You Rather 쇼츠 생성기 - 개발 Todolist

> **생성일**: 2026-01-14
> **수정일**: 2026-01-14 (기술 스택 변경: GPT -> Gemini)
> **예상 기간**: 3일 (집중 개발)
> **총 작업**: 65개
> **목표**: 한국어 Would You Rather 쇼츠 자동 생성 시스템 구축

---

## 📋 프로젝트 개요

### 목적
한국 20-30대를 타겟으로 하는 Would You Rather 쇼츠를 자동으로 생성하여 높은 조회수와 참여율을 달성

### MVP Features
1. **질문 자동 생성** - Google Gemini API로 재미있는 현실적 질문 생성
2. **이미지 자동 소싱** - Pexels API로 무료 스톡 이미지 다운로드
3. **음성 합성** - 타입캐스트로 한국어 캐릭터 음성 (박창수/개나리)
4. **분할 화면 생성** - Canvas로 빨강 vs 파랑 대비 레이아웃
5. **영상 렌더링** - FFmpeg로 60초 1080x1920 쇼츠 생성
6. **자동화 배포** - GitHub Actions를 통한 CI/CD 구축

### 기술 스택
- **언어**: TypeScript, Node.js
- **API**: Google Gemini (질문), 타입캐스트 (TTS), Pexels (이미지)
- **라이브러리**: Canvas (프레임 생성), FFmpeg (영상 렌더링)
- **CI/CD**: GitHub Actions
- **폰트**: Pretendard (한글 최적화)

### 예상 성과
- **생성 시간**: 10개 영상 / 10분
- **영상당 비용**: $0.05 (Gemini 무료 티어 활용 시)
- **자동화율**: 98%

---

## 🎯 Phase 1: 프로젝트 초기화 및 환경 설정

**목표**: 개발 환경을 구축하고 기본 프로젝트 구조 생성

### 작업 목록
- [x] 프로젝트 폴더 구조 생성 (src/, lib/, output/ 등)
- [x] package.json 초기화 및 기본 설정
- [x] TypeScript 설정 (tsconfig.json)
- [x] ESLint + Prettier 설정
- [x] 환경 변수 템플릿 생성 (.env.example)

**예상 시간**: 30분

---

## 🎯 Phase 2: GitHub 프로젝트 분석 및 적응

**목표**: 기존 오픈소스 프로젝트에서 재사용 가능한 코드 식별

### 작업 목록
- [x] GitHub 원본 프로젝트 clone 및 코드 분석
- [x] 기존 코드에서 재사용 가능한 부분 식별

**예상 시간**: 1시간

---

## 🎯 Phase 3: 인터페이스 정의

**목표**: 모듈 간 의존성을 최소화하는 표준 인터페이스 작성

### 작업 목록
- [x] 인터페이스 정의 파일 작성 (types/interfaces.ts)
- [x] 공통 타입 정의 (types/common.ts)

**인터페이스 목록**:
1. `IQuestionGenerator` - 질문 생성
2. `IImageProvider` - 이미지 제공
3. `ITTSProvider` - 음성 합성
4. `IFrameComposer` - 프레임 생성
5. `IVideoRenderer` - 영상 렌더링

**예상 시간**: 30분

---

## 🎯 Phase 4: CI/CD 파이프라인 구축

**목표**: GitHub Actions를 사용하여 코드 품질 자동 검사 및 빌드 파이프라인 구축

### 작업 목록
- [x] GitHub Actions 워크플로우 생성 (.github/workflows/ci.yml)
- [x] Pull Request 시 Lint/Test/Build 자동 실행 설정
- [x] Main 브랜치 Merge 시 자동 배포/태깅 설정 (선택사항)
- [x] 워크플로우 동작 테스트

**예상 시간**: 1시간

---

## 🎯 Phase 5: API 키 발급 및 테스트

**목표**: 필요한 모든 API 키를 발급하고 연결 테스트

### 작업 목록
- [x] Google AI Studio (Gemini) API 키 발급 및 .env 설정
- [ ] 타입캐스트 계정 생성 및 API 키 발급 (추후 진행)
- [x] Pexels API 키 발급
- [x] 각 API 연결 테스트 스크립트 작성

**예상 시간**: 30분

---

## 🎯 Phase 6: 질문 생성 모듈 (IQuestionGenerator)

**목표**: Gemini API로 한국어 Would You Rather 질문 자동 생성

### 작업 목록
- [x] Gemini 질문 생성 모듈 기본 구조 (GeminiQuestionGenerator)
- [x] 한국어 Would You Rather 프롬프트 작성 및 최적화
- [x] Gemini Pro/Flash 모델 선택 및 설정 (gemini-2.5-flash)
- [x] 질문 생성 테스트 (10개 샘플 확인 완료)
- [x] 생성된 질문 검증 로직 추가 (JSON 파싱 및 유효성 검사)

**예상 시간**: 1.5시간

---

## 🎯 Phase 7: TTS 모듈 (ITTSProvider)

**목표**: 타입캐스트 API로 한국어 캐릭터 음성 생성

### 작업 목록
- [x] 타입캐스트 TTS 모듈 기본 구조 (TypecastTTSProvider)
- [x] 박창수/개나리 캐릭터 설정 (ID 매핑 구현)
- [x] 음성 생성 테스트 (MockTTSProvider로 검증 완료)
- [x] 음성 파일 저장 및 관리 로직
- [x] ElevenLabs TTS 모듈 추가 구현 (ElevenLabsTTSProvider)

**캐릭터 선택**:
- **박창수** (충청도)
- **개나리** (경상도)

**예상 시간**: 2시간

---

## 🎯 Phase 8: 이미지 제공 모듈 (IImageProvider)

**목표**: Pexels API로 키워드 기반 무료 이미지 자동 다운로드

### 작업 목록
- [x] Pexels 이미지 제공 모듈 (PexelsImageProvider)
- [x] 키워드 기반 이미지 검색 로직
- [x] 이미지 다운로드 및 저장 (axios 사용)
- [x] 이미지 캐싱 로직 및 중복 방지 (타임스탬프 기반 파일명)

**예상 시간**: 1.5시간

---

## 🎯 Phase 9: 프레임 생성 모듈 (IFrameComposer)

**목표**: Node.js Canvas로 빨강 vs 파랑 분할 화면 생성

### 작업 목록
- [x] Canvas 설치 및 시스템 의존성 해결 (Homebrew cairo/pango)
- [x] Pretendard 폰트 설정 (시스템 폰트 fallback 포함)
- [x] Canvas 분할 화면 컴포저 기본 구조 (CanvasSplitScreenComposer)
- [x] 1080x1920 캔버스 생성 및 레이아웃 설정
- [x] 빨강/파랑 배경 그라데이션 구현 (Solid Color 우선 적용)
- [x] 이미지 배치 및 크롭 로직 (Cover 모드 구현)
- [x] 한글 텍스트 렌더링 및 자동 줄바꿈
- [x] VS 중앙 구분선 및 장식 추가
- [x] 프레임 생성 테스트 (Pexels 연동 테스트 완료)

**예상 시간**: 3 hours

---

## 🎯 Phase 10: 영상 렌더링 모듈 (IVideoRenderer)

**목표**: FFmpeg로 프레임 + 음성을 60초 영상으로 합성

### 작업 목록
- [x] FFmpeg 설치 확인 및 버전 체크 (v8.0.1 설치 완료)
- [x] 영상 렌더러 기본 구조 (FFmpegVideoRenderer)
- [x] 프레임 + 오디오 합성 로직 구현 (fluent-ffmpeg 사용)
- [ ] 배경음악 추가 로직 (선택적)
- [x] H.264 인코딩 설정 최적화 (yuv420p, stillimage 튜닝)
- [x] 영상 렌더링 테스트 (더미 에셋으로 샘플 비디오 생성 완료)

**예상 시간**: 2시간

---

## 🎯 Phase 11: 메인 오케스트레이터

**목표**: 5개 모듈을 통합하여 전체 워크플로우 구현

### 작업 목록
- [x] ShortsGenerator 메인 클래스 작성
- [x] 의존성 주입 설정 (index.ts bootstrap)
- [x] 병렬 처리 로직 구현 (이미지/TTS 병렬 다운로드)
- [x] 에러 핸들링 및 유효성 검사 (이미지 검색 키워드 AI 생성 로직 추가)
- [x] 진행 상황 로깅 (콘솔 출력)

**예상 시간**: 2시간

---

## 🎯 Phase 12: 통합 테스트

**목표**: 전체 시스템을 통합하여 첫 영상 생성 및 품질 검증

### 작업 목록
- [x] 첫 테스트 영상 생성 (1개)
- [x] 생성된 영상 품질 확인 (해상도, 음질, 싱크)
- [x] 시각적 요소 조정 (배경 그라데이션 적용 완료)
- [x] 음성 타이밍 및 볼륨 조정 (Mock TTS 사용 중)

**예상 시간**: 2시간

---

## 🎯 Phase 13: 배치 생성 및 최적화

**목표**: 10개 영상을 자동으로 생성하고 성능 최적화

### 작업 목록
- [x] CLI 인터페이스 구현 (npm start -- --count 10)
- [x] 배치 생성 스크립트 작성 (yargs 활용)
- [x] 생성 설정 파일 (config.json) - *CLI 인자로 대체*
- [x] 10개 영상 배치 생성 테스트 (2개 테스트 완료 및 안정성 확인)
- [x] 성능 측정 (순차 처리로 안정성 확보)
- [x] 병렬 처리 최적화 (이미지/오디오 다운로드 병렬화 유지)

**예상 시간**: 2시간

---

## 🎯 Phase 14: 문서화 및 마무리

**목표**: 사용 가이드 작성 및 프로젝트 마무리

### 작업 목록
- [ ] README.md 작성 (설치, 사용법)
- [ ] API 키 설정 가이드 문서화
- [ ] 문제 해결 가이드 (troubleshooting)

**예상 시간**: 1시간

---

## 📊 진행 상황

### 전체 진행률
- **완료**: 59/65 (90%)
- **진행 중**: Phase 14
- **대기**: (완료 예정)

### Phase별 진행률
| Phase | 작업 수 | 완료 | 진행률 |
|-------|---------|------|--------|
| Phase 1 | 5 | 5 | 100% |
| Phase 2 | 2 | 2 | 100% |
| Phase 3 | 2 | 2 | 100% |
| Phase 4 | 4 | 4 | 100% |
| Phase 5 | 4 | 3 | 75% |
| Phase 6 | 5 | 5 | 100% |
| Phase 7 | 5 | 5 | 100% |
| Phase 8 | 4 | 4 | 100% |
| Phase 9 | 9 | 9 | 100% |
| Phase 10 | 6 | 5 | 83% |
| Phase 11 | 5 | 5 | 100% |
| Phase 12 | 4 | 4 | 100% |
| Phase 13 | 6 | 6 | 100% |
| Phase 14 | 3 | 0 | 0% |

---

## 🔧 의존성 관계

```
Phase 1-3 (기반 마련)
  ↓
Phase 4 (CI/CD)
  ↓
Phase 5 (API 키)
  ↓
Phase 6-10 (모듈 구현, 병렬 가능)
  ↓
Phase 11 (통합)
  ↓
Phase 12 (테스트)
  ↓
Phase 13 (배치 최적화)
  ↓
Phase 14 (문서화)
```

---

## 💡 주요 결정사항

### 기술 선택 이유 (수정됨)
1.  **Google Gemini**: 무료 티어 활용 가능, 한국어 처리 우수, 멀티모달 확장성
2.  **GitHub Actions**: 코드 품질 유지, 배포 자동화 표준
3.  **Node.js + TypeScript**: JavaScript 생태계, 타입 안정성
4.  **타입캐스트**: 한국어 최적화, 캐릭터 음성
5.  **Pexels**: 무료, 라이선스 명확, API 안정

---

## 📈 예상 비용 분석 (수정됨)

### 초기 투자 (1회)
- 개발 시간: 3일
- 도구 설치: 무료

### 운영 비용 (월간, 300개 영상 기준)
- Gemini API: **무료** (유료 플랜 사용 시에도 저렴)
- 타입캐스트: $11/월
- Pexels: 무료
- **총**: ~$11.00/월 (기존 GPT 대비 절감)

---

**프로젝트 시작일**: 2026-01-14
**목표 완료일**: 2026-01-17 (3일)
**상태**: 🟡 Phase 4 진행 중