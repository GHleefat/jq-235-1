import { useMemo } from 'react'
import { Undo2, Trash2, Check, Eye, EyeOff, Grid3X3, Minus, Plus } from 'lucide-react'
import { useCopybookStore } from '@/store/copybookStore'
import { useWritingStore } from '@/store/writingStore'
import { useScoreStore } from '@/store/scoreStore'
import { STYLE_NAMES } from '@/types'
import { getCopybookById } from '@/data/copybooks'
import { clsx } from 'clsx'

export default function Toolbar() {
  const selectedCopybookId = useCopybookStore(s => s.selectedCopybookId)
  const selectedCopybook = useMemo(() => getCopybookById(selectedCopybookId), [selectedCopybookId])
  const showModel = useCopybookStore(s => s.showModel)
  const showGrid = useCopybookStore(s => s.showGrid)
  const toggleShowModel = useCopybookStore(s => s.toggleShowModel)
  const toggleShowGrid = useCopybookStore(s => s.toggleShowGrid)

  const undoStroke = useWritingStore(s => s.undoStroke)
  const clearAll = useWritingStore(s => s.clearAll)
  const brushSize = useWritingStore(s => s.brushSize)
  const setBrushSize = useWritingStore(s => s.setBrushSize)
  const session = useWritingStore(s => s.session)
  const strokes = useMemo(() => session?.strokes || [], [session])

  const isScoreVisible = useScoreStore(s => s.isScoreVisible)
  const calculateAndShow = useScoreStore(s => s.calculateAndShow)
  const hideScore = useScoreStore(s => s.hideScore)
  const resetScore = useScoreStore(s => s.reset)
  const setPlaybackMode = useScoreStore(s => s.setPlaybackMode)
  const isPlaybackMode = useScoreStore(s => s.isPlaybackMode)

  const handleScore = () => {
    if (!selectedCopybook) return
    if (isScoreVisible) {
      hideScore()
    } else {
      setPlaybackMode(false)
      calculateAndShow(strokes, selectedCopybook, 520)
    }
  }

  const handleClear = () => {
    clearAll()
    resetScore()
    setPlaybackMode(false)
  }

  return (
    <div className="w-full px-4 py-3 bg-rice-50/90 backdrop-blur-sm border-b border-ochre-100/30 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-calligraphy text-3xl text-ink-300 leading-none">墨韵</span>
            <span className="text-xs text-ink-100 font-song">在线临帖</span>
          </div>
        </div>

        {selectedCopybook && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rice-100 rounded-md border border-ochre-100/30">
            <span className="font-calligraphy text-2xl text-ink-300">{selectedCopybook.character}</span>
            <div className="text-xs text-ink-100 font-song">
              <div>{STYLE_NAMES[selectedCopybook.style]}</div>
              <div>{selectedCopybook.strokeCount} 笔</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-rice-100 rounded-md border border-ochre-100/30">
          <span className="text-xs text-ink-100 font-song mr-1">笔触</span>
          <button
            onClick={() => setBrushSize(Math.max(8, brushSize - 4))}
            className="p-1 rounded hover:bg-rice-200 transition-colors"
            disabled={brushSize <= 8}
          >
            <Minus size={14} className="text-ink-200" />
          </button>
          <span className="w-6 text-center text-sm text-ink-300 font-song">{brushSize}</span>
          <button
            onClick={() => setBrushSize(Math.min(50, brushSize + 4))}
            className="p-1 rounded hover:bg-rice-200 transition-colors"
            disabled={brushSize >= 50}
          >
            <Plus size={14} className="text-ink-200" />
          </button>
        </div>

        <button
          onClick={toggleShowGrid}
          className={clsx(
            'p-2 rounded-md transition-all duration-200',
            showGrid
              ? 'bg-ink-300 text-rice-50'
              : 'bg-rice-100 text-ink-200 hover:bg-rice-200 border border-ochre-100/30'
          )}
          title={showGrid ? '隐藏米字格' : '显示米字格'}
        >
          <Grid3X3 size={18} />
        </button>

        <button
          onClick={toggleShowModel}
          className={clsx(
            'p-2 rounded-md transition-all duration-200',
            showModel
              ? 'bg-ink-300 text-rice-50'
              : 'bg-rice-100 text-ink-200 hover:bg-rice-200 border border-ochre-100/30'
          )}
          title={showModel ? '隐藏范字' : '显示范字'}
        >
          {showModel ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>

        <div className="w-px h-6 bg-ochre-100/40 mx-1" />

        <button
          onClick={undoStroke}
          disabled={strokes.length === 0 || isPlaybackMode}
          className="p-2 rounded-md bg-rice-100 text-ink-200 hover:bg-rice-200 border border-ochre-100/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title="撤销上一笔"
        >
          <Undo2 size={18} />
        </button>

        <button
          onClick={handleClear}
          disabled={strokes.length === 0 && !isScoreVisible}
          className="p-2 rounded-md bg-rice-100 text-ink-200 hover:bg-cinnabar-50 hover:text-cinnabar-300 border border-ochre-100/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title="清空画布"
        >
          <Trash2 size={18} />
        </button>

        <div className="w-px h-6 bg-ochre-100/40 mx-1" />

        <button
          onClick={handleScore}
          disabled={isPlaybackMode}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-2 rounded-md font-song text-sm transition-all duration-200 shadow-paper',
            isScoreVisible
              ? 'bg-ink-300 text-rice-50 hover:bg-ink-400'
              : 'bg-cinnabar-300 text-white hover:bg-cinnabar-400 shadow-seal'
          )}
        >
          <Check size={16} />
          <span>{isScoreVisible ? '隐藏评分' : '完成评分'}</span>
        </button>
      </div>
    </div>
  )
}
