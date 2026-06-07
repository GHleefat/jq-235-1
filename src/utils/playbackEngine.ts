import type { UserStroke, BrushPoint } from '@/types'
import { drawBrushStroke, drawBrushPoint, defaultBrushConfig } from './brushEngine'

export interface PlaybackState {
  isPlaying: boolean
  currentStrokeIndex: number
  currentPointIndex: number
  speed: number
  startTime: number
  lastFrameTime: number
}

export function createInitialPlaybackState(): PlaybackState {
  return {
    isPlaying: false,
    currentStrokeIndex: 0,
    currentPointIndex: 0,
    speed: 1,
    startTime: 0,
    lastFrameTime: 0,
  }
}

export function getTotalPoints(strokes: UserStroke[]): number {
  return strokes.reduce((sum, s) => sum + s.points.length, 0)
}

export function getCurrentProgress(
  strokes: UserStroke[],
  strokeIndex: number,
  pointIndex: number
): number {
  let completed = 0
  for (let i = 0; i < strokeIndex; i++) {
    completed += strokes[i].points.length
  }
  completed += pointIndex
  const total = getTotalPoints(strokes)
  return total > 0 ? completed / total : 0
}

export function renderPlaybackFrame(
  ctx: CanvasRenderingContext2D,
  strokes: UserStroke[],
  strokeIndex: number,
  pointIndex: number
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  for (let i = 0; i < strokeIndex; i++) {
    drawBrushStroke(ctx, strokes[i].points, defaultBrushConfig)
  }

  if (strokeIndex < strokes.length) {
    const currentStroke = strokes[strokeIndex]
    const visiblePoints = currentStroke.points.slice(0, pointIndex + 1)

    if (visiblePoints.length === 1) {
      drawBrushPoint(ctx, visiblePoints[0], defaultBrushConfig)
    } else if (visiblePoints.length > 1) {
      drawBrushStroke(ctx, visiblePoints, defaultBrushConfig)
    }
  }
}

export function renderExpectedStroke(
  ctx: CanvasRenderingContext2D,
  strokePoints: Array<{ x: number; y: number }>,
  canvasSize: number,
  color: string = 'rgba(194, 58, 43, 0.3)'
) {
  if (strokePoints.length < 2) return

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([6, 4])

  ctx.beginPath()
  const scaledPoints = strokePoints.map(p => ({
    x: p.x * canvasSize,
    y: p.y * canvasSize,
  }))

  ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y)
  for (let i = 1; i < scaledPoints.length; i++) {
    ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y)
  }
  ctx.stroke()
  ctx.restore()
}

export function advancePlayback(
  strokes: UserStroke[],
  state: PlaybackState,
  deltaTime: number
): { newStrokeIndex: number; newPointIndex: number; finished: boolean } {
  let newStrokeIndex = state.currentStrokeIndex
  let newPointIndex = state.currentPointIndex
  let finished = false

  if (newStrokeIndex >= strokes.length) {
    return { newStrokeIndex, newPointIndex, finished: true }
  }

  const pointsToAdvance = Math.max(1, Math.floor(deltaTime * 0.06 * state.speed))

  for (let i = 0; i < pointsToAdvance; i++) {
    if (newStrokeIndex >= strokes.length) {
      finished = true
      break
    }

    const currentStroke = strokes[newStrokeIndex]
    newPointIndex++

    if (newPointIndex >= currentStroke.points.length) {
      newStrokeIndex++
      newPointIndex = 0
    }
  }

  return { newStrokeIndex, newPointIndex, finished }
}

export interface PlaybackController {
  play: () => void
  pause: () => void
  reset: () => void
  setSpeed: (speed: number) => void
  getProgress: () => number
  isPlaying: () => boolean
}
