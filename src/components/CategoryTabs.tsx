import type { Level } from '../types'

interface CategoryTabsProps {
  current: Level | 'all'
  onChange: (level: Level | 'all') => void
}

const TABS: Array<{ key: Level | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'cet4', label: '四级' },
  { key: 'cet6', label: '六级' },
  { key: 'ielts', label: '雅思' },
]

export function CategoryTabs({ current, onChange }: CategoryTabsProps) {
  return (
    <div className="category-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`tab-item ${current === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
