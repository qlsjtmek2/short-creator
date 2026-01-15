# Short Creator - 개발 Todolist

> **생성일**: 2026-01-14
> **수정일**: 2026-01-15 (설정 고도화 및 프로젝트 정리)
> **상태**: Phase 19 완료 (최종 배포 가능)

---

## 📋 프로젝트 개요

### 목적
한국 20-30대를 타겟으로 하는 스토리텔링 기반 정보성 쇼츠를 자동으로 생성하여 높은 조회수와 참여율을 달성 (Would You Rather 제거됨)

### 핵심 기능
1. **Interactive Director Mode V2**: Next.js 기반 웹 GUI로 직관적인 제작 환경 제공
2. **Multi-Source Assets**: Pexels, Google Search, Klipy(GIF), Reddit, Imgflip 등 다양한 소스 지원
3. **AI Script Generation**: Gemini 2.0 (Scenario) 기반의 고품질 대본 생성 및 커스텀 프롬프트 지원
4. **Dynamic Rendering**: FFmpeg 기반의 고품질 영상 합성 (Zoom-in, Pop-in 자막)

---

## ✅ 완료된 Phases

### Phase 1~15: 초기 구축 및 스토리텔링 엔진 (완료)
- 기본 인프라, Gemini/TTS/Pexels 연동, StoryOrchestrator 구현

### Phase 17: Interactive Director Mode V1 (완료)
- Backend API 서버 구축, Next.js 프론트엔드 설정

### Phase 18: UI/UX 고도화 (완료)
- Pretendard 폰트, 중앙 정렬, Drag & Drop 대본 편집, 짤방 선택 UI 개선

### Phase 19: 설정 고도화 및 프로젝트 정리 (완료) ⭐ NEW
- [x] **API Key 발급 링크 추가**: 설정창에서 각 서비스 키 발급 페이지로 바로 이동
- [x] **Gemini 최신 모델 반영**: Gemini 2.0 Flash/Pro 등 미래 모델(가상) 옵션 추가
- [x] **프롬프트 설정 세분화**: System/User 프롬프트 템플릿, 톤, 제목 길이 등 상세 설정 기능 구현
- [x] **Would You Rather 제거**: 레거시 코드 및 CLI 스크립트 삭제
- [x] **백엔드 연동**: 프론트엔드 설정을 백엔드 생성기에 전달하는 파이프라인 구축

---

## 📊 진행 상황

### 전체 진행률
- **완료**: Phase 1~19 (100%)
- **상태**: 🟢 **프로젝트 완료 (Maintenance Mode)**

---

**프로젝트 종료일**: 2026-01-15