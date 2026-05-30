import { useState, useEffect, useCallback } from 'react'

export type Theme = 'green' | 'blue' | 'pink'

const THEME_KEY = 'jvdu-theme'
const THEMES: Theme[] = ['green', 'blue', 'pink']

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored && THEMES.includes(stored as Theme)) {
      return stored as Theme
    }
  } catch {
    // localStorage 不可用时忽略
  }
  return 'green'
}

function applyTheme(theme: Theme) {
  if (theme === 'green') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  // 初始化时应用主题
  useEffect(() => {
    applyTheme(theme)
  }, [])

  // 切换到下一个主题（green → blue → pink → green）
  const nextTheme = useCallback(() => {
    setTheme((current) => {
      const idx = THEMES.indexOf(current)
      const next = THEMES[(idx + 1) % THEMES.length]
      applyTheme(next)
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch { /* ignore */ }
      return next
    })
  }, [])

  // 设置指定主题
  const setThemeDirect = useCallback((t: Theme) => {
    setTheme(t)
    applyTheme(t)
    try {
      localStorage.setItem(THEME_KEY, t)
    } catch { /* ignore */ }
  }, [])

  return { theme, nextTheme, setTheme: setThemeDirect }
}
