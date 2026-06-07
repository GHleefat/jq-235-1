import CharacterSelector from '@/components/CharacterSelector'
import CopyCanvas from '@/components/CopyCanvas'
import Toolbar from '@/components/Toolbar'
import ScorePanel from '@/components/ScorePanel'
import { useScoreStore } from '@/store/scoreStore'

export default function Home() {
  const isScoreVisible = useScoreStore(s => s.isScoreVisible)

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-rice-100">
      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <CharacterSelector />

        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <CopyCanvas size={520} />
        </div>

        {isScoreVisible && <ScorePanel />}

        {!isScoreVisible && (
          <div className="w-72 h-full flex flex-col bg-rice-50/60 backdrop-blur-sm border-l border-ochre-100/20 p-6">
            <div className="text-center mb-6">
              <div className="font-calligraphy text-4xl text-ink-300 mb-2">墨韵</div>
              <p className="text-xs text-ink-100 font-song tracking-widest">
                心摹手追 · 翰墨飘香
              </p>
            </div>

            <div className="space-y-4 text-sm font-song text-ink-200">
              <div className="p-3 bg-rice-50 rounded-md border border-ochre-100/30">
                <h3 className="font-medium text-ink-300 mb-1.5">描红模式</h3>
                <p className="text-xs text-ink-100 leading-relaxed">
                  范字以较高透明度显示，适合初学者描摹字形轮廓，熟悉基本笔画走向。
                </p>
              </div>

              <div className="p-3 bg-rice-50 rounded-md border border-ochre-100/30">
                <h3 className="font-medium text-ink-300 mb-1.5">对临模式</h3>
                <p className="text-xs text-ink-100 leading-relaxed">
                  范字以较低透明度显示，需要对照观察后独立书写，锻炼结构记忆能力。
                </p>
              </div>

              <div className="p-3 bg-rice-50 rounded-md border border-ochre-100/30">
                <h3 className="font-medium text-ink-300 mb-1.5">运笔技巧</h3>
                <ul className="text-xs text-ink-100 leading-relaxed space-y-1">
                  <li>• 慢速运笔，笔触加粗</li>
                  <li>• 快速行笔，产生飞白</li>
                  <li>• 起收笔处稍加停顿</li>
                  <li>• 转折处注意提按</li>
                </ul>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div
                className="aspect-square rounded-lg border-2 border-cinnabar-300/40 flex items-center justify-center bg-rice-50/50"
                style={{ boxShadow: 'inset 0 0 20px rgba(194,58,43,0.05)' }}
              >
                <div className="text-center">
                  <div className="font-calligraphy text-6xl text-cinnabar-300/70 leading-none">
                    墨
                  </div>
                  <div className="text-2xl text-ink-200/50 mt-1 tracking-[0.3em] font-song">
                    韵
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-ink-100/60 font-song mt-3">
                执笔如握剑 · 运笔似行云
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
