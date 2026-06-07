import { create } from 'zustand'
import type { CalligraphyStyle, Copybook, CopybookCategory, PracticeMode } from '@/types'
import { copybooks, getCopybookById } from '@/data/copybooks'

interface CopybookState {
  allCopybooks: Copybook[]
  selectedCategory: CopybookCategory
  selectedStyle: CalligraphyStyle
  selectedCopybookId: string
  practiceMode: PracticeMode
  showModel: boolean
  showGrid: boolean

  setCategory: (category: CopybookCategory) => void
  setStyle: (style: CalligraphyStyle) => void
  setCopybook: (id: string) => void
  setPracticeMode: (mode: PracticeMode) => void
  toggleShowModel: () => void
  toggleShowGrid: () => void
  unlockCopybook: (id: string) => void
  getFilteredCopybooks: () => Copybook[]
  getSelectedCopybook: () => Copybook | undefined
}

const firstUnlocked = copybooks.find(c => c.unlocked) || copybooks[0]

export const useCopybookStore = create<CopybookState>((set, get) => ({
  allCopybooks: copybooks,
  selectedCategory: 'basic',
  selectedStyle: 'yan',
  selectedCopybookId: firstUnlocked.id,
  practiceMode: 'trace',
  showModel: true,
  showGrid: true,

  setCategory: (category) => {
    const filtered = copybooks.filter(
      c => c.category === category && c.style === get().selectedStyle
    )
    const firstAvailable = filtered.find(c => c.unlocked) || filtered[0]
    set({ selectedCategory: category, selectedCopybookId: firstAvailable?.id || get().selectedCopybookId })
  },

  setStyle: (style) => {
    const filtered = copybooks.filter(
      c => c.category === get().selectedCategory && c.style === style
    )
    const firstAvailable = filtered.find(c => c.unlocked) || filtered[0]
    set({ selectedStyle: style, selectedCopybookId: firstAvailable?.id || get().selectedCopybookId })
  },

  setCopybook: (id) => {
    const cb = getCopybookById(id)
    if (cb && cb.unlocked) {
      set({ selectedCopybookId: id })
    }
  },

  setPracticeMode: (mode) => set({ practiceMode: mode }),

  toggleShowModel: () => set(state => ({ showModel: !state.showModel })),

  toggleShowGrid: () => set(state => ({ showGrid: !state.showGrid })),

  unlockCopybook: (id) => {
    set(state => ({
      allCopybooks: state.allCopybooks.map(c =>
        c.id === id ? { ...c, unlocked: true } : c
      ),
    }))
  },

  getFilteredCopybooks: () => {
    const { selectedCategory, selectedStyle, allCopybooks } = get()
    return allCopybooks.filter(
      c => c.category === selectedCategory && c.style === selectedStyle
    )
  },

  getSelectedCopybook: () => {
    return getCopybookById(get().selectedCopybookId)
  },
}))
