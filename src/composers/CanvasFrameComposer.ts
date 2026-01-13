import {
  createCanvas,
  loadImage,
  registerFont,
  CanvasRenderingContext2D,
} from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { IFrameComposer } from '../../types/interfaces';
import { WouldYouRatherQuestion } from '../../types/common';

export class CanvasFrameComposer implements IFrameComposer {
  private width = 1080;
  private height = 1920;
  private outputDir: string;
  private fontPath = 'assets/fonts/Pretendard-Bold.ttf';

  constructor(outputDir: string = 'output/frames') {
    this.outputDir = outputDir;

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // 폰트 등록 시도
    if (fs.existsSync(this.fontPath)) {
      registerFont(this.fontPath, { family: 'Pretendard' });
    } else {
      console.warn(
        '⚠️ Font file not found at:',
        this.fontPath,
        '- Using system font.',
      );
    }
  }

  async composeFrame(
    question: WouldYouRatherQuestion,
    imageAPath: string,
    imageBPath: string,
  ): Promise<string> {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // 1. 배경 그리기 (상단: 빨강 그라데이션, 하단: 파랑 그라데이션)
    const redGradient = ctx.createLinearGradient(0, 0, 0, this.height / 2);
    redGradient.addColorStop(0, '#FF6B6B');
    redGradient.addColorStop(1, '#EE5253');
    ctx.fillStyle = redGradient;
    ctx.fillRect(0, 0, this.width, this.height / 2);

    const blueGradient = ctx.createLinearGradient(
      0,
      this.height / 2,
      0,
      this.height,
    );
    blueGradient.addColorStop(0, '#48DBFB');
    blueGradient.addColorStop(1, '#2E86DE');
    ctx.fillStyle = blueGradient;
    ctx.fillRect(0, this.height / 2, this.width, this.height / 2);

    // 2. 이미지 그리기 (상/하단 중앙 배치, Cover 모드 흉내)
    try {
      const imgA = await loadImage(imageAPath);
      this.drawImageCover(ctx, imgA, 0, 0, this.width, this.height / 2 - 200); // 텍스트 공간 확보를 위해 높이 줄임

      const imgB = await loadImage(imageBPath);
      this.drawImageCover(
        ctx,
        imgB,
        0,
        this.height / 2 + 200,
        this.width,
        this.height / 2 - 200,
      );
    } catch (e) {
      console.error('Failed to load images:', e);
    }

    // 3. 텍스트 그리기
    const fontSize = 60;
    const fontFamily = fs.existsSync(this.fontPath) ? 'Pretendard' : 'Arial';
    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';

    // 텍스트 줄바꿈 처리 및 그림자
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    // 옵션 A 텍스트 (상단 중앙)
    this.wrapText(
      ctx,
      question.optionA,
      this.width / 2,
      this.height * 0.25,
      this.width - 100,
      80,
    );

    // 옵션 B 텍스트 (하단 중앙)
    this.wrapText(
      ctx,
      question.optionB,
      this.width / 2,
      this.height * 0.75,
      this.width - 100,
      80,
    );

    // 4. VS 배지 그리기 (중앙)
    ctx.shadowColor = 'transparent'; // 그림자 제거
    this.drawVSBadge(ctx);

    // 5. 파일 저장
    const fileName = `frame_${question.id}.png`;
    const filePath = path.join(this.outputDir, fileName);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buffer);

    console.log(`✅ Frame generated: ${filePath}`);
    return filePath;
  }

  // 이미지를 컨테이너에 꽉 차게 그리기 (object-fit: cover)
  private drawImageCover(
    ctx: CanvasRenderingContext2D,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    img: any,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const imgRatio = img.width / img.height;
    const containerRatio = w / h;
    let drawW, drawH, startX, startY;

    if (imgRatio > containerRatio) {
      drawH = h;
      drawW = h * imgRatio;
      startX = x - (drawW - w) / 2;
      startY = y;
    } else {
      drawW = w;
      drawH = w / imgRatio;
      startX = x;
      startY = y - (drawH - h) / 2;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, startX, startY, drawW, drawH);
    ctx.restore();
  }

  // 텍스트 자동 줄바꿈
  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) {
    const words = text.split(''); // 한글은 글자 단위로 쪼개는 게 자연스러움
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n];
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // 여러 줄 렌더링 (Y축 중심 정렬)
    const totalHeight = lines.length * lineHeight;
    const startY = y - totalHeight / 2 + lineHeight / 2;

    lines.forEach((l, i) => {
      ctx.fillText(l, x, startY + i * lineHeight);
    });
  }

  private drawVSBadge(ctx: CanvasRenderingContext2D) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = 80;

    // 원형 배지
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // VS 텍스트
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', centerX, centerY + 5);
  }
}
