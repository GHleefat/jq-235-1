import { useState, useMemo } from 'react'
import { Lock, Star, PenTool } from 'lucide-react'
import {
  CopybookCategory,
  CalligraphyStyle,
  PracticeMode,
  STYLE_NAMES,
  CATEGORY_NAMES,
  MODE_NAMES,
} from '@/types'
import { useCopybookStore } from '@/store/copybookStore'
import { useWritingStore } from '@/store/writingStore'
import { useScoreStore } from '@/store/scoreStore'
import { clsx } from 'clsx'

const categories: { id: CopybookCategory; icon: typeof PenTool; desc: string }[] = [
  { id: 'basic', icon: PenTool, desc: '点横竖撇捺' },
  { id: 'single', icon: Star, desc: '常用单字练习' },
  { id: 'phrase', icon: Star, desc: '四字成语' },
]

const styles: CalligraphyStyle[] = ['yan', 'liu', 'ou', 'zhao']
const modes: PracticeMode[] = ['trace', 'copy']

export default function CharacterSelector() {
  const selectedCategory = useCopybookStore(s => s.selectedCategory)
  const selectedStyle = useCopybookStore(s => s.selectedStyle)
  const selectedCopybookId = useCopybookStore(s => s.selectedCopybookId)
  const practiceMode = useCopybookStore(s => s.practiceMode)
  const allCopybooks = useCopybookStore(s => s.allCopybooks)
  const setCategory = useCopybookStore(s => s.setCategory)
  const setStyle = useCopybookStore(s => s.setStyle)
  const setCopybook = useCopybookStore(s => s.setCopybook)
  const setPracticeMode = useCopybookStore(s => s.setPracticeMode)

  const clearAll = useWritingStore(s => s.clearAll)
  const resetScore = useScoreStore(s => s.reset)
  const setPlaybackMode = useScoreStore(s => s.setPlaybackMode)

  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filteredCopybooks = useMemo(() => {
    return allCopybooks.filter(
      c => c.category === selectedCategory && c.style === selectedStyle
    )
  }, [allCopybooks, selectedCategory, selectedStyle])

  const handleSelectCopybook = (id: string, unlocked: boolean) => {
    if (!unlocked) return
    setCopybook(id)
    clearAll()
    resetScore()
    setPlaybackMode(false)
  }

  return (
    <div className="w-64 h-full flex flex-col bg-rice-50/80 backdrop-blur-sm border-r border-ochre-100/30">
      <div className="p-4 border-b border-ochre-100/30">
        <h2 className="font-calligraphy text-2xl text-ink-300 mb-1">字帖选择</h2>
        <p className="text-xs text-ink-100 font-song">循序渐进，从笔画到章法</p>
      </div>

      <div className="px-4 py-3 border-b border-ochre-100/30">
        <p className="text-xs text-ink-100 font-song mb-2">分类</p>
        <div className="flex flex-col gap-1.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all duration-200',
                selectedCategory === cat.id
                  ? 'bg-cinnabar-300 text-white shadow-seal'
                  : 'hover:bg-rice-200/60 text-ink-200'
              )}
            >
              <cat.icon size={16} className="shrink-0" />
              <div>
                <div className="text-sm font-song font-medium">{CATEGORY_NAMES[cat.id]}</div>
                <div className={clsx(
                  'text-xs',
                  selectedCategory === cat.id ? 'text-cinnabar-50' : 'text-ink-100/70'
                )}>
                  {cat.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-ochre-100/30">
        <p className="text-xs text-ink-100 font-song mb-2">书体</p>
        <div className="grid grid-cols-4 gap-1">
          {styles.map(style => (
            <button
              key={style}
              onClick={() => setStyle(style)}
              className={clsx(
                'py-1.5 rounded text-xs font-song transition-all duration-200',
                selectedStyle === style
                  ? 'bg-ink-300 text-rice-50 shadow-paper'
                  : 'bg-rice-200/50 text-ink-200 hover:bg-rice-200'
              )}
            >
              {STYLE_NAMES[style]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-ochre-100/30">
        <p className="text-xs text-ink-100 font-song mb-2">练习模式</p>
        <div className="grid grid-cols-2 gap-1">
          {modes.map(mode => (
            <button
              key={mode}
              onClick={() => setPracticeMode(mode)}
              className={clsx(
                'py-1.5 rounded text-sm font-song transition-all duration-200',
                practiceMode === mode
                  ? 'bg-cinnabar-300 text-white shadow-seal'
                  : 'bg-rice-200/50 text-ink-200 hover:bg-rice-200'
              )}
            >
              {MODE_NAMES[mode]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <div className="grid grid-cols-2 gap-2">
          {filteredCopybooks.map(cb => {
            const isSelected = cb.id === selectedCopybookId
            const isHovered = hoveredId === cb.id

            return (
              <button
                key={cb.id}
                onClick={() => handleSelectCopybook(cb.id, cb.unlocked)}
                onMouseEnter={() => setHoveredId(cb.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={!cb.unlocked}
                className={clsx(
                  'relative aspect-square rounded-md flex items-center justify-center transition-all duration-200 overflow-hidden',
                  cb.unlocked
                    ? isSelected
                      ? 'bg-rice-50 border-2 border-cinnabar-300 shadow-paper-lg scale-[1.02]'
                      : 'bg-rice-50 border border-ochre-100/40 hover:border-ochre-100 hover:shadow-paper'
                    : 'bg-rice-200/40 border border-rice-300 cursor-not-allowed opacity-70'
                )}
              >
                {!cb.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-300/40 backdrop-blur-[1px]">
                    <Lock size={16} className="text-rice-50" />
                  </div>
                )}

                <span
                  className={clsx(
                    'font-calligraphy transition-all duration-200',
                    cb.character.length === 1 ? 'text-4xl' : 'text-xl',
                    cb.unlocked ? 'text-ink-300' : 'text-ink-100/50',
                    isSelected && cb.unlocked && 'text-cinnabar-300'
                  )}
                  style={{ textShadow: isHovered && cb.unlocked ? '0 1px 2px rgba(44,36,22,0.1)' : 'none' }}
                >
                  {cb.character}
                </span>

                {isSelected && cb.unlocked && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cinnabar-300 animate-pulse" />
                )}

                {cb.unlocked && (
                  <div className="absolute bottom-1 right-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={clsx(
                          'w-1 h-1 rounded-full',
                          i < cb.difficulty ? 'bg-ochre-200' : 'bg-rice-300'
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
