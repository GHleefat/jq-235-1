export type CalligraphyStyle = 'yan' | 'liu' | 'ou' | 'zhao'

export type CopybookCategory = 'basic' | 'single' | 'phrase'

export type PracticeMode = 'trace' | 'copy'

export interface Keypoint {
  id: string
  name: string
  x: number
  y: number
  importance: number
}

export interface PathPoint {
  x: number
  y: number
  pressure?: number
  timestamp: number
}

export interface StrokePath {
  id: string
  order: number
  points: PathPoint[]
}

export interface Copybook {
  id: string
  character: string
  style: CalligraphyStyle
  category: CopybookCategory
  difficulty: number
  order: number
  unlocked: boolean
  strokeCount: number
  keypoints: Keypoint[]
  strokePaths: StrokePath[]
}

export interface BrushPoint {
  x: number
  y: number
  velocity: number
  timestamp: number
}

export interface UserStroke {
  id: string
  points: BrushPoint[]
}

export interface WritingSession {
  copybookId: string
  strokes: UserStroke[]
  startTime: number
  endTime?: number
}

export interface KeypointComparison {
  keypointId: string
  expected: { x: number; y: number }
  actual: { x: number; y: number }
  distance: number
  score: number
}

export interface StrokeComparison {
  strokeId: string
  similarity: number
  offset: { x: number; y: number }
}

export interface ScoreResult {
  totalScore: number
  structureScore: number
  strokeScore: number
  keypointComparisons: KeypointComparison[]
  strokeComparisons: StrokeComparison[]
  suggestions: string[]
}

export const STYLE_NAMES: Record<CalligraphyStyle, string> = {
  yan: '颜体',
  liu: '柳体',
  ou: '欧体',
  zhao: '赵体',
}

export const CATEGORY_NAMES: Record<CopybookCategory, string> = {
  basic: '基本笔画',
  single: '单字练习',
  phrase: '四字成语',
}

export const MODE_NAMES: Record<PracticeMode, string> = {
  trace: '描红',
  copy: '对临',
}
