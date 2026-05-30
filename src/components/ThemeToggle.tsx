import type { Theme } from '../hooks/useTheme'

interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
}

const THEME_LABELS: Record<Theme, { emoji: string; label: string }> = {
  green: { emoji: '🟢', label: '浅绿' },
  blue: { emoji: '🔵', label: '淡蓝' },
  pink: { emoji: '🟣', label: '淡粉' },
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const { emoji, label } = THEME_LABELS[theme]

  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`当前主题：${label}，点击切换`}
      title={`主题：${label}`}
    >
      <span className="theme-emoji">{emoji}</span>
    </button>
  )
}
