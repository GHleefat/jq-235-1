import type {
  UserStroke,
  Keypoint,
  KeypointComparison,
  StrokeComparison,
  ScoreResult,
} from '@/types'

interface Point {
  x: number
  y: number
}

function normalizeStroke(points: Point[], canvasSize: number): Point[] {
  return points.map(p => ({
    x: p.x / canvasSize,
    y: p.y / canvasSize,
  }))
}

function euclideanDistance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function extractUserKeypoints(strokes: UserStroke[]): Point[] {
  const keypoints: Point[] = []

  strokes.forEach(stroke => {
    if (stroke.points.length < 2) return

    keypoints.push({
      x: stroke.points[0].x,
      y: stroke.points[0].y,
    })

    if (stroke.points.length > 4) {
      const step = Math.floor(stroke.points.length / 3)
      for (let i = step; i < stroke.points.length - 1; i += step) {
        const p = stroke.points[i]
        const prev = stroke.points[i - 1]
        const next = stroke.points[i + 1]

        const v1x = p.x - prev.x
        const v1y = p.y - prev.y
        const v2x = next.x - p.x
        const v2y = next.y - p.y

        const dot = v1x * v2x + v1y * v2y
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y)
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y)

        if (mag1 > 0 && mag2 > 0) {
          const cosAngle = dot / (mag1 * mag2)
          if (cosAngle < 0.7) {
            keypoints.push({ x: p.x, y: p.y })
          }
        }
      }
    }

    keypoints.push({
      x: stroke.points[stroke.points.length - 1].x,
      y: stroke.points[stroke.points.length - 1].y,
    })
  })

  return keypoints
}

function matchKeypoints(
  expected: Keypoint[],
  actual: Point[]
): Array<{ expected: Keypoint; actual: Point }> {
  const matches: Array<{ expected: Keypoint; actual: Point }> = []
  const usedActual = new Set<number>()

  expected.forEach(exp => {
    let bestIdx = -1
    let bestDist = Infinity

    actual.forEach((act, idx) => {
      if (usedActual.has(idx)) return
      const dist = euclideanDistance(
        { x: exp.x, y: exp.y },
        { x: act.x, y: act.y }
      )
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = idx
      }
    })

    if (bestIdx >= 0) {
      usedActual.add(bestIdx)
      matches.push({ expected: exp, actual: actual[bestIdx] })
    }
  })

  return matches
}

function calculateDistanceScore(distance: number): number {
  const maxDist = 0.4
  const clamped = Math.min(distance, maxDist)
  return Math.max(0, (1 - clamped / maxDist) * 100)
}

function calculateStrokeSimilarity(
  userPoints: Point[],
  expectedStart: Point,
  expectedEnd: Point
): number {
  if (userPoints.length < 2) return 0

  const userStart = userPoints[0]
  const userEnd = userPoints[userPoints.length - 1]

  const startDist = euclideanDistance(userStart, expectedStart)
  const endDist = euclideanDistance(userEnd, expectedEnd)

  const avgDist = (startDist + endDist) / 2
  return calculateDistanceScore(avgDist)
}

function generateSuggestions(
  structureScore: number,
  strokeScore: number,
  comparisons: KeypointComparison[]
): string[] {
  const suggestions: string[] = []

  if (structureScore < 60) {
    suggestions.push('整体结构偏差较大，建议先观察范字的间架结构再下笔')
  } else if (structureScore < 80) {
    suggestions.push('结构基本合理，注意各部分之间的比例关系')
  }

  if (strokeScore < 60) {
    suggestions.push('笔画书写不够流畅，注意起笔、行笔、收笔的节奏')
  } else if (strokeScore < 80) {
    suggestions.push('笔画基本到位，可以加强运笔的提按变化')
  }

  const worstPoints = comparisons
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)

  worstPoints.forEach(c => {
    if (c.distance > 0.15) {
      suggestions.push(`注意${c.keypointId.includes('k1') ? '起笔' : c.keypointId.includes('k5') ? '收笔' : '转折'}位置的准确性`)
    }
  })

  if (suggestions.length === 0) {
    suggestions.push('写得很好！继续保持，可以尝试提高运笔速度增加笔触变化')
  }

  return suggestions.slice(0, 4)
}

export function calculateScore(
  userStrokes: UserStroke[],
  expectedKeypoints: Keypoint[],
  canvasSize: number
): ScoreResult {
  const normalizedStrokes = userStrokes.map(s => ({
    ...s,
    points: normalizeStroke(s.points.map(p => ({ x: p.x, y: p.y })), canvasSize),
  }))

  const userKeypointsRaw = extractUserKeypoints(userStrokes)
  const userKeypoints = normalizeStroke(userKeypointsRaw, canvasSize)

  const matches = matchKeypoints(expectedKeypoints, userKeypoints)

  const keypointComparisons: KeypointComparison[] = matches.map(m => {
    const distance = euclideanDistance(
      { x: m.expected.x, y: m.expected.y },
      m.actual
    )
    return {
      keypointId: m.expected.id,
      expected: { x: m.expected.x, y: m.expected.y },
      actual: m.actual,
      distance,
      score: calculateDistanceScore(distance) * m.expected.importance,
    }
  })

  expectedKeypoints.forEach(kp => {
    if (!keypointComparisons.find(c => c.keypointId === kp.id)) {
      keypointComparisons.push({
        keypointId: kp.id,
        expected: { x: kp.x, y: kp.y },
        actual: { x: 0.5, y: 0.5 },
        distance: 0.3,
        score: 20,
      })
    }
  })

  const totalImportance = keypointComparisons.reduce((sum, c, i) => {
    const kp = expectedKeypoints.find(k => k.id === c.keypointId)
    return sum + (kp?.importance || 0.5)
  }, 0)

  const weightedStructureScore = keypointComparisons.reduce((sum, c) => {
    const kp = expectedKeypoints.find(k => k.id === c.keypointId)
    return sum + c.score * (kp?.importance || 0.5)
  }, 0) / totalImportance

  const strokeComparisons: StrokeComparison[] = normalizedStrokes.map((s, i) => {
    const expectedStart = { x: 0.2 + (i % 3) * 0.2, y: 0.15 + i * 0.1 }
    const expectedEnd = { x: 0.6 + (i % 3) * 0.15, y: 0.3 + i * 0.12 }
    const similarity = calculateStrokeSimilarity(s.points, expectedStart, expectedEnd)
    return {
      strokeId: s.id,
      similarity,
      offset: { x: 0, y: 0 },
    }
  })

  const strokeScore = strokeComparisons.length > 0
    ? strokeComparisons.reduce((sum, s) => sum + s.similarity, 0) / strokeComparisons.length
    : 0

  const totalScore = Math.round(weightedStructureScore * 0.65 + strokeScore * 0.35)

  return {
    totalScore,
    structureScore: Math.round(weightedStructureScore),
    strokeScore: Math.round(strokeScore),
    keypointComparisons,
    strokeComparisons,
    suggestions: generateSuggestions(weightedStructureScore, strokeScore, keypointComparisons),
  }
}
