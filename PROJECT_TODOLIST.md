# Short Creator - Video Editor Expansion Plan

> 생성일: 2026-01-16
> 목표: 웹 기반 영상 편집/미리보기 기능 및 타임라인 조정 기능 구현
> 상태: Phase 1 시작 전

## 📋 프로젝트 개요
- **목적**: 사용자가 최종 렌더링 전 영상을 미리보고, 타이밍/효과음/자막을 세밀하게 조정할 수 있는 '영상 편집기' 경험 제공
- **핵심 기능**:
  - **DOM Preview**: FFmpeg 없이 브라우저에서 즉시 확인 가능한 미리보기 플레이어
  - **Timeline Editor**: 대본/오디오 세그먼트별 시간 및 순서 조정
  - **SFX/VFX**: 효과음 및 영상 효과(줌/팬/필터) 적용 인터페이스
  - **Audio Pre-generation**: 편집 단계에서 오디오 확인을 위한 TTS 선행 생성

---

## 🎯 Phase 1: 아키텍처 및 상태 관리 확장
편집 기능을 위해 프론트엔드 데이터 구조를 확장하고 백엔드 API를 준비합니다.
- [x] **Type Definition**: `EditorState`, `SegmentConfig` (duration, sfx, vfx 포함) 인터페이스 정의
- [x] **API - TTS Preview**: `/api/preview/tts` 엔드포인트 구현 (텍스트 -> 오디오 URL + Duration 반환)
- [ ] **Frontend State**: `Step3_Assets` 이후 `Step3_Editor` 단계 추가를 위한 라우팅/State 설계
- [ ] **Asset Manager**: 업로드/선택된 에셋(이미지, 오디오)을 통합 관리하는 유틸리티 작성

## 🎯 Phase 2: Editor UI (미리보기 플레이어)
사용자가 편집 결과를 즉시 확인할 수 있는 플레이어를 구현합니다.
- [x] **Preview Player Component**: HTML5 Audio + Image + CSS Animation을 조합한 플레이어 제작
- [x] **Play/Pause/Seek**: 재생 컨트롤 및 진행바(Progress Bar) 구현
- [x] **Segment Sync**: 오디오 재생 시간에 맞춰 이미지/자막이 전환되는 동기화 로직 구현
- [x] **VFX Simulator**: CSS Filter/Transform을 사용하여 실제 FFmpeg 효과(Zoom/Pan)를 흉내내는 시뮬레이터 구현 (기본 Crossfade만 적용됨)

## 🎯 Phase 3: Timeline & Script Editing
상세 편집을 위한 타임라인 UI를 구현합니다.
- [x] **Timeline View**: 각 세그먼트(대본 한 줄)를 블록 형태로 시각화 (리스트 형태로 구현됨)
- [x] **Timing Adjust**: 오디오 딜레이(Delay) 또는 간격 조절 UI
- [x] **Script Editing**: 편집 단계에서 대본 수정 시 즉시 TTS 재생성 요청 로직
- [x] **Image Cycling**: 썸네일 클릭 시 대체 이미지로 변경 기능 구현

## 🎯 Phase 4: SFX & VFX Integration
효과음과 시각 효과를 추가하는 기능을 구현합니다.
- [x] **SFX Library**: 서버에 기본 효과음 에셋 구축 및 목록 API 제공 (Mock/Hardcoded)
- [x] **SFX Selector**: 세그먼트별 효과음 선택 UI (Sound Picker)
- [x] **VFX Selector**: 이미지별 효과 선택 UI (Zoom-in, Shake, Slide 등)
- [x] **VFX Mapping**: 선택된 CSS 효과를 FFmpeg 필터 명령어로 변환하는 로직 작성 (Backend 예정)

## 🎯 Phase 5: Final Rendering Pipeline Update
편집된 내용을 실제 영상으로 만들어내는 파이프라인을 업데이트합니다.
- [x] **JSON Payload Update**: `renderVideo` API가 확장된 `EditorState`를 받도록 수정
- [x] **FFmpeg Builder**: 타임라인 정보(Delay, Duration)와 SFX/VFX를 반영하도록 필터 체인 로직 개선
- [x] **Complex Filter Graph**: 다중 오디오 트랙(BGM + TTS + SFX) 믹싱 로직 구현
- [x] **End-to-End Test**: 편집된 내용이 최종 영상에 정확히 반영되는지 테스트 (User Verification 필요)

---

## 🎯 Phase 21: Unified Rendering Engine
현재의 시뮬레이션 방식을 버리고, Backend에서 모든 좌표와 타이밍을 계산하여 공유하는 SSOT 아키텍처를 도입합니다.
- [x] **Step 1: LayoutEngine Core**: `node-canvas` 기반 텍스트 측정 및 좌표 계산 엔진 구축
- [ ] **Step 2: Render Manifest API**: 에디터 데이터를 `RenderManifest` JSON으로 변환하는 로직 구현
- [ ] **Step 3: Remotion Manifest-Driven**: `ShortsVideo.tsx`가 Manifest를 기반으로 렌더링하도록 수정
- [ ] **Step 4: FFmpeg Manifest-Driven**: `FFmpegStoryRenderer`가 Manifest 기반 필터 체인 생성하도록 수정
- [ ] **Step 5: Validation**: 미리보기와 최종 렌더링 결과물의 픽셀 단위 일치 검증

---

## 📊 진행 상황
- **완료**: 20/25 (80%)
- **진행 중**: Phase 21
