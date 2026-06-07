import { useRef, useEffect, useCallback, useMemo } from "react";
import { useCopybookStore } from "@/store/copybookStore";
import { useWritingStore } from "@/store/writingStore";
import type { BrushPoint } from "@/types";
import { getCopybookById } from "@/data/copybooks";
import {
  calculateVelocity,
  drawBrushStroke,
  drawBrushPoint,
  drawBrushSegment,
  defaultBrushConfig,
} from "@/utils/brushEngine";
import StrokePlayback from "@/components/StrokePlayback";
import { useScoreStore } from "@/store/scoreStore";

interface CopyCanvasProps {
  size?: number;
}

const CANVAS_SIZE = 520;

export default function CopyCanvas({ size = CANVAS_SIZE }: CopyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastBrushPointRef = useRef<BrushPoint | null>(null);
  const lastRawPointRef = useRef<{
    x: number;
    y: number;
    timestamp: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const drawingRef = useRef(false);
  const pendingPointRef = useRef<BrushPoint | null>(null);

  const selectedCopybookId = useCopybookStore((s) => s.selectedCopybookId);
  const selectedCopybook = useMemo(
    () => getCopybookById(selectedCopybookId),
    [selectedCopybookId],
  );
  const showModel = useCopybookStore((s) => s.showModel);
  const showGrid = useCopybookStore((s) => s.showGrid);
  const practiceMode = useCopybookStore((s) => s.practiceMode);

  const startSession = useWritingStore((s) => s.startSession);
  const startStroke = useWritingStore((s) => s.startStroke);
  const addPoint = useWritingStore((s) => s.addPoint);
  const endStroke = useWritingStore((s) => s.endStroke);
  const brushSize = useWritingStore((s) => s.brushSize);
  const session = useWritingStore((s) => s.session);
  const strokes = useMemo(() => session?.strokes || [], [session]);

  const isPlaybackMode = useScoreStore((s) => s.isPlaybackMode);

  const getBrushConfig = useCallback(
    () => ({
      ...defaultBrushConfig,
      maxWidth: brushSize,
      minWidth: Math.max(2, brushSize * 0.15),
    }),
    [brushSize],
  );

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, canvasSize: number) => {
      ctx.save();
      ctx.strokeStyle = "rgba(139, 69, 19, 0.15)";
      ctx.lineWidth = 1;

      ctx.strokeRect(0, 0, canvasSize, canvasSize);

      ctx.beginPath();
      ctx.moveTo(0, canvasSize / 2);
      ctx.lineTo(canvasSize, canvasSize / 2);
      ctx.moveTo(canvasSize / 2, 0);
      ctx.lineTo(canvasSize / 2, canvasSize);
      ctx.stroke();

      ctx.strokeStyle = "rgba(139, 69, 19, 0.1)";
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvasSize, canvasSize);
      ctx.moveTo(canvasSize, 0);
      ctx.lineTo(0, canvasSize);
      ctx.stroke();
      ctx.restore();
    },
    [],
  );

  const drawModel = useCallback(
    (ctx: CanvasRenderingContext2D, canvasSize: number) => {
      if (!selectedCopybook || !showModel) return;

      const opacity = practiceMode === "trace" ? 0.25 : 0.12;

      ctx.save();
      ctx.font = `${canvasSize * 0.85}px "Ma Shan Zheng", "ZCOOL XiaoWei", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(44, 36, 22, ${opacity})`;

      const chars = selectedCopybook.character;
      if (chars.length === 1) {
        ctx.fillText(chars, canvasSize / 2, canvasSize / 2 + canvasSize * 0.02);
      } else {
        const charSize = canvasSize / Math.ceil(Math.sqrt(chars.length));
        const cols = Math.ceil(Math.sqrt(chars.length));
        const rows = Math.ceil(chars.length / cols);
        const offsetX = (canvasSize - cols * charSize) / 2;
        const offsetY = (canvasSize - rows * charSize) / 2;

        chars.split("").forEach((char, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          ctx.font = `${charSize * 0.9}px "Ma Shan Zheng", "ZCOOL XiaoWei", serif`;
          ctx.fillText(
            char,
            offsetX + col * charSize + charSize / 2,
            offsetY + row * charSize + charSize / 2 + charSize * 0.02,
          );
        });
      }
      ctx.restore();
    },
    [selectedCopybook, showModel, practiceMode],
  );

  const renderBackground = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = "#FAF7F0";
    ctx.fillRect(0, 0, size, size);

    if (showGrid) {
      drawGrid(ctx, size);
    }

    drawModel(ctx, size);
  }, [size, showGrid, drawGrid, drawModel]);

  const renderStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    const config = {
      ...defaultBrushConfig,
      maxWidth: brushSize,
      minWidth: Math.max(2, brushSize * 0.15),
    };

    strokes.forEach((stroke) => {
      if (stroke.points.length === 1) {
        drawBrushPoint(ctx, stroke.points[0], config);
      } else {
        drawBrushStroke(ctx, stroke.points, config);
      }
    });
  }, [size, strokes, brushSize]);

  useEffect(() => {
    renderBackground();
  }, [renderBackground]);

  useEffect(() => {
    if (!isPlaybackMode) {
      renderStrokes();
    }
  }, [renderStrokes, isPlaybackMode, strokes.length]);

  useEffect(() => {
    if (selectedCopybook) {
      startSession(selectedCopybook.id);
    }
  }, [selectedCopybook, startSession]);

  const getCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      timestamp: performance.now(),
    };
  };

  const flushPendingDraw = useCallback(() => {
    const pending = pendingPointRef.current;
    const lastBrush = lastBrushPointRef.current;
    if (!pending || !lastBrush) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawBrushSegment(ctx, lastBrush, pending, getBrushConfig());
    lastBrushPointRef.current = pending;
    pendingPointRef.current = null;
  }, [getBrushConfig]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPlaybackMode) return;
    e.preventDefault();

    const coords = getCanvasCoords(e);
    if (!coords) return;

    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    lastRawPointRef.current = null;
    lastBrushPointRef.current = null;
    pendingPointRef.current = null;

    const brushPoint: BrushPoint = {
      x: coords.x,
      y: coords.y,
      velocity: 0,
      timestamp: coords.timestamp,
    };
    startStroke(brushPoint);
    lastRawPointRef.current = coords;
    lastBrushPointRef.current = brushPoint;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawBrushPoint(ctx, brushPoint, getBrushConfig());
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPlaybackMode || !drawingRef.current) return;
    e.preventDefault();

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const velocity = calculateVelocity(lastRawPointRef.current, coords);
    const brushPoint: BrushPoint = {
      x: coords.x,
      y: coords.y,
      velocity,
      timestamp: coords.timestamp,
    };
    addPoint(brushPoint);
    lastRawPointRef.current = coords;
    pendingPointRef.current = brushPoint;

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        flushPendingDraw();
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    drawingRef.current = false;
    endStroke();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    flushPendingDraw();

    lastRawPointRef.current = null;
    lastBrushPointRef.current = null;
    pendingPointRef.current = null;
  };

  return (
    <div className="relative">
      <div
        className="relative rounded-lg shadow-paper-lg overflow-hidden border border-ochre-100/30"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={bgCanvasRef}
          width={size}
          height={size}
          className="absolute inset-0"
        />

        {isPlaybackMode ? (
          <StrokePlayback size={size} />
        ) : (
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="absolute inset-0 cursor-crosshair touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        )}

        <div className="absolute top-3 left-3 px-2 py-1 bg-rice-50/90 border border-ochre-100/40 rounded text-xs text-ink-200 font-song">
          {selectedCopybook?.character || "—"}
        </div>
      </div>
    </div>
  );
}
