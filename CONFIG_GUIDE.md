# 쇼츠 설정 파일 가이드 (shorts.config.json)

이 문서는 `shorts.config.json` 파일의 모든 설정값에 대한 상세한 설명입니다.

---

## 📋 목차

- [Would You Rather 쇼츠 설정](#would-you-rather-쇼츠-설정)
- [스토리텔링 쇼츠 설정](#스토리텔링-쇼츠-설정)

---

## Would You Rather 쇼츠 설정

### `wouldYouRather.canvas`

영상의 기본 해상도 설정

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `width` | 영상 너비 (픽셀) | 양수 정수 (예: 1080, 1920) | `1080` |
| `height` | 영상 높이 (픽셀) | 양수 정수 (예: 1920, 1080) | `1920` |

**💡 권장사항**:
- 세로형 쇼츠는 `1080x1920` 유지
- 가로형 영상은 `1920x1080` 사용 가능

---

### `wouldYouRather.colors`

영상의 색상 테마 설정

#### `colors.optionA` (상단 옵션)

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `start` | 그라데이션 시작 색상 | HEX 색상 코드 (예: `#FF0000`, `#48DBFB`) | `#FF6B6B` |
| `end` | 그라데이션 끝 색상 | HEX 색상 코드 | `#EE5253` |

#### `colors.optionB` (하단 옵션)

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `start` | 그라데이션 시작 색상 | HEX 색상 코드 | `#48DBFB` |
| `end` | 그라데이션 끝 색상 | HEX 색상 코드 | `#2E86DE` |

#### 기타 색상

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `text` | 텍스트 색상 | HEX 색상 코드 | `#FFFFFF` (흰색) |
| `vsBadgeBackground` | VS 배지 배경색 | HEX 색상 코드 | `#FFFFFF` |
| `vsBadgeBorder` | VS 배지 테두리 색상 | HEX 색상 코드 | `#000000` |
| `vsBadgeText` | VS 배지 텍스트 색상 | HEX 색상 코드 | `#000000` |

**💡 색상 선택 팁**:
- 온라인 색상 피커 사용: [Google Color Picker](https://g.co/kgs/BvKXqQQ)
- 대비가 높은 색상 조합 선택 (가독성 향상)
- 브랜드 컬러 적용 가능

---

### `wouldYouRather.font`

텍스트 폰트 설정

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `path` | 폰트 파일 경로 | 상대 경로 (예: `assets/fonts/font.ttf`) | `assets/fonts/Pretendard-Bold.ttf` |
| `family` | 폰트 패밀리명 | 폰트 파일 경로 문자열 | `Pretendard` |
| `size` | 텍스트 크기 | 양수 정수 (px) | `60` |
| `lineHeight` | 줄 간격 | 양수 정수 (px) | `80` |

**💡 권장사항**:
- 폰트 크기: 40~80px (너무 작으면 모바일에서 안보임)
- 줄 간격: 폰트 크기의 1.2~1.5배
- 한글 폰트 사용 권장 (Pretendard, Noto Sans KR 등)

---

### `wouldYouRather.textShadow`

텍스트 그림자 효과 설정 (가독성 향상)

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `color` | 그림자 색상 | rgba 또는 HEX (예: `rgba(0,0,0,0.8)`, `#000000`) | `rgba(0, 0, 0, 0.8)` |
| `blur` | 그림자 흐림 정도 | 0 이상 정수 (px) | `10` |
| `offsetX` | 그림자 X축 오프셋 | 정수 (음수 가능, px) | `4` |
| `offsetY` | 그림자 Y축 오프셋 | 정수 (음수 가능, px) | `4` |

**💡 권장사항**:
- 밝은 배경: 어두운 그림자 사용
- 어두운 배경: 밝은 그림자 사용
- 오프셋 값이 클수록 그림자가 멀어짐

---

### `wouldYouRather.vsBadge`

중앙 "VS" 배지 설정

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `radius` | 배지 반지름 | 양수 정수 (px) | `80` |
| `borderWidth` | 테두리 두께 | 0 이상 정수 (px) | `10` |
| `fontSize` | "VS" 텍스트 크기 | 양수 정수 (px) | `80` |

**💡 권장사항**:
- 반지름: 60~100px
- 배지가 너무 크면 텍스트 가림

---

### `wouldYouRather.layout`

화면 레이아웃 설정

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `imagePadding` | 이미지 영역 상하 여백 (텍스트 공간) | 0 이상 정수 (px) | `200` |
| `textMaxWidthPadding` | 텍스트 좌우 여백 | 0 이상 정수 (px) | `100` |
| `optionATextY` | 옵션 A 텍스트 Y 위치 (화면 비율) | 0.0 ~ 1.0 (0.5 = 중앙) | `0.25` |
| `optionBTextY` | 옵션 B 텍스트 Y 위치 (화면 비율) | 0.0 ~ 1.0 | `0.75` |

**💡 권장사항**:
- `imagePadding`: 150~250px (텍스트가 이미지와 겹치지 않도록)
- `textMaxWidthPadding`: 80~150px (화면 가장자리 여백)
- Y 위치: 0.2~0.3 (상단), 0.7~0.8 (하단)

---

### `wouldYouRather.audio`

오디오 설정

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `bgmPath` | BGM 파일 경로 | 상대 경로 (예: `assets/music/bgm.mp3`) | `assets/music/bgm.mp3` |
| `ttsVolume` | TTS 음성 볼륨 | 0.0 ~ 1.0 (0 = 무음, 1 = 최대) | `1.0` |
| `bgmVolume` | BGM 볼륨 | 0.0 ~ 1.0 | `0.15` |

**💡 권장사항**:
- TTS는 항상 1.0 유지 (음성이 잘 들려야 함)
- BGM은 0.1~0.2 (너무 크면 음성이 안들림)

---

## 스토리텔링 쇼츠 설정

### `storytelling.canvas`

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `width` | 영상 너비 (px) | 양수 정수 | `1080` |
| `height` | 영상 높이 (px) | 양수 정수 | `1920` |

---

### `storytelling.letterbox`

상하단 검은색 레터박스 (시네마틱 효과)

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `top` | 상단 레터박스 높이 | 0 이상 정수 (px) | `300` |
| `bottom` | 하단 레터박스 높이 | 0 이상 정수 (px) | `300` |
| `color` | 레터박스 색상 | CSS 색상 (예: `black`, `#000000`) | `black` |

**💡 권장사항**:
- 200~400px: 시네마틱 느낌
- 0px: 레터박스 없음 (전체 화면)

---

### `storytelling.title`

상단 고정 타이틀 설정

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `fontPath` | FFmpeg용 폰트 경로 | 절대 경로 (시스템 폰트) | `/System/Library/Fonts/AppleSDGothicNeo.ttc` |
| `fontSize` | 타이틀 크기 | 양수 정수 (px) | `48` |
| `fontColor` | 타이틀 색상 | CSS 색상 (예: `white`, `#FFFFFF`) | `white` |
| `y` | 상단에서의 Y 위치 | 양수 정수 (px) | `150` |
| `borderWidth` | 텍스트 테두리 두께 | 0 이상 정수 (px) | `2` |
| `borderColor` | 텍스트 테두리 색상 | CSS 색상 | `black` |

**💡 시스템 폰트 경로**:
- **macOS**: `/System/Library/Fonts/AppleSDGothicNeo.ttc`
- **Linux**: `/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc`
- **Windows**: `C:/Windows/Fonts/malgun.ttf`

---

### `storytelling.subtitle`

ASS 자막 설정

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `fontPath` | 자막 폰트 파일 경로 | 상대 경로 (예: `assets/fonts/font.ttf`) | `assets/fonts/Pretendard-Bold.ttf` |
| `fontSize` | 자막 크기 | 양수 정수 (px) | `60` |
| `primaryColor` | 자막 색상 | ASS 형식 (`&H00BBGGRR`) | `&H00FFFFFF` (흰색) |
| `outlineColor` | 아웃라인 색상 | ASS 형식 | `&H00000000` (검은색) |
| `backColor` | 배경 색상 | ASS 형식 | `&H00000000` |
| `outline` | 아웃라인 두께 | 0 이상 정수 | `4` |
| `shadow` | 그림자 크기 | 0 이상 정수 | `3` |
| `alignment` | 정렬 | 1~9 (5 = 중앙, 2 = 하단 중앙) | `5` |
| `marginV` | 하단 여백 | 0 이상 정수 (px) | `0` |

**💡 ASS 색상 형식**:
- 형식: `&H00BBGGRR` (역순 RGB + 투명도)
- 흰색: `&H00FFFFFF`
- 검은색: `&H00000000`
- 빨강: `&H000000FF`
- 파랑: `&H00FF0000`

**💡 정렬 번호**:
```
7  8  9    (상단)
4  5  6    (중앙)
1  2  3    (하단)
```

---

### `storytelling.subtitle.animation`

자막 Pop-in 애니메이션 설정

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `popInDuration` | 뿅 하고 나타나는 시간 | 양수 정수 (ms) | `200` |
| `scaleUpStart` | 시작 배율 | 0 이상 정수 (%) | `0` |
| `scaleUpEnd` | 최대 배율 | 양수 정수 (%) | `120` |
| `scaleDownStart` | Scale down 시작 시간 | 양수 정수 (ms) | `200` |
| `scaleDownEnd` | Scale down 끝 시간 | 양수 정수 (ms) | `400` |
| `finalScale` | 최종 배율 | 양수 정수 (%) | `100` |

**💡 애니메이션 타이밍**:
- 빠른 애니메이션: 100~200ms
- 일반 속도: 200~400ms
- 느린 애니메이션: 400~600ms

---

### `storytelling.kenBurns`

Ken Burns Zoom-in 효과 (이미지 서서히 확대)

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `startZoom` | 시작 줌 배율 | 양수 실수 (1.0 = 원본 크기) | `1.0` |
| `endZoom` | 끝 줌 배율 | 양수 실수 (1.1 = 10% 확대) | `1.1` |
| `zoomIncrement` | 프레임당 줌 증가량 | 양수 실수 (작을수록 부드러움) | `0.0001` |
| `fps` | 프레임레이트 | 양수 정수 (24, 30, 60) | `30` |

**💡 권장사항**:
- `endZoom`: 1.05~1.15 (너무 크면 어지러움)
- `zoomIncrement`: 0.0001~0.0005
- `fps`: 30 고정 권장

---

### `storytelling.audio`

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `bgmPath` | BGM 파일 경로 | 상대 경로 | `assets/music/bgm.mp3` |
| `ttsVolume` | TTS 볼륨 | 0.0 ~ 1.0 | `1.0` |
| `bgmVolume` | BGM 볼륨 | 0.0 ~ 1.0 | `0.15` |

---

### `storytelling.rendering`

FFmpeg 렌더링 품질 설정

| 속성 | 설명 | 가능한 값 | 기본값 |
|------|------|-----------|--------|
| `videoCodec` | 비디오 코덱 | `libx264`, `libx265`, `h264_videotoolbox` | `libx264` |
| `preset` | 인코딩 속도 | `ultrafast`, `fast`, `medium`, `slow`, `veryslow` | `medium` |
| `crf` | 화질 (낮을수록 고화질) | 0~51 정수 | `23` |
| `pixelFormat` | 픽셀 포맷 | `yuv420p`, `yuv444p` | `yuv420p` |
| `audioCodec` | 오디오 코덱 | `aac`, `mp3`, `opus` | `aac` |
| `audioBitrate` | 오디오 비트레이트 | 문자열 (예: `128k`, `192k`, `320k`) | `192k` |

**💡 Preset 선택**:
- `ultrafast`: 빠른 렌더링, 큰 파일 크기
- `medium`: 균형잡힌 선택 (권장)
- `slow`: 느린 렌더링, 작은 파일 크기

**💡 CRF 값**:
- `18`: 거의 무손실 (파일 크기 큼)
- `23`: 고품질 (권장, 기본값)
- `28`: 보통 품질
- `35`: 낮은 품질

---

## 자주 묻는 질문 (FAQ)

### Q1: 설정을 잘못 수정했어요. 어떻게 되돌리나요?
A: `shorts.config.example.json` 파일을 복사해서 `shorts.config.json`으로 덮어쓰세요.

### Q2: 폰트를 변경하고 싶어요.
A:
1. 폰트 파일(`.ttf`, `.otf`)을 `assets/fonts/` 폴더에 복사
2. Would You Rather: `wouldYouRather.font.path`를 새 폰트 경로로 변경
3. 스토리텔링 타이틀: `storytelling.title.fontPath`를 새 폰트 경로로 변경
4. 스토리텔링 자막: `storytelling.subtitle.fontPath`를 새 폰트 경로로 변경

### Q3: 영상이 너무 어둡거나 밝아요.
A: `colors` 섹션의 색상 코드를 조정하세요. 밝게 하려면 높은 값(예: `#FFFFFF`), 어둡게 하려면 낮은 값(예: `#000000`)을 사용하세요.

### Q4: 자막이 너무 작아요.
A: `storytelling.subtitle.fontSize` 값을 증가시키세요 (예: 60 → 80).

### Q5: BGM이 너무 크거나 작아요.
A: `audio.bgmVolume` 값을 조정하세요 (0.0~1.0 범위).

---

**📝 설정 변경 후 항상 영상을 다시 생성해야 합니다.**
```bash
npm start        # Would You Rather
npm run story    # 스토리텔링
```
