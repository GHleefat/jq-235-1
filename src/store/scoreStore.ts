import { create } from 'zustand'
import type { ScoreResult, UserStroke, Copybook } from '@/types'
import { calculateScore } from '@/utils/scoringEngine'

interface ScoreState {
  result: ScoreResult | null
  isScoreVisible: boolean
  isPlaybackMode: boolean

  calculateAndShow: (strokes: UserStroke[], copybook: Copybook, canvasSize: number) => void
  hideScore: () => void
  setPlaybackMode: (enabled: boolean) => void
  reset: () => void
}

export const useScoreStore = create<ScoreState>((set) => ({
  result: null,
  isScoreVisible: false,
  isPlaybackMode: false,

  calculateAndShow: (strokes, copybook, canvasSize) => {
    if (strokes.length === 0) {
      set({
        result: {
          totalScore: 0,
          structureScore: 0,
          strokeScore: 0,
          keypointComparisons: [],
          strokeComparisons: [],
          suggestions: ['请先书写内容后再进行评分'],
        },
        isScoreVisible: true,
      })
      return
    }

    const result = calculateScore(strokes, copybook.keypoints, canvasSize)
    set({ result, isScoreVisible: true })
  },

  hideScore: () => set({ isScoreVisible: false }),

  setPlaybackMode: (enabled) => set({ isPlaybackMode: enabled }),

  reset: () => set({ result: null, isScoreVisible: false, isPlaybackMode: false }),
}))
