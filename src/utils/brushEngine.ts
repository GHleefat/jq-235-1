import type { BrushPoint } from "@/types";

export interface BrushConfig {
  maxWidth: number;
  minWidth: number;
  widthFactor: number;
  velocityThreshold: number;
  feibaiThreshold: number;
  color: string;
}

export const defaultBrushConfig: BrushConfig = {
  maxWidth: 30,
  minWidth: 4,
  widthFactor: 0.12,
  velocityThreshold: 10,
  feibaiThreshold: 25,
  color: "#2C2416",
};

export function calculateVelocity(
  prev: { x: number; y: number; timestamp: number } | null,
  curr: { x: number; y: number; timestamp: number },
): number {
  if (!prev) return 0;
  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const timeDelta = Math.max(curr.timestamp - prev.timestamp, 1);
  return (distance / timeDelta) * 16;
}

export function calculateBrushWidth(
  velocity: number,
  config: BrushConfig,
): number {
  const width = config.maxWidth - velocity * config.widthFactor;
  return Math.max(config.minWidth, Math.min(config.maxWidth, width));
}

export function calculateAlpha(velocity: number, config: BrushConfig): number {
  if (velocity < config.feibaiThreshold) return 1;
  const excess = velocity - config.feibaiThreshold;
  const alpha = Math.max(0.45, 1 - excess * 0.02);
  return alpha;
}

export function shouldSkipFeibai(
  velocity: number,
  config: BrushConfig,
): boolean {
  if (velocity < config.feibaiThreshold) return false;
  const excess = velocity - config.feibaiThreshold;
  const probability = Math.min(0.2, excess * 0.008);
  return Math.random() < probability;
}

export function interpolatePoints(
  prev: BrushPoint,
  curr: BrushPoint,
  minGap: number = 3,
): BrushPoint[] {
  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= minGap) return [curr];

  const steps = Math.ceil(distance / minGap);
  const result: BrushPoint[] = [];
  const dt = curr.timestamp - prev.timestamp;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    result.push({
      x: prev.x + dx * t,
      y: prev.y + dy * t,
      velocity: prev.velocity + (curr.velocity - prev.velocity) * t,
      timestamp: prev.timestamp + dt * t,
    });
  }

  return result;
}

export function smoothPoint(
  prev: BrushPoint | null,
  curr: { x: number; y: number; timestamp: number },
  smoothing: number = 0.3,
): { x: number; y: number } {
  if (!prev) return { x: curr.x, y: curr.y };
  return {
    x: prev.x + (curr.x - prev.x) * smoothing,
    y: prev.y + (curr.y - prev.y) * smoothing,
  };
}

export function quadraticControlPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: p1.x * 2 - (p0.x + p2.x) / 2,
    y: p1.y * 2 - (p0.y + p2.y) / 2,
  };
}

export function drawBrushSegment(
  ctx: CanvasRenderingContext2D,
  prev: BrushPoint,
  curr: BrushPoint,
  config: BrushConfig = defaultBrushConfig,
) {
  const subPoints = interpolatePoints(prev, curr, 2);
  let drawPrev = prev;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const subCurr of subPoints) {
    const width = calculateBrushWidth(subCurr.velocity, config);
    const alpha = calculateAlpha(subCurr.velocity, config);

    if (shouldSkipFeibai(subCurr.velocity, config)) {
      drawPrev = subCurr;
      continue;
    }

    const midX = (drawPrev.x + subCurr.x) / 2;
    const midY = (drawPrev.y + subCurr.y) / 2;
    const prevWidth = calculateBrushWidth(drawPrev.velocity, config);

    ctx.strokeStyle = hexToRgba(config.color, alpha);
    ctx.lineWidth = (prevWidth + width) / 2;

    ctx.beginPath();
    ctx.moveTo(drawPrev.x, drawPrev.y);
    ctx.quadraticCurveTo(midX, midY, subCurr.x, subCurr.y);
    ctx.stroke();

    drawPrev = subCurr;
  }

  ctx.restore();
}

export function drawBrushStroke(
  ctx: CanvasRenderingContext2D,
  points: BrushPoint[],
  config: BrushConfig = defaultBrushConfig,
) {
  if (points.length < 2) return;

  for (let i = 1; i < points.length; i++) {
    drawBrushSegment(ctx, points[i - 1], points[i], config);
  }
}

export function drawBrushPoint(
  ctx: CanvasRenderingContext2D,
  point: { x: number; y: number },
  config: BrushConfig = defaultBrushConfig,
) {
  ctx.save();
  ctx.fillStyle = config.color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, config.minWidth * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
