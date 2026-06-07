import type { Copybook, CalligraphyStyle, CopybookCategory } from '@/types'

function generateKeypoints(char: string, style: CalligraphyStyle) {
  const base = [
    { id: 'k1', name: '起笔点', x: 0.25, y: 0.2, importance: 0.9 },
    { id: 'k2', name: '左高点', x: 0.2, y: 0.35, importance: 0.7 },
    { id: 'k3', name: '中心', x: 0.5, y: 0.5, importance: 1.0 },
    { id: 'k4', name: '右高点', x: 0.8, y: 0.35, importance: 0.7 },
    { id: 'k5', name: '收笔点', x: 0.75, y: 0.8, importance: 0.9 },
    { id: 'k6', name: '左下点', x: 0.25, y: 0.75, importance: 0.6 },
    { id: 'k7', name: '右下点', x: 0.75, y: 0.75, importance: 0.6 },
  ]
  return base.map((k, i) => ({
    ...k,
    x: 0.15 + (i % 3) * 0.35 + (char.charCodeAt(0) % 10) * 0.005,
    y: 0.15 + Math.floor(i / 3) * 0.3 + (style.length * i) % 5 * 0.01,
  }))
}

function generateStrokePaths(strokeCount: number) {
  const paths = []
  for (let i = 0; i < strokeCount; i++) {
    const points = []
    const startX = 0.2 + (i % 3) * 0.2
    const startY = 0.15 + i * 0.15
    const endX = 0.3 + (i % 4) * 0.15
    const endY = 0.25 + i * 0.12
    for (let t = 0; t <= 1; t += 0.05) {
      points.push({
        x: startX + (endX - startX) * t + Math.sin(t * Math.PI) * 0.1,
        y: startY + (endY - startY) * t,
        pressure: 0.5 + Math.sin(t * Math.PI) * 0.3,
        timestamp: t * 2000,
      })
    }
    paths.push({
      id: `s${i}`,
      order: i + 1,
      points,
    })
  }
  return paths
}

const basicStrokes: { char: string; name: string; strokes: number }[] = [
  { char: '一', name: '横', strokes: 1 },
  { char: '丨', name: '竖', strokes: 1 },
  { char: '丿', name: '撇', strokes: 1 },
  { char: '丶', name: '捺', strokes: 1 },
  { char: '丶', name: '点', strokes: 1 },
  { char: '亅', name: '钩', strokes: 1 },
  { char: '乛', name: '折', strokes: 1 },
  { char: '乙', name: '弯', strokes: 1 },
]

const singleChars: { char: string; strokes: number }[] = [
  { char: '永', strokes: 5 },
  { char: '人', strokes: 2 },
  { char: '大', strokes: 3 },
  { char: '天', strokes: 4 },
  { char: '中', strokes: 4 },
  { char: '国', strokes: 8 },
  { char: '山', strokes: 3 },
  { char: '水', strokes: 4 },
  { char: '风', strokes: 4 },
  { char: '月', strokes: 4 },
  { char: '花', strokes: 7 },
  { char: '龙', strokes: 5 },
]

const phrases: { chars: string[]; strokes: number }[] = [
  { chars: ['天', '道', '酬', '勤'], strokes: 37 },
  { chars: ['心', '旷', '神', '怡'], strokes: 30 },
  { chars: ['风', '和', '日', '丽'], strokes: 26 },
  { chars: ['万', '象', '更', '新'], strokes: 29 },
  { chars: ['学', '海', '无', '涯'], strokes: 30 },
  { chars: ['志', '存', '高', '远'], strokes: 25 },
]

const styles: CalligraphyStyle[] = ['yan', 'liu', 'ou', 'zhao']

export const copybooks: Copybook[] = []

let order = 1

styles.forEach((style, si) => {
  basicStrokes.forEach((item, i) => {
    copybooks.push({
      id: `${style}-basic-${i}`,
      character: item.char,
      style,
      category: 'basic',
      difficulty: 1,
      order: order++,
      unlocked: si === 0 && i === 0,
      strokeCount: item.strokes,
      keypoints: generateKeypoints(item.char, style),
      strokePaths: generateStrokePaths(item.strokes),
    })
  })
})

styles.forEach((style, si) => {
  singleChars.forEach((item, i) => {
    copybooks.push({
      id: `${style}-single-${i}`,
      character: item.char,
      style,
      category: 'single',
      difficulty: si === 0 ? Math.min(2 + Math.floor(i / 4), 4) : Math.min(3 + Math.floor(i / 4), 5),
      order: order++,
      unlocked: si === 0 && i < 3,
      strokeCount: item.strokes,
      keypoints: generateKeypoints(item.char, style),
      strokePaths: generateStrokePaths(item.strokes),
    })
  })
})

styles.forEach((style, si) => {
  phrases.forEach((item, i) => {
    copybooks.push({
      id: `${style}-phrase-${i}`,
      character: item.chars.join(''),
      style,
      category: 'phrase',
      difficulty: 5,
      order: order++,
      unlocked: si === 0 && i === 0,
      strokeCount: item.strokes,
      keypoints: generateKeypoints(item.chars[0], style),
      strokePaths: generateStrokePaths(Math.min(item.strokes, 12)),
    })
  })
})

export function getCopybooksByCategory(category: CopybookCategory, style?: CalligraphyStyle) {
  return copybooks.filter(c => c.category === category && (!style || c.style === style))
}

export function getCopybookById(id: string) {
  return copybooks.find(c => c.id === id)
}
