import { create } from 'zustand'
import type { BrushPoint, UserStroke, WritingSession } from '@/types'

interface WritingState {
  session: WritingSession | null
  isDrawing: boolean
  brushSize: number

  startSession: (copybookId: string) => void
  endSession: () => void
  startStroke: (point: BrushPoint) => void
  addPoint: (point: BrushPoint) => void
  endStroke: () => void
  undoStroke: () => void
  clearAll: () => void
  setBrushSize: (size: number) => void
  getCurrentStroke: () => UserStroke | null
  getAllStrokes: () => UserStroke[]
}

export const useWritingStore = create<WritingState>((set, get) => ({
  session: null,
  isDrawing: false,
  brushSize: 24,

  startSession: (copybookId) => {
    set({
      session: {
        copybookId,
        strokes: [],
        startTime: Date.now(),
      },
      isDrawing: false,
    })
  },

  endSession: () => {
    set(state => ({
      session: state.session
        ? { ...state.session, endTime: Date.now() }
        : null,
      isDrawing: false,
    }))
  },

  startStroke: (point) => {
    set(state => {
      if (!state.session) return state
      const newStroke: UserStroke = {
        id: `stroke-${Date.now()}`,
        points: [point],
      }
      return {
        isDrawing: true,
        session: {
          ...state.session,
          strokes: [...state.session.strokes, newStroke],
        },
      }
    })
  },

  addPoint: (point) => {
    set(state => {
      if (!state.session || !state.isDrawing || state.session.strokes.length === 0) {
        return state
      }
      const strokes = [...state.session.strokes]
      const lastStroke = strokes[strokes.length - 1]
      strokes[strokes.length - 1] = {
        ...lastStroke,
        points: [...lastStroke.points, point],
      }
      return {
        session: {
          ...state.session,
          strokes,
        },
      }
    })
  },

  endStroke: () => {
    set({ isDrawing: false })
  },

  undoStroke: () => {
    set(state => {
      if (!state.session || state.session.strokes.length === 0) return state
      return {
        session: {
          ...state.session,
          strokes: state.session.strokes.slice(0, -1),
        },
      }
    })
  },

  clearAll: () => {
    set(state => {
      if (!state.session) return state
      return {
        session: {
          ...state.session,
          strokes: [],
        },
        isDrawing: false,
      }
    })
  },

  setBrushSize: (size) => set({ brushSize: size }),

  getCurrentStroke: () => {
    const { session, isDrawing } = get()
    if (!session || !isDrawing || session.strokes.length === 0) return null
    return session.strokes[session.strokes.length - 1]
  },

  getAllStrokes: () => {
    return get().session?.strokes || []
  },
}))
