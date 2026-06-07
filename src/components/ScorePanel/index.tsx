import { useMemo } from 'react'
import { X, Play, TrendingUp, Pen, Lightbulb, Award, Target } from 'lucide-react'
import { useScoreStore } from '@/store/scoreStore'
import { useCopybookStore } from '@/store/copybookStore'
import { getCopybookById } from '@/data/copybooks'
import { clsx } from 'clsx'

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = () => {
    if (score >= 90) return '#C23A2B'
    if (score >= 75) return '#8B4513'
    if (score >= 60) return '#9C7A4E'
    return '#B8956A'
  }

  const getGrade = () => {
    if (score >= 90) return '神品'
    if (score >= 80) return '妙品'
    if (score >= 70) return '能品'
    if (score >= 60) return '佳品'
    return '习之'
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E0D5BC"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${getColor()}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-calligraphy text-5xl text-ink-300 leading-none">{score}</span>
        <span className="text-xs text-ink-100 font-song mt-1">分</span>
      </div>
      <div
        className="absolute -bottom-1 px-3 py-1 rounded-sm animate-stamp"
        style={{
          backgroundColor: getColor(),
          transform: 'rotate(-3deg)',
          boxShadow: '0 2px 6px rgba(44,36,22,0.2)',
        }}
      >
        <span className="font-calligraphy text-rice-50 text-lg tracking-wider">{getGrade()}</span>
      </div>
    </div>
  )
}

function ScoreBar({
  label,
  score,
  icon: Icon,
}: {
  label: string
  score: number
  icon: typeof Pen
}) {
  const getBarColor = () => {
    if (score >= 80) return 'bg-cinnabar-300'
    if (score >= 60) return 'bg-ochre-200'
    return 'bg-ochre-100'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon size={14} className="text-ink-200" />
          <span className="text-sm font-song text-ink-200">{label}</span>
        </div>
        <span className="text-sm font-song text-ink-300 font-medium">{score}</span>
      </div>
      <div className="h-2 bg-rice-200 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out', getBarColor())}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default function ScorePanel() {
  const result = useScoreStore(s => s.result)
  const isVisible = useScoreStore(s => s.isScoreVisible)
  const hideScore = useScoreStore(s => s.hideScore)
  const setPlaybackMode = useScoreStore(s => s.setPlaybackMode)
  const resetScore = useScoreStore(s => s.reset)

  const selectedCopybookId = useCopybookStore(s => s.selectedCopybookId)
  const selectedCopybook = useMemo(() => getCopybookById(selectedCopybookId), [selectedCopybookId])
  const unlockCopybook = useCopybookStore(s => s.unlockCopybook)
  const allCopybooks = useCopybookStore(s => s.allCopybooks)

  const nextCopybook = useMemo(() => {
    if (!selectedCopybook) return null
    const idx = allCopybooks.findIndex(c => c.id === selectedCopybook.id)
    const next = allCopybooks.slice(idx + 1).find(c => c.unlocked === false)
    return next
  }, [selectedCopybook, allCopybooks])

  if (!isVisible || !result) return null

  const handleUnlockNext = () => {
    if (nextCopybook && result.totalScore >= 60) {
      unlockCopybook(nextCopybook.id)
    }
  }

  return (
    <div className="w-72 h-full flex flex-col bg-rice-50/90 backdrop-blur-sm border-l border-ochre-100/30 animate-scale-in">
      <div className="p-4 border-b border-ochre-100/30 flex items-center justify-between">
        <div>
          <h2 className="font-calligraphy text-xl text-ink-300">评分结果</h2>
          <p className="text-xs text-ink-100 font-song">
            {selectedCopybook?.character || '—'} · 结构分析
          </p>
        </div>
        <button
          onClick={() => { hideScore(); resetScore() }}
          className="p-1.5 rounded hover:bg-rice-200 transition-colors text-ink-200"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex justify-center pt-6 pb-4">
          <ScoreRing score={result.totalScore} />
        </div>

        <div className="px-4 py-3 space-y-3 border-b border-ochre-100/30">
          <ScoreBar label="结构分" score={result.structureScore} icon={Target} />
          <ScoreBar label="笔画分" score={result.strokeScore} icon={Pen} />
        </div>

        <div className="px-4 py-3 border-b border-ochre-100/30">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={14} className="text-ink-200" />
            <span className="text-sm font-song text-ink-200">关键点准确度</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {result.keypointComparisons.slice(0, 7).map((c, i) => {
              const pointScore = Math.round(c.score)
              return (
                <div
                  key={c.keypointId}
                  className="aspect-square rounded flex flex-col items-center justify-center"
                  style={{
                    backgroundColor: pointScore >= 80 ? 'rgba(194,58,43,0.1)'
                      : pointScore >= 60 ? 'rgba(156,122,78,0.15)'
                      : 'rgba(184,149,106,0.2)',
                  }}
                >
                  <span className="text-xs font-song font-medium text-ink-300">
                    {pointScore}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb size={14} className="text-ink-200" />
            <span className="text-sm font-song text-ink-200">改进建议</span>
          </div>
          <ul className="space-y-1.5">
            {result.suggestions.map((s, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs font-song text-ink-200 leading-relaxed animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="text-cinnabar-300 shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {nextCopybook && result.totalScore >= 60 && (
          <div className="px-4 pb-4">
            <div
              className="p-3 rounded-lg bg-gradient-to-br from-cinnabar-50 to-rice-100 border border-cinnabar-100/50 cursor-pointer hover:shadow-paper transition-all duration-200"
              onClick={handleUnlockNext}
            >
              <div className="flex items-center gap-2 mb-1">
                <Award size={14} className="text-cinnabar-300" />
                <span className="text-xs font-song text-cinnabar-300 font-medium">
                  恭喜解锁下一字帖
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-calligraphy text-2xl text-ink-300">
                  {nextCopybook.character}
                </span>
                <span className="text-xs text-ink-100 font-song">
                  点击解锁
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-ochre-100/30">
        <button
          onClick={() => setPlaybackMode(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-ink-300 text-rice-50 hover:bg-ink-400 transition-all duration-200 font-song text-sm shadow-paper"
        >
          <Play size={16} />
          <span>查看笔画回放</span>
        </button>
      </div>
    </div>
  )
}
