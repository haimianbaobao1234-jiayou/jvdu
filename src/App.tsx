import { useState } from 'react'
import './App.css'
import { useTheme } from './hooks/useTheme'
import { ThemeToggle } from './components/ThemeToggle'
import { ArticleList } from './components/ArticleList'
import { ArticleReader } from './components/ArticleReader'
import type { Article } from './types'

function App() {
  const { theme, nextTheme } = useTheme()
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null)

  // 阅读页视图
  if (currentArticle) {
    return (
      <div className="app">
        <ArticleReader
          article={currentArticle}
          onBack={() => setCurrentArticle(null)}
        />
      </div>
    )
  }

  // 列表页视图
  return (
    <div className="app">
      <div className="top-bar">
        <h1 className="top-title">句读</h1>
        <ThemeToggle theme={theme} onToggle={nextTheme} />
      </div>
      <main className="main-content">
        <ArticleList onSelectArticle={setCurrentArticle} />
      </main>
    </div>
  )
}

export default App
