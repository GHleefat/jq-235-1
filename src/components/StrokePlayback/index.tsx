import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Play, Pause, RotateCcw, Gauge } from 'lucide-react'
import { useWritingStore } from '@/store/writingStore'
import { useScoreStore } from '@/store/scoreStore'
import {
  renderPlaybackFrame,
  advancePlayback,
  getCurrentProgress,
  type PlaybackState,
  createInitialPlaybackState,
} from '@/utils/playbackEngine'
import { clsx } from 'clsx'

interface StrokePlaybackProps {
  size: number
}

export default function StrokePlayback({ size }: StrokePlaybackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const stateRef = useRef<PlaybackState>(createInitialPlaybackState())

  const session = useWritingStore(s => s.session)
  const strokes = useMemo(() => session?.strokes || [], [session])
  const setPlaybackMode = useScoreStore(s => s.setPlaybackMode)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1)

  const render = useCallback((strokeIdx: number, pointIdx: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    renderPlaybackFrame(ctx, strokes, strokeIdx, pointIdx)
  }, [strokes])

  const loop = useCallback((timestamp: number) => {
    if (!stateRef.current.isPlaying) return

    const delta = stateRef.current.lastFrameTime
      ? timestamp - stateRef.current.lastFrameTime
      : 16
    stateRef.current.lastFrameTime = timestamp

    const { newStrokeIndex, newPointIndex, finished } = advancePlayback(
      strokes,
      stateRef.current,
      delta
    )

    stateRef.current.currentStrokeIndex = newStrokeIndex
    stateRef.current.currentPointIndex = newPointIndex

    const prog = getCurrentProgress(strokes, newStrokeIndex, newPointIndex)
    setProgress(prog)
    render(newStrokeIndex, newPointIndex)

    if (finished) {
      stateRef.current.isPlaying = false
      setIsPlaying(false)
      return
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [strokes, render])

  const handlePlayPause = () => {
    if (strokes.length === 0) return

    if (isPlaying) {
      stateRef.current.isPlaying = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setIsPlaying(false)
    } else {
      if (stateRef.current.currentStrokeIndex >= strokes.length) {
        stateRef.current.currentStrokeIndex = 0
        stateRef.current.currentPointIndex = 0
      }
      stateRef.current.isPlaying = true
      stateRef.current.lastFrameTime = 0
      stateRef.current.speed = speed
      setIsPlaying(true)
      rafRef.current = requestAnimationFrame(loop)
    }
  }

  const handleReset = () => {
    stateRef.current.isPlaying = false
    stateRef.current.currentStrokeIndex = 0
    stateRef.current.currentPointIndex = 0
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsPlaying(false)
    setProgress(0)
    render(0, 0)
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
    stateRef.current.speed = newSpeed
  }

  const handleClose = () => {
    stateRef.current.isPlaying = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPlaybackMode(false)
  }

  useEffect(() => {
    render(0, 0)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [render])

  const progressPercent = Math.round(progress * 100)

  return (
    <div className="absolute inset-0 flex flex-col bg-rice-50/95">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full"
      />

      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-rice-50 via-rice-50/95 to-transparent">
        <div className="mb-2">
          <div className="h-1.5 bg-rice-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-cinnabar-300 transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-ink-100 font-song">
            <span>回放进度</span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePlayPause}
              disabled={strokes.length === 0}
              className={clsx(
                'p-2 rounded-md transition-all duration-200',
                strokes.length === 0
                  ? 'bg-rice-200 text-ink-100/50 cursor-not-allowed'
                  : isPlaying
                  ? 'bg-ink-300 text-rice-50 hover:bg-ink-400'
                  : 'bg-cinnabar-300 text-white hover:bg-cinnabar-400 shadow-seal'
              )}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-md bg-rice-100 text-ink-200 hover:bg-rice-200 border border-ochre-100/30 transition-all duration-200"
              title="重置"
            >
              <RotateCcw size={16} />
            </button>

            <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-rice-100 rounded-md border border-ochre-100/30">
              <Gauge size={12} className="text-ink-100" />
              {[0.5, 1, 1.5, 2].map(s => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={clsx(
                    'px-1.5 py-0.5 text-xs font-song rounded transition-colors',
                    speed === s
                      ? 'bg-cinnabar-300 text-white'
                      : 'text-ink-200 hover:bg-rice-200'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-sm font-song rounded-md bg-ink-300 text-rice-50 hover:bg-ink-400 transition-all duration-200"
          >
            返回书写
          </button>
        </div>
      </div>
    </div>
  )
}
